import { useQuery } from "@tanstack/react-query";
import { fetchPeptides, fetchPeptideBySlug, fetchPeptidesWithInteractions, fetchPeptideCount } from "@/services/peptideService";

export function usePeptides() {
  return useQuery({
    queryKey: ["peptides"],
    queryFn: fetchPeptides,
  });
}

export function usePeptideBySlug(slug: string) {
  return useQuery({
    queryKey: ["peptide", slug],
    queryFn: () => fetchPeptideBySlug(slug),
    enabled: !!slug,
  });
}

export function usePeptidesWithInteractions() {
  return useQuery({
    queryKey: ["peptides-interactions"],
    queryFn: fetchPeptidesWithInteractions,
  });
}

export function usePeptideCount() {
  return useQuery({
    queryKey: ["peptides-count"],
    queryFn: fetchPeptideCount,
  });
}
