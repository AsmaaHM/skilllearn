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

export function useCurrentProfile() {
  return useQuery(currentProfileQuery);
}

/** For Login and Registration: send already signed-in users to the Dashboard. */
export async function redirectIfSignedIn() {
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

/** True when the session came from a password-reset email link. */
export function isRecoverySession(accessToken: string | undefined): boolean {
  if (!accessToken) return false;
  try {
    const payload = accessToken.split(".")[1] ?? "";
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    const amr: unknown = json?.amr;
    return Array.isArray(amr) && amr.some((entry) => entry?.method === "recovery");
  } catch {
    return false;
  }
}
