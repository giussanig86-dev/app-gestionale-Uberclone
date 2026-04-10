import type { Driver, GeoPosition, ApiResponse } from '@/types'
import { mockDrivers } from '../db/drivers'
import { mockRequest, mockPaginatedRequest } from './mockClient'

let drivers = [...mockDrivers]

const jitter = (v: number) => v + (Math.random() - 0.5) * 0.002

export const driversApi = {
  getAll: (params: { companyId?: string; status?: string; page?: number; perPage?: number; search?: string } = {}): Promise<ApiResponse<Driver[]>> => {
    let filtered = drivers
    if (params.companyId) filtered = filtered.filter((d) => d.companyId === params.companyId)
    if (params.status) filtered = filtered.filter((d) => d.status === params.status)
    return mockPaginatedRequest(filtered, { page: params.page, perPage: params.perPage, search: params.search, searchFields: ['firstName', 'lastName', 'phone'] })
  },

  getById: (id: string): Promise<ApiResponse<Driver>> => {
    const driver = drivers.find((d) => d.id === id)
    if (!driver) return Promise.reject(new Error(`Autista ${id} non trovato`))
    return mockRequest(driver)
  },

  getAvailable: (): Promise<ApiResponse<Driver[]>> => {
    return mockRequest(drivers.filter((d) => d.status === 'disponibile'), { latencyMs: 100 })
  },

  updatePosition: (id: string): Promise<ApiResponse<GeoPosition>> => {
    drivers = drivers.map((d) => {
      if (d.id !== id || !d.currentPosition) return d
      const newPos: GeoPosition = {
        lat: jitter(d.currentPosition.lat),
        lng: jitter(d.currentPosition.lng),
        heading: (d.currentPosition.heading ?? 0 + Math.floor(Math.random() * 20 - 10) + 360) % 360,
        speed: d.status === 'in_corsa' ? Math.floor(Math.random() * 50) + 15 : 0,
        timestamp: new Date().toISOString(),
      }
      return { ...d, currentPosition: newPos }
    })
    const updated = drivers.find((d) => d.id === id)
    return mockRequest(updated?.currentPosition ?? { lat: 0, lng: 0, timestamp: new Date().toISOString() }, { latencyMs: 50 })
  },

  getAllPositions: (): Promise<ApiResponse<{ driverId: string; position: GeoPosition }[]>> => {
    drivers = drivers.map((d) => {
      if (!d.currentPosition || d.status === 'offline') return d
      return {
        ...d,
        currentPosition: {
          lat: jitter(d.currentPosition.lat),
          lng: jitter(d.currentPosition.lng),
          heading: ((d.currentPosition.heading ?? 0) + Math.floor(Math.random() * 10 - 5) + 360) % 360,
          speed: d.status === 'in_corsa' ? Math.floor(Math.random() * 50) + 15 : 0,
          timestamp: new Date().toISOString(),
        },
      }
    })
    const positions = drivers
      .filter((d) => d.currentPosition && d.status !== 'offline')
      .map((d) => ({ driverId: d.id, position: d.currentPosition! }))
    return mockRequest(positions, { latencyMs: 80 })
  },
}
