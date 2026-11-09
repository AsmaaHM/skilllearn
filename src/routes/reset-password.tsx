import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { AuthLayout, FormError, FormField, authLinkClass } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isRecoverySession } from "@/lib/auth";
import {
  PASSWORD_HINT,
  authErrorMessage,
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/auth-validation";

export const Route = createFileRoute("/reset-password")({
  // The reset link's sign-in details arrive in the browser address bar only.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Choose a new password · SkillLearn" },
      { name: "description", content: "Set a new password for your SkillLearn account." },
      { property: "og:title", content: "Choose a new password · SkillLearn" },
      { property: "og:description", content: "Set a new password for your SkillLearn account." },
    ],
  }),
  component: ResetPasswordPage,
});

type LinkState = "checking" | "ready" | "invalid";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    // An expired or already-used link comes back with an error instead of a session.
    if (new URLSearchParams(window.location.hash.slice(1)).has("error")) {
      setLinkState("invalid");
      return;
    }

    let settled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        settled = true;
        setLinkState("ready");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (settled) return;
      setLinkState(isRecoverySession(data.session?.access_token) ? "ready" : "invalid");
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setFormError(authErrorMessage(error));
      return;
    }
    // End the reset session so the learner logs in fresh with the new password.
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { notice: "password-reset" }, replace: true });
  });

  if (linkState === "checking") {
    return (
      <AuthLayout title="Choose a new password">
        <p className="text-sm text-muted-foreground">Checking your reset link…</p>
      </AuthLayout>
    );
  }

  if (linkState === "invalid") {
    return (
      <AuthLayout
        title="This link doesn't work"
        footer={
          <Link to="/auth" className={authLinkClass}>
            Back to log in
          </Link>
        }
      >
        <div className="flex flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <LinkIcon className="size-6" />
          </span>
          <p className="mt-4 text-sm text-muted-foreground">
            Your password reset link is invalid or has expired. Request a new one to continue.
          </p>
          <Button asChild className="mt-6 h-10 w-full">
            <Link to="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" description="Enter a new password for your account.">
      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <FormError message={formError} />
        <FormField
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          hint={PASSWORD_HINT}
          error={errors.password?.message}
          {...register("password")}
        />
        <FormField
          id="confirm-password"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
