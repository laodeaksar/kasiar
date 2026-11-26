export type ListResponse<T> = {
  rows: T[]
  total: number
  page: number
  pageSize: number
}

export type ApiError = {
  status: number
  message: string
  fields: Record<string, string>
  details?: unknown
}
