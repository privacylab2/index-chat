# Index Protocol

Index Protocol is implemented in **TypeScript**, using **libsodium** as the main cryptographic backend.
<br/><br/>Note: each directory in lib has a directory.md file which explains what each file does.
## Security Notice

When implementing your own app or version of the protocol, it is critical to follow the guidelines strictly.  
Index is designed to be highly secure, and deviating from the protocol can introduce serious vulnerabilities.
Still, I am one person, not a cryptography expert, and Index is open source. I cannot guarantee that my implementation of the protocol is perfect or bulletproof. If you notice issues in the code, please reach out.

## Basic Security Protections
- If in a Web/Electron/Tauri app, add a strict content security policy so that even if an XSS or RCE is found, it can't compromise security.
- Wipe(zero) all secrets once they are no longer needed.
## Authentication
The first thing the protocol does on app install / account creation is generation of an identity keypair. The keypair is **Curve25519**<sup>*</sup> and is used for signing messages to initiate a session.

<i>\* - Curve25519 is the preferred format for identity keys because it is highly trusted and has no mysterious constants. You can technically deviate but it is not recommended.</i>

## Message (Context) Protocol
Index uses a message format to identify what messages are and prevent message reuse attacks.
An example message is something like `NDX-0001-DKX-X25-NIT`

The order of messages is as follows:<br/>
`APP-VERSION-INTENT-ALGORITHIM-SPECIAL`

To prevent introducing exploits or vulnerabilties, all fields are fixed length with the exception of SPECIAL.
<br/>**The format must not be reordered.**
<br/>
- APP is 3 bytes long. It can be any combination of bytes but is intended to be uppercase and lowercase letters. Some apps (including the official Index app) may reject the app field if it is not purely a-zA-Z. It identifies the specific client name. Index is NDX
- VERSION is 4 bytes long. It is intended to be numbers 0000 - 9999. Same rejection as before is possible but not universal.
- INTENT is 3 bytes long. It states the intent of the message. For example DKX for Diffie-Hellman Key Exchange or MSG for sending a chat message.
- ALGORITHIM is 3 bytes long. It denotes the algorithim used. For example, XCH for XCHACHA20, AES, or X25 for X25519. It is always uppercase characters.
- SPECIAL does not have a fixed byte limit as it is always last in a message. It denotes extra information or modifiers. It should not be used for message data or content. For example, if you had AES as algorithim, special could be `256GCM` or with an intent of `DKX` and Algorithim of `X25`, special could be INIT to differentiate initializing a session vs key rotations.

**! REQUIREMENT**: To represent null, a field must be the exact text `NUL` (case sensitive) for 3 byte fields, and `NULL` for 4 byte fields.

This can be represented as follows:
```js
//3 BYTE NULL
new Uint8Array([78, 85, 76]);

//4 BYTE NULL
new Uint8Array([78, 85, 76, 76]);
```

You might need to use NULL on something like a QRY command (intent), which doesn't need to specify algorithim for things such as fetching info.

**! REQUIREMENT**: Parsing is case sensitive. For example, in the `APP` field, abc, ABC and aBc are not the same app.
Since app codes are only three letters, you must use a shared or app specific directory that translates app codes to full names in the UI.

Each client can choose what apps it allows/supports. It can also blocklist specific app + version combos (or whitelist if it prefers). An app may choose to only allow itself, allow a small list of trusted apps, or disregard the field entirely and allow anything that follows protocol.

**! REQUIREMENT**:
You may modify app, version, and special fields, but `INTENT`, `ALGORITHIM`, and `SPECIAl` handling must be kept exactly the same across clients unless all or the majority of clients decide to get rid of or add a new protocol/command.

<br/>! WARNING: It is important to parse safely and uniformly to prevent including vulnerabilities and bugs, especially in memory safe languages. Perform validation on EVERY field, and parse front to back, using byte lengths, positions, and slicing, not splitting by seperator or reading until a character.<br/>
For example, in C, reading until a - could overflow and leak memory if a dash is not found. Parse the incoming message with zero trust.

<br/>Right now, there is no way to actually directly verify that an app is what it says and isn't pretending to be something else. The main goal is to make networking easier, but, you can use the special field or extra data to attempt to add a verification system.

