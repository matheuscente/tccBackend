export interface PaginatedUsersDTO<T> {
    items: T[]
    total: number
    page: number
    pageSize: number
}
