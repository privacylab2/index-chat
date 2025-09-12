import { sha256 } from "hash-wasm";
import { generateIdentityKeypair } from "../../../lib/crypt/crypto";
import { SecureStore, Argon2IdKey } from "../lib/local_securestore";
/**
 * 
 * @param name The name of the user account (without any @ sign) validation is possible but wont accomplish much unless client limits usernames to <16 or something
 * @param encryptionKey An encryption key for most of the accounts data, should be Argon2id securely derived
 */
export async function createUserAccount(name: string, encryptionKey: Argon2IdKey) {
    const identityKeyPair = generateIdentityKeypair();
    const processedName: string = name.slice(0, 16)
    const userStoreName: string = `ndxuser_${processedName}`
    const userStore = new SecureStore(userStoreName, encryptionKey)
    if (!await userStore.storeCreated()) {
        await userStore.set('keypair', identityKeyPair)
        await userStore.set('details', {
            name,
            createdAt: new Date().toISOString(),
            clientId: 'NDX'
        })
    } else {   
        //user account already exists or has data
        return false
    }


    return userStoreName
}

export async function deleteUserAccount(name: string) {
    const processedName: string = name.slice(0, 16)
    const userStoreName: string = `ndxuser_${processedName}`
    electronAPI.writeStore(userStoreName, new Uint8Array())
    return electronAPI.dangerousDeleteStore(userStoreName, await sha256(userStoreName))
}