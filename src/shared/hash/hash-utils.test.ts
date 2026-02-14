import { Hash } from "../hash/hash-utils";

describe('hash util test', () => {
    const saltRounds = 10;
    let hashUtil: Hash;
    const password = '123'

    beforeEach(() => {
        hashUtil = new Hash(saltRounds)
    })

    it('should generate a password hash', async () => {
        const hashed = await hashUtil.hash(password)

        expect(typeof hashed).toBe("string")
        expect(hashed).not.toBe(password)
        expect(hashed.length).toBeGreaterThanOrEqual(20)
    })

    it('should validate password', async () => {
        const hashed = await hashUtil.hash(password)

        const isValid = await hashUtil.compare(password, hashed)

        expect(isValid).toBe(true)
    })

    it("should be fail to validate a invalid password", async () => {
        const wrongPassword = 'incorrectPassword'

        const isValid = await hashUtil.compare(password, wrongPassword)

        expect(isValid).toBe(false)
    })

        it("should fail because the hashed password is the same as the original password", async () => {

        const isValid = await hashUtil.compare(password, password)

        expect(isValid).toBe(false)
    })



})