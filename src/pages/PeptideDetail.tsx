import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Syringe, BookOpen, GitMerge } from "lucide-react";
import PeptideHero from "@/components/peptide/PeptideHero";
import PeptideSidebar from "@/components/peptide/PeptideSidebar";
import OverviewTab from "@/components/peptide/OverviewTab";
import ProtocolsTab from "@/components/peptide/ProtocolsTab";
import ResearchTab from "@/components/peptide/ResearchTab";
import SynergyTab from "@/components/peptide/SynergyTab";

export default function PeptideDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: peptide, isLoading } = useQuery({
    queryKey: ["peptide", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("peptides")
        .select("*")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!peptide) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center flex-col gap-3">
        <p className="text-sm text-muted-foreground">Peptídeo não encontrado.</p>
        <button onClick={() => navigate("/library")} className="text-xs text-primary hover:underline">
          Voltar à Biblioteca
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Hero Banner */}
      <PeptideHero
        name={peptide.name}
        category={peptide.category}
        classification={peptide.classification}
        description={peptide.description}
        evidence_level={peptide.evidence_level}
        alternative_names={peptide.alternative_names}
      />

      {/* Two-column layout: Main + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* Main content with tabs */}
        <div>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-card border border-border/30 w-full justify-start gap-0.5 h-auto flex-wrap p-1">
              <TabsTrigger value="overview" className="text-xs gap-1.5 data-[state=active]:bg-foreground data-[state=active]:text-background font-medium">
                <Zap className="h-3 w-3" /> Visão Geral
              </TabsTrigger>
              <TabsTrigger value="protocols" className="text-xs gap-1.5 data-[state=active]:bg-foreground data-[state=active]:text-background font-medium">
                <Syringe className="h-3 w-3" /> Protocolos
              </TabsTrigger>
              <TabsTrigger value="research" className="text-xs gap-1.5 data-[state=active]:bg-foreground data-[state=active]:text-background font-medium">
                <BookOpen className="h-3 w-3" /> Pesquisa
              </TabsTrigger>
              <TabsTrigger value="synergy" className="text-xs gap-1.5 data-[state=active]:bg-foreground data-[state=active]:text-background font-medium">
                <GitMerge className="h-3 w-3" /> Sinergia
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <OverviewTab
                name={peptide.name}
                mechanism={peptide.mechanism}
                mechanism_points={peptide.mechanism_points}
                benefits={peptide.benefits}
                side_effects={peptide.side_effects}
                timeline={peptide.timeline}
              />
            </TabsContent>

            <TabsContent value="protocols" className="mt-4">
              <ProtocolsTab
                dosage_info={peptide.dosage_info}
                dosage_table={peptide.dosage_table}
                protocol_phases={peptide.protocol_phases}
                reconstitution={peptide.reconstitution}
                reconstitution_steps={peptide.reconstitution_steps}
                half_life={peptide.half_life}
              />
            </TabsContent>

            <TabsContent value="research" className="mt-4">
              <ResearchTab
                mechanism={peptide.mechanism}
                mechanism_points={peptide.mechanism_points}
                evidence_level={peptide.evidence_level}
                scientific_references={peptide.scientific_references}
              />
            </TabsContent>

            <TabsContent value="synergy" className="mt-4">
              <SynergyTab
                interactions={peptide.interactions}
                stacks={peptide.stacks}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <aside className="order-first lg:order-last">
          <div className="lg:sticky lg:top-4">
            <PeptideSidebar
              classification={peptide.classification}
              evidence_level={peptide.evidence_level}
              half_life={peptide.half_life}
              reconstitution={peptide.reconstitution}
              alternative_names={peptide.alternative_names}
              category={peptide.category}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
