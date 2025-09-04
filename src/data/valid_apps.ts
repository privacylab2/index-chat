import { bytesIncludedIn } from "./byte_comparison";

/** */
type App = "NDX";
export const SELF_APP_ID: App = "NDX";

export const validApps: Record<App, Uint8Array> = Object.fromEntries(
  (["NDX"] as App[]).map(app => [app, new TextEncoder().encode(app)])
) as Record<App, Uint8Array>;

