import { concatUint8Arrays } from "../../lib/crypto_util";

type TimestampStore = {
  fetch: () => string | null;
  store: (val: string) => void;
};

function createTimestamp({ fetch, store }: TimestampStore) {
  let _last = parseInt(fetch() || '0', 10);

  return function timestamp(): number {
    let time = Date.now();
    if (_last >= time) time = _last + 1;
    _last = time;
    store(String(_last));
    return _last;
  };
}

export const getTimestamp = createTimestamp({
  fetch: () => localStorage.getItem('lastMs'),
  store: (val: string) => localStorage.setItem('lastMs', val)
});

export function u16ToBytesBE(num: number) {
  const arr = new Uint8Array(2);
  arr[0] = (num >> 8) & 0xFF; 
  arr[1] = num & 0xFF;       
  return arr;
}

export function u8aToU16BE(arr: Uint8Array) {
  if (!(arr instanceof Uint8Array) || arr.length < 2) {
    throw new Error("Array must be Uint8Array with at least 2 elements");
  }
  return (arr[0] << 8) | arr[1];
}

export function u64ToBytesBE(num: bigint) {
  const arr = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    arr[7 - i] = Number((num >> BigInt(i * 8)) & 0xFFn); 
  }
  return arr;
}

export function bytesToU64BE(arr: Uint8Array) {
  if (!(arr instanceof Uint8Array) || arr.length < 8) {
    throw new Error("Array must be Uint8Array with at least 8 elements");
  }
  let num = 0n;
  for (let i = 0; i < 8; i++) {
    num |= BigInt(arr[7 - i]) << BigInt(i * 8);
  }
  return num;
}

export function* NONCEGEN_ANTIREPLAY(timestampFunc?: Function): Generator<Uint8Array, void, unknown> {
  const timestamp = timestampFunc ?? getTimestamp;
  let baseTime: number = timestamp();
  const Uint16Arr: Uint16Array = new Uint16Array([0]);

  while (true) {
    Uint16Arr[0]++;
    if (Uint16Arr[0] > 65500) baseTime = timestamp();

    yield concatUint8Arrays(
      u64ToBytesBE(BigInt(baseTime)),
      u16ToBytesBE(Uint16Arr[0])
    );
  }
}
