import { describe, expect, it } from "vitest";

import { SKILL_CATEGORIES, parseSkillForm, statusFromProgress, type SkillFormValues } from "@/lib/skills";

const valid: SkillFormValues = {
  name: "TypeScript",
  category: "Programming",
  description: "",
  targetCompletionDate: "",
  progress: "0",
};

const errorsFor = (overrides: Partial<SkillFormValues>) => {
  const r = parseSkillForm({ ...valid, ...overrides });
  return r.ok ? {} : r.errors;
};

describe("skill form", () => {
  it("offers exactly the five fixed categories", () => {
    expect([...SKILL_CATEGORIES]).toEqual(["Programming", "Languages", "Design", "Productivity", "Business"]);
  });

  it("requires a name and a category", () => {
    expect(errorsFor({ name: "   " }).name).toBe("Enter a skill name.");
    expect(errorsFor({ category: "" as SkillFormValues["category"] }).category).toBe("Choose a category.");
  });

  it("rejects categories outside the fixed list", () => {
    expect(errorsFor({ category: "Music" as SkillFormValues["category"] }).category).toBe("Choose a category.");
  });

  it("accepts progress 0 and 100 and rejects values outside 0–100 or non-whole numbers", () => {
    expect(parseSkillForm({ ...valid, progress: "0" }).ok).toBe(true);
    expect(parseSkillForm({ ...valid, progress: "100" }).ok).toBe(true);
    for (const bad of ["101", "-1", "12.5", "abc", ""]) {
      expect(parseSkillForm({ ...valid, progress: bad }).ok).toBe(false);
    }
  });

  it("starts progress at 0 for a new skill", async () => {
    const { emptySkillForm } = await import("@/lib/skills");
    expect(emptySkillForm.progress).toBe("0");
  });

  it("saves empty description and target date as empty, and trims the name", () => {
    const r = parseSkillForm({ ...valid, name: "  SQL  ", progress: "40" });
    expect(r).toEqual({
      ok: true,
      data: { name: "SQL", category: "Programming", description: null, target_completion_date: null, progress: 40 },
    });
  });

  it("rejects an impossible target date", () => {
    expect(errorsFor({ targetCompletionDate: "2026-02-30" }).targetCompletionDate).toBe("Enter a valid date.");
    expect(parseSkillForm({ ...valid, targetCompletionDate: "2026-12-31" }).ok).toBe(true);
  });
});

describe("skill status from progress", () => {
  it("0 is not started, 1–99 in progress, 100 completed", () => {
    expect(statusFromProgress(0)).toBe("not_started");
    expect(statusFromProgress(1)).toBe("in_progress");
    expect(statusFromProgress(99)).toBe("in_progress");
    expect(statusFromProgress(100)).toBe("completed");
  });
});
