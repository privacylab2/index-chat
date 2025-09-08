# directory
- **basic_encryption.ts** : provides basic functions for deriving keys with argon2id, encrypting data and decryting (intended for local use)
- **local_securestore.ts** : provides a high level api for data storage in the applications data directory, similar to localStorage but encrypted with XChaCha20-POLY1305.