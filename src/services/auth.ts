import { supabase, supabaseUrl, supabaseAnonKey } from "../lib/supabase";
import type { User } from "../lib/types";
import { setSession, clearSession } from "../lib/session";

const FUNCTIONS_URL = `${supabaseUrl}/functions/v1`;

/** Get current Supabase Auth JWT token */
async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

/** Helper: call Edge Function with JWT */
async function callEdgeFunction<T>(name: string, body: Record<string, unknown>, tokenOverride?: string): Promise<T> {
  const token = tokenOverride || await getAuthToken();
  if (!token) {
    throw new Error("認証トークンが取得できませんでした");
  }
  const anonKey = supabaseAnonKey;
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": anonKey,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Edge Function ${name} failed`);
  }
  return data as T;
}

// ── Anonymous Auth (子供) ──

export async function signInAnonymously() {
  return supabase.auth.signInAnonymously();
}

export async function createChildAccount(nickname: string, pin: string, token?: string, icon?: string) {
  return callEdgeFunction<{
    familyId: string;
    familyName: string;
    userId: string;
    walletId: string;
    inviteWords: string[];
    backupWords: string[];
  }>("create-child-account", { nickname, pin, icon }, token);
}

// ── Email Auth (親) ──

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  await supabase.auth.signOut();
  await clearSession();
}

// ── PIN ──

export async function verifyPin(userId: string, pin: string) {
  return callEdgeFunction<{
    valid: boolean;
    userId: string;
    familyId: string;
    name: string;
    role: string;
    authId: string;
  }>("verify-pin", { userId, pin });
}

// ── Family Join ──

export async function joinFamilyByToken(token: string, name: string, icon?: string) {
  return callEdgeFunction<{
    familyId: string;
    familyName: string;
    userId: string;
    role: string;
  }>("join-family", { token, name, icon });
}

export async function joinFamilyByWords(words: string[], name: string, icon?: string) {
  return callEdgeFunction<{
    familyId: string;
    familyName: string;
    userId: string;
    role: string;
  }>("join-family-by-words", { words, name, icon });
}

// ── Account Recovery ──

export async function recoverAccount(backupWords: string[], newPin: string, token?: string) {
  return callEdgeFunction<{
    familyId: string;
    familyName: string;
    userId: string;
    userName: string;
    role: string;
  }>("recover-account", { backupWords, newPin }, token);
}

// ── Session ──

export async function loginAsUser(
  user: Pick<User, "id" | "role" | "name">,
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
