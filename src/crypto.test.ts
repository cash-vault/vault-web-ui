import { describe, it, expect } from "vitest";
import { encrypt, decrypt, deriveEncryptionKey } from "./crypto";

const MASTER_PASSWORD = "test-master-password";
const SALT = "test-salt-value";

describe("deriveEncryptionKey", () => {
  it("returns a Uint8Array of 32 bytes (256 bits)", async () => {
    const key = await deriveEncryptionKey(MASTER_PASSWORD, SALT);
    expect(key).toBeInstanceOf(Uint8Array);
    expect(key.length).toBe(32);
  });

  it("derives different keys for different passwords", async () => {
    const [key1, key2] = await Promise.all([
      deriveEncryptionKey("password-a", SALT),
      deriveEncryptionKey("password-b", SALT),
    ]);
    expect(key1).not.toEqual(key2);
  });

  it("derives different keys for different salts", async () => {
    const [key1, key2] = await Promise.all([
      deriveEncryptionKey(MASTER_PASSWORD, "salt-a"),
      deriveEncryptionKey(MASTER_PASSWORD, "salt-b"),
    ]);
    expect(key1).not.toEqual(key2);
  });

  it("derives the same key deterministically", async () => {
    const [key1, key2] = await Promise.all([
      deriveEncryptionKey(MASTER_PASSWORD, SALT),
      deriveEncryptionKey(MASTER_PASSWORD, SALT),
    ]);
    expect(key1).toEqual(key2);
  });
});

describe("encrypt / decrypt round trip", () => {
  it("encrypts and decrypts a string", async () => {
    const key = await deriveEncryptionKey(MASTER_PASSWORD, SALT);
    const plaintext = "Hello, Vault!";
    const { ciphertext, iv } = await encrypt(plaintext, key);
    expect(ciphertext).toBeTruthy();
    expect(iv).toBeTruthy();
    expect(ciphertext).not.toBe(plaintext);

    const decrypted = await decrypt(ciphertext, iv, key);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertexts for the same plaintext (random IV)", async () => {
    const key = await deriveEncryptionKey(MASTER_PASSWORD, SALT);
    const plaintext = "Same text";
    const [a, b] = await Promise.all([
      encrypt(plaintext, key),
      encrypt(plaintext, key),
    ]);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it("decrypt fails with wrong key", async () => {
    const key = await deriveEncryptionKey(MASTER_PASSWORD, SALT);
    const wrongKey = await deriveEncryptionKey("wrong-password", SALT);
    const { ciphertext, iv } = await encrypt("secret", key);

    await expect(decrypt(ciphertext, iv, wrongKey)).rejects.toThrow();
  });

  it("handles empty string", async () => {
    const key = await deriveEncryptionKey(MASTER_PASSWORD, SALT);
    const { ciphertext, iv } = await encrypt("", key);
    const decrypted = await decrypt(ciphertext, iv, key);
    expect(decrypted).toBe("");
  });

  it("handles special characters", async () => {
    const key = await deriveEncryptionKey(MASTER_PASSWORD, SALT);
    const plaintext = "héllo wörld 你好 ₹ 😀";
    const { ciphertext, iv } = await encrypt(plaintext, key);
    const decrypted = await decrypt(ciphertext, iv, key);
    expect(decrypted).toBe(plaintext);
  });
});
