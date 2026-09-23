const createUser = `
CREATE(u:User{
  username: $username,
  id: randomUUID(),
  name: $name,
  password : $password,
  birthDate:  Date($birthDate),
  role: $role,
  createdAt: dateTime()
})

RETURN {
 id: u.id,
 name: u.name,
 username: u.username,
 birthDate: u.birthDate,
 role: u.role,
 createdAt: u.createdAt
} AS user
`
const getUserById = `MATCH(u:User{id: $id})
WHERE u.deletedAt IS NULL

RETURN {
 id: u.id,
 name: u.name,
 username: u.username,
 birthDate: u.birthDate,
 role: u.role,
 deletedAt: u.deletedAt,
 updatedAt: u.updatedAt,
 createdAt: u.createdAt

} AS user
`

const getUserByUserame = `
MATCH(u:User{username: $username})
WHERE u.deletedAt IS NULL

RETURN {
  id: u.id,
  name: u.name,
  username: u.username,
  birthDate: u.birthDate,
  role: u.role,
  deletedAt: u.deletedAt,
  updatedAt: u.updatedAt,
  createdAt: u.createdAt
} AS user
`

const getUserPassword = `
MATCH(u:User{username: $username})
WHERE u.deletedAt IS NULL

RETURN {
 id: u.id,
 username: u.username,
 password: u.password
} AS user
`

const updateUserPassword = `
MATCH(u:User{id: $userId})
WHERE u.deletedAt IS NULL

  SET u.password = $password,
      u.updatedAt = dateTime()
`

const updateUserData = `
MATCH(u:User{id: $id})
WHERE u.deletedAt IS NULL

SET u.name = $name,
    u.username = $username,
    u.birthDate =  Date($birthDate),
    u.role = $role,
    u.updatedAt = dateTime()

RETURN {
  id: u.id,
  name: u.name,
  username: u.username,
  birthDate: u.birthDate,
  role:  u.role,
  deletedAt: u.deletedAt,
  updatedAt: u.updatedAt
} AS user
`

const deleteUser = `
MATCH(u:User{id: $id})
WHERE u.deletedAt IS NULL

SET u.deletedAt =  dateTime(),
    u.updatedAt = dateTime()
`

const deleteAllUsers = `
  MATCH(u:User)
  DETACH DELETE u 
`

export {
    deleteUser,
    updateUserData,
    updateUserPassword,
    getUserById,
    getUserByUserame,
    getUserPassword,
    createUser,
    deleteAllUsers
}