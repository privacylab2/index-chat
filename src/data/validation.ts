import { expose } from "../lib/_globals";
import { bytesIncludedIn } from "./byte_comparison";
import { validApps } from "./valid_apps";

export function isDash(dashByte: number): boolean {
    return dashByte === 45;
}

export function parseProtocolBytes(protocolBytes: Uint8Array): {
    app: Uint8Array;
    version: Uint8Array;
    intent: Uint8Array;
    algo: Uint8Array;
    special: Uint8Array;
    dashes: boolean;
    byteLength: number;
} {
    const app: Uint8Array = protocolBytes.subarray(0, 3);
    const version: Uint8Array = protocolBytes.subarray(4, 8);
    const intent: Uint8Array = protocolBytes.subarray(9, 12);
    const algo: Uint8Array = protocolBytes.subarray(13, 16);
    const special: Uint8Array = protocolBytes.subarray(17);
    const dashes: boolean = [3, 8, 12, 16]
        .map(pos => protocolBytes[pos])
        .every(isDash);
    return {
        app,
        version,
        intent,
        algo,
        special,
        dashes,
        byteLength: protocolBytes.length
    }
}




export function isValidApp(appBytes: Uint8Array): boolean {
    if (appBytes.length != 3) return false;
    const acceptableApps: Uint8Array[] = Object.values(validApps);
    return bytesIncludedIn(acceptableApps, appBytes);
}

function isValidVersion(versionBytes: Uint8Array) {
    if (versionBytes.length !== 4) return false;
    return versionBytes.every(b => b >= 48 && b <= 57); //must be 0000-9999, not required in every implementation but enforced by Index.
}

function isValidIntent(intentBytes: Uint8Array) {
    if (intentBytes.length !== 3) return false;
    return intentBytes.every(b => (b >= 65 && b <= 90) || (b >= 48 && b <= 57));
}


function isValidAlgo(algoBytes: Uint8Array) {
    if (algoBytes.length !== 3) return false;
    return algoBytes.every(b => (b >= 65 && b <= 90) || (b >= 48 && b <= 57));
}



export function protocolValid(protocol: {
    app: Uint8Array;
    version: Uint8Array;
    intent: Uint8Array;
    algo: Uint8Array;
    special: Uint8Array;
    dashes: boolean;
    byteLength: number;
}): boolean {
    return protocol.byteLength > 17
        && isValidApp(protocol.app)
        && isValidVersion(protocol.version)
        && isValidIntent(protocol.intent)
        && isValidAlgo(protocol.algo)
        && protocol.dashes;
}

expose({
    parseProtocolBytes,
    protocolValid
})
