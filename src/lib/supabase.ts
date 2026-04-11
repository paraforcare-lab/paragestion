import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://emqngbghtririfhnruxc.supabase.co";
const SUPABASE_PUBLIC_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcW5nYmdodHJpcmlmaG5ydXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5OTg0MDcsImV4cCI6MjA5MDU3NDQwN30.rIdX07fhjHIxDRSHMScARtRNrMJ7CusRSFgwrkKAjiI";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcW5nYmdodHJpcmlmaG5ydXhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk5ODQwNywiZXhwIjoyMDkwNTc0NDA3fQ.P8RMebspFwOZmC3VNr5FKDUFgm-4aMqLWRvpEPWfMiE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
