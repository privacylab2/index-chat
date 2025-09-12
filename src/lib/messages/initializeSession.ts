import { decode, encode } from "@msgpack/msgpack";
import { generateContextMessage } from "../../data/generateContextMessage";
import { Modifiers, validAlgo, validIntent } from "../../data/protocol_types";
import { GLOBAL_ANTIREPLAY_NG, SELF_APP_ID, SELF_APP_VERSION } from "../_globals";
import { createUnauthenticatedMessage, parseSignedMessage, SignedMessage, signMessage, UnauthenticatedMessage } from "../crypt/crypto";
import { sha256 } from "hash-wasm";
import { concatUint8Arrays } from "../crypt/crypto_util";
export interface SessionInitializationPayloadArgumentsInterface {
    direct: boolean,
    recipientPublicKey: Uint8Array,
}

async function computeDmId(senderPub: Uint8Array, recipientPub: Uint8Array): Promise<string> {
    return await sha256(concatUint8Arrays(senderPub, recipientPub));
}


//Must be able to look up sender public key and recipient public key to name and back or else
//it's difficult to resolve the name in a decentralized network, could use github db, gunjs, or DHT
//!TODO: clean up sender / recipient logic and what is being sent over
export interface DMSessionAcceptRejectPayloadArgumentsInterface {
    /**
     * The incoming users public key as looked up by their username or through a directory, NOT incoming message data's 'sender' (would allow impersonation)
     */
    incomingPublicKey: Uint8Array,
    recipientPublicKey: Uint8Array
    accepted: boolean
}

export interface InitializeSessionOutgoingPayloadInterface {
    direct: boolean,
    sender: Uint8Array,
    recipient: Uint8Array,
    dmId: string,
    dhPublicKey: Uint8Array
}

interface SCKeypair {
    publicKey: Uint8Array,
    privateKey: Uint8Array
}

//Group id agreement idea (hash of the initial dh keys)
export async function initializeSession(selfIdentityKeypair: SCKeypair, payload: SessionInitializationPayloadArgumentsInterface, dxKeypair: SCKeypair) {
    const payloadData: InitializeSessionOutgoingPayloadInterface = {
        direct: payload.direct,
        sender: selfIdentityKeypair.publicKey,
        recipient: payload.recipientPublicKey,
        dmId: await computeDmId(selfIdentityKeypair.publicKey, payload.recipientPublicKey), //SENDER ALWAYS FIRST
        dhPublicKey: dxKeypair.publicKey
    };


    const contextMessage: Uint8Array = generateContextMessage(
        SELF_APP_ID,
        SELF_APP_VERSION,
        validIntent.DKX,
        validAlgo.X25,
        Modifiers.INIT
    );

    const unauthenticatedMessage = createUnauthenticatedMessage(
        contextMessage,
        encode(payloadData),
        GLOBAL_ANTIREPLAY_NG
    ) as UnauthenticatedMessage | null;
    // expose({unauthenticatedMessage})

    if (!unauthenticatedMessage) throw new Error("Failed to construct unauthenticated message.");

    const signedMessage = signMessage(selfIdentityKeypair.privateKey, unauthenticatedMessage) as SignedMessage | null;
    if (!signedMessage) throw new Error("Failed to construct signed message.");

    return encode(signedMessage)
}

export async function acceptRejectDMSession(selfIdentityKeypair: SCKeypair, signedMessageObject: SignedMessage, payload: DMSessionAcceptRejectPayloadArgumentsInterface) {
    const info = parseSignedMessage(payload.incomingPublicKey, signedMessageObject)
    if (!info.signatureValid) {console.log('signature invalid'); return false;}
    const incomingPayloadData = decode(info.data)
    const incomingRequest: InitializeSessionOutgoingPayloadInterface = incomingPayloadData as InitializeSessionOutgoingPayloadInterface
    if (!(incomingRequest).direct) {console.log('dm not direct'); return false;}
    const incomimgDmId: string = incomingRequest.dmId
    const calculatedDmid: string = await computeDmId(payload.incomingPublicKey, selfIdentityKeypair.publicKey)
    //must also ensure that the public key that signed is the same that is being added to the dm 
    return calculatedDmid
}