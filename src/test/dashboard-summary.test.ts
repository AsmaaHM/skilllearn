import { describe, expect, it } from "vitest";

import { summarizeSkills } from "@/lib/skills";

const skills = (...progress: number[]) => progress.map((p) => ({ progress: p }));

describe("Dashboard metrics", () => {
  it("Total Skills counts every saved skill", () => {
    expect(summarizeSkills(skills(0, 40, 100, 100)).total).toBe(4);
  });

  it("In Progress counts skills with progress above 0 and below 100", () => {
    expect(summarizeSkills(skills(0, 1, 50, 99, 100)).inProgress).toBe(3);
  });

  it("Completed counts skills with progress exactly 100", () => {
    expect(summarizeSkills(skills(0, 99, 100, 100)).completed).toBe(2);
  });

  it("Overall Progress is the mean of all progress values, rounded to the nearest whole number", () => {
    expect(summarizeSkills(skills(33, 100)).overallProgress).toBe(67); // 66.5 → 67
    expect(summarizeSkills(skills(0, 10, 15)).overallProgress).toBe(8); // 8.33 → 8
    expect(summarizeSkills(skills(0, 0, 100)).overallProgress).toBe(33);
  });

  it("everything is 0 with no skills", () => {
    expect(summarizeSkills([])).toEqual({ total: 0, inProgress: 0, completed: 0, notStarted: 0, overallProgress: 0 });
  });
});
