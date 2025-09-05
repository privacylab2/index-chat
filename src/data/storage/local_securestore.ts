import sodium from 'libsodium-wrappers';
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

expose({
    dk: deriveKey
})