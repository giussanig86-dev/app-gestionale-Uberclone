import type { ApiResponse } from '@/types'

const MIN_LATENCY = 80
const MAX_LATENCY = 350

function randomLatency(): number {
  return Math.floor(Math.random() * (MAX_LATENCY - MIN_LATENCY) + MIN_LATENCY)
}

export async function mockRequest<T>(
  data: T,
  options: { errorRate?: number; latencyMs?: number } = {}
): Promise<ApiResponse<T>> {
  const latency = options.latencyMs ?? randomLatency()
  await new Promise((resolve) => setTimeout(resolve, latency))

  const shouldError = Math.random() < (options.errorRate ?? 0)
  if (shouldError) {
    throw new Error('Errore di rete simulato (App Gestionale 2)')
  }

  return {
    data,
    timestamp: new Date().toISOString(),
  }
}

export async function mockPaginatedRequest<T>(
  allData: T[],
  params: { page?: number; perPage?: number; search?: string; searchFields?: (keyof T)[] },
  options: { errorRate?: number; latencyMs?: number } = {}
): Promise<ApiResponse<T[]>> {
  const latency = options.latencyMs ?? randomLatency()
  await new Promise((resolve) => setTimeout(resolve, latency))

  const shouldError = Math.random() < (options.errorRate ?? 0)
  if (shouldError) {
    throw new Error('Errore di rete simulato (App Gestionale 2)')
  }

  let filtered = allData

  if (params.search && params.searchFields && params.searchFields.length > 0) {
    const q = params.search.toLowerCase()
    filtered = allData.filter((item) =>
      params.searchFields!.some((field) => {
        const val = item[field]
        return typeof val === 'string' && val.toLowerCase().includes(q)
      })
    )
  }

  const page = params.page ?? 1
  const perPage = params.perPage ?? 20
  const start = (page - 1) * perPage
  const paginated = filtered.slice(start, start + perPage)

  return {
    data: paginated,
    meta: {
      total: filtered.length,
      page,
      perPage,
    },
    timestamp: new Date().toISOString(),
  }
}
