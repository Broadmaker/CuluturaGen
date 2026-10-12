import { describe, expect, it } from "vitest";
import {
  databaseUrlRequiresSSL,
  databaseUrlTlsMode,
  pgSslForMode,
  resolveAppDatabaseUrl,
  resolveMigrationDatabaseUrl,
  resolvePoolMax,
  sanitizeDatabaseUrl,
} from "@/lib/db/database-url";

// Supabase Phase B (md/10 §7): pure URL policy — no network in these tests.

describe("sanitizeDatabaseUrl", () => {
  it("strips Prisma-style ?schema=, keeps the rest", () => {
    expect(
      sanitizeDatabaseUrl("postgresql://u:p@host:5432/db?schema=public"),
    ).toBe("postgresql://u:p@host:5432/db");
  });

  it("keeps other params, returns plain URLs untouched", () => {
    expect(
      sanitizeDatabaseUrl("postgresql://u@host/db?sslmode=require&schema=public"),
    ).toBe("postgresql://u@host/db?sslmode=require");
    const plain = "postgresql://u@host:5432/db";
    expect(sanitizeDatabaseUrl(plain)).toBe(plain);
  });

  it("returns garbage input unchanged", () => {
    expect(sanitizeDatabaseUrl("not-a-url")).toBe("not-a-url");
  });
});

describe("databaseUrlTlsMode", () => {
  it("defaults Supabase hosts to encrypted (require), not verify-full", () => {
    expect(
      databaseUrlTlsMode("postgresql://postgres:pw@db.xyz.supabase.co:5432/postgres", {}),
    ).toBe("require");
    expect(
      databaseUrlTlsMode("postgresql://postgres:pw@xyz.pooler.supabase.com:6543/postgres", {}),
    ).toBe("require");
    expect(databaseUrlTlsMode("postgresql://u:p@localhost:5432/db", {})).toBe("off");
  });

  it("honors sslmode param and strict flag", () => {
    expect(databaseUrlTlsMode("postgresql://u@h/db?sslmode=verify-full", {})).toBe("verify-full");
    expect(databaseUrlTlsMode("postgresql://u@h/db?sslmode=require", {})).toBe("require");
    expect(
      databaseUrlTlsMode("postgresql://u:p@localhost:5432/db", { DATABASE_SSL: "strict" }),
    ).toBe("verify-full");
    expect(
      databaseUrlTlsMode("postgresql://u:p@localhost:5432/db", { DATABASE_SSL: "1" }),
    ).toBe("require");
  });

  it("maps modes to pg ssl options", () => {
    expect(pgSslForMode("off")).toBeUndefined();
    expect(pgSslForMode("require")).toEqual({ rejectUnauthorized: false });
    expect(pgSslForMode("verify-full")).toEqual({ rejectUnauthorized: true });
  });
});

describe("resolveMigrationDatabaseUrl", () => {
  it("prefers DIRECT_URL (session-mode) over the pooler URL", () => {
    const { url, source } = resolveMigrationDatabaseUrl({
      DATABASE_URL: "postgresql://u@pooler:6543/db",
      DIRECT_URL: "postgresql://u@direct:5432/db?schema=public",
    });
    expect(source).toBe("DIRECT_URL");
    expect(url).toBe("postgresql://u@direct:5432/db");
  });

  it("falls back to DATABASE_URL and throws when both are missing", () => {
    expect(
      resolveMigrationDatabaseUrl({ DATABASE_URL: "postgresql://u@h/db" }).source,
    ).toBe("DATABASE_URL");
    expect(() => resolveMigrationDatabaseUrl({})).toThrow(/DIRECT_URL nor DATABASE_URL/);
  });
});

describe("resolveAppDatabaseUrl + resolvePoolMax", () => {
  it("requires DATABASE_URL and sanitizes it", () => {
    expect(() => resolveAppDatabaseUrl({})).toThrow(/DATABASE_URL is not set/);
    expect(
      resolveAppDatabaseUrl({ DATABASE_URL: "postgresql://u@h/db?schema=public" }),
    ).toBe("postgresql://u@h/db");
  });

  it("defaults pool max to 10, clamps to 1–50", () => {
    expect(resolvePoolMax({})).toBe(10);
    expect(resolvePoolMax({ DATABASE_POOL_MAX: "5" })).toBe(5);
    expect(resolvePoolMax({ DATABASE_POOL_MAX: "0" })).toBe(1);
    expect(resolvePoolMax({ DATABASE_POOL_MAX: "999" })).toBe(50);
    expect(resolvePoolMax({ DATABASE_POOL_MAX: "junk" })).toBe(10);
  });
});
