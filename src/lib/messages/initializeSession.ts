import { encode } from "@msgpack/msgpack";
import { generateContextMessage } from "../../data/generateContextMessage";
import { Modifiers, validAlgo, validIntent } from "../../data/protocol_types";
import { GLOBAL_ANTIREPLAY_NG, SELF_APP_ID, SELF_APP_VERSION } from "../_globals";
import { createUnauthenticatedMessage, SignedMessage, signMessage, UnauthenticatedMessage } from "../crypt/crypto";

export interface SessionInitializationPayloadInterface {
    direct: boolean
}
export async function initializeSession(identityPrivateKey: Uint8Array, payload: SessionInitializationPayloadInterface) {
    const payloadData = {
        direct: payload.direct
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

    if (!unauthenticatedMessage) throw new Error("Failed to construct unauthenticated message.");

    const signedMessage = signMessage(contextMessage, identityPrivateKey) as SignedMessage | null;
    if (!signedMessage) throw new Error("Failed to construct signed message.");

    return encode(signedMessage);
}
