import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "@/lib/env";

let client: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (client) {
    return client;
  }

  const config = requireSupabaseConfig();
  client = createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}
