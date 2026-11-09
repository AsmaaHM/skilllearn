import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthLayout, FormError, FormField, authLinkClass } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  authErrorMessage,
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/auth-validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password · SkillLearn" },
      { name: "description", content: "Request a link to reset your SkillLearn password." },
      { property: "og:title", content: "Reset your password · SkillLearn" },
      { property: "og:description", content: "Get a link to choose a new SkillLearn password." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setFormError(authErrorMessage(error));
      return;
    }
    setSentTo(email);
  });

  const footer = (
    <>
      Remembered it?{" "}
      <Link to="/auth" className={authLinkClass}>
        Back to log in
      </Link>
    </>
  );

  if (sentTo) {
    return (
      <AuthLayout title="Check your email" footer={footer}>
        <div className="flex flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
            <MailCheck className="size-6" />
          </span>
          <p className="mt-4 text-sm">
            If an account exists for <span className="font-semibold">{sentTo}</span>, we've sent a
            link to reset your password.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Open the link to choose a new password. If you don't see it in a few minutes, check
            your spam folder.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter the email you registered with and we'll send you a reset link."
      footer={footer}
    >
      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <FormError message={formError} />
        <FormField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthLayout>
  );
}