<br/><br/>While this will not actually compile in TypeScript as it is too large to represent as a union, below is an official hypothetical type for message format to hopefully lessen ambiguity.

```ts
type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type Uppercase = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";

export type App = "NDX" | "ABC"; // so on
export type Version = `${Digit}${Digit}${Digit}${Digit}`;
export type Intent = `${Uppercase}${Uppercase}${Uppercase}`
export type Algorithim = `${Uppercase}${Uppercase}${Uppercase}`
export type Special = string | "NULL";
export type Protocol = `${App}-${Version}-${Intent}-${Algorithim}-${Special}`;
```

Special can be anything, but the reference uses 3 byte chunks to denote "modifiers", such as 256, GCM, and P13
for example, INIT + AES-256 + AES-GCM = "NIT256GCM"

# Data Generation Notice
**! REQUIREMENT**: Always use a completely secure random bytes generator, such as `sodium.randombytes_buf` or `crypto.getRandomValues` in JavaScript or equivalents in other languages. Using an insecure generator like `Math.random`, or any sort of PRNG can allow attackers to deduce private keys or encryption keys based on things such as nonces and public keys, completely breaking encryption. It is shockingly effective. 

## Encryption algorithms
The two official encryption algorithms used to encrypt data transmit over the network by Index are **XChaCha20-Poly1305** and **AES-256-GCM**.
<br/><br/>
Both are forms of AEAD (authenticated encryption with associated data), meaning they can encrypt, decrypt and validate that data has not been tampered with.

Both require 32 byte keys.<br/>
There is a few major differences between the two algorithms.
The main difference is nonce size. AES-256-GCM requires a 12 byte (96 bit) nonce, while XChaCha requires a 24 byte (192 bit) nonce.
<br/>
A nonce is used to add uniqueness and randomness to each message, even with the same key, to prevent leakage of metadata or pattern analysis.<br/>
Nonce reuse is catastrophic in both algorithms, practically removing encryption, and instead making a slightly lossy encoding. Over time, attackers can begin recovering the message.<br/><br/>
In XChaCha-Poly1305, accidental nonce collision is astronomically unlikely due to the large random byte space. (chance of two colliding is 1.6e-58, and a 50% chance of collision would take 10^29 nonces).<br/>

**! WARNING:** however, AES-GCM uses a 12 byte nonce space, making collisions (while still unlikely) much more feasible. It is important to carefully handle AES-256-GCM nonces to ensure you NEVER reuse a nonce for the same key.

In the official Index app, AES-256-GCM nonces are generated like this:
```ts
export function* NONCEGEN_AESGCM_256() {
    let counter = getSafeRandomCounter()
    while (true) {
        counter = increment64BitArray(counter);
        yield concatUint8Arrays(counter, sodium.randombytes_buf(4));
    }
}
```

An error will be thrown if the 64 bit array ever wraps around, ensuring a nonce isn't reused. It takes approximately 18 million generated nonces before the 64 bit array can wrap around in the worst case scenario (getSafeRandomCounter blocks top 1% of 64 bit integers)<br/>

Once all 64 bit values have been used, a new key must be generated. keys are(should be) rotated frequently, so hitting the limit is practically impossible.

The last major differences between the algorithims revolve around speed, implementation, and trust.

AES-GCM-256 is fast on devices with AES-NI (AES NATIVE INSTRUCTIONS, present on most CPUs post 2012), but can be significantly slower on older devices or devices that do not have CPU acceleration. 

In constrast, XChaCha20-Poly1305 is implemented in pure software, so it is fast on almost all devices, including embedded or IoT devices and mobile phones.

AES-GCM-256 with CPU instructions can slightly over perform XChaCha, but the difference between accelerated AES and XChaCha-Poly1305 is negligible.

The last major difference is trust. Both algorithms have more and less trusted aspects.

For example, AES had heavy involvement from the United States Government (including the NSA and NIST), and often relies on AES-NI. There is not any concrete evidence of a backdoor by the US government or malicious AES-NI, but it is a possibility, especially in the future, and its implementation is less transparent than XChaCha.

