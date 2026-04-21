import api from './client'
import type { ListingFilters, ListingStatus } from '../types'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getMe: () =>
    api.get('/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post(`/auth/reset-password/${token}`, { password }),

  verifyEmail: (token: string) =>
    api.get(`/auth/verify/${token}`),

  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),
}

// ── Listings ──────────────────────────────────────────────────────────────────
export const listingsApi = {
  getAll: (filters: ListingFilters = {}) =>
    api.get('/listings', { params: filters }),

  getMine: () =>
    api.get('/listings/mine'),

  getById: (id: string) =>
    api.get(`/listings/${id}`),

  getMapPins: (filters: Partial<ListingFilters> = {}) =>
    api.get('/listings/map', { params: filters }),

  create: (formData: FormData) =>
    api.post('/listings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, formData: FormData) =>
    api.put(`/listings/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateStatus: (id: string, status: ListingStatus) =>
    api.patch(`/listings/${id}/status`, { status }),

  deleteImage: (id: string, imageUrl: string) =>
    api.delete(`/listings/${id}/image`, { data: { imageUrl } }),

  delete: (id: string) =>
    api.delete(`/listings/${id}`),

  toggleFavorite: (id: string) =>
    api.post(`/listings/${id}/favorite`),
}

// ── Universities ──────────────────────────────────────────────────────────────
export const universitiesApi = {
  search: (query: string, state?: string) =>
    api.get('/universities', { params: { search: query, state } }),
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatApi = {
  getThreads: () =>
    api.get('/threads'),

  getUnreadCount: () =>
    api.get('/threads/unread-count'),

  createThread: (listingId: string) =>
    api.post('/threads', { listingId }),

  getMessages: (threadId: string) =>
    api.get(`/threads/${threadId}/messages`),

  sendMessage: (threadId: string, body: string) =>
    api.post(`/threads/${threadId}/messages`, { body }),

  blockThread: (threadId: string) =>
    api.patch(`/threads/${threadId}/block`),

  deleteThread: (threadId: string) =>
    api.patch(`/threads/${threadId}/delete`),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () =>
    api.get('/admin/stats'),

  getUsers: (params = {}) =>
    api.get('/admin/users', { params }),

  updateUser: (id: string, data: object) =>
    api.patch(`/admin/users/${id}`, data),

  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`),

  getAllListings: (params = {}) =>
    api.get('/admin/listings', { params }),

  reactivateListing: (id: string) =>
    api.patch(`/admin/listings/${id}/reactivate`),

  forceStatus: (id: string, status: string) =>
    api.patch(`/admin/listings/${id}/status`, { status }),

  boostListing: (id: string, days: number) =>
    api.patch(`/admin/listings/${id}/boost`, { days }),

  unboostListing: (id: string) =>
    api.patch(`/admin/listings/${id}/unboost`),

  deleteListing: (id: string) =>
    api.delete(`/admin/listings/${id}`),

  getAllThreads: (params = {}) =>
    api.get('/admin/threads', { params }),
}
