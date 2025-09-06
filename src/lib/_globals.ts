import { NONCEGEN_ANTIREPLAY } from "../data/generation/secure_nonce_antireplay";
import { Version } from "../data/protocol_types";
import { App } from "../data/valid_apps";

//!REQUIREMENT: SET TO FALSE IN PRODUCTION
export const DEBUG_MODE = true;

export function expose(obj: object) {
    if (DEBUG_MODE) {
        Object.assign(window, obj);
    }
}

//Global app metadata
export const SELF_APP_ID: App = "NDX";
export const SELF_APP_VERSION: Version = "0001";

//Global message antireplay nonce generator
export const GLOBAL_ANTIREPLAY_NG: Generator = NONCEGEN_ANTIREPLAY();