XChaCha20-Poly1305 (created by Daniel J Bernstein), however, is much more transparent, designed to run purely in software, regardless of CPU acceleration or features, and did not have any significant government involvement or funding. Its larger nonce space also makes it harder to accidentally self sabotage. It is approved for use in many critical protocols, including some government protocols, but it is less vetted and battle-tested than AES. <br/><br/>Overall, there are several tradeoffs when choosing an encryption algorithm. For this reason, Index leaves the choice up to the user on what encryption algorithm to choose when creating sessions/rooms. It is a good idea to have transparency and customizability about the E2EE details, while ensuring users can't sabotage themselves or others.

# First steps
## App install
On app install, generate an identity keypair. The identity keypair should be in Ed25519 format for signing.<br/>
! SUGGESTION: Store the users private key locally on their device using secure local encryption based on a password.
This gives the user a simple password-based login while removing the typical risks of username password infrastructure. Derive a key from the password using a secure algorithm like Argon2. If using Argon2, you can allow the users to modify the settings to strengthen their password. (such as memorySize, timeCost/iterations) <br/>

You can also choose another method for users to login, but other clients will not trust messages from the user unless they can cryptographically prove their identity to prevent tampering.

Users can manually share public keys, use the Index directory, a decentralized or conglomerate directory, or an app-specific directory.
## Starting communication
The first step in creating a one-on-one session is to perform an ephmeral Diffie-Hellman key exchange.

Generate an X25519 keypair for key exchange. Create a context message in the following format.

App: your app name/id<br/>
Version: your app/protocol version<br/>
Intent: DKX<br/>
Algorithim: X25<br/>
Special: NIT (which stands for INIT)

A full example is `NDX-0001-DKX-X25-NIT`, which is generated by the official app (or planned libindex-protocol-typescript module) with the following TypeScript:
```ts
const context: Uint8Array = generateContextMessage(
    "NDX",
    "0001",
    validIntent.DKX,
    validAlgo.X25,
    Modifiers.INIT
);
```

Then, create an unauthenticated message:
```ts
const ng: Generator = NONCEGEN_ANTIREPLAY();
const unauthenticatedMessage = createUnauthenticatedMessage(
    context,
    new Uint8Array([]), //session info, such as name or icon 
    ng 
)

if (unauthenticatedMessage == false) {
    throw new Error("Construction failed. Is context valid?")
}
```
Message data is typically [msgpack](https://en.wikipedia.org/wiki/MessagePack) format.

NONCEGEN_ANTIREPLAY() is an ES generator function that generates never before used nonces based on a monotomic timestamp and 16-bit counter. It is used to prevent replay attacks.
It is defined as so:
```ts
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
```

Anti replay nonce generation does not have to exactly match the official client, but it should be 10 bytes (unless other apps specifically recognize your nonce format), and never overlap even if storage is wiped or clock/timezone changes.

timestamp is defined in [secure_nonce_antireplay](src/data/generation/secure_nonce_antireplay.ts). The important part is the it should never repeat, even across app restarts or clock rewinds.

Next, you should sign the message. 

In the reference client, it is done like so:
```ts
const signedMessage = signMessage(
    unauthenticatedMessage,
    identityPrivateKey
)
```

The signed message can then be MessagePacked and sent over the network. (WebRTC P2P or relay is the intended method, but the protocol is transport agnostic)<br/><br/>Then, when you recieve the signed message, binary, unpack it with MessagePack, parse it, and verify the signature:
```ts
const parsedMessage = parseSignedMessage(
    signedMessage,
    identityPublicKey
);

const { nonce, context, data, signatureValid } = parsedMessage;
if (!signatureValid) {
    throw new Error("Invalid signature, message rejected.")
}
```

**Again, message parsing is IMPORTANT, especially in memory unsafe languages.**<br/>
Treat all incoming messages as invalid until proven otherwise. Do not ever try to read until a character, and handle the special section of context very well to prevent out of bounds reads. For example, you could treat the special section as a max of 15-20 3 byte chunks, remainder padded with zeroes and loop over each recognized chunk. Again, to reiterate, attackers can and will try every possible way to mess with your handling of messages. Never expect the source to follow your rules or conventions.