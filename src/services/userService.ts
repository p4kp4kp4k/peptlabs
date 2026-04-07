import { supabase } from "@/integrations/supabase/client";
import type { UserProfile, Recommendation } from "@/types";

/** Fetch all profiles (admin) */
export async function fetchAllProfiles(limit = 50): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as UserProfile[];
}

/** Fetch profile count */
export async function fetchProfileCount(): Promise<number> {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

/** Update user profile */
export async function updateProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as UserProfile;
}

/** Save recommendation */
export async function saveRecommendation(rec: {
  user_id: string;
  goals: any;
  recommended_peptides: any;
  notes?: string;
}): Promise<Recommendation> {
  const { data, error } = await supabase
    .from("recommendations")
    .insert(rec)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Recommendation;
}

/** Fetch user recommendations */
export async function fetchUserRecommendations(userId: string): Promise<Recommendation[]> {
  const { data, error } = await supabase
    .from("recommendations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Recommendation[];
}
