/**
 * Browser-safe Supabase client — uses the anon public key only.
 *
 * This file is imported by React components and is bundled by Vite.
 * It must NEVER reference the service role key (VITE_SUPABASE_SERVICE_KEY)
 * because Vite would embed it in the public JS bundle.
 *
 * Server-side code (api/index.ts, src/routes/api.ts) should import from
 * ./supabase.server instead to get the admin client that bypasses RLS.
 */
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables")
}

/**
 * Public (anon-key) client — subject to Row-Level Security.
 * Use this in all React components and hooks.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
