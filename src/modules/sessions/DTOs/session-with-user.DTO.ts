import type { Session } from "@prisma/client";
import type { UserRole } from "../../users/types/user-role.type";

export interface SessionWithUserDTO extends Session {
    user: {
        id: string,
        role: UserRole,
        deletedAt: Date | null
    }
}