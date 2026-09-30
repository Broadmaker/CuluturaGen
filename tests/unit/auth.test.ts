// §119 auth: scrypt passwords + HMAC sessions + zod validation.
import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import {
  loginSchema,
  projectCreateSchema,
  registerSchema,
} from "@/lib/validation/schemas";

describe("passwords", () => {
  it("round-trips and salts uniquely", async () => {
    const a = await hashPassword("Admin123!");
    const b = await hashPassword("Admin123!");
    expect(a).not.toBe(b);
    expect(await verifyPassword("Admin123!", a)).toBe(true);
    expect(await verifyPassword("Admin123!", b)).toBe(true);
  });

  it("rejects wrong passwords and malformed stored values", async () => {
    const h = await hashPassword("correct-horse");
    expect(await verifyPassword("wrong-horse", h)).toBe(false);
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$salt$hash")).toBe(false);
  });
});

describe("sessions", () => {
  it("sign → verify round-trip", () => {
    process.env.AUTH_SECRET = "test-secret";
    const t = createSessionToken("uid-1", ["DESIGNER"]);
    const p = verifySessionToken(t);
    expect(p?.uid).toBe("uid-1");
    expect(p?.roles).toEqual(["DESIGNER"]);
  });

  it("rejects tampered, malformed, and expired tokens", () => {
    process.env.AUTH_SECRET = "test-secret";
    const t = createSessionToken("uid-1", []);
    const [body] = t.split(".");
    expect(verifySessionToken(`${body}.tamperedsig`)).toBeNull();
    expect(verifySessionToken("garbage")).toBeNull();
    expect(verifySessionToken(null)).toBeNull();
    // Expired payload, freshly signed
    const expired = Buffer.from(
      JSON.stringify({ uid: "u", roles: [], exp: Date.now() - 1000 }),
    ).toString("base64url");
    const sig = createHmac("sha256", "test-secret").update(expired).digest("base64url");
    expect(verifySessionToken(`${expired}.${sig}`)).toBeNull();
  });
});

describe("validation schemas", () => {
  it("project create: name required, budget positive, culture UUID", () => {
    expect(projectCreateSchema.safeParse({ name: "Festival" }).success).toBe(true);
    expect(projectCreateSchema.safeParse({ name: "" }).success).toBe(false);
    expect(projectCreateSchema.safeParse({ name: "x", budget: -5 }).success).toBe(false);
    expect(projectCreateSchema.safeParse({ name: "x", cultureId: "nope" }).success).toBe(false);
  });

  it("register: email + min-length password", () => {
    expect(
      registerSchema.safeParse({ email: "a@b.co", password: "12345678" }).success,
    ).toBe(true);
    expect(registerSchema.safeParse({ email: "nope", password: "12345678" }).success).toBe(
      false,
    );
    expect(registerSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(
      false,
    );
  });

  it("login: any non-empty password passes shape check (checked vs hash)", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
