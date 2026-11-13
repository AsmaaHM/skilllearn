import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Layers,
  Plus,
  Sprout,
  Timer,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { SkillFormDialog } from "@/components/skill-dialogs";
import { ProgressBar, SectionCard, SkillRow, StatCard } from "@/components/skill-ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentProfile } from "@/lib/auth";
import { describeSkillError, skillsQuery, summarizeSkills } from "@/lib/skills";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard · SkillLearn" },
      {
        name: "description",
        content:
          "See your learning at a glance: total skills, skills in progress, completed, and overall progress.",
      },
      { property: "og:title", content: "Dashboard · SkillLearn" },
      {
        property: "og:description",
        content: "Your learning at a glance on SkillLearn.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(skillsQuery),
  pendingMs: 150,
  pendingMinMs: 300,
  pendingComponent: DashboardLoading,
  errorComponent: DashboardError,
  notFoundComponent: () => <p className="text-sm text-muted-foreground">Nothing to show here.</p>,
  component: Dashboard,
});

const OVERVIEW_LIMIT = 5;

const statusOrder = { in_progress: 0, not_started: 1, completed: 2 } as const;

function DashboardHeader() {
  const { data: profile } = useCurrentProfile();
  const firstName = profile?.displayName.split(" ")[0];
  return (
    <PageHeader
      title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
      description="Here's how your learning is going."
    />
  );
}

function ViewAllButton() {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link to="/skills">
        View all
        <ArrowRight />
      </Link>
    </Button>
  );
}

function Dashboard() {
  const { data: skills } = useSuspenseQuery(skillsQuery);
  const summary = summarizeSkills(skills);
  const overview = [...skills]
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || b.progress - a.progress)
    .slice(0, OVERVIEW_LIMIT);

  const pct = (n: number) => (summary.total === 0 ? 0 : (n / summary.total) * 100);

  return (
    <>
      <DashboardHeader />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Skills"
          value={summary.total}
          hint="Skills you're tracking"
          icon={Layers}
        />
        <StatCard
          label="In Progress"
          value={summary.inProgress}
          hint="Currently learning"
          icon={Timer}
        />
        <StatCard
          label="Completed"
          value={summary.completed}
          hint="Skills mastered"
          icon={CheckCircle2}
        />
        <StatCard label="Overall Progress" value={`${summary.overallProgress}%`} icon={TrendingUp}>
          <ProgressBar value={summary.overallProgress} className="mt-3" />
        </StatCard>
      </div>

      <SectionCard
        title="Skills Overview"
        description="Your skills, with what you're learning now at the top."
        className="mt-8"
        action={<ViewAllButton />}
      >
        {skills.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Sprout className="size-5" />
            </span>
            <p className="mt-4 font-medium">No skills yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add the first skill you want to learn. Your progress will show up here.
            </p>
            <div className="mt-5">
              <SkillFormDialog
                trigger={
                  <Button>
                    <Plus />
                    Add skill
                  </Button>
                }
              />
            </div>
          </div>
        ) : (
          <>
            <div className="border-b px-4 py-4 sm:px-5">
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-status-done"
                  style={{ width: `${pct(summary.completed)}%` }}
                />
                <div
                  className="h-full bg-status-active"
                  style={{ width: `${pct(summary.inProgress)}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                <Legend className="bg-status-done" label="Completed" value={summary.completed} />
                <Legend
                  className="bg-status-active"
                  label="In progress"
                  value={summary.inProgress}
                />
                <Legend
                  className="bg-muted-foreground/40"
                  label="Not started"
                  value={summary.notStarted}
                />
              </div>
            </div>
            <ul className="divide-y">
              {overview.map((skill) => (
                <li key={skill.id}>
                  <SkillRow skill={skill} showTargetDate />
                </li>
              ))}
            </ul>
          </>
        )}
      </SectionCard>
    </>
  );
}

function DashboardLoading() {
  return (
    <>
      <DashboardHeader />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-14" />
          </div>
        ))}
      </div>
      <SectionCard title="Skills Overview" description="Loading your skills…" className="mt-8">
        <ul className="divide-y" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
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

function DashboardError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <>
      <DashboardHeader />
      <div
        role="alert"
        className="flex flex-col items-center rounded-xl border bg-card px-5 py-14 text-center"
      >
        <AlertCircle className="size-6 text-destructive" />
        <p className="mt-3 font-medium">Your dashboard didn't load</p>
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

function Legend({ className, label, value }: { className: string; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`size-2 rounded-full ${className}`} />
      {label}
      <span className="font-medium text-foreground">{value}</span>
    </span>
  );
}
