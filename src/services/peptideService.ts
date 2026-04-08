import { supabase } from "@/integrations/supabase/client";
import type { Peptide, PeptideListItem, PeptideWithInteractions, NormalizedInteraction } from "@/types";
import type { Json } from "@/integrations/supabase/types";

/** Fetch all peptides (lightweight list) */
export async function fetchPeptides(): Promise<PeptideListItem[]> {
  const { data, error } = await supabase
    .from("peptides")
    .select("id, name, slug, category, description, benefits")
    .order("name");
  if (error) throw error;
  return (data ?? []) as PeptideListItem[];
}

/** Fetch single peptide by slug (full detail) */
export async function fetchPeptideBySlug(slug: string): Promise<Peptide | null> {
  const { data, error } = await supabase
    .from("peptides")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }
  return data as unknown as Peptide;
}

/** Fetch all peptides with interactions */
export async function fetchPeptidesWithInteractions(): Promise<PeptideWithInteractions[]> {
  const { data, error } = await supabase
    .from("peptides")
    .select("name, slug, category, interactions")
    .not("interactions", "is", null);
  if (error) throw error;

  return (data ?? [])
    .map((p) => ({
      name: p.name,
      slug: p.slug,
      category: p.category,
      interactions: normalizeInteractions(p.interactions),
    }))
    .filter((p) => p.interactions.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Fetch peptide count */
export async function fetchPeptideCount(): Promise<number> {
  const { count, error } = await supabase
    .from("peptides")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

/** Admin: create peptide */
export async function createPeptide(peptide: Partial<Peptide> & { name: string; slug: string; category: string }) {
  const { data, error } = await supabase.from("peptides").insert(peptide as any).select().single();
  if (error) throw error;
  return data;
}

/** Admin: update peptide */
export async function updatePeptide(id: string, updates: Partial<Peptide>) {
  const { data, error } = await supabase.from("peptides").update(updates as any).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

/** Admin: delete peptide */
export async function deletePeptide(id: string) {
  const { error } = await supabase.from("peptides").delete().eq("id", id);
  if (error) throw error;
}

// ── Helpers ──

function normalizeInteractions(data: Json | null): NormalizedInteraction[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return (data as any[]).map((item) => ({
      nome: item.peptideo || item.nome || "",
      status: (item.tipo || item.status || "").toUpperCase(),
      descricao: item.descricao || "",
      mecanismo: item.mecanismo || undefined,
      consequencias: item.consequencias || undefined,
      fonte: item.fonte || undefined,
    }));
  }
  const old = data as any;
  return [
    ...(old.peptideos || []).map((i: any) => ({
      nome: i.nome || "",
      status: (i.status || "").toUpperCase(),
      descricao: i.descricao || "",
      mecanismo: i.mecanismo || undefined,
      consequencias: i.consequencias || undefined,
      fonte: i.fonte || undefined,
    })),
    ...(old.outras_substancias || []).map((i: any) => ({
      nome: i.nome || "",
      status: (i.status || "").toUpperCase(),
      descricao: i.descricao || "",
      mecanismo: i.mecanismo || undefined,
      consequencias: i.consequencias || undefined,
      fonte: i.fonte || undefined,
    })),
  ];
}
