import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { SectionCard, SkillRow } from "@/components/skill-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, placeholderSkills, type SkillStatus } from "@/lib/skills-data";

export const Route = createFileRoute("/skills/")({
  head: () => ({
    meta: [
      { title: "Skills · SkillLearn" },
      { name: "description", content: "Browse and manage the skills you're learning on SkillLearn." },
      { property: "og:title", content: "Skills · SkillLearn" },
      { property: "og:description", content: "Browse and manage the skills you're learning." },
    ],
  }),
  component: SkillsPage,
});

type Filter = "all" | SkillStatus;

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_progress", label: STATUS_LABELS.in_progress },
  { value: "not_started", label: STATUS_LABELS.not_started },
  { value: "completed", label: STATUS_LABELS.completed },
];

function SkillsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return placeholderSkills.filter(
      (s) =>
        (filter === "all" || s.status === filter) &&
        (q === "" || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)),
    );
  }, [filter, query]);

  const countFor = (f: Filter) =>
    f === "all" ? placeholderSkills.length : placeholderSkills.filter((s) => s.status === f).length;

  return (
    <>
      <PageHeader
        title="Skills"
        description="Everything you're learning, in one place."
        actions={
          <Button disabled title="Coming soon">
            <Plus />
            Add skill
          </Button>
        }
      />

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
  );
}
