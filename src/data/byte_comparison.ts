/**
 * Compares Uint8Arrays to ensure they are exactly equal.
 */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/**
 * Checks if an Array of Uint8Arrays contains a Uint8Array simply.
 * @param bytes The Uint8Array to check for in the list of Uint8Arrays.
 * @param arrays An Array of Uint8Array.
 * @returns Whether the bytes Uint8Array is found in arrays.
 */
export function bytesIncludedIn(arrays: Uint8Array[], bytes: Uint8Array): boolean {
    for (const validBytes of arrays) {
        if (bytesEqual(bytes, validBytes)) {
            return true;
        }
    }
    return false;
}
