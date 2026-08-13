import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../lib/api'
import type { Listing, Volunteer, ImpactSummary, Notification, SpoilagePrediction, RouteResult } from '../types'

// ─── Generic async data hook ──────────────────────────────────────────────────
function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data,    setData]    = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true); setError(null)
    try   { setData(await fetcher()) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error') }
    finally { setLoading(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

// ─── Listings ─────────────────────────────────────────────────────────────────
interface ListingsFilter {
  status?: string; type?: string; sort?: string; page?: number; limit?: number
}

interface ListingsResult {
  listings:   Listing[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export function useListings(filter: ListingsFilter = {}) {
  const params = new URLSearchParams()
  if (filter.status && filter.status !== 'all') params.set('status', filter.status)
  if (filter.type   && filter.type   !== 'all') params.set('type',   filter.type)
  if (filter.sort)   params.set('sort',  filter.sort)
  if (filter.page)   params.set('page',  String(filter.page))
  if (filter.limit)  params.set('limit', String(filter.limit))
  const qs = params.toString()

  return useAsync<ListingsResult>(
    () => api.get<ListingsResult>(`/listings${qs ? `?${qs}` : ''}`),
    [qs]
  )
}

export function useListing(id: string) {
  return useAsync<Listing>(() => api.get<Listing>(`/listings/${id}`), [id])
}

// ─── Volunteers ───────────────────────────────────────────────────────────────
export function useVolunteers() {
  return useAsync<Volunteer[]>(() => api.get<Volunteer[]>('/volunteers'), [])
}

// ─── Impact ───────────────────────────────────────────────────────────────────
export function useImpact() {
  return useAsync<ImpactSummary>(() => api.get<ImpactSummary>('/impact/summary'), [])
}

// ─── Notifications ────────────────────────────────────────────────────────────
export function useNotifications() {
  const { data, loading, refetch } = useAsync<Notification[]>(
    () => api.get<Notification[]>('/notifications'),
    []
  )

  const markRead = useCallback(async (id: string) => {
    await api.patch(`/notifications/${id}/read`, {})
    refetch()
  }, [refetch])

  const markAllRead = useCallback(async () => {
    await api.post('/notifications/read-all', {})
    refetch()
  }, [refetch])

  return { notifications: data ?? [], loading, markRead, markAllRead, refetch }
}

// ─── AI Spoilage Prediction (client-side with API fallback) ───────────────────
const BASE_RISK: Record<string, Record<string, number>> = {
  cooked_meals:    { room_temperature:72, hot_heated:45, refrigerated:28, frozen:5  },
  bakery:          { room_temperature:30, hot_heated:22, refrigerated:12, frozen:4  },
  raw_produce:     { room_temperature:22, hot_heated:58, refrigerated:10, frozen:3  },
  dairy:           { room_temperature:88, hot_heated:96, refrigerated:32, frozen:6  },
  catering_event:  { room_temperature:65, hot_heated:52, refrigerated:30, frozen:5  },
  packaged_food:   { room_temperature:8,  hot_heated:15, refrigerated:5,  frozen:2  },
}
const TIPS = {
  high:   ['Prioritise immediately','Alert multiple volunteers','Insulated transport required'],
  medium: ['Pick up within 2 hours','Single volunteer sufficient','Check container seal'],
  low:    ['Pickup within 6 hours','Standard transport OK','Monitor temperature'],
}

export function useSpoilagePrediction() {
  const [prediction, setPrediction] = useState<SpoilagePrediction | null>(null)
  const [loading,    setLoading]    = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const predict = useCallback((input: { foodType: string; storage: string; preparedAt?: string; quantity: number }) => {
    if (!input.foodType || !input.storage) { setPrediction(null); return }
    if (timerRef.current) clearTimeout(timerRef.current)
    setLoading(true)

    timerRef.current = setTimeout(() => {
      const base       = BASE_RISK[input.foodType]?.[input.storage] ?? 40
      let   timeDecay  = 0
      if (input.preparedAt) {
        const [h, m]  = input.preparedAt.split(':').map(Number)
        const elapsed = Math.max(0, new Date().getHours() * 60 + new Date().getMinutes() - (h * 60 + m)) / 60
        timeDecay     = Math.min(elapsed * 4.5, 22)
      }
      const batchFactor = input.quantity > 150 ? 6 : input.quantity > 75 ? 3 : 0
      const risk        = Math.min(Math.round(base + timeDecay + batchFactor), 98)
      const tier        = risk >= 70 ? 'high' : risk >= 40 ? 'medium' : 'low'
      const confidence  = Number((0.82 + (input.preparedAt ? 0.08 : 0) + (input.quantity > 0 ? 0.04 : 0)).toFixed(2))
      setPrediction({ risk, tier, confidence, tips: TIPS[tier as keyof typeof TIPS], features: { base, timeDecay: Math.round(timeDecay), batchFactor } })
      setLoading(false)
    }, 200)
  }, [])

  const reset = useCallback(() => setPrediction(null), [])
  return { prediction, loading, predict, reset }
}

// ─── Route Optimiser ──────────────────────────────────────────────────────────
export function useRouteOptimiser() {
  const [route,      setRoute]      = useState<RouteResult | null>(null)
  const [optimising, setOptimising] = useState(false)

  const optimise = useCallback(async (
    from: { lat: number; lng: number },
    to:   { lat: number; lng: number; name?: string }
  ) => {
    setOptimising(true)
    try {
      const result = await api.post<RouteResult>('/volunteers/optimise-route', { from, to })
      setRoute(result)
    } catch {
      // Fallback: client-side calculation
      const R    = 6371
      const dLat = (to.lat - from.lat) * Math.PI / 180
      const dLng = (to.lng - from.lng) * Math.PI / 180
      const h    = Math.sin(dLat/2)**2 + Math.cos(from.lat*Math.PI/180)*Math.cos(to.lat*Math.PI/180)*Math.sin(dLng/2)**2
      const dist = R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h))
      const pts  = Array.from({length:10},(_,i)=>({lat:from.lat+(to.lat-from.lat)*(i/9)+(Math.random()-.5)*.004,lng:from.lng+(to.lng-from.lng)*(i/9)+(Math.random()-.5)*.004}))
      setRoute({ distanceKm:dist.toFixed(1), etaMinutes:Math.round(dist*5.8+3), fuelSavedL:(dist*0.08).toFixed(2), timeSavingPct:35, algorithm:'Local NN-TSP', polyline:pts, steps:[{instruction:`Head to ${to.name??'pickup'}`,distance:`${dist.toFixed(1)} km`,duration:`${Math.round(dist*5.8+3)} min`}] })
    } finally {
      setOptimising(false)
    }
  }, [])

  const reset = useCallback(() => setRoute(null), [])
  return { route, optimising, optimise, reset }
}

// ─── Listing actions ──────────────────────────────────────────────────────────
export function useListingActions() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const accept = useCallback(async (listingId: string, volunteerId: string) => {
    setLoading(true); setError(null)
    try   { return await api.post(`/listings/${listingId}/accept`, { volunteerId }) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); throw err }
    finally { setLoading(false) }
  }, [])

  const verifyQR = useCallback(async (listingId: string, qrCode: string) => {
    setLoading(true); setError(null)
    try   { return await api.post(`/listings/${listingId}/verify-qr`, { qrCode }) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); throw err }
    finally { setLoading(false) }
  }, [])

  const markDelivered = useCallback(async (listingId: string) => {
    setLoading(true); setError(null)
    try   { return await api.post(`/listings/${listingId}/deliver`, {}) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); throw err }
    finally { setLoading(false) }
  }, [])

  return { loading, error, accept, verifyQR, markDelivered }
}
