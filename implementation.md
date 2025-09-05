# Index Protocol

Index Protocol is implemented in **TypeScript**, using **libsodium** as the main cryptographic backend.

## Security Notice

When implementing your own app or version of the protocol, it is critical to follow the guidelines strictly.  
Index is designed to be highly secure, and deviating from the protocol can introduce serious vulnerabilities.
Still, I am one person, not a cryptography expert, and Index is open source. I cannot guarantee that my implementation of the protocol is perfect or bulletproof. If you notice issues in the code, please reach out.

## Authentication
The first thing the protocol does on app install / account creation is generation of an identity keypair. The keypair is **Curve25519**<sup>*</sup> and is used for signing messages to initiate a session.

<i>\* - Curve25519 is the preferred format for identity keys because it is highly trusted and has no mysterious constants. You can technically deviate but it is not recommended.</i>

## Message Protocol
Index uses a message format to indetify what messages are and prevent message reuse attacks.
An example message is something like `NDX-0001-DKX-X25-INIT`

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

Special can be anything, but the reference uses 3 byte chunks 