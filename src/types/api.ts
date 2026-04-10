export interface ApiResponse<T> {
  data: T
  meta?: {
    total: number
    page: number
    perPage: number
  }
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  field?: string
}

export interface PaginatedRequest {
  page?: number
  perPage?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  search?: string
}
