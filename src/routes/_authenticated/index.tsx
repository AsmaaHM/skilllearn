import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Layers, Timer, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { ProgressBar, SectionCard, SkillRow, StatCard } from "@/components/skill-ui";
import { Button } from "@/components/ui/button";
import { placeholderSkills, placeholderUser, summarizeSkills } from "@/lib/skills-data";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard · SkillLearn" },
      {
        name: "description",
        content: "See your learning at a glance: total skills, skills in progress, completed, and overall progress.",
      },
      { property: "og:title", content: "Dashboard · SkillLearn" },
      {
        property: "og:description",
        content: "Your learning at a glance on SkillLearn.",
      },
    ],
  }),
  component: Dashboard,
});

const statusOrder = { in_progress: 0, not_started: 1, completed: 2 } as const;

function Dashboard() {
  const summary = summarizeSkills(placeholderSkills);
  const firstName = placeholderUser.displayName.split(" ")[0];
  const overview = [...placeholderSkills]
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || b.progress - a.progress)
    .slice(0, 5);

  const pct = (n: number) => (summary.total === 0 ? 0 : (n / summary.total) * 100);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's how your learning is going."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Skills" value={summary.total} hint="Skills you're tracking" icon={Layers} />
        <StatCard label="In Progress" value={summary.inProgress} hint="Currently learning" icon={Timer} />
        <StatCard label="Completed" value={summary.completed} hint="Skills mastered" icon={CheckCircle2} />
        <StatCard label="Overall Progress" value={`${summary.overallProgress}%`} icon={TrendingUp}>
          <ProgressBar value={summary.overallProgress} className="mt-3" />
        </StatCard>
      </div>

      <SectionCard
        title="Skills Overview"
        description="Your skills, with what you're learning now at the top."
        className="mt-8"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/skills">
              View all
              <ArrowRight />
            </Link>
          </Button>
        }
      >
        <div className="border-b px-4 py-4 sm:px-5">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-status-done" style={{ width: `${pct(summary.completed)}%` }} />
            <div className="h-full bg-status-active" style={{ width: `${pct(summary.inProgress)}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
            <Legend className="bg-status-done" label="Completed" value={summary.completed} />
            <Legend className="bg-status-active" label="In progress" value={summary.inProgress} />
            <Legend className="bg-muted-foreground/40" label="Not started" value={summary.notStarted} />
          </div>
        </div>
        <ul className="divide-y">
          {overview.map((skill) => (
            <li key={skill.id}>
              <SkillRow skill={skill} />
            </li>
          ))}
        </ul>
      </SectionCard>
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
