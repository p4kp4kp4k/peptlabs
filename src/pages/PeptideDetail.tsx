import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Beaker, BookOpen, GitMerge, Syringe } from "lucide-react";
import PeptideHeader from "@/components/peptide/PeptideHeader";
import QuickFacts from "@/components/peptide/QuickFacts";
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
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
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
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <PeptideHeader
        name={peptide.name}
        category={peptide.category}
        classification={peptide.classification}
        description={peptide.description}
        alternative_names={peptide.alternative_names}
      />

      <QuickFacts
        classification={peptide.classification}
        evidence_level={peptide.evidence_level}
        half_life={peptide.half_life}
        reconstitution={peptide.reconstitution}
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-secondary/50 w-full justify-start gap-0.5 flex-wrap h-auto">
          <TabsTrigger value="overview" className="text-xs gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Zap className="h-3 w-3" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="protocols" className="text-xs gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Syringe className="h-3 w-3" /> Protocolos
          </TabsTrigger>
          <TabsTrigger value="research" className="text-xs gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <BookOpen className="h-3 w-3" /> Pesquisa
          </TabsTrigger>
          <TabsTrigger value="synergy" className="text-xs gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <GitMerge className="h-3 w-3" /> Sinergia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <OverviewTab
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
  );
}
