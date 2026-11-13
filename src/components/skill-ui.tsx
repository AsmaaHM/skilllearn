import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { STATUS_LABELS, formatSkillDate, type SkillStatus } from "@/lib/skills";

/** What a skill row needs. */
export interface SkillRowData {
  id: string;
  name: string;
  category: string;
  progress: number;
  status: SkillStatus;
  targetCompletionDate?: string | null;
}

const statusBadgeClass: Record<SkillStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-status-active-soft text-status-active-foreground",
  completed: "bg-status-done-soft text-status-done-foreground",
};

const statusBarClass: Record<SkillStatus, string> = {
  not_started: "bg-muted-foreground/40",
  in_progress: "bg-status-active",
  completed: "bg-status-done",
};

export function StatusBadge({ status, className }: { status: SkillStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusBadgeClass[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ProgressBar({
  value,
  status,
  className,
}: {
  value: number;
  status?: SkillStatus;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-all", status ? statusBarClass[status] : "bg-primary")}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

export function SkillRow({ skill, showTargetDate = false }: { skill: SkillRowData; showTargetDate?: boolean }) {
  return (
    <Link
      to="/skills/$skillId"
      params={{ skillId: skill.id }}
      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50 sm:px-5"
    >
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <p className="truncate font-medium">{skill.name}</p>
          <StatusBadge status={skill.status} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {skill.category}
          {showTargetDate && skill.targetCompletionDate && (
            <> · Target {formatSkillDate(skill.targetCompletionDate)}</>
          )}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={skill.progress} status={skill.status} className="max-w-xs" />
          <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
            {skill.progress}%
          </span>
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-card", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
