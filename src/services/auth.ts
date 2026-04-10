import { supabase } from "../lib/supabase";
import type { User } from "../lib/types";
import { setSession, clearSession } from "../lib/session";

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  await supabase.auth.signOut();
  await clearSession();
}

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const { data } = await supabase.rpc("verify_pin", {
    p_user_id: userId,
    p_pin: pin,
  });
  return !!data;
}

export async function loginAsUser(
  user: User,
  familyId: string,
  authId?: string
) {
  await setSession({
    userId: user.id,
    familyId,
    role: user.role,
    name: user.name,
    authId,
  });
}
