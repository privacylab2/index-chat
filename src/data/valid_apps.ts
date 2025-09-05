import { bytesIncludedIn } from "./byte_comparison";

/** */
export type App = "NDX";
export const SELF_APP_ID: App = "NDX";

export const validApps: Record<App, Uint8Array> = Object.fromEntries(
  (["NDX"] as App[]).map(app => [app, new TextEncoder().encode(app)])
) as Record<App, Uint8Array>;

export function appIsValid(appBytes: Uint8Array) {
    if (appBytes.length != 3) return false;
    return bytesIncludedIn(Object.values(validApps), appBytes);    
}