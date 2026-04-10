import type { Vehicle, ApiResponse } from '@/types'
import { mockVehicles } from '../db/vehicles'
import { mockRequest, mockPaginatedRequest } from './mockClient'

let vehicles = [...mockVehicles]

export const vehiclesApi = {
  getAll: (params: { companyId?: string; status?: string; page?: number; perPage?: number; search?: string } = {}): Promise<ApiResponse<Vehicle[]>> => {
    let filtered = vehicles
    if (params.companyId) filtered = filtered.filter((v) => v.companyId === params.companyId)
    if (params.status) filtered = filtered.filter((v) => v.status === params.status)
    return mockPaginatedRequest(filtered, { page: params.page, perPage: params.perPage, search: params.search, searchFields: ['plate', 'brand', 'model'] })
  },

  getById: (id: string): Promise<ApiResponse<Vehicle>> => {
    const vehicle = vehicles.find((v) => v.id === id)
    if (!vehicle) return Promise.reject(new Error(`Veicolo ${id} non trovato`))
    return mockRequest(vehicle)
  },

  getAvailable: (): Promise<ApiResponse<Vehicle[]>> => {
    return mockRequest(vehicles.filter((v) => v.status === 'disponibile'), { latencyMs: 100 })
  },

  update: (id: string, payload: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> => {
    vehicles = vehicles.map((v) => (v.id === id ? { ...v, ...payload } : v))
    const updated = vehicles.find((v) => v.id === id)!
    return mockRequest(updated)
  },
}
