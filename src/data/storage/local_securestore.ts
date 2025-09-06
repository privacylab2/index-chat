import { decode, encode } from "@msgpack/msgpack";
import { encryptData, decryptData } from "./basic_encryption";
import { concatUint8Arrays } from "../../lib/crypt/crypto_util";
import { expose } from "../../lib/_globals";

interface Argon2IdKey {
    hash: Uint8Array,
    salt: Uint8Array
}
export class SecureStore {
    name: string;
    key: Argon2IdKey;
    constructor(name: string, key: Argon2IdKey) {
        this.name = name;
        this.key = key;
    }

    async _read() {
        return await electronAPI.readStore(this.name)
    }

    async _write(data: Uint8Array) {
        await electronAPI.writeStore(this.name, data)
    }

    static async getSalt(name: string) {
        const data: Uint8Array = await electronAPI.readStore(name)
        if (data.length == 0) {
            return null
        }

        return data.slice(0,16)
    }

    async read() {
        const rawData = await this._read();
        const salt: Uint8Array = rawData.slice(0,16)
        const nonce = rawData.slice(16, 40)
        const data = rawData.slice(40)
        const decryptionResponse = await decryptData(data, nonce, this.key.hash)
        if (decryptionResponse == null) return null;
        const decryptedData: Uint8Array = decryptionResponse;
        const decryptedObject: any = decode(decryptedData)
        return decryptedObject
    }

    async write(obj: any) {
        const encoded: any = encode(obj);
        const encrpytionResponse: {nonce:Uint8Array,ciphertext:Uint8Array} = await encryptData(encoded, this.key.hash);
        const nonce: Uint8Array = encrpytionResponse.nonce;
        const ciphertext: Uint8Array = encrpytionResponse.ciphertext
        const fullData: Uint8Array = concatUint8Arrays(this.key.salt, nonce, ciphertext)
        return await this._write(fullData)
    }

    async set(key: string, value: object) {
        await electronAPI.ensureStore(this.name);
        let obj: any = await this.read();
        if (obj == null) obj = {}
        obj[key] = value;
        return await this.write(obj)
    }

    async get(key: string) {
        await electronAPI.ensureStore(this.name);
        const data: any = await this.read();
        return data[key]
    }

    async wipe(validation: string) {
        if (validation === `CONFIRM WIPE ${this.name}`) {
            await this._write(new Uint8Array([]))
            return true
        } else {
            return false
        }
    }

}

expose({
    SecureStore
})