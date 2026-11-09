import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthLayout, FormError, FormField, authLinkClass } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { redirectIfSignedIn } from "@/lib/auth";
import {
  PASSWORD_HINT,
  authErrorMessage,
  registerSchema,
  type RegisterValues,
} from "@/lib/auth-validation";

export const Route = createFileRoute("/register")({
  ssr: false,
  beforeLoad: redirectIfSignedIn,
  head: () => ({
    meta: [
      { title: "Create your account · SkillLearn" },
      { name: "description", content: "Create a SkillLearn account to organize the skills you want to learn." },
      { property: "og:title", content: "Create your account · SkillLearn" },
      { property: "og:description", content: "Start organizing your skills and tracking progress." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async ({ displayName, email, password }) => {
    setFormError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // After the verification link is opened, Login forwards the now-verified user to the Dashboard.
        emailRedirectTo: `${window.location.origin}/auth`,
        // Read by the existing profile trigger to set the profile's display name.
        data: { display_name: displayName },
      },
    });
    if (error) {
      setFormError(authErrorMessage(error));
      return;
    }
    if (data.session) {
      // Only happens if email verification is switched off for the project.
      navigate({ to: "/", replace: true });
      return;
    }
    setSentTo(email);
  });

  if (sentTo) {
    return (
      <AuthLayout
        title="Check your email"
        footer={
          <Link to="/auth" className={authLinkClass}>
            Back to log in
          </Link>
        }
      >
        <div className="flex flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
            <MailCheck className="size-6" />
          </span>
          <p className="mt-4 text-sm">
            We sent a verification link to <span className="font-semibold">{sentTo}</span>.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Open the link to verify your email, then log in. If you don't see it in a few minutes,
            check your spam folder.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      description="Organize the skills you want to learn and track your progress."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/auth" className={authLinkClass}>
            Log in
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <FormError message={formError} />
        <FormField
          id="display-name"
          label="Display name"
          autoComplete="name"
          error={errors.displayName?.message}
          {...register("displayName")}
        />
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
          autoComplete="new-password"
          hint={PASSWORD_HINT}
          error={errors.password?.message}
          {...register("password")}
        />
        <FormField
          id="confirm-password"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Register"}
        </Button>
      </form>
    </AuthLayout>
  );
}
