import { createClient } from "@supabase/supabase-js"

function getEnvVar(name: string): string {
  if (typeof process !== "undefined" && process.env?.[name]) {
    return process.env[name]!;
  }
  if (typeof import.meta !== "undefined") {
    const viteEnv = (import.meta as Record<string, any>).env;
    if (viteEnv?.[name]) return viteEnv[name];
  }
  throw new Error(`Missing environment variable: ${name}`);
}

const SUPABASE_URL = getEnvVar("VITE_SUPABASE_URL");
const SUPABASE_PUBLIC_KEY = getEnvVar("VITE_SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_KEY = getEnvVar("VITE_SUPABASE_SERVICE_KEY");

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
