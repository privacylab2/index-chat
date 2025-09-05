import sodium from 'libsodium-wrappers';
await sodium.ready;
import { argon2id } from "hash-wasm";
import { expose } from '../../lib/_globals';


export async function deriveKey(pass: string, extraOptions: object, saltBytes: Uint8Array) {
    const salt = saltBytes ? saltBytes : sodium.randombytes_buf(16);
    return {
        hash: await argon2id({
            hashLength: 32,
            iterations: 7,
            memorySize: 64 * 256,
            salt: salt,
            parallelism: 1,
            ...extraOptions,
            outputType: 'binary',
            password: pass,
        }),
        salt
    }
}

export async function encryptData(data: string | Uint8Array, key: Uint8Array) {
    const nonce: Uint8Array = sodium.randombytes_buf(24);
    const ciphertext: Uint8Array = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
        data,
        null,
        null,
        nonce,
        key
    )

    return {
        nonce,
        ciphertext
    }
}

export async function decryptData(data: Uint8Array, nonce: Uint8Array, key: Uint8Array) {
    try {
        const plaintext: Uint8Array = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
            null,
            data,
            null,
            nonce,
            key
        )
        return plaintext
    } catch (e) {
        return null;
    }
}



expose({
    dk: deriveKey,
    encryptData,
    decryptData
})