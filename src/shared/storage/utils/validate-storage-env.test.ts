import { validateStorageEnv } from "./validate-storage-env.util";

describe("validateStorageEnv tests", () => {
    const complete = {
        endpoint: "https://s3.us-east-005.backblazeb2.com",
        region: "us-east-005",
        bucket: "bucket",
        keyId: "key-id",
        applicationKey: "application-key",
    };

    it("should accept a complete B2 configuration", () => {
        expect(validateStorageEnv(complete)).toEqual([]);
    });

    it("should accept no B2 configuration (local disk)", () => {
        expect(validateStorageEnv({})).toEqual([]);
    });

    it("should list the missing variables when the configuration is partial", () => {
        const errors = validateStorageEnv({ ...complete, keyId: undefined, applicationKey: " " });

        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain("B2_KEY_ID, B2_APPLICATION_KEY");
    });

    it("should require the endpoint to start with https://", () => {
        const errors = validateStorageEnv({ ...complete, endpoint: "s3.us-east-005.backblazeb2.com" });

        expect(errors).toEqual([expect.stringContaining("B2_ENDPOINT precisa começar com https://")]);
    });

    it("should accept the local simulator endpoint over http", () => {
        expect(validateStorageEnv({ ...complete, endpoint: "http://localhost:9000" })).toEqual([]);
    });

    it("should reject an endpoint that is not a valid URL", () => {
        const errors = validateStorageEnv({ ...complete, endpoint: "https://exa mple.com" });

        expect(errors).toEqual([expect.stringContaining("B2_ENDPOINT não é uma URL válida")]);
    });
});
