// ─── Domain types ─────────────────────────────────────────────────────────────

export type UserRole    = 'ngo' | 'restaurant' | 'volunteer' | 'admin'
export type ListingStatus = 'available' | 'in_transit' | 'delivered' | 'expired' | 'cancelled'
export type FoodType    = 'cooked_meals' | 'bakery' | 'raw_produce' | 'dairy' | 'catering_event' | 'packaged_food'
export type StorageCond = 'room_temperature' | 'refrigerated' | 'hot_heated' | 'frozen'
export type VehicleType = 'car' | 'scooter' | 'bicycle' | 'van'
export type PickupStep  = 'listed' | 'accepted' | 'assigned' | 'en_route' | 'qr_verified' | 'delivered'
export type NotifType   = 'urgent' | 'tracking' | 'success' | 'info' | 'system'

export interface User {
  id:         string
  name:       string
  email:      string
  role:       UserRole
  phone?:     string
  avatarUrl?: string
  isVerified: boolean
  orgId?:     string
  orgName?:   string
  createdAt:  string
}

export interface Listing {
  id:             string
  name:           string
  foodType:       FoodType
  quantity:       number
  unit:           string
  storage:        StorageCond
  allergens:      string[]
  notes?:         string
  images:         string[]
  preparedAt?:    string
  pickupDeadline: string
  pickupLat:      number
  pickupLng:      number
  pickupAddress:  string
  spoilageRisk:   number
  aiConfidence?:  number
  status:         ListingStatus
  donorName:      string
  city:           string
  donorLat?:      number
  donorLng?:      number
  assignedNgoId?: string
  ngoName?:       string
  qrCode?:        string
  qrVerifiedAt?:  string
  acceptedAt?:    string
  deliveredAt?:   string
  createdAt:      string
}

export interface Volunteer {
  id:              string
  userId:          string
  name:            string
  phone?:          string
  vehicle:         VehicleType
  rating:          number
  totalDeliveries: number
  kgDelivered:     number
  isAvailable:     boolean
  currentListingId?: string
  avatarUrl?:      string
}

export interface NGO {
  id:           string
  name:         string
  city:         string
  capacity?:    number
  isVerified:   boolean
  mealsReceived: number
  contactEmail?: string
  contactPhone?: string
}

export interface Notification {
  id:        string
  type:      NotifType
  title:     string
  body?:     string
  listingId?: string
  isRead:    boolean
  createdAt: string
}

export interface Pickup {
  id:          string
  listingId:   string
  foodName:    string
  quantity:    number
  unit:        string
  currentStep: PickupStep
  volunteerName: string
  ngoName:     string
  acceptedAt:  string
  deliveredAt?: string
}

export interface SpoilagePrediction {
  risk:       number
  tier:       'high' | 'medium' | 'low'
  confidence: number
  tips:       string[]
  features: {
    base:        number
    timeDecay:   number
    batchFactor: number
  }
}

export interface RouteResult {
  distanceKm:    string
  etaMinutes:    number
  fuelSavedL:    string
  timeSavingPct: number
  algorithm:     string
  polyline:      Array<{ lat: number; lng: number }>
  steps:         Array<{ instruction: string; distance: string; duration: string }>
}

export interface ImpactSummary {
  totals: {
    total_listings:   number
    total_delivered:  number
    total_kg:         number
    total_meals:      number
    meals_today:      number
    kg_today:         number
    active_volunteers: number
  }
  byCategory:   Array<{ food_type: string; count: number; kg: number }>
  weeklyTrend:  Array<{ day: string; kg: number; meals: number }>
  monthlyTrend: Array<{ month: string; kg: number }>
  ngos:         NGO[]
  co2PreventedKg: number
}

// ─── Form types ───────────────────────────────────────────────────────────────
export interface CreateListingForm {
  name:           string
  foodType:       string
  quantity:       string
  unit:           string
  storage:        string
  allergens:      string
  notes:          string
  preparedAt:     string
  pickupDeadline: string
  pickupAddress:  string
  pickupLat:      string
  pickupLng:      string
  distance:       string
}
