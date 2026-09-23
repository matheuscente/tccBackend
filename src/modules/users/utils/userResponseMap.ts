import type { UserResponseDTO } from "../DTOs/user-response.dto";

const userResponseMap = (data: UserResponseDTO): UserResponseDTO =>  {
    return {
      id: data.id,
      name: data.name,
      username: data.username,
      role: data.role,
      birthDate: data.birthDate,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    } 
}

export {
    userResponseMap
}