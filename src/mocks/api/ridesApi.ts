import type { Ride, ApiResponse } from '@/types'
import { mockRides } from '../db/rides'
import { mockRequest, mockPaginatedRequest } from './mockClient'

let rides = [...mockRides]

export const ridesApi = {
  getAll: (params: { companyId?: string; status?: string; page?: number; perPage?: number; search?: string } = {}): Promise<ApiResponse<Ride[]>> => {
    let filtered = rides
    if (params.companyId) filtered = filtered.filter((r) => r.companyId === params.companyId)
    if (params.status) filtered = filtered.filter((r) => r.status === params.status)
    return mockPaginatedRequest(filtered, { page: params.page, perPage: params.perPage, search: params.search, searchFields: ['passengerName', 'internalRef'] })
  },

  getById: (id: string): Promise<ApiResponse<Ride>> => {
    const ride = rides.find((r) => r.id === id)
    if (!ride) return Promise.reject(new Error(`Corsa ${id} non trovata`))
    return mockRequest(ride)
  },

  getActive: (): Promise<ApiResponse<Ride[]>> => {
    const active = rides.filter((r) => r.status === 'in_corso' || r.status === 'assegnata')
    return mockRequest(active, { latencyMs: 80 })
  },

  create: (payload: Omit<Ride, 'id' | 'createdAt'>): Promise<ApiResponse<Ride>> => {
    const newRide: Ride = {
      ...payload,
      id: `ride-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    rides = [newRide, ...rides]
    return mockRequest(newRide, { latencyMs: 400 })
  },

  update: (id: string, payload: Partial<Ride>): Promise<ApiResponse<Ride>> => {
    rides = rides.map((r) => (r.id === id ? { ...r, ...payload } : r))
    const updated = rides.find((r) => r.id === id)!
    return mockRequest(updated, { latencyMs: 300 })
  },

  cancel: (id: string): Promise<ApiResponse<Ride>> => {
    rides = rides.map((r) => r.id === id ? { ...r, status: 'annullata' } : r)
    const updated = rides.find((r) => r.id === id)!
    return mockRequest(updated, { latencyMs: 200 })
  },

  getPositions: (): Promise<ApiResponse<{ rideId: string; driverId: string; lat: number; lng: number; heading: number; speed: number }[]>> => {
    const positions = rides
      .filter((r) => r.status === 'in_corso' && r.driverId)
      .map((r) => ({
        rideId: r.id,
        driverId: r.driverId!,
        lat: r.origin.lat + (Math.random() - 0.5) * 0.05,
        lng: r.origin.lng + (Math.random() - 0.5) * 0.05,
        heading: Math.floor(Math.random() * 360),
        speed: Math.floor(Math.random() * 60) + 10,
      }))
    return mockRequest(positions, { latencyMs: 80 })
  },
}
