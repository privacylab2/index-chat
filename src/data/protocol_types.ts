import { App, SELF_APP_ID, validApps } from "./valid_apps";
import { concatUint8Arrays } from "../lib/crypto_util";
import { DEBUG_MODE } from "../lib/_globals";

export const validIntentArr = ["DKX", "MSG", "NUL"] as const;
export type Intent = typeof validIntentArr[number];

export const validIntent: Record<Intent, Uint8Array> = Object.fromEntries(
    validIntentArr.map(i => [i, new TextEncoder().encode(i)])
) as Record<Intent, Uint8Array>;

export const validAlgoArr = ["AES", "XCH", "X25", "NUL"] as const;
export type Algo = typeof validAlgoArr[number];

export const validAlgo: Record<Algo, Uint8Array> = Object.fromEntries(
    validAlgoArr.map(a => [a, new TextEncoder().encode(a)])
) as Record<Algo, Uint8Array>;

// const specialMap: Record<Algo, string[]> = {
//   AES: ["256-GCM"],
//   XCH: ["POLY1305"],
//   X25: ["NULL"],
//   NUL: []
// };

// export const validSpecialPerAlgo: Record<Algo, Uint8Array[]> = Object.fromEntries(
//   (Object.entries(specialMap) as [Algo, string[]][]).map(
//     ([algo, specials]) => [algo, specials.map(s => new TextEncoder().encode(s))]
//   )
// ) as Record<Algo, Uint8Array[]>;

// function chunkModifiers(special: Uint8Array): Uint8Array[] {
//     const chunks: Uint8Array[] = [];
//     for (let i = 0; i < special.length; i += 3) {
//         const chunk = special.slice(i, i + 3);
//         if (chunk.length === 3) chunks.push(chunk);
//     }
//     return chunks;
// }

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type Version = `${Digit}${Digit}${Digit}${Digit}`;

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


// Example
export enum Modifiers {
    /**
    * INITIAL EXCHANGE, used in KX (DKX-X25-INIT)
    */
    INIT = "NIT",
    /**
    * AES-256
    */
    AES256 = "256",
    /**
    * AES-GCM
    */
    AESGCM = "GCM",
    /**
     * POLY1305
     */
    POLY1305 = "P13",
    NULL = "NUL"
}
(window as any).GCM = generateContextMessage;


// Expose functions and constants
if (DEBUG_MODE) {
    (window as any).SELF_APP_ID = SELF_APP_ID;
    (window as any).validApps = validApps;
    (window as any).validIntent = validIntent;
    (window as any).validAlgo = validAlgo;
    (window as any).Modifiers = Modifiers;
}