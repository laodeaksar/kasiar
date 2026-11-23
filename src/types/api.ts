export type ListResponse<T> = {
  rows: T[]
  total: number
  page: number
  pageSize: number
}

export type ApiError = {
  message: string
  fields: Record<string, string>
}
