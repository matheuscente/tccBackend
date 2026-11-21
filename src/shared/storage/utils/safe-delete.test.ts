import type { IStorageProvider } from "../interfaces/storage-provider.interface";
import { safeDeleteStoredObject } from "./safe-delete.util";

describe("safeDeleteStoredObject tests", () => {
    const storageMock = { delete: jest.fn() } as unknown as jest.Mocked<IStorageProvider>;

    afterEach(() => jest.restoreAllMocks());

    it("should delete the object without logging", async () => {
        storageMock.delete.mockResolvedValue();
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

        await safeDeleteStoredObject(storageMock, "key", "test");

        expect(storageMock.delete).toHaveBeenCalledWith("key");
        expect(consoleError).not.toHaveBeenCalled();
    });

    it("should log the failure with the key and the context instead of throwing", async () => {
        const error = new Error("storage error");
        storageMock.delete.mockRejectedValue(error);
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

        await expect(safeDeleteStoredObject(storageMock, "users/key.pdf", "exclusão de arquivo")).resolves.toBeUndefined();

        expect(consoleError).toHaveBeenCalledWith('Falha ao remover o objeto "users/key.pdf" do armazenamento (exclusão de arquivo)', error);
    });
});
