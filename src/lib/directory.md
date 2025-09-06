# directory
- **_globals.ts** : defines a const called DEBUG_MODE and a function called expose which will expose provides variables to window if DEBUG_MODE is true. Falsifying DEBUG_MODE will remove all exposed variables.
- **crypto_util.ts** : defines utilities for cryptography (as of now, just concatUint8Arrays, which avoids manual .set to prevent errors and simplify code)
- **crypto.ts** : the main library entrypoint, defines messages, keypair generation, so on.