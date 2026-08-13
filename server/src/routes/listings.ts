import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { db } from '../db/pool'
import { authenticate, requireRole } from '../middleware/auth'
import { ok, created, noContent, NotFoundError, ConflictError, ForbiddenError } from '../utils/response'
import { generateQRCode, verifyQRCode } from '../utils/jwt'
import { SpoilageService } from '../services/spoilage'
import logger from '../utils/logger'

const router = Router()

// Helper: compute priority score combining spoilage risk, ai confidence and distance
function computePriority(listing: any, q: { lat?: number; lng?: number } ) {
  // Base from spoilage risk (0-100)
  const risk = Number(listing.spoilage_risk ?? 0)
  const confidence = Number(listing.ai_confidence ?? 0) || 0.5

  // Distance penalty (if client provided lat/lng)
  let distanceKm = 0
  if (q.lat != null && q.lng != null && listing.pickup_lat && listing.pickup_lng) {
    const toRad = (deg: number) => deg * Math.PI / 180
    const R = 6371 // km
    const dLat = toRad(Number(listing.pickup_lat) - q.lat)
    const dLon = toRad(Number(listing.pickup_lng) - q.lng)
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(q.lat)) * Math.cos(toRad(Number(listing.pickup_lat))) * Math.sin(dLon/2)**2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    distanceKm = R * c
  }

  // priority: higher = more urgent. Combine risk (60%), inverse distance (20%), confidence(20%)
  const score = Math.max(0, Math.min(100, Math.round(
    0.6 * risk + 0.2 * Math.max(0, 50 - distanceKm) + 0.2 * (confidence * 100)
  )))

  const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'
  return { score, level, distanceKm: Number(distanceKm.toFixed(2)) }
}

// ─── Validation ───────────────────────────────────────────────────────────────
const CreateListingSchema = z.object({
  name:            z.string().min(2).max(255),
  food_type:       z.enum(['cooked_meals','bakery','raw_produce','dairy','catering_event','packaged_food']),
  quantity:        z.number().positive().max(10000),
  unit:            z.string().default('kg'),
  storage:         z.enum(['room_temperature','refrigerated','hot_heated','frozen']),
  allergens:       z.array(z.string()).optional(),
  notes:           z.string().max(1000).optional(),
  prepared_at:     z.string().datetime().optional(),
  pickup_deadline: z.string().datetime(),
  pickup_lat:      z.number().min(-90).max(90),
  pickup_lng:      z.number().min(-180).max(180),
  pickup_address:  z.string().min(5).max(500),
})

const ListingsQuerySchema = z.object({
  status:   z.enum(['available','in_transit','delivered','expired','all']).default('available'),
  type:     z.string().optional(),
  lat:      z.coerce.number().optional(),
  lng:      z.coerce.number().optional(),
  radius:   z.coerce.number().default(10),   // km
  sort:     z.enum(['urgency','distance','quantity','created']).default('urgency'),
  page:     z.coerce.number().int().positive().default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
})

// ─── GET /listings ─────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = ListingsQuerySchema.parse(req.query)

    const conditions: string[]  = []
    const params:     unknown[] = []
    let   p = 1

    if (q.status !== 'all') {
      conditions.push(`l.status = $${p++}`)
      params.push(q.status)
    }
    if (q.type) {
      conditions.push(`l.food_type = $${p++}`)
      params.push(q.type)
    }
    // Deadline not expired for available listings
    if (q.status === 'available') {
      conditions.push('l.pickup_deadline > NOW()')
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    // Sort logic
    const sortClause = {
      urgency:  'l.spoilage_risk DESC, l.pickup_deadline ASC',
      distance: 'l.pickup_lat ASC',
      quantity: 'l.quantity DESC',
      created:  'l.created_at DESC',
    }[q.sort]

    const offset = (q.page - 1) * q.limit

    const rows = await db.query(
      `SELECT
         l.id, l.name, l.food_type, l.quantity, l.unit, l.storage,
         l.allergens, l.notes, l.images, l.pickup_deadline,
         l.pickup_lat, l.pickup_lng, l.pickup_address,
         l.spoilage_risk, l.ai_confidence, l.status,
         l.qr_verified_at, l.accepted_at, l.delivered_at,
         l.created_at,
         o.name AS donor_name, o.city,
         o.lat AS donor_lat, o.lng AS donor_lng
       FROM listings l
       JOIN organisations o ON o.id = l.donor_id
       ${where}
       ORDER BY ${sortClause}
       LIMIT $${p++} OFFSET $${p++}`,
      [...params, q.limit, offset]
    )

    // Attach computed priority for each listing
    const listingsWithPriority = rows.map(r => ({ ...r, priority: computePriority(r, { lat: q.lat, lng: q.lng }) }))

    const [{ count }] = await db.query<{ count: string }>(
      `SELECT COUNT(*) FROM listings l ${where}`,
      params
    )

    ok(res, {
      listings: listingsWithPriority,
      pagination: {
        page:  q.page,
        limit: q.limit,
        total: Number(count),
        pages: Math.ceil(Number(count) / q.limit),
      },
    })
  } catch (err) {
    next(err)
  }
})

