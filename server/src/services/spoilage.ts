import logger from '../utils/logger'

// ─── Feature weights (in production: loaded from trained model artifact) ───────
const BASE_RISK: Record<string, Record<string, number>> = {
  cooked_meals:    { room_temperature: 72, hot_heated: 45, refrigerated: 28, frozen: 5  },
  bakery:          { room_temperature: 30, hot_heated: 22, refrigerated: 12, frozen: 4  },
  raw_produce:     { room_temperature: 22, hot_heated: 58, refrigerated: 10, frozen: 3  },
  dairy:           { room_temperature: 88, hot_heated: 96, refrigerated: 32, frozen: 6  },
  catering_event:  { room_temperature: 65, hot_heated: 52, refrigerated: 30, frozen: 5  },
  packaged_food:   { room_temperature: 8,  hot_heated: 15, refrigerated: 5,  frozen: 2  },
}

const TIPS: Record<string, string[]> = {
  high:   ['Prioritise immediately', 'Alert multiple volunteers', 'Insulated transport required'],
  medium: ['Pickup within 2 hours', 'Single volunteer sufficient', 'Check container seal'],
  low:    ['Pickup within 6 hours', 'Standard transport OK', 'Monitor temperature'],
}

interface PredictInput {
  foodType:   string
  storage:    string
  preparedAt?: Date
  quantity:   number
}

interface PredictOutput {
  risk:       number   // 0–100
  tier:       'high' | 'medium' | 'low'
  confidence: number   // 0–1
  tips:       string[]
  features: {
    base:         number
    timeDecay:    number
    batchFactor:  number
  }
}

export class SpoilageService {
  /**
   * Predict spoilage risk.
   *
   * In production this POSTs to a Python FastAPI ML service:
   *   POST /predict { food_type, storage, elapsed_hours, quantity_kg }
   *   → { risk, confidence, shap_values }
   *
   * Here we implement the same logic as a TypeScript approximation.
   */
  static async predict(input: PredictInput): Promise<PredictOutput> {
    try {
      // In production: call ML microservice
      if (process.env.ML_SERVICE_URL && process.env.NODE_ENV === 'production') {
        return await SpoilageService.callMLService(input)
      }
      return SpoilageService.localPredict(input)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      logger.warn('ML service unavailable, falling back to local model', { error: msg })
      return SpoilageService.localPredict(input)
    }
  }

  private static localPredict(input: PredictInput): PredictOutput {
    const { foodType, storage, preparedAt, quantity } = input

    const base       = BASE_RISK[foodType]?.[storage] ?? 40
    const timeDecay  = SpoilageService.calcTimeDecay(preparedAt)
    const batchFactor= quantity > 150 ? 6 : quantity > 75 ? 3 : 0

    const risk       = Math.min(Math.round(base + timeDecay + batchFactor), 98)
    const tier       = risk >= 70 ? 'high' : risk >= 40 ? 'medium' : 'low'
    // Confidence increases with more features filled in
    const confidence = Number((0.82 + (preparedAt ? 0.08 : 0) + (quantity > 0 ? 0.04 : 0)).toFixed(2))

    return { risk, tier, confidence, tips: TIPS[tier], features: { base, timeDecay: Math.round(timeDecay), batchFactor } }
  }

  private static calcTimeDecay(preparedAt?: Date): number {
    if (!preparedAt) return 0
    const elapsedHours = (Date.now() - preparedAt.getTime()) / 3_600_000
    return Math.min(elapsedHours * 4.5, 22)
  }

  private static async callMLService(input: PredictInput): Promise<PredictOutput> {
    const res = await fetch(`${process.env.ML_SERVICE_URL}/predict`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'X-API-Key':     process.env.ML_API_KEY!,
      },
      body: JSON.stringify({
        food_type:     input.foodType,
        storage:       input.storage,
        elapsed_hours: input.preparedAt
          ? (Date.now() - input.preparedAt.getTime()) / 3_600_000
          : null,
        quantity_kg: input.quantity,
      }),
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) throw new Error(`ML service returned ${res.status}`)
    return res.json() as Promise<PredictOutput>
  }
}
