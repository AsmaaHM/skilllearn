import { describe, expect, it } from "vitest";

import { placeholderSkills, summarizeSkills, type Skill } from "@/lib/skills-data";

const make = (status: Skill["status"], progress: number): Skill => ({
  id: `${status}-${progress}`,
  name: "x",
  category: "x",
  status,
  progress,
  description: "",
  startedOn: null,
  updatedOn: "2026-01-01",
});

describe("summarizeSkills", () => {
  it("counts total, in progress and completed skills", () => {
    const s = summarizeSkills([make("in_progress", 50), make("completed", 100), make("not_started", 0)]);
    expect(s.total).toBe(3);
    expect(s.inProgress).toBe(1);
    expect(s.completed).toBe(1);
  });

  it("overall progress is the rounded average progress of all skills", () => {
    expect(summarizeSkills([make("in_progress", 33), make("completed", 100)]).overallProgress).toBe(67);
    expect(summarizeSkills(placeholderSkills).overallProgress).toBe(43);
  });

  it("overall progress is 0 with no skills", () => {
    expect(summarizeSkills([]).overallProgress).toBe(0);
  });
});
