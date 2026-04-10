import type { Invoice, ApiResponse } from '@/types'
import { mockInvoices } from '../db/invoices'
import { mockRequest, mockPaginatedRequest } from './mockClient'

let invoices = [...mockInvoices]

export const invoicesApi = {
  getAll: (params: { companyId?: string; status?: string; page?: number; perPage?: number; search?: string } = {}): Promise<ApiResponse<Invoice[]>> => {
    let filtered = invoices
    if (params.companyId) filtered = filtered.filter((i) => i.companyId === params.companyId)
    if (params.status) filtered = filtered.filter((i) => i.status === params.status)
    return mockPaginatedRequest(filtered, { page: params.page, perPage: params.perPage, search: params.search, searchFields: ['invoiceNumber', 'notes'] })
  },

  getById: (id: string): Promise<ApiResponse<Invoice>> => {
    const invoice = invoices.find((i) => i.id === id)
    if (!invoice) return Promise.reject(new Error(`Fattura ${id} non trovata`))
    return mockRequest(invoice)
  },

  update: (id: string, payload: Partial<Invoice>): Promise<ApiResponse<Invoice>> => {
    invoices = invoices.map((i) => (i.id === id ? { ...i, ...payload } : i))
    const updated = invoices.find((i) => i.id === id)!
    return mockRequest(updated)
  },
}
