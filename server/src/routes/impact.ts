import { Router, Request, Response, NextFunction } from 'express'
import { db } from '../db/pool'
import { ok } from '../utils/response'

const router = Router()

// ─── GET /impact/summary ──────────────────────────────────────────────────────
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totals] = await db.query<{
      total_listings:   string
      total_delivered:  string
      total_kg:         string
      total_meals:      string
    }>(
      `SELECT
         COUNT(*)                                          AS total_listings,
         COUNT(*) FILTER (WHERE status = 'delivered')     AS total_delivered,
         COALESCE(SUM(quantity) FILTER (WHERE status = 'delivered'), 0) AS total_kg,
         COALESCE(SUM(ROUND(quantity * 3)) FILTER (WHERE status = 'delivered'), 0) AS total_meals
       FROM listings`
    )

    const [today] = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'delivered' AND delivered_at >= CURRENT_DATE) AS meals_today,
         COALESCE(SUM(quantity) FILTER (WHERE status = 'delivered' AND delivered_at >= CURRENT_DATE), 0) AS kg_today
       FROM listings`
    )

    const [volunteers] = await db.query(
      `SELECT COUNT(*) FILTER (WHERE is_available = true) AS active_volunteers FROM volunteer_profiles`
    )

    const byCategory = await db.query(
      `SELECT food_type, COUNT(*) AS count, COALESCE(SUM(quantity), 0) AS kg
       FROM listings WHERE status = 'delivered'
       GROUP BY food_type ORDER BY kg DESC`
    )

    const weeklyTrend = await db.query(
      `SELECT
         TO_CHAR(delivered_at, 'Dy') AS day,
         COALESCE(SUM(quantity), 0)  AS kg,
         COALESCE(SUM(ROUND(quantity * 3)), 0) AS meals
       FROM listings
       WHERE status = 'delivered'
         AND delivered_at >= NOW() - INTERVAL '7 days'
       GROUP BY TO_CHAR(delivered_at, 'Dy'), DATE_TRUNC('day', delivered_at)
       ORDER BY DATE_TRUNC('day', delivered_at)`
    )

    const monthlyTrend = await db.query(
      `SELECT
         TO_CHAR(delivered_at, 'Mon') AS month,
         COALESCE(SUM(quantity), 0)   AS kg
       FROM listings
       WHERE status = 'delivered'
         AND delivered_at >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(delivered_at, 'Mon'), DATE_TRUNC('month', delivered_at)
       ORDER BY DATE_TRUNC('month', delivered_at)`
    )

    const ngos = await db.query(
      `SELECT o.id, o.name, o.city, o.capacity, o.is_verified, o.meals_received,
              u.email AS contact_email, o.contact_phone
       FROM organisations o
       JOIN users u ON u.id = o.user_id
       WHERE o.org_type = 'ngo'
       ORDER BY o.meals_received DESC`
    )

    ok(res, {
      totals:   { ...totals, ...today, ...volunteers },
      byCategory,
      weeklyTrend,
      monthlyTrend,
      ngos,
      // CO₂: ~1.7 kg CO₂ saved per kg food rescued
      co2PreventedKg: Math.round(Number(totals.total_kg) * 1.7),
    })
  } catch (err) {
    next(err)
  }
})

// ─── GET /impact/leaderboard ──────────────────────────────────────────────────
router.get('/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const volunteers = await db.query(
      `SELECT u.name, vp.vehicle, vp.rating, vp.total_deliveries, vp.kg_delivered
       FROM volunteer_profiles vp
       JOIN users u ON u.id = vp.user_id
       WHERE vp.total_deliveries > 0
       ORDER BY vp.kg_delivered DESC
       LIMIT 10`
    )

    const donors = await db.query(
      `SELECT o.name, COUNT(l.id) AS total_listings,
              COALESCE(SUM(l.quantity) FILTER (WHERE l.status = 'delivered'), 0) AS kg_donated
       FROM organisations o
       JOIN listings l ON l.donor_id = o.id
       WHERE o.org_type IN ('restaurant','hotel','caterer')
       GROUP BY o.id, o.name
       HAVING COUNT(l.id) > 0
       ORDER BY kg_donated DESC
       LIMIT 10`
    )

    ok(res, { volunteers, donors })
  } catch (err) {
    next(err)
  }
})

export default router
