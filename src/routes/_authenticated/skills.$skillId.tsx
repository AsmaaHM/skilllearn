import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, CalendarCheck, Clock, Pencil, Tag, Trash2 } from "lucide-react";
import type { ComponentType } from "react";

import { DeleteSkillDialog, SkillFormDialog } from "@/components/skill-dialogs";
import { ProgressBar, StatusBadge } from "@/components/skill-ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { describeSkillError, formatSkillDate, skillQuery, skillsQuery, type SkillRecord } from "@/lib/skills";

export const Route = createFileRoute("/_authenticated/skills/$skillId")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(skillQuery(params.skillId)),
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} · SkillLearn` : "Skill · SkillLearn";
    const description = loaderData?.description || "Details and progress for one of your skills.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  pendingMs: 150,
  pendingMinMs: 300,
  pendingComponent: SkillLoading,
  errorComponent: SkillError,
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
  const { skillId } = Route.useParams();
  const { data: skill } = useSuspenseQuery(skillQuery(skillId));
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleDeleted = async () => {
    // Drop it from the list right away, leave this page, then refresh from the database.
    queryClient.setQueryData(skillsQuery.queryKey, (old: SkillRecord[] | undefined) =>
      old?.filter((s) => s.id !== skill.id),
    );
    await navigate({ to: "/skills", replace: true });
    queryClient.removeQueries({ queryKey: skillQuery(skill.id).queryKey });
    void queryClient.invalidateQueries({ queryKey: skillsQuery.queryKey });
  };

  return (
    <>
      <BackLink />

      <div className="rounded-xl border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <StatusBadge status={skill.status} />
            <h1 className="mt-3 break-words text-2xl font-semibold sm:text-3xl">{skill.name}</h1>
            <p className="mt-2 max-w-2xl whitespace-pre-line break-words text-sm text-muted-foreground sm:text-base">
              {skill.description || "No description yet."}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <SkillFormDialog
              skill={skill}
              trigger={
                <Button variant="outline">
                  <Pencil />
                  Edit
                </Button>
              }
            />
            <DeleteSkillDialog
              skill={skill}
              onDeleted={handleDeleted}
              trigger={
                <Button variant="outline" size="icon" aria-label="Delete skill" title="Delete skill">
                  <Trash2 />
                </Button>
              }
            />
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
        <Detail icon={CalendarCheck} label="Target completion" value={formatSkillDate(skill.targetCompletionDate)} />
        <Detail icon={Clock} label="Last updated" value={formatSkillDate(skill.updatedAt)} />
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

function SkillLoading() {
  return (
    <>
      <BackLink />
      <div className="rounded-xl border bg-card p-5 sm:p-7" aria-busy="true">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="mt-4 h-8 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mt-10 h-3 w-full" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[74px] rounded-xl" />
        ))}
      </div>
    </>
  );
}

function SkillError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <>
      <BackLink />
      <div role="alert" className="flex flex-col items-center rounded-xl border bg-card px-5 py-14 text-center">
        <AlertCircle className="size-6 text-destructive" />
        <p className="mt-3 font-medium">This skill didn't load</p>
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
