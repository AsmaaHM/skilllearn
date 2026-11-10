import { z } from "zod";

// Password rule shown to users at registration and password reset.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters, including a letter and a number.`;

const emailField = z
  .string()
  .trim()
  .min(1, { message: "Enter your email address." })
  .max(255, { message: "Email must be 255 characters or fewer." })
  .email({ message: "Enter a valid email address." });

const newPasswordField = z
  .string()
  .min(1, { message: "Enter a password." })
  .min(PASSWORD_MIN_LENGTH, { message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` })
  .max(PASSWORD_MAX_LENGTH, { message: `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.` })
  .regex(/[A-Za-z]/, { message: "Password must include at least one letter." })
  .regex(/\d/, { message: "Password must include at least one number." });

const confirmField = z.string().min(1, { message: "Confirm your password." });

const passwordsMatch = (v: { password: string; confirmPassword: string }) =>
  v.password === v.confirmPassword;
const mismatch = { message: "Passwords don't match.", path: ["confirmPassword"] };

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, { message: "Enter your display name." })
      .max(50, { message: "Display name must be 50 characters or fewer." }),
    email: emailField,
    password: newPasswordField,
    confirmPassword: confirmField,
  })
  .refine(passwordsMatch, mismatch);

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { message: "Enter your password." }),
});

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({ password: newPasswordField, confirmPassword: confirmField })
  .refine(passwordsMatch, mismatch);

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

/** Turns an auth error into a message a learner can act on. */
export function authErrorMessage(error: { code?: string | undefined; message?: string | undefined } | null | undefined): string {
  switch (error?.code) {
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "email_not_confirmed":
      return "Your email isn't verified yet. Open the verification link we emailed you, then log in.";
    case "over_email_send_rate_limit":
      return "Too many emails have been sent recently. Please wait a while and try again.";
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a moment and try again.";
    case "weak_password":
      return "That password is too easy to guess. Choose a stronger one.";
    case "same_password":
      return "Your new password must be different from your current one.";
    case "email_address_invalid":
      return "Enter a valid email address.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try logging in instead.";
    case "signup_disabled":
      return "New registrations are currently closed.";
    default:
      return "Something went wrong. Please try again.";
  }
}
