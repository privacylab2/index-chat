import sodium from "libsodium-wrappers";
import { concatUint8Arrays } from "../../lib/crypto_util";
import { DEBUG_MODE, expose } from "../../lib/_globals";

function increment64BitArray(bytes: Uint8Array): Uint8Array {
    if (bytes.length !== 8) {
        throw new Error("Input must be exactly 8 bytes");
    }

    const result = new Uint8Array(8);
    let carry = 1;

    for (let i = 7; i >= 0; i--) {
        const sum = bytes[i] + carry;
        result[i] = sum & 0xff; 
        carry = sum > 0xff ? 1 : 0;
    }

    if (carry) {
        throw new Error("Counter wrap-around error! New key required.");
    }

    return result;
}

//Ensures random number is not in the top 1% of 64 bit integers to avoid quickly hitting limit (im paranoid)
function getSafeRandomCounter(): Uint8Array {
    const MAX_UINT64 = BigInt("0xffffffffffffffff");
    const TOP_1_PERCENT = MAX_UINT64 / BigInt(100);
    let counter: bigint;
    let safeCounter: Uint8Array;
    do {
        const bytes = sodium.randombytes_buf(8);
        counter = BigInt(0);
        for (let i = 0; i < 8; i++) {
            counter = (counter << BigInt(8)) + BigInt(bytes[i]);
        }
        safeCounter = new Uint8Array(8);
        let tmp = counter;
        for (let i = 7; i >= 0; i--) {
            safeCounter[i] = Number(tmp & BigInt(0xff));
            tmp >>= BigInt(8);
        }
    } while (counter > MAX_UINT64 - TOP_1_PERCENT);
    return safeCounter;
}


export function* NONCEGEN_AESGCM_256() {
    let counter = getSafeRandomCounter()
    while (true) {
        counter = increment64BitArray(counter);
        yield concatUint8Arrays(counter, sodium.randombytes_buf(4));
    }
}

expose({
    ng: NONCEGEN_AESGCM_256
})