import { supabase } from "@/integrations/supabase/client";
import type { Stack } from "@/types";

/** Fetch all stacks */
export async function fetchStacks(): Promise<Stack[]> {
  const { data, error } = await supabase
    .from("stacks")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Stack[];
}

/** Fetch stack count */
export async function fetchStackCount(): Promise<number> {
  const { count, error } = await supabase
    .from("stacks")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

/** Admin: create stack */
export async function createStack(stack: Partial<Stack> & { name: string; category: string }) {
  const { data, error } = await supabase.from("stacks").insert({
    ...stack,
    peptides: (stack.peptides ?? []) as any,
  } as any).select().single();
  if (error) throw error;
  return data;
}

/** Admin: update stack */
export async function updateStack(id: string, updates: Partial<Stack>) {
  const { data, error } = await supabase.from("stacks").update(updates as any).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

/** Admin: delete stack */
export async function deleteStack(id: string) {
  const { error } = await supabase.from("stacks").delete().eq("id", id);
  if (error) throw error;
}
