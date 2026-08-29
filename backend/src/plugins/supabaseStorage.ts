import { createClient } from "@supabase/supabase-js";
import { env } from "../utils/env.js";

// Service-role client for server-side uploads only — never expose this
// key to the frontend. Bypasses RLS, which is fine since only this
// backend (behind the admin auth check) ever calls it.
export const supabaseStorage = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export const STORAGE_BUCKET = env.SUPABASE_STORAGE_BUCKET;