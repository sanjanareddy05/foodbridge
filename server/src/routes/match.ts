import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { db } from '../db/pool'
import { authenticate, requireRole } from '../middleware/auth'
import { ok, ValidationError } from '../utils/response'
import logger from '../utils/logger'

const router = Router()

const MatchSchema = z.object({
  listingId: z.string().uuid().optional(),
  pickup_lat: z.number().min(-90).max(90).optional(),
  pickup_lng: z.number().min(-180).max(180).optional(),
  radius: z.number().min(0).default(15),
  limit: z.number().int().min(1).max(20).default(5),
})

// POST /api/match
router.post('/', authenticate, requireRole('ngo', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.debug('Match request raw', { raw: String((req as any).rawBody ?? '').slice(0,1000) })
    const body = MatchSchema.parse(req.body)

    let lat = body.pickup_lat
    let lng = body.pickup_lng

    if (!lat || !lng) {
      if (body.listingId) {
        const listing = await db.queryOne('SELECT pickup_lat, pickup_lng, quantity, storage FROM listings WHERE id = $1', [body.listingId])
        if (!listing) throw new ValidationError('Listing not found')
        lat = Number(listing.pickup_lat)
        lng = Number(listing.pickup_lng)
      } else {
        throw new ValidationError('Provide listingId or pickup_lat/pickup_lng')
      }
    }

    // find available volunteers with location, compute distance in meters
    const rows = await db.query(
      `SELECT vp.id, vp.vehicle, vp.rating, vp.total_deliveries, vp.kg_delivered, vp.is_available, vp.last_location_lat, vp.last_location_lng, u.id AS user_id, u.name, u.phone,
              earth_distance(ll_to_earth($1, $2), ll_to_earth(vp.last_location_lat, vp.last_location_lng)) AS meters
       FROM volunteer_profiles vp
       JOIN users u ON u.id = vp.user_id
       WHERE vp.is_available = true AND vp.last_location_lat IS NOT NULL AND vp.last_location_lng IS NOT NULL
       ORDER BY meters ASC
       LIMIT $3`,
      [lat, lng, body.limit]
    )

    const speeds: Record<string, number> = { car: 40, van: 35, scooter: 25, bicycle: 12 }

    const suggestions = rows.map((v: any) => {
      const distanceKm = v.meters ? Number((v.meters / 1000).toFixed(2)) : null
      const speed = speeds[v.vehicle] || 25
      const etaMin = distanceKm != null ? Math.max(1, Math.round((distanceKm / speed) * 60)) : null
      const score = Math.max(0, Math.min(100, Math.round(
        50 /* availability */ + (Number(v.rating) / 5) * 30 + Math.max(0, 20 - (distanceKm ?? 0))
      )))

      return {
        volunteerId: v.id,
        userId: v.user_id,
        name: v.name,
        phone: v.phone,
        vehicle: v.vehicle,
        rating: Number(v.rating),
        totalDeliveries: Number(v.total_deliveries),
        distanceKm,
        etaMin,
        score,
      }
    })

    ok(res, { suggestions })
  } catch (err) {
    next(err)
  }
})

export default router
