import { queryOptions, useQuery, type QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export interface CurrentProfile {
  id: string;
  email: string;
  displayName: string;
}

// The signed-in user's profile row (row-level security limits it to their own).
export const currentProfileQuery = queryOptions({
  queryKey: ["current-profile"],
  queryFn: async (): Promise<CurrentProfile | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;

    return {
      id: user.id,
      email: user.email ?? "",
      displayName: data?.display_name ?? user.email?.split("@")[0] ?? "Learner",
    };
  },
  staleTime: 5 * 60 * 1000,
});

/** Saves a new display name to the signed-in user's own profile row. Returns the saved name. */
export async function updateDisplayName(displayName: string): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw { code: "PGRST301", message: "Not signed in" };
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", session.user.id)
    .select("display_name")
    .single();
  if (error) throw error;
  return data.display_name;
}

/** Turns a failed profile save into a short message people can act on. */
export function describeProfileError(error: unknown): string {
  const e = (error ?? {}) as { code?: string; message?: string };
  const msg = e.message ?? "";
  if (/failed to fetch|network|load failed/i.test(msg)) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (e.code === "PGRST301" || /jwt|not signed in/i.test(msg)) return "Your session has ended. Sign in again to continue.";
  if (e.code === "PGRST116") return "Your profile couldn't be found. Sign out and back in, then try again.";
  return "Your name couldn't be saved. Please try again.";
}

export function useCurrentProfile() {
  return useQuery(currentProfileQuery);
}

/** For Login and Registration: send already signed-in users to the Dashboard. */
export async function redirectIfSignedIn() {
  redirectRecoveryLink();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    // Stored session is no longer valid (expired or revoked): clear it and stay here.
    await supabase.auth.signOut({ scope: "local" });
    return;
  }
  throw redirect({ to: "/" });
}

/** Ends the session everywhere, drops cached data, and returns to Login. */
export async function signOutToLogin(
  queryClient: QueryClient,
  navigate: (opts: { to: "/auth"; replace: true }) => unknown,
) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
  navigate({ to: "/auth", replace: true });
}

export type AuthLinkHash = "recovery" | "error" | "none";

/**
 * Reads what an email link put after "#" in the address. A password-reset link
 * carries the sign-in details plus `type=recovery`; a used or expired link carries `error`.
 */
export function readAuthLinkHash(hash: string): AuthLinkHash {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (params.has("error") || params.has("error_code")) return "error";
  if (params.get("type") === "recovery" && params.has("access_token")) return "recovery";
  return "none";
}

// Remembers, for this tab only, that the current session came from a reset link,
// so a refresh of the reset page still shows the form. Sign-in tokens never say so themselves.
const RECOVERY_FLAG = "skilllearn:password-recovery";

export function markRecoveryPending() {
  try {
    sessionStorage.setItem(RECOVERY_FLAG, "1");
  } catch {
    /* storage blocked: the form still works for this page load */
  }
}

export function isRecoveryPending(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_FLAG) === "1";
  } catch {
    return false;
  }
}

export function clearRecoveryPending() {
  try {
    sessionStorage.removeItem(RECOVERY_FLAG);
  } catch {
    /* nothing to clear */
  }
}

/**
 * For any screen a reset link might land on (e.g. the home page when the link falls back
 * to the site address): send it to the reset page with the link details intact, before
 * anything else signs the visitor in and lets the guard route them elsewhere.
 */
export function redirectRecoveryLink() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/reset-password") return;
  if (readAuthLinkHash(window.location.hash) !== "recovery") return;
  markRecoveryPending();
  throw redirect({ to: "/reset-password", hash: window.location.hash.slice(1) });
}
