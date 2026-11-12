import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { AlertCircle, Plus, Search, Sprout } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { SkillFormDialog } from "@/components/skill-dialogs";
import { SectionCard, SkillRow } from "@/components/skill-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, type SkillStatus } from "@/lib/skills-data";
import { describeSkillError, skillsQuery } from "@/lib/skills";

export const Route = createFileRoute("/_authenticated/skills/")({
  head: () => ({
    meta: [
      { title: "Skills · SkillLearn" },
      { name: "description", content: "Browse and manage the skills you're learning on SkillLearn." },
      { property: "og:title", content: "Skills · SkillLearn" },
      { property: "og:description", content: "Browse and manage the skills you're learning." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(skillsQuery),
  pendingMs: 150,
  pendingMinMs: 300,
  pendingComponent: SkillsLoading,
  errorComponent: SkillsError,
  notFoundComponent: () => <p className="text-sm text-muted-foreground">Skills not found.</p>,
  component: SkillsPage,
});

type Filter = "all" | SkillStatus;

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_progress", label: STATUS_LABELS.in_progress },
  { value: "not_started", label: STATUS_LABELS.not_started },
  { value: "completed", label: STATUS_LABELS.completed },
];

function AddSkillButton() {
  return (
    <SkillFormDialog
      trigger={
        <Button>
          <Plus />
          Add skill
        </Button>
      }
    />
  );
}

function SkillsPage() {
  const { data: skills } = useSuspenseQuery(skillsQuery);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills.filter(
      (s) =>
        (filter === "all" || s.status === filter) &&
        (q === "" || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)),
    );
  }, [skills, filter, query]);

  const countFor = (f: Filter) => (f === "all" ? skills.length : skills.filter((s) => s.status === f).length);

  return (
    <>
      <PageHeader
        title="Skills"
        description="Everything you're learning, in one place."
        actions={<AddSkillButton />}
      />

      {skills.length === 0 ? (
        <SectionCard title="All skills" description="0 skills">
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Sprout className="size-5" />
            </span>
            <p className="mt-4 font-medium">No skills yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add the first skill you want to learn and start tracking your progress.
            </p>
            <div className="mt-5">
              <AddSkillButton />
            </div>
          </div>
        </SectionCard>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              role="tablist"
              aria-label="Filter by status"
              className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0"
            >
              {filters.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    filter === f.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                  <span className="text-xs opacity-75 tabular-nums">{countFor(f.value)}</span>
                </button>
              ))}
            </div>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search skills"
                aria-label="Search skills"
                className="bg-card pl-9"
              />
            </div>
          </div>

          <SectionCard
            title={filter === "all" ? "All skills" : filters.find((f) => f.value === filter)!.label}
            description={`${visible.length} ${visible.length === 1 ? "skill" : "skills"}`}
          >
            {visible.length > 0 ? (
              <ul className="divide-y">
                {visible.map((skill) => (
                  <li key={skill.id}>
                    <SkillRow skill={skill} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-14 text-center">
                <p className="font-medium">No skills found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try a different filter or search term.</p>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </>
  );
}

function SkillsLoading() {
  return (
    <>
      <PageHeader title="Skills" description="Everything you're learning, in one place." />
      <div className="mb-4 flex gap-1.5">
        {[56, 96, 96, 92].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-full" style={{ width: w }} />
        ))}
      </div>
      <SectionCard title="All skills" description="Loading your skills…">
        <ul className="divide-y" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="space-y-2.5 px-4 py-4 sm:px-5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-full max-w-xs" />
            </li>
          ))}
        </ul>
      </SectionCard>
    </>
  );
}

function SkillsError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <>
      <PageHeader title="Skills" description="Everything you're learning, in one place." />
      <div role="alert" className="flex flex-col items-center rounded-xl border bg-card px-5 py-14 text-center">
        <AlertCircle className="size-6 text-destructive" />
        <p className="mt-3 font-medium">Your skills didn't load</p>
        <p className="mt-1 text-sm text-muted-foreground">{describeSkillError(error)}</p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => {
            void router.invalidate();
            reset();
          }}
        >
          Try again
        </Button>
      </div>
    </>
  );
}
