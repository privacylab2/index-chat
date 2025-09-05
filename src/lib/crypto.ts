//Make types for keys that require it to be the right type of key and functions to check
import sodium from 'libsodium-wrappers';
import { concatUint8Arrays } from './crypto_util';
import { isValidApp, parseProtocolBytes, protocolValid } from '../data/validation';
import { DEBUG_MODE } from './_globals';

await sodium.ready;

export function generateIdentityKeypair() {
    return sodium.crypto_sign_keypair();
}

export function generateKXKeypair() {
    return sodium.crypto_kx_keypair();
}



/**
 * 
 * @param contextMessage the context message (in format as seen in validation.ts and implementation.md)
 * @param data the data of the message to transmit (not context) 
 * @returns 
 */
export function createUnauthenticatedMessage(contextU8: Uint8Array, data: Uint8Array) {
    const nonce: Uint8Array = sodium.randombytes_buf(16)
    // const contextU8: Uint8Array = new TextEncoder().encode(contextMessage);
    if (!protocolValid(parseProtocolBytes(contextU8))) return false;
    const meta: Uint8Array = concatUint8Arrays(nonce, contextU8)
    return {
        meta,
        data
        // signature: sodium.crypto_sign_detached(fullMessage, identityPrivateKey),
    }
}

export function parseMessageMetadata(meta: Uint8Array) {
    return {
        nonce: meta.slice(0, 16),
        context: meta.slice(16)
    }
}
if (DEBUG_MODE) {
    (window as any).sodium = sodium;
    (window as any).generateIdentityKeypair = generateIdentityKeypair;
    (window as any).isValidApp = isValidApp;
    (window as any).createUm = createUnauthenticatedMessage;
    (window as any).pmm = parseMessageMetadata
}