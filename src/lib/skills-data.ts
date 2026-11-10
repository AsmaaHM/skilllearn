// Placeholder data used to demonstrate the interface until real storage is added.

export type SkillStatus = "not_started" | "in_progress" | "completed";

export interface Skill {
  id: string;
  name: string;
  category: string;
  status: SkillStatus;
  progress: number; // 0–100
  description: string;
  startedOn: string | null; // ISO date
  updatedOn: string; // ISO date
}

export const STATUS_LABELS: Record<SkillStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

export const placeholderSkills: Skill[] = [
  {
    id: "typescript",
    name: "TypeScript",
    category: "Programming",
    status: "in_progress",
    progress: 65,
    description:
      "Get comfortable with types, generics, and narrowing so everyday JavaScript projects are safer to change.",
    startedOn: "2026-08-03",
    updatedOn: "2026-11-06",
  },
  {
    id: "spanish",
    name: "Conversational Spanish",
    category: "Languages",
    status: "in_progress",
    progress: 40,
    description: "Hold a 10-minute everyday conversation without switching back to English.",
    startedOn: "2026-06-14",
    updatedOn: "2026-11-04",
  },
  {
    id: "ui-design",
    name: "UI Design Fundamentals",
    category: "Design",
    status: "completed",
    progress: 100,
    description: "Layout, spacing, typography, and color basics for designing clean interfaces.",
    startedOn: "2026-03-01",
    updatedOn: "2026-07-22",
  },
  {
    id: "public-speaking",
    name: "Public Speaking",
    category: "Communication",
    status: "not_started",
    progress: 0,
    description: "Prepare and deliver a short talk with confidence in front of a small group.",
    startedOn: null,
    updatedOn: "2026-10-18",
  },
  {
    id: "photography",
    name: "Photography Basics",
    category: "Creative",
    status: "in_progress",
    progress: 25,
    description: "Understand exposure, composition, and natural light using a phone or camera.",
    startedOn: "2026-09-20",
    updatedOn: "2026-11-01",
  },
  {
    id: "sql",
    name: "SQL for Data Analysis",
    category: "Data",
    status: "completed",
    progress: 100,
    description: "Write queries with joins, grouping, and window functions to answer real questions.",
    startedOn: "2026-01-10",
    updatedOn: "2026-05-30",
  },
  {
    id: "guitar",
    name: "Acoustic Guitar",
    category: "Music",
    status: "in_progress",
    progress: 15,
    description: "Learn the open chords and play three full songs from start to finish.",
    startedOn: "2026-10-05",
    updatedOn: "2026-11-07",
  },
  {
    id: "personal-finance",
    name: "Personal Finance",
    category: "Life skills",
    status: "not_started",
    progress: 0,
    description: "Build a simple budget, understand savings goals, and learn investing basics.",
    startedOn: null,
    updatedOn: "2026-10-28",
  },
];

export function getSkillById(id: string): Skill | undefined {
  return placeholderSkills.find((skill) => skill.id === id);
}

export interface SkillSummary {
  total: number;
  inProgress: number;
  completed: number;
  notStarted: number;
  overallProgress: number; // rounded average progress across all skills, 0–100
}

export function summarizeSkills(skills: Skill[]): SkillSummary {
  const total = skills.length;
  const inProgress = skills.filter((s) => s.status === "in_progress").length;
  const completed = skills.filter((s) => s.status === "completed").length;
  const overallProgress =
    total === 0 ? 0 : Math.round(skills.reduce((sum, s) => sum + s.progress, 0) / total);
  return { total, inProgress, completed, notStarted: total - inProgress - completed, overallProgress };
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