// ─── GET /listings/:id ────────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await db.queryOne(
      `SELECT l.*, o.name AS donor_name, o.contact_phone,
              n.name AS ngo_name
       FROM listings l
       JOIN organisations o ON o.id = l.donor_id
       LEFT JOIN organisations n ON n.id = l.assigned_ngo_id
       WHERE l.id = $1`,
      [req.params.id]
    )
    if (!listing) throw new NotFoundError('Listing')
    ok(res, listing)
  } catch (err) {
    next(err)
  }
})

// ─── POST /listings ───────────────────────────────────────────────────────────
router.post('/', authenticate, requireRole('restaurant', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateListingSchema.parse(req.body)

    // Get org ID for this user
    const org = await db.queryOne<{ id: string }>(
      'SELECT id FROM organisations WHERE user_id = $1',
      [req.user!.userId]
    )
    if (!org) throw new ForbiddenError('No organisation found for this account')

    // Run AI spoilage prediction
    const { risk, confidence } = await SpoilageService.predict({
      foodType:    body.food_type,
      storage:     body.storage,
      preparedAt:  body.prepared_at ? new Date(body.prepared_at) : undefined,
      quantity:    body.quantity,
    })

    const [listing] = await db.query(
      `INSERT INTO listings
         (donor_id, name, food_type, quantity, unit, storage, allergens,
          notes, prepared_at, pickup_deadline, pickup_lat, pickup_lng,
          pickup_address, spoilage_risk, ai_confidence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        org.id, body.name, body.food_type, body.quantity, body.unit,
        body.storage, body.allergens ?? [], body.notes ?? null,
        body.prepared_at ?? null, body.pickup_deadline,
        body.pickup_lat, body.pickup_lng, body.pickup_address,
        risk, confidence,
      ]
    )

    // Notify nearby NGOs (fire-and-forget)
    notifyNearbyNGOs(listing).catch(e => logger.error('NGO notification failed', { error: e.message }))

    logger.info('Listing created', { listingId: listing.id, donorId: org.id, risk })
    created(res, listing, 'Listing posted — nearby NGOs notified')
  } catch (err) {
    next(err)
  }
})

// ─── POST /listings/:id/accept ────────────────────────────────────────────────
// Uses SERIALIZABLE transaction to prevent double-acceptance
router.post('/:id/accept', authenticate, requireRole('ngo', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { volunteerId } = z.object({ volunteerId: z.string().uuid() }).parse(req.body)

    const ngo = await db.queryOne<{ id: string }>(
      'SELECT id FROM organisations WHERE user_id = $1', [req.user!.userId]
    )
    if (!ngo) throw new ForbiddenError('No NGO found for this account')

    const result = await db.withSerializableTransaction(async (client) => {
      // Lock the row
      const listingResult = await client.query<{ id: string; status: string }>(
        `SELECT id, status FROM listings WHERE id = $1 FOR UPDATE`,
        [req.params.id]
      )
      const listing = listingResult.rows[0]
      if (!listing) throw new NotFoundError('Listing')
      if (listing.status !== 'available') throw new ConflictError('Listing is no longer available')

      // Generate QR code
      const qrCode = generateQRCode(req.params.id)

      // Update listing
      await client.query(
        `UPDATE listings
         SET status = 'in_transit', assigned_ngo_id = $1, accepted_at = NOW(), qr_code = $2
         WHERE id = $3`,
        [ngo.id, qrCode, req.params.id]
      )

      // Create pickup record
      const pickupResult = await client.query<{ id: string }>(
        `INSERT INTO pickups (listing_id, volunteer_id, ngo_id, current_step)
         SELECT $1, vp.id, $2, 'accepted'
         FROM volunteer_profiles vp WHERE vp.user_id = $3
         RETURNING *`,
        [req.params.id, ngo.id, volunteerId]
      )
      const pickup = pickupResult.rows[0]

      // Audit event
      await client.query(
        `INSERT INTO pickup_events (pickup_id, step, actor_id)
         VALUES ($1, 'accepted', $2)`,
        [pickup.id, req.user!.userId]
      )

      return { listing: { ...listing, status: 'in_transit', qrCode }, pickup }
    })

    logger.info('Listing accepted', { listingId: req.params.id, ngoId: ngo.id })
    ok(res, result, 'Pickup accepted successfully')
  } catch (err) {
    next(err)
  }
})

// ─── POST /listings/:id/verify-qr ────────────────────────────────────────────
router.post('/:id/verify-qr', authenticate, requireRole('volunteer', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qrCode } = z.object({ qrCode: z.string() }).parse(req.body)

    const listing = await db.queryOne<{ id: string; qr_code: string }>(
      'SELECT id, qr_code FROM listings WHERE id = $1',
      [req.params.id]
    )
    if (!listing) throw new NotFoundError('Listing')
    if (listing.qr_code !== qrCode) throw new ConflictError('Invalid QR code')
    if (!verifyQRCode(qrCode, req.params.id)) throw new ConflictError('QR code verification failed')

    await db.withTransaction(async (client) => {
      await client.query(
        `UPDATE listings SET qr_verified_at = NOW() WHERE id = $1`,
        [req.params.id]
      )
      const pickupResult = await client.query<{ id: string }>(
        'SELECT id FROM pickups WHERE listing_id = $1', [req.params.id]
      )
      const pickup = pickupResult.rows[0]
      if (pickup) {
        await client.query(
          `UPDATE pickups SET current_step = 'qr_verified' WHERE id = $1`, [pickup.id]
        )
        await client.query(
          `INSERT INTO pickup_events (pickup_id, step, actor_id) VALUES ($1, 'qr_verified', $2)`,
          [pickup.id, req.user!.userId]
        )
      }
    })

    logger.info('QR verified', { listingId: req.params.id, qrCode })
    ok(res, { verified: true, qrCode }, 'QR code verified successfully')
  } catch (err) {
    next(err)
  }
})

// ─── POST /listings/:id/deliver ───────────────────────────────────────────────
router.post('/:id/deliver', authenticate, requireRole('volunteer', 'ngo', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.withTransaction(async (client) => {
      await client.query(
        `UPDATE listings SET status = 'delivered', delivered_at = NOW() WHERE id = $1`,
        [req.params.id]
      )
      const pickupResult = await client.query<{ id: string }>(
        'SELECT id FROM pickups WHERE listing_id = $1', [req.params.id]
      )
      const pickup = pickupResult.rows[0]
      if (pickup) {
        await client.query(
          `UPDATE pickups SET current_step = 'delivered', delivered_at = NOW() WHERE id = $1`,
          [pickup.id]
        )
        await client.query(
          `INSERT INTO pickup_events (pickup_id, step, actor_id) VALUES ($1, 'delivered', $2)`,
          [pickup.id, req.user!.userId]
        )
        // Update volunteer stats
        const listingResult = await client.query<{ quantity: number }>(
          'SELECT quantity FROM listings WHERE id = $1', [req.params.id]
        )
        const listing = listingResult.rows[0]
        if (listing) {
          await client.query(
            `UPDATE volunteer_profiles
             SET total_deliveries = total_deliveries + 1,
                 kg_delivered = kg_delivered + $1
             WHERE id = (SELECT volunteer_id FROM pickups WHERE id = $2)`,
            [listing.quantity, pickup.id]
          )
        }
      }
    })

    logger.info('Listing delivered', { listingId: req.params.id })
    ok(res, { delivered: true }, 'Delivery confirmed')
  } catch (err) {
    next(err)
  }
})

// ─── DELETE /listings/:id ─────────────────────────────────────────────────────
router.delete('/:id', authenticate, requireRole('restaurant', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await db.queryOne<{ id: string; status: string; donor_id: string }>(
      `SELECT l.id, l.status, l.donor_id FROM listings l
       JOIN organisations o ON o.id = l.donor_id
       WHERE l.id = $1 AND o.user_id = $2`,
      [req.params.id, req.user!.userId]
    )
    if (!listing) throw new NotFoundError('Listing')
    if (listing.status !== 'available') throw new ConflictError('Cannot cancel an active pickup')

    await db.query(
      `UPDATE listings SET status = 'cancelled' WHERE id = $1`, [req.params.id]
    )
    noContent(res)
  } catch (err) {
    next(err)
  }
})

// ─── Helper: notify nearby NGOs ───────────────────────────────────────────────
async function notifyNearbyNGOs(listing: Record<string, unknown>) {
  const ngos = await db.query<{ user_id: string; name: string }>(
    `SELECT o.user_id, o.name FROM organisations o
     WHERE o.org_type = 'ngo' AND o.is_verified = true
       AND earth_distance(
         ll_to_earth($1, $2),
         ll_to_earth(o.lat, o.lng)
       ) < 10000`,  // 10 km radius
    [listing.pickup_lat, listing.pickup_lng]
  )

  if (!ngos.length) return

  const values = ngos.map((_, i) =>
    `($${i * 5 + 1}, 'urgent'::notif_type, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4})`
  ).join(',')

  const params = ngos.flatMap(ngo => [
    ngo.user_id,
    `New listing: ${listing.quantity}${listing.unit} of ${listing.name}`,
    `${listing.pickup_address} · Pickup by ${listing.pickup_deadline}`,
    listing.id,
  ])

  await db.query(`INSERT INTO notifications (user_id, type, title, body, listing_id) VALUES ${values}`, params)
}

export default router
