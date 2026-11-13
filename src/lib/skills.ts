import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Must match the allowed values in the skills table; change both together.
export const SKILL_CATEGORIES = ["Programming", "Languages", "Design", "Productivity", "Business"] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const SKILL_NAME_MAX = 100;
export const SKILL_DESCRIPTION_MAX = 1000;

export type SkillStatus = "not_started" | "in_progress" | "completed";

export const STATUS_LABELS: Record<SkillStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

export interface SkillRecord {
  id: string;
  name: string;
  category: string;
  description: string | null;
  progress: number;
  status: SkillStatus;
  targetCompletionDate: string | null; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

/** 0 = not started, 1–99 = in progress, 100 = completed. */
export function statusFromProgress(progress: number): SkillStatus {
  if (progress >= 100) return "completed";
  if (progress <= 0) return "not_started";
  return "in_progress";
}

export function toSkillRecord(row: Tables<"skills">): SkillRecord {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    progress: row.progress,
    status: statusFromProgress(row.progress),
    targetCompletionDate: row.target_completion_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------- Dashboard summary ----------

export interface SkillSummary {
  total: number;
  inProgress: number; // progress 1–99
  completed: number; // progress 100
  notStarted: number; // progress 0
  overallProgress: number; // rounded mean progress across all skills; 0 with no skills
}

export function summarizeSkills(skills: readonly { progress: number }[]): SkillSummary {
  const total = skills.length;
  const inProgress = skills.filter((s) => s.progress > 0 && s.progress < 100).length;
  const completed = skills.filter((s) => s.progress === 100).length;
  const overallProgress =
    total === 0 ? 0 : Math.round(skills.reduce((sum, s) => sum + s.progress, 0) / total);
  return { total, inProgress, completed, notStarted: total - inProgress - completed, overallProgress };
}

// ---------- Form rules ----------

export const skillFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a skill name.")
    .max(SKILL_NAME_MAX, `Keep the name under ${SKILL_NAME_MAX} characters.`),
  category: z.enum(SKILL_CATEGORIES, {
    errorMap: () => ({ message: "Choose a category." }),
  }),
  description: z
    .string()
    .trim()
    .max(SKILL_DESCRIPTION_MAX, `Keep the description under ${SKILL_DESCRIPTION_MAX} characters.`),
  targetCompletionDate: z
    .string()
    .trim()
    .refine((v) => v === "" || isValidIsoDate(v), "Enter a valid date."),
  progress: z
    .string()
    .trim()
    .min(1, "Enter progress from 0 to 100.")
    .refine((v) => /^\d+$/.test(v) && Number(v) <= 100, "Progress must be a whole number from 0 to 100."),
});

export type SkillFormValues = z.input<typeof skillFormSchema>;

export const emptySkillForm: SkillFormValues = {
  name: "",
  category: "" as SkillCategory,
  description: "",
  targetCompletionDate: "",
  progress: "0",
};

export function skillToForm(skill: SkillRecord): SkillFormValues {
  return {
    name: skill.name,
    category: (SKILL_CATEGORIES as readonly string[]).includes(skill.category)
      ? (skill.category as SkillCategory)
      : ("" as SkillCategory),
    description: skill.description ?? "",
    targetCompletionDate: skill.targetCompletionDate ?? "",
    progress: String(skill.progress),
  };
}

export interface SkillInput {
  name: string;
  category: SkillCategory;
  description: string | null;
  target_completion_date: string | null;
  progress: number;
}

export type SkillFormResult =
  | { ok: true; data: SkillInput }
  | { ok: false; errors: Partial<Record<keyof SkillFormValues, string>> };

/** Validates the form and converts it to the values saved in the database. */
export function parseSkillForm(values: SkillFormValues): SkillFormResult {
  const result = skillFormSchema.safeParse(values);
  if (!result.success) {
    const errors: Partial<Record<keyof SkillFormValues, string>> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof SkillFormValues;
      errors[key] ??= issue.message;
    }
    return { ok: false, errors };
  }
  const v = result.data;
  return {
    ok: true,
    data: {
      name: v.name,
      category: v.category,
      description: v.description === "" ? null : v.description,
      target_completion_date: v.targetCompletionDate === "" ? null : v.targetCompletionDate,
      progress: Number(v.progress),
    },
  };
}

function isValidIsoDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

// ---------- Errors ----------

interface DbError {
  code?: string;
  message?: string;
}

/** Turns a database or network failure into a short message people can act on. */
export function describeSkillError(error: unknown): string {
  const e = (error ?? {}) as DbError;
  const msg = e.message ?? "";
  if (/failed to fetch|network|load failed/i.test(msg)) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (e.code === "PGRST116") return "This skill no longer exists. It may have been deleted.";
  if (e.code === "42501") return "You don't have permission to change this skill.";
  if (e.code === "23503") return "Your profile isn't set up yet, so skills can't be saved. Sign out and back in, then try again.";
  if (e.code === "23514") return "Some values aren't allowed. Check the fields and try again.";
  if (e.code === "PGRST301" || /jwt|not signed in/i.test(msg)) {
    return "Your session has ended. Sign in again to continue.";
  }
  return "Something went wrong. Please try again.";
}

// ---------- Reading ----------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Row-level security limits every query to the signed-in user's own skills.
export const skillsQuery = queryOptions({
  queryKey: ["skills", "list"],
  queryFn: async (): Promise<SkillRecord[]> => {
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data.map(toSkillRecord);
  },
  staleTime: 30_000,
});

export const skillQuery = (id: string) =>
  queryOptions({
    queryKey: ["skills", "detail", id],
    queryFn: async (): Promise<SkillRecord> => {
      if (!UUID_RE.test(id)) throw notFound();
      const { data, error } = await supabase.from("skills").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return toSkillRecord(data);
    },
    staleTime: 30_000,
  });

// ---------- Writing ----------

async function currentUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw { code: "PGRST301", message: "Not signed in" } satisfies DbError;
  return session.user.id;
}

export async function createSkill(input: SkillInput): Promise<SkillRecord> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("skills")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return toSkillRecord(data);
}

export async function updateSkill(id: string, input: SkillInput): Promise<SkillRecord> {
  const { data, error } = await supabase.from("skills").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return toSkillRecord(data);
}

export async function deleteSkill(id: string): Promise<void> {
  const { data, error } = await supabase.from("skills").delete().eq("id", id).select("id");
  if (error) throw error;
  if (data.length === 0) throw { code: "PGRST116", message: "No rows deleted" } satisfies DbError;
}

// ---------- Display ----------

/** Formats a calendar date (YYYY-MM-DD) or a full timestamp; "—" when empty. */
export function formatSkillDate(value: string | null): string {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
