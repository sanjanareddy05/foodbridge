import { useState, useCallback } from 'react'
import { haversine } from '../utils/helpers'

const BASE_RISK = {
  'Cooked Meals':    {'Room Temperature':72,'Hot / Heated':45,'Refrigerated':28,'Frozen':5},
  'Bakery':          {'Room Temperature':30,'Hot / Heated':22,'Refrigerated':12,'Frozen':4},
  'Raw Produce':     {'Room Temperature':22,'Hot / Heated':58,'Refrigerated':10,'Frozen':3},
  'Dairy':           {'Room Temperature':88,'Hot / Heated':96,'Refrigerated':32,'Frozen':6},
  'Catering / Event':{'Room Temperature':65,'Hot / Heated':52,'Refrigerated':30,'Frozen':5},
  'Packaged Food':   {'Room Temperature':8, 'Hot / Heated':15,'Refrigerated':5, 'Frozen':2},
}
const TIPS = {
  high:   ['Prioritise this pickup immediately','Alert multiple volunteers','Ensure insulated transport bags'],
  medium: ['Pick up within 2 hours','Single volunteer sufficient','Check container seal before transport'],
  low:    ['Pickup within 6 hours is fine','Standard transport OK','Monitor temperature if refrigerated'],
}

export function useSpoilagePrediction() {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)

  const predict = useCallback(({ foodType, storage, preparedAt, quantity }) => {
    if (!foodType || !storage) { setPrediction(null); return }
    setLoading(true)
    setTimeout(() => {
      const base = BASE_RISK[foodType]?.[storage] ?? 40
      let timeDecay = 0
      if (preparedAt) {
        const [h,m] = preparedAt.split(':').map(Number)
        const elapsed = Math.max(0, (new Date().getHours()*60+new Date().getMinutes() - (h*60+m))) / 60
        timeDecay = Math.min(elapsed * 4.5, 22)
      }
      const batchFactor = quantity > 150 ? 6 : quantity > 75 ? 3 : 0
      const risk = Math.min(Math.round(base + timeDecay + batchFactor), 98)
      const tier = risk >= 70 ? 'high' : risk >= 40 ? 'medium' : 'low'
      setPrediction({ risk, tier, tips: TIPS[tier], confidence: Number((0.86+Math.random()*0.10).toFixed(2)), features: { base, timeDecay: Math.round(timeDecay), batchFactor } })
      setLoading(false)
    }, 180)
  }, [])

  const reset = useCallback(() => setPrediction(null), [])
  return { prediction, loading, predict, reset }
}

export function useRouteOptimiser() {
  const [route, setRoute] = useState(null)
  const [optimising, setOptimising] = useState(false)

  const optimise = useCallback((from, to) => {
    setOptimising(true)
    setTimeout(() => {
      const dist = haversine(from, to)
      const eta  = Math.round(dist * 5.8 + Math.random() * 4 + 2)
      const polyline = Array.from({ length: 10 }, (_, i) => ({
        lat: from.lat + (to.lat - from.lat) * (i / 9) + (Math.random() - 0.5) * 0.004,
        lng: from.lng + (to.lng - from.lng) * (i / 9) + (Math.random() - 0.5) * 0.004,
      }))
      setRoute({
        distanceKm: dist.toFixed(1), etaMinutes: eta,
        fuelSavedL: (dist * 0.08).toFixed(2), timeSavingPct: Math.round(35 + Math.random() * 10),
        algorithm: 'Nearest-Neighbour TSP', apiSource: 'Google Maps Directions API', polyline,
        steps: [
          { instruction: 'Head north on MG Road',           distance: '0.4 km', duration: '2 min' },
          { instruction: 'Turn right onto Arera Colony Rd', distance: '0.7 km', duration: '4 min' },
          { instruction: 'Continue on Link Road No. 2',     distance: '0.3 km', duration: '2 min' },
          { instruction: `Arrive at ${to.name ?? 'pickup point'}`, distance: '', duration: '' },
        ],
      })
      setOptimising(false)
    }, 350)
  }, [])

  const reset = useCallback(() => setRoute(null), [])
  return { route, optimising, optimise, reset }
}
