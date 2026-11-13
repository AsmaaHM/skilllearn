import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, LogOut, Moon, Sun } from "lucide-react";
import { useState, type ComponentType, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/skill-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  currentProfileQuery,
  describeProfileError,
  signOutToLogin,
  updateDisplayName,
  useCurrentProfile,
  type CurrentProfile,
} from "@/lib/auth";
import { displayNameSchema } from "@/lib/auth-validation";
import { useTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings · SkillLearn" },
      { name: "description", content: "Update your display name and appearance preferences on SkillLearn." },
      { property: "og:title", content: "Settings · SkillLearn" },
      { property: "og:description", content: "Your SkillLearn profile and appearance preferences." },
    ],
  }),
  component: SettingsPage,
});

const themeOptions: { value: Theme; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: profile } = useCurrentProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOutToLogin(queryClient, navigate);
  };

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and how SkillLearn looks." />

      <div className="space-y-6">
        <SectionCard title="Profile" description="This is how your name appears in SkillLearn.">
          {profile ? (
            <DisplayNameForm key={profile.id} profile={profile} />
          ) : (
            <div className="space-y-4 p-4 sm:p-5">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input id="display-name" disabled className="max-w-sm" />
              </div>
              <Button disabled>Save changes</Button>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Appearance" description="Choose a light or dark theme.">
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-3 p-4 sm:max-w-md sm:p-5">
            {themeOptions.map(({ value, label, icon: Icon }) => {
              const selected = theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "relative rounded-xl border p-3 text-left transition-colors",
                    selected ? "border-primary ring-1 ring-primary" : "hover:border-foreground/20",
                  )}
                >
                  <ThemePreview theme={value} />
                  <span className="mt-3 flex items-center gap-2 text-sm font-medium">
                    <Icon className="size-4" />
                    {label}
                  </span>
                  {selected && (
                    <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Account" description="Sign out of SkillLearn on this device.">
          <div className="p-4 sm:p-5">
            <Button
              type="button"
              variant="outline"
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut />
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function DisplayNameForm({ profile }: { profile: CurrentProfile }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(profile.displayName);
  const [touched, setTouched] = useState(false);

  const parsed = displayNameSchema.safeParse(value);
  const error = parsed.success ? null : parsed.error.issues[0]?.message ?? "Enter your display name.";
  const changed = parsed.success && parsed.data !== profile.displayName;

  const mutation = useMutation({
    mutationFn: updateDisplayName,
    onSuccess: (saved) => {
      queryClient.setQueryData(currentProfileQuery.queryKey, (old) => (old ? { ...old, displayName: saved } : old));
      setValue(saved);
      toast.success("Display name updated", { description: saved });
    },
    onError: (err) => toast.error("Couldn't save your name", { description: describeProfileError(err) }),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!parsed.success || !changed || mutation.isPending) return;
    mutation.mutate(parsed.data);
  };

  const showError = touched && error;

  return (
    <form noValidate className="space-y-4 p-4 sm:p-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setTouched(true);
          }}
          maxLength={50}
          autoComplete="name"
          className="max-w-sm"
          aria-invalid={showError ? true : undefined}
          aria-describedby={showError ? "display-name-error" : undefined}
        />
        {showError && (
          <p id="display-name-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" disabled={!changed || mutation.isPending}>
        {mutation.isPending && <Loader2 className="animate-spin" />}
        {mutation.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

// A tiny mock of the app in each theme, so the choice is easy to picture.
function ThemePreview({ theme }: { theme: Theme }) {
  return (
    <div className={cn(theme, "overflow-hidden rounded-lg border")}>
      <div className="flex h-16 bg-background">
        <div className="w-1/4 border-r bg-sidebar" />
        <div className="flex-1 space-y-1.5 p-2">
          <div className="h-1.5 w-2/3 rounded-full bg-foreground/70" />
          <div className="h-1.5 w-1/2 rounded-full bg-muted-foreground/40" />
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div className="h-full w-3/5 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
