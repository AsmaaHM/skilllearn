import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthLayout, FormError, FormField, authLinkClass } from "@/components/auth-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { redirectIfSignedIn } from "@/lib/auth";
import { authErrorMessage, loginSchema, type LoginValues } from "@/lib/auth-validation";

interface LoginSearch {
  notice?: "password-reset";
}

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): LoginSearch =>
    search["notice"] === "password-reset" ? { notice: "password-reset" } : {},
  beforeLoad: redirectIfSignedIn,
  head: () => ({
    meta: [
      { title: "Log in · SkillLearn" },
      { name: "description", content: "Log in to SkillLearn to track the skills you're learning." },
      { property: "og:title", content: "Log in · SkillLearn" },
      { property: "og:description", content: "Log in to keep track of your learning progress." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { notice } = Route.useSearch();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setFormError(authErrorMessage(error));
      return;
    }
    navigate({ to: "/", replace: true });
  });

  return (
    <AuthLayout
      title="Log in"
      description="Welcome back. Pick up where you left off."
      footer={
        <>
          New to SkillLearn?{" "}
          <Link to="/register" className={authLinkClass}>
            Create an account
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={onSubmit} className="space-y-4">
        {notice === "password-reset" && !formError && (
          <Alert className="border-status-done/40 bg-status-done-soft text-status-done-foreground">
            <CheckCircle2 className="size-4 !text-status-done" />
            <AlertDescription>Your password was updated. Log in with your new password.</AlertDescription>
          </Alert>
        )}
        <FormError message={formError} />
        <FormField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          labelAction={
            <Link to="/forgot-password" className={`text-xs ${authLinkClass}`}>
              Forgot password?
            </Link>
          }
          {...register("password")}
        />
        <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
