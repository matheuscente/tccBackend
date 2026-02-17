import { HashProvider } from "./hash.provider";

describe('hash util test', () => {
    const saltRounds = 10;
    let hashProvider: HashProvider;
    const password = '123'

    beforeEach(() => {
        hashProvider = new HashProvider(saltRounds)
    })

    it('should generate a password hash', async () => {
        const hashed = await hashProvider.hash(password)

        expect(typeof hashed).toBe("string")
        expect(hashed).not.toBe(password)
        expect(hashed.length).toBeGreaterThanOrEqual(20)
    })

    it('should validate password', async () => {
        const hashed = await hashProvider.hash(password)

        const isValid = await hashProvider.compare(password, hashed)

        expect(isValid).toBe(true)
    })

    it("should be fail to validate a invalid password", async () => {
        const wrongPassword = 'incorrectPassword'

        const isValid = await hashProvider.compare(password, wrongPassword)

        expect(isValid).toBe(false)
    })

        it("should fail because the hashed password is the same as the original password", async () => {

        const isValid = await hashProvider.compare(password, password)

        expect(isValid).toBe(false)
    })



})