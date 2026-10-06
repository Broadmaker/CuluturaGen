import { afterEach, describe, expect, it } from "vitest";
import {
  getStorageBackend,
  resolveS3Config,
  sanitizeStorageKey,
} from "@/lib/storage-config";

// md/10 §8, md/09 §81: backend selection is env-driven, local by default,
// fail-fast on typos or incomplete s3 config. No network in these tests.
const KEYS = [
  "STORAGE_BACKEND",
  "STORAGE_URL",
  "STORAGE_BUCKET",
  "STORAGE_REGION",
  "STORAGE_ACCESS_KEY",
  "STORAGE_SECRET_KEY",
] as const;

const saved: Record<string, string | undefined> = {};

for (const k of KEYS) saved[k] = process.env[k];

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

function clearS3(): void {
  for (const k of KEYS) delete process.env[k];
}

describe("getStorageBackend", () => {
  it("defaults to local", () => {
    clearS3();
    expect(getStorageBackend()).toBe("local");
  });

  it("selects s3 when asked", () => {
    clearS3();
    process.env.STORAGE_BACKEND = "s3";
    expect(getStorageBackend()).toBe("s3");
  });

  it("rejects unknown backends fail-fast", () => {
    clearS3();
    process.env.STORAGE_BACKEND = "gcs";
    expect(() => getStorageBackend()).toThrow(/not supported/);
  });
});

describe("sanitizeStorageKey", () => {
  it("accepts normal relative keys", () => {
    expect(sanitizeStorageKey("projects/generated/abc/v1.png")).toBe(
      "projects/generated/abc/v1.png",
    );
  });

  it("rejects traversal, absolute, and empty keys", () => {
    expect(() => sanitizeStorageKey("../etc/passwd")).toThrow();
    expect(() => sanitizeStorageKey("projects/../../x")).toThrow();
    expect(() => sanitizeStorageKey("/abs/path.png")).toThrow();
    expect(() => sanitizeStorageKey("")).toThrow();
  });
});

describe("resolveS3Config", () => {
  it("resolves a complete config", () => {
    clearS3();
    process.env.STORAGE_URL = "https://xyz.storage.supabase.co/storage/v1/s3";
    process.env.STORAGE_BUCKET = "cultural-attire";
    process.env.STORAGE_REGION = "eu-west-1";
    process.env.STORAGE_ACCESS_KEY = "akid";
    process.env.STORAGE_SECRET_KEY = "secret";
    const cfg = resolveS3Config();
    expect(cfg.bucket).toBe("cultural-attire");
    expect(cfg.region).toBe("eu-west-1");
  });

  it("names the missing variables instead of failing opaquely", () => {
    clearS3();
    process.env.STORAGE_BUCKET = "cultural-attire";
    expect(() => resolveS3Config()).toThrow(/STORAGE_URL.*STORAGE_ACCESS_KEY.*STORAGE_SECRET_KEY/);
  });
});
