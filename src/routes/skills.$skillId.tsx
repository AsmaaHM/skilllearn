import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Clock, Pencil, Tag, Trash2 } from "lucide-react";
import type { ComponentType } from "react";

import { ProgressBar, StatusBadge } from "@/components/skill-ui";
import { Button } from "@/components/ui/button";
import { formatDate, getSkillById } from "@/lib/skills-data";

export const Route = createFileRoute("/skills/$skillId")({
  loader: ({ params }) => {
    const skill = getSkillById(params.skillId);
    if (!skill) throw notFound();
    return { skill };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.skill.name} · SkillLearn` : "Skill not found · SkillLearn";
    const description = loaderData?.skill.description ?? "This skill could not be found.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: SkillNotFound,
  component: SkillDetail,
});

function BackLink() {
  return (
    <Link
      to="/skills"
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to skills
    </Link>
  );
}

function SkillDetail() {
  const { skill } = Route.useLoaderData();

  return (
    <>
      <BackLink />

      <div className="rounded-xl border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <StatusBadge status={skill.status} />
            <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">{skill.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {skill.description}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" disabled title="Coming soon">
              <Pencil />
              Edit
            </Button>
            <Button variant="outline" size="icon" disabled title="Coming soon" aria-label="Delete skill">
              <Trash2 />
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="font-display text-2xl font-semibold tabular-nums">{skill.progress}%</span>
          </div>
          <ProgressBar value={skill.progress} status={skill.status} className="h-3" />
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Detail icon={Tag} label="Category" value={skill.category} />
        <Detail icon={CalendarDays} label="Started" value={formatDate(skill.startedOn)} />
        <Detail icon={Clock} label="Last updated" value={formatDate(skill.updatedOn)} />
      </dl>
    </>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}

function SkillNotFound() {
  return (
    <>
      <BackLink />
      <div className="rounded-xl border bg-card px-5 py-14 text-center">
        <h1 className="text-xl font-semibold">Skill not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This skill doesn't exist or may have been removed.
        </p>
      </div>
    </>
  );
}
