import { describe, expect, it } from "vitest";

import { readAuthLinkHash } from "@/lib/auth";

describe("password reset link detection", () => {
  it("recognises a reset link that carries a sign-in session", () => {
    expect(
      readAuthLinkHash("#access_token=abc&expires_in=3600&refresh_token=def&token_type=bearer&type=recovery"),
    ).toBe("recovery");
  });

  it("treats a used or expired link as an error", () => {
    expect(
      readAuthLinkHash("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired"),
    ).toBe("error");
  });

  it("does not treat a sign-up confirmation link as a reset link", () => {
    expect(readAuthLinkHash("#access_token=abc&refresh_token=def&type=signup")).toBe("none");
  });

  it("ignores a recovery type without a session", () => {
    expect(readAuthLinkHash("#type=recovery")).toBe("none");
  });

  it("ignores an empty address fragment", () => {
    expect(readAuthLinkHash("")).toBe("none");
  });
});
