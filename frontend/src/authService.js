import { supabase } from './supabaseClient';

// Email/Password Sign-Up
export async function signUpWithEmail(email, password) {
  return await supabase.auth.signUp({ email, password });
}

// Email/Password Sign-In
export async function signInWithEmail(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

// Social Logins (Google, GitHub)
export async function signInWithProvider(providerName) {
  return await supabase.auth.signInWithOAuth({ provider: providerName });
}

// Sign Out
export async function signOut() {
  return await supabase.auth.signOut();
}