import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { db } from '../db/pool'
import { authenticate, requireRole } from '../middleware/auth'
import { ok, NotFoundError } from '../utils/response'
import { RouteService } from '../services/route'

const router = Router()

// ─── GET /volunteers ──────────────────────────────────────────────────────────
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const volunteers = await db.query(
      `SELECT vp.id, vp.vehicle, vp.rating, vp.total_deliveries, vp.kg_delivered,
              vp.is_available, vp.last_location_lat, vp.last_location_lng,
              u.id AS user_id, u.name, u.phone, u.avatar_url,
              p.listing_id AS current_listing_id
       FROM volunteer_profiles vp
       JOIN users u ON u.id = vp.user_id
       LEFT JOIN pickups p ON p.volunteer_id = vp.id
         AND p.current_step NOT IN ('delivered')
         AND p.delivered_at IS NULL
       WHERE u.is_active = true
       ORDER BY vp.rating DESC, vp.total_deliveries DESC`
    )
    ok(res, volunteers)
  } catch (err) {
    next(err)
  }
})

// ─── GET /volunteers/:id ──────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const volunteer = await db.queryOne(
      `SELECT vp.*, u.name, u.email, u.phone, u.avatar_url
       FROM volunteer_profiles vp
       JOIN users u ON u.id = vp.user_id
       WHERE vp.id = $1`,
      [req.params.id]
    )
    if (!volunteer) throw new NotFoundError('Volunteer')

    const recentDeliveries = await db.query(
      `SELECT p.id, l.name, l.quantity, l.unit, p.delivered_at
       FROM pickups p
       JOIN listings l ON l.id = p.listing_id
       WHERE p.volunteer_id = $1 AND p.delivered_at IS NOT NULL
       ORDER BY p.delivered_at DESC LIMIT 5`,
      [req.params.id]
    )

    ok(res, { ...volunteer, recentDeliveries })
  } catch (err) {
    next(err)
  }
})

// ─── PUT /volunteers/location ──────────────────────────────────────────────────
router.put('/location', authenticate, requireRole('volunteer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).parse(req.body)

    await db.query(
      `UPDATE volunteer_profiles
       SET last_location_lat = $1, last_location_lng = $2, last_location_at = NOW()
       WHERE user_id = $3`,
      [lat, lng, req.user!.userId]
    )
    ok(res, { lat, lng }, 'Location updated')
  } catch (err) {
    next(err)
  }
})

// ─── POST /volunteers/optimise-route ──────────────────────────────────────────
router.post('/optimise-route', authenticate, requireRole('volunteer', 'ngo', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = z.object({
      from: z.object({ lat: z.number(), lng: z.number(), name: z.string().optional() }),
      to:   z.object({ lat: z.number(), lng: z.number(), name: z.string().optional() }),
    }).parse(req.body)

    const route = await RouteService.optimise(from, to)
    ok(res, route)
  } catch (err) {
    next(err)
  }
})

// ─── POST /volunteers/rate ────────────────────────────────────────────────────
router.post('/rate', authenticate, requireRole('ngo', 'restaurant', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      pickupId:    z.string().uuid(),
      volunteerId: z.string().uuid(),
      score:       z.number().int().min(1).max(5),
      comment:     z.string().max(500).optional(),
    }).parse(req.body)

    await db.query(
      `INSERT INTO ratings (pickup_id, rater_id, volunteer_id, score, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (pickup_id) DO NOTHING`,
      [body.pickupId, req.user!.userId, body.volunteerId, body.score, body.comment ?? null]
    )

    ok(res, null, 'Rating submitted')
  } catch (err) {
    next(err)
  }
})

export default router
