import { describe, expect, it } from "vitest";

import { authErrorMessage, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/auth-validation";

const valid = {
  displayName: "Asmaa",
  email: "asmaa@example.com",
  password: "learning1",
  confirmPassword: "learning1",
};

describe("registration rules", () => {
  it("accepts a complete, valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a display name", () => {
    expect(registerSchema.safeParse({ ...valid, displayName: "   " }).success).toBe(false);
  });

  it("rejects a badly formatted email", () => {
    expect(registerSchema.safeParse({ ...valid, email: "asmaa@" }).success).toBe(false);
  });

  it("requires passwords of at least 8 characters", () => {
    expect(registerSchema.safeParse({ ...valid, password: "learn1", confirmPassword: "learn1" }).success).toBe(false);
  });

  it("requires a letter and a number in the password", () => {
    expect(registerSchema.safeParse({ ...valid, password: "12345678", confirmPassword: "12345678" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: "learning", confirmPassword: "learning" }).success).toBe(false);
  });

  it("requires the confirmation to match the password", () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: "learning2" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["confirmPassword"]);
  });
});

describe("password reset rules", () => {
  it("requires matching new passwords", () => {
    expect(resetPasswordSchema.safeParse({ password: "learning1", confirmPassword: "learning9" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: "learning1", confirmPassword: "learning1" }).success).toBe(true);
  });
});

describe("login", () => {
  it("requires an email and password", () => {
    expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(false);
  });

  it("explains unverified accounts and wrong credentials differently", () => {
    expect(authErrorMessage({ code: "email_not_confirmed" })).toMatch(/verif/i);
    expect(authErrorMessage({ code: "invalid_credentials" })).toBe("Incorrect email or password.");
  });
});
