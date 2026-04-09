import { supabase } from "@/integrations/supabase/client";
import type { Protocol, ProtocolHistoryEntry } from "@/types";

/** Fetch user's protocols */
export async function fetchUserProtocols(userId: string): Promise<Protocol[]> {
  const { data, error } = await supabase
    .from("protocols")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Protocol[];
}

/** Create protocol */
export async function createProtocol(protocol: {
  user_id: string;
  name: string;
  description?: string;
  peptides?: any[];
  status?: string;
}): Promise<Protocol> {
  const { data, error } = await supabase
    .from("protocols")
    .insert({
      ...protocol,
      peptides: protocol.peptides ?? [],
      status: protocol.status ?? "draft",
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Protocol;
}

/** Update protocol */
export async function updateProtocol(id: string, updates: Partial<Protocol>) {
  const { data, error } = await supabase
    .from("protocols")
    .update(updates as any)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Protocol;
}

/** Soft delete protocol (archive) */
export async function deleteProtocol(id: string) {
  const { error } = await supabase
    .from("protocols")
    .update({ deleted_at: new Date().toISOString() } as any)
    .eq("id", id);
  if (error) throw error;
}

/** Restore soft-deleted protocol */
export async function restoreProtocol(id: string) {
  const { error } = await supabase
    .from("protocols")
    .update({ deleted_at: null } as any)
    .eq("id", id);
  if (error) throw error;
}

/** Fetch protocol count for user */
export async function fetchUserProtocolCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("protocols")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

/** Log protocol action */
export async function logProtocolAction(entry: {
  protocol_id: string;
  user_id: string;
  action: string;
  details?: any;
}) {
  const { error } = await supabase.from("protocol_history").insert(entry);
  if (error) throw error;
}

/** Fetch protocol history */
export async function fetchProtocolHistory(protocolId: string): Promise<ProtocolHistoryEntry[]> {
  const { data, error } = await supabase
    .from("protocol_history")
    .select("*")
    .eq("protocol_id", protocolId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ProtocolHistoryEntry[];
}
