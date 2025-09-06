//Make types for keys that require it to be the right type of key and functions to check
import sodium from 'libsodium-wrappers';
import { concatUint8Arrays } from './crypto_util';
import { isValidApp, parseProtocolBytes, protocolValid } from '../../data/validation';
import { expose } from '../_globals';

await sodium.ready;

export function generateIdentityKeypair() {
    return sodium.crypto_sign_keypair();
}

export function generateKXKeypair() {
    return sodium.crypto_kx_keypair();
}



interface UnauthenticatedMessage { meta: Uint8Array, data: Uint8Array };
/**
 * 
 * @param contextMessage the context message (in format as seen in validation.ts and implementation.md)
 * @param data the data of the message to transmit (not context) 
 * @param nonceGenerator a NONCEGEN_ANTIREPLAY generator object
 * @returns 
 */
export function createUnauthenticatedMessage(contextU8: Uint8Array, data: Uint8Array, nonceGenerator: Generator): UnauthenticatedMessage | boolean {
    const nonce: Uint8Array = nonceGenerator.next().value as Uint8Array;
    // const contextU8: Uint8Array = new TextEncoder().encode(contextMessage);
    if (!protocolValid(parseProtocolBytes(contextU8))) return false;
    const meta: Uint8Array = concatUint8Arrays(nonce, contextU8)
    return {
        meta,
        data
        // signature: sodium.crypto_sign_detached(fullMessage, identityPrivateKey),
    }
}

interface SignedMessage { data: Uint8Array, signature: Uint8Array }
/** signs a response to createUnauthenticatedMessage */
export function signMessage(messageObject: object, identityPrivateKey: Uint8Array): SignedMessage {
    const encoded: Uint8Array = encode(messageObject);
    const signature: Uint8Array = sodium.crypto_sign_detached(encoded, identityPrivateKey);
    return {
        data: encoded,
        signature
    }
}

export function parseSignedMessage(signedMessageObject: SignedMessage, identityPublicKey: Uint8Array) {
    const signature: Uint8Array = signedMessageObject.signature;
    const data: Uint8Array = signedMessageObject.data;
    const dataUnpacked: UnauthenticatedMessage = decode(data) as UnauthenticatedMessage;
    const unpackedMeta: Uint8Array = dataUnpacked.meta;
    const unpackedData: Uint8Array = dataUnpacked.data;
    const nonce: Uint8Array = unpackedMeta.slice(0,10)
    const context: Uint8Array = unpackedMeta.slice(10)

    const signatureValid: boolean = sodium.crypto_sign_verify_detached(signature, data, identityPublicKey);
    return {
        nonce,
        context,
        data: unpackedData,
        signatureValid
    }
}


export function parseMessageMetadata(meta: Uint8Array) {
    return {
        nonce: meta.slice(0, 10),
        context: meta.slice(10)
    }
}
// if (DEBUG_MODE) {
//     (window as any).sodium = sodium;
//     (window as any).generateIdentityKeypair = generateIdentityKeypair;
//     (window as any).isValidApp = isValidApp;
//     (window as any).createUm = createUnauthenticatedMessage;
//     (window as 
// any).pmm = parseMessageMetadata
// }
import { encode, decode } from '@msgpack/msgpack';

expose({
    sodium,
    generateIdentityKeypair,
    isValidApp,
    createUm: createUnauthenticatedMessage,
    sign: signMessage,
    pmm: parseMessageMetadata,
    encode, decode,
    psm: parseSignedMessage
})

import '../../data/storage/local_securestore'
import { NONCEGEN_ANTIREPLAY } from '../../data/generation/secure_nonce_antireplay';


expose({NONCEGEN_ANTIREPLAY})