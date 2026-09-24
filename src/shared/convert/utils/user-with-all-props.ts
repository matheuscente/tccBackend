import type { UserRole } from "../../../modules/users/types/user-role.type"

interface UserWithAllProps {
    id: string,
    name: string,
    username: string,
    role: UserRole,
    birthDate: number,
    createdAt: number,
    updatedAt?: number | undefined,
    deletedAt?: number | undefined,
    password: string

}

export {
    type UserWithAllProps
}