import { getSupabaseAdminClient } from "@/lib/supabase";

interface PostThreadViewRow {
  view_count: number | null;
}

function parseViewCount(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function getPostViewCount(canonicalSlug: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("post_threads")
    .select("view_count")
    .eq("canonical_slug", canonicalSlug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return parseViewCount((data as PostThreadViewRow | null)?.view_count);
}

export async function incrementPostViewCount(canonicalSlug: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("increment_post_view_count", {
    input_canonical_slug: canonicalSlug,
  });

  if (error) {
    throw new Error(error.message);
  }

  return parseViewCount(data as number | string | null);
}
