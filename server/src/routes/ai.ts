import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { SpoilageService } from '../services/spoilage'

const router = Router()

const DescribeSchema = z.object({
  name: z.string(),
  food_type: z.enum(['cooked_meals','bakery','raw_produce','dairy','catering_event','packaged_food']),
  storage: z.enum(['room_temperature','refrigerated','hot_heated','frozen']),
  quantity: z.number().positive(),
  unit: z.string().optional(),
  prepared_at: z.string().optional(),
  pickup_deadline: z.string().optional(),
  pickup_lat: z.number().optional(),
  pickup_lng: z.number().optional(),
  notes: z.string().optional(),
})

// POST /api/ai/describe
router.post('/describe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = DescribeSchema.parse(req.body)

    const bodyTyped = DescribeSchema.parse(req.body) as z.infer<typeof DescribeSchema>
    const preparedAt = bodyTyped.prepared_at ? new Date(bodyTyped.prepared_at) : undefined
    const { risk, tier, confidence, tips, features } = await SpoilageService.predict({
      foodType: bodyTyped.food_type,
      storage: bodyTyped.storage,
      preparedAt,
      quantity: bodyTyped.quantity,
    })

    // Generate a short AI-style description (deterministic templating for offline use)
    const descParts: string[] = []
    descParts.push(`${bodyTyped.name} — ${bodyTyped.quantity}${bodyTyped.unit ?? ''} (${bodyTyped.food_type.replace(/_/g,' ')})`)
    if (bodyTyped.notes) descParts.push(bodyTyped.notes)
    descParts.push(`Storage: ${bodyTyped.storage.replace(/_/g,' ')}, Spoilage risk: ${risk}/100`)
    if (bodyTyped.pickup_deadline) descParts.push(`Pickup by ${new Date(bodyTyped.pickup_deadline).toLocaleString()}`)

    const suggestedAction = tier === 'high' ? 'Immediate pickup recommended' : tier === 'medium' ? 'Pickup within 2 hours' : 'Pickup within 6 hours'

    const description = descParts.join(' — ')

    res.json({
      description,
      risk,
      tier,
      confidence,
      tips,
      suggestedAction,
      features,
    })
  } catch (err) {
    next(err)
  }
})

export default router
