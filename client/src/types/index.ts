// ── User ──────────────────────────────────────────────────────────────────────
export interface User {
  _id: string
  name: string
  email: string
  isVerifiedStudent: boolean
  role: 'user' | 'admin'
  favorites: string[]
  createdAt: string
}

// ── Listing ───────────────────────────────────────────────────────────────────
export type ListingStatus = 'active' | 'pending' | 'offMarket'

export interface ListingOwner {
  _id: string
  name: string
  isVerifiedStudent: boolean
  email?: string
}

export interface Listing {
  _id: string
  owner: ListingOwner
  title: string
  description?: string
  price: number
  bedrooms: number
  petsAllowed: boolean
  utilitiesIncluded: boolean
  address: string
  city: string
  state: string
  university: string
  coordinates: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
  }
  distanceToCampus: number | null
  images: string[]
  favoriteCount: number
  status: ListingStatus
  boostedUntil: string | null
  expiresAt: string
  createdAt: string
  updatedAt: string
  // Computed by API
  isFavorited?: boolean
  isBoosted?: boolean
  isOwnListing?: boolean
}

export interface MapPin {
  _id: string
  title: string
  price: number
  status: ListingStatus
  images: string[]
  coordinates: {
    type: 'Point'
    coordinates: [number, number]
  }
}

// ── Thread & Messages ─────────────────────────────────────────────────────────
export interface ListingSnapshot {
  title: string
  mainImage: string
  price: number
  status: ListingStatus
}

export interface Thread {
  _id: string
  listing: string
  participants: User[]
  listingSnapshot: ListingSnapshot
  blockedBy: string[]
  deletedBy: string[]
  lastMessage: string
  lastMessageAt: string
  createdAt: string
  // Computed
  unreadCount?: number
  isBlocked?: boolean
}

export interface Message {
  _id: string
  thread: string
  sender: User
  body: string
  readBy: string[]
  createdAt: string
}

// ── University ────────────────────────────────────────────────────────────────
export interface University {
  _id: string
  name: string
  city: string
  state: string
  coordinates: {
    type: 'Point'
    coordinates: [number, number]
  }
  domain?: string
}

// ── API responses ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ── Forms ─────────────────────────────────────────────────────────────────────
export interface RegisterForm {
  name: string
  email: string
  password: string
}

export interface LoginForm {
  email: string
  password: string
}

export interface ListingForm {
  title: string
  description: string
  price: string
  bedrooms: string
  petsAllowed: string
  utilitiesIncluded: string
  address: string
  city: string
  state: string
  university: string
  images: File[]
}

// ── Filters ───────────────────────────────────────────────────────────────────
export interface ListingFilters {
  state?: string
  city?: string
  university?: string
  minPrice?: string
  maxPrice?: string
  bedrooms?: string
  petsAllowed?: string
  utilitiesIncluded?: string
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'distance_asc' | 'distance_desc'
  page?: number
}
