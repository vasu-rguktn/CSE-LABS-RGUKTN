import { supabase } from "./config";

/**
 * PortalUser — a normalized user shape consumed by all pages/components.
 * Maps Supabase's User fields to the same property names the app already uses
 * (uid, email, displayName, photoURL) so the Navbar, authStore, and pages
 * work without any JSX/logic changes.
 */
export interface PortalUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const DEMO_FACULTY_EMAILS = [
  "krishnasingh@rguktn.ac.in",
  "devi.duvvuri@rguktn.ac.in",
  "uday@rguktn.ac.in",
  "schiranjeevi@rguktn.ac.in",
  "rayalaupendar@rguktn.ac.in",
  "kumaranurupam@rguktn.ac.in",
  "bhanucse@rguktn.ac.in",
  "dsrilakshmi@rguktn.ac.in",
  "nswathi@rguktn.ac.in",
  "padmabai@rguktn.ac.in",
  "sravan.kalapala@rguktn.ac.in",
  "sampathsarnala@rguktn.ac.in",
  "k.lakshmikanth@rguktn.ac.in",
  "jayakrishna0005@rguktn.ac.in",
  "krishnapriyavaliveti@rguktn.ac.in",
  "rama572krishna@rguktn.ac.in",
  "mjblessy.m@rguktn.ac.in",
  "mlr.rao1237@rguktn.ac.in",
  "vasuch9959@rguktn.ac.in",
  "manupatijyothi418@rguktn.ac.in",
  "prathap.motakatla@rguktn.ac.in",
  "kalavathiyarrapati111@rguktn.ac.in"
];

export const isAllowedEmail = (email: string | null): boolean => {
  if (!email) return false;
  // DEMO ONLY: restrict strictly to whitelisted faculty emails
  return DEMO_FACULTY_EMAILS.includes(email);
};

/**
 * signInWithGoogle — triggers a full-page redirect to Google OAuth via Supabase.
 *
 * Unlike the Firebase popup flow, this redirects the browser away. The return
 * value `{ user: null, error: null }` signals "redirect initiated" to the
 * calling page so it shows a loader but doesn't navigate. After the redirect
 * back, the onAuthStateChange listener in App.tsx picks up the session.
 */
export const signInWithGoogle = async (): Promise<{
  user: PortalUser | null;
  error: string | null;
}> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    // Browser is about to redirect — return null, the auth listener handles the rest
    return { user: null, error: null };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return {
      user: null,
      error: error.message ?? "Sign-in failed. Please try again.",
    };
  }
};

export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
};

/**
 * Maps a Supabase auth user to the PortalUser shape the app consumes.
 * Returns null when there's no user or the email domain is invalid.
 */
export const mapSupabaseUser = (
  raw: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null
): PortalUser | null => {
  if (!raw) return null;
  return {
    uid: raw.id,
    email: raw.email ?? null,
    displayName: (raw.user_metadata?.full_name as string) ?? null,
    photoURL: (raw.user_metadata?.avatar_url as string) ?? null,
  };
};
