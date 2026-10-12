import { describe, expect, it } from "vitest";
import {
  createS3ClientFromEnv,
  listS3Manifest,
  resolveDumpUrl,
  sanitizeDbUrl,
  storageBackend,
} from "../../scripts/backup-lib.mjs";

// Backup helpers: pure URL policy + s3 manifest shape. No network here —
// listS3Manifest is driven by a stub client.

describe("sanitizeDbUrl", () => {
  it("strips ?schema=, keeps the rest", () => {
    expect(sanitizeDbUrl("postgresql://u@h/db?schema=public")).toBe("postgresql://u@h/db");
    expect(sanitizeDbUrl("postgresql://u@h/db?sslmode=require&schema=public")).toBe(
      "postgresql://u@h/db?sslmode=require",
    );
  });
});

describe("resolveDumpUrl", () => {
  it("prefers DIRECT_URL (session-mode) for pg_dump", () => {
    const { url, source } = resolveDumpUrl({
      DATABASE_URL: "postgresql://u@pooler:6543/db",
      DIRECT_URL: "postgresql://u@direct:5432/db?schema=public",
    });
    expect(source).toBe("DIRECT_URL");
    expect(url).toBe("postgresql://u@direct:5432/db");
  });

  it("falls back to DATABASE_URL, throws when both missing", () => {
    expect(resolveDumpUrl({ DATABASE_URL: "postgresql://u@h/db" }).source).toBe(
      "DATABASE_URL",
    );
    expect(() => resolveDumpUrl({})).toThrow(/DIRECT_URL nor DATABASE_URL/);
  });
});

describe("storageBackend", () => {
  it("accepts local/s3, rejects the rest", () => {
    expect(storageBackend({})).toBe("local");
    expect(storageBackend({ STORAGE_BACKEND: "s3" })).toBe("s3");
    expect(() => storageBackend({ STORAGE_BACKEND: "gcs" })).toThrow(/not supported/);
  });
});

describe("createS3ClientFromEnv", () => {
  it("names missing vars instead of failing opaquely", () => {
    expect(() => createS3ClientFromEnv({})).toThrow(/STORAGE_URL.*STORAGE_BUCKET/);
  });
});

describe("listS3Manifest", () => {
  function stubClient(pages: Record<string, unknown>[]) {
    let i = 0;
    return {
      send: async () => pages[i++] ?? { Contents: [], IsTruncated: false },
    };
  }

  it("paginates and normalizes entries", async () => {
    const pages = [
      {
        Contents: [{ Key: "a.png", Size: 10, ETag: '"abc"', LastModified: new Date("2026-01-01") }],
        IsTruncated: true,
        NextContinuationToken: "t",
      },
      { Contents: [{ Key: "b.pdf", Size: 0 }], IsTruncated: false },
    ];
    const out = await listS3Manifest(stubClient(pages), "cultural-attire");
    expect(out).toEqual([
      { key: "a.png", size: 10, etag: "abc", lastModified: "2026-01-01T00:00:00.000Z" },
      { key: "b.pdf", size: 0, etag: "", lastModified: null },
    ]);
  });
});
