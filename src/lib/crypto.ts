//Make types for keys that require it to be the right type of key and functions to check
import sodium from 'libsodium-wrappers';
import { concatUint8Arrays } from './crypto_util';
import { isValidApp } from '../data/valid_apps';

await sodium.ready;
(window as any).sodium = sodium;

export function generateIdentityKeypair() {
    return sodium.crypto_sign_keypair();
}

export function generateKXKeypair() {
    return sodium.crypto_kx_keypair();
}


//MUST BE THE SAME LENGTH (BYTES) EVERY TIME (21), and no \x00
enum DHKXContext {
    SignInitialDHK = "KX_DH_V1_SIGN_INITIAL"
}

export function signKXPublicKey(contextMessage: DHKXContext, kxPublicKey: Uint8Array, identityPrivateKey: Uint8Array) {
    const nonce: Uint8Array = sodium.randombytes_buf(16)
    const contextU8: Uint8Array = new TextEncoder().encode(contextMessage);
    const fullMessage: Uint8Array = concatUint8Arrays(contextU8, nonce, kxPublicKey)
    return {
        contextU8,
        nonce,
        fullMessage,
        signature: sodium.crypto_sign_detached(fullMessage, identityPrivateKey),
    }
}
(window as any).generateIdentityKeypair = generateIdentityKeypair;
(window as any).isValidApp = isValidApp