//!REQUIREMENT: SET TO FALSE IN PRODUCTION
export const DEBUG_MODE = false;

export function expose(obj: object) {
    if (DEBUG_MODE) {
        Object.assign(window, obj);
    }
}