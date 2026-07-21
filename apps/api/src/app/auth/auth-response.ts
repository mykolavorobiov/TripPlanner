import type { Session } from '@supabase/supabase-js';

export function publicSession(session: Session | null) {
  if (!session) return null;
  return {
    access_token: session.access_token,
    expires_at: session.expires_at,
    user: session.user,
  };
}
