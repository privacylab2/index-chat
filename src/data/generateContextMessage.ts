import { concatUint8Arrays } from "../lib/crypt/crypto_util";
import { Version } from "./protocol_types";
import { App, validApps } from "./valid_apps";

export function generateContextMessage(
    appId: App,
    version: Version,
    intent: Uint8Array,
    algorithm: Uint8Array,
    modifiers: string
): Uint8Array {
    const encoder = new TextEncoder();
    const dash = encoder.encode("-");   // [45]
    const appU8 = validApps[appId];
    const versionU8 = encoder.encode(version);
    const modifiersU8 = encoder.encode(modifiers);

    return concatUint8Arrays(
        appU8, dash,
        versionU8, dash,
        intent, dash,
        algorithm, dash,
        modifiersU8
    );
}
