export interface ListUsersQueryDTO {
    search?: string
    page?: number
    pageSize?: number
}

export interface PaginatedUsersDTO<T> {
    items: T[]
    total: number
    page: number
    pageSize: number
}
