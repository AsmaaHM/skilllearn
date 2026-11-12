import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { FormError } from "@/components/auth-layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  SKILL_CATEGORIES,
  SKILL_DESCRIPTION_MAX,
  SKILL_NAME_MAX,
  createSkill,
  deleteSkill,
  describeSkillError,
  emptySkillForm,
  parseSkillForm,
  skillQuery,
  skillToForm,
  skillsQuery,
  updateSkill,
  type SkillCategory,
  type SkillFormValues,
  type SkillInput,
  type SkillRecord,
} from "@/lib/skills";
import { cn } from "@/lib/utils";

type FieldErrors = Partial<Record<keyof SkillFormValues, string>>;

/** Add (no `skill`) or edit (with `skill`) a skill in a dialog. */
export function SkillFormDialog({
  skill,
  trigger,
  onSaved,
}: {
  skill?: SkillRecord;
  trigger: ReactNode;
  onSaved?: (saved: SkillRecord) => void;
}) {
  const isEdit = Boolean(skill);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<SkillFormValues>(emptySkillForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (input: SkillInput) => (skill ? updateSkill(skill.id, input) : createSkill(input)),
    onSuccess: (saved) => {
      queryClient.setQueryData(skillQuery(saved.id).queryKey, saved);
      void queryClient.invalidateQueries({ queryKey: skillsQuery.queryKey });
      toast.success(isEdit ? "Skill updated" : "Skill added", { description: saved.name });
      setOpen(false);
      onSaved?.(saved);
    },
    onError: (error) => setSubmitError(describeSkillError(error)),
  });

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending) return;
    if (next) {
      setValues(skill ? skillToForm(skill) : emptySkillForm);
      setErrors({});
      setSubmitError(null);
      mutation.reset();
    }
    setOpen(next);
  };

  const set = <K extends keyof SkillFormValues>(key: K, value: SkillFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const parsed = parseSkillForm(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    mutation.mutate(parsed.data);
  };

  const progressPreview = /^\d+$/.test(values.progress) ? Math.min(100, Number(values.progress)) : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit skill" : "Add skill"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the details and progress for this skill." : "Add a new skill you want to learn."}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <FormError message={submitError} />

          <Field id="skill-name" label="Name" error={errors.name}>
            <Input
              id="skill-name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={SKILL_NAME_MAX}
              placeholder="e.g. TypeScript"
              autoFocus
              {...invalid("skill-name", errors.name)}
            />
          </Field>

          <Field id="skill-category" label="Category" error={errors.category}>
            <Select value={values.category} onValueChange={(v) => set("category", v as SkillCategory)}>
              <SelectTrigger id="skill-category" {...invalid("skill-category", errors.category)}>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field id="skill-description" label="Description" optional error={errors.description}>
            <Textarea
              id="skill-description"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={SKILL_DESCRIPTION_MAX}
              rows={3}
              placeholder="What do you want to be able to do?"
              {...invalid("skill-description", errors.description)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="skill-target" label="Target completion date" optional error={errors.targetCompletionDate}>
              <Input
                id="skill-target"
                type="date"
                value={values.targetCompletionDate}
                onChange={(e) => set("targetCompletionDate", e.target.value)}
                {...invalid("skill-target", errors.targetCompletionDate)}
              />
            </Field>

            <Field id="skill-progress" label="Progress (%)" error={errors.progress}>
              <Input
                id="skill-progress"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={1}
                value={values.progress}
                onChange={(e) => set("progress", e.target.value)}
                {...invalid("skill-progress", errors.progress)}
              />
            </Field>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPreview}%` }} />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Add skill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function invalid(id: string, error: string | undefined) {
  return error
    ? {
        "aria-invalid": true as const,
        "aria-describedby": `${id}-error`,
        className: "border-destructive focus-visible:ring-destructive",
      }
    : {};
}

function Field({
  id,
  label,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className={cn("text-xs font-medium text-destructive")}>
          {error}
        </p>
      )}
    </div>
  );
}

/** Asks for confirmation, then permanently deletes the skill. */
export function DeleteSkillDialog({
  skill,
  trigger,
  onDeleted,
}: {
  skill: SkillRecord;
  trigger: ReactNode;
  onDeleted: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => deleteSkill(skill.id),
    onSuccess: async () => {
      setOpen(false);
      await onDeleted();
      toast.success("Skill deleted", { description: skill.name });
    },
    onError: (e) => setError(describeSkillError(e)),
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending) return;
        if (next) setError(null);
        setOpen(next);
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{skill.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the skill and its progress. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FormError message={error} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={mutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            {mutation.isPending && <Loader2 className="animate-spin" />}
            Delete skill
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
