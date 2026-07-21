import type { User } from '@supabase/supabase-js';

export const OWNER_EMAILS = ['rominab24@gmail.com'];

export function isOwner(user: User | null | undefined): boolean {
  const email = user?.email?.toLowerCase().trim();
  if (!email) return false;
  return OWNER_EMAILS.map((e) => e.toLowerCase()).includes(email);
}
