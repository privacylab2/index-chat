import { deriveKey, encryptData, decryptData } from "./basic_encryption";

export async function createSecureStore(name: string) {
    const udPath: string = await electronAPI.getUserDataPath();
}