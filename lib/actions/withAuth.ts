import { createClient } from "../supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Authenticate the current request, then run fn with the supabase client and user id. */
export async function withAuth<T>(
  fn: (supabase: SupabaseServerClient, userId: string) => Promise<T>
): Promise<T> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return fn(supabase, user.id);
}
