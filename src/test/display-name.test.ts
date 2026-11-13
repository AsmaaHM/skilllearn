import { describe, expect, it } from "vitest";

import { displayNameSchema } from "@/lib/auth-validation";

describe("display name rule (Settings)", () => {
  it("rejects an empty name", () => {
    expect(displayNameSchema.safeParse("").success).toBe(false);
  });

  it("rejects a name that is only spaces", () => {
    expect(displayNameSchema.safeParse("   ").success).toBe(false);
  });

  it("trims surrounding spaces before saving", () => {
    expect(displayNameSchema.parse("  Asmaa H  ")).toBe("Asmaa H");
  });
});
