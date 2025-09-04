import { bytesIncludedIn } from "./byte_comparison";
import { validApps } from "./valid_apps";

export function isValidApp(appBytes: Uint8Array) {
    if (appBytes.length != 3) return false; //Improper length
    const acceptableApps: Uint8Array[] = Object.values(validApps);
    return bytesIncludedIn(acceptableApps, appBytes);
}

export function isDash(dashByte: number) {
    return dashByte === 45;
}

export function parseProtocolBytes(protocolBytes: Uint8Array) {
    // Expected format: NDX-0001-
    const appBytes: Uint8Array = protocolBytes.slice(0, 3);
    const dashOneByte: number = protocolBytes[3]
    const versionBytes: Uint8Array = protocolBytes.slice(4,8);
    const dashTwoByte: number = protocolBytes[8];
    const intent: Uint8Array = protocolBytes.slice(9, )
}
