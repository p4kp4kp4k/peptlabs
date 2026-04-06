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
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
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
    <div className="p-3 sm:p-4 space-y-3 max-w-5xl mx-auto">
      {/* Hero Banner */}
      <PeptideHero
        name={peptide.name}
        category={peptide.category}
        classification={peptide.classification}
        description={peptide.description}
        evidence_level={peptide.evidence_level}
        alternative_names={peptide.alternative_names}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4 items-start">
        {/* Main content */}
        <div>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-card/80 border border-border/25 w-full justify-start gap-0.5 h-auto flex-wrap p-0.5 rounded-lg">
              {[
                { value: "overview", icon: Zap, label: "Visão Geral" },
                { value: "protocols", icon: Syringe, label: "Protocolos" },
                { value: "research", icon: BookOpen, label: "Pesquisa" },
                { value: "synergy", icon: GitMerge, label: "Sinergia" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-[11px] gap-1 font-semibold rounded-md px-2.5 py-1.5 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm transition-all"
                >
                  <tab.icon className="h-2.5 w-2.5" /> {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-3">
              <OverviewTab
                name={peptide.name}
                mechanism={peptide.mechanism}
                mechanism_points={peptide.mechanism_points}
                benefits={peptide.benefits}
                side_effects={peptide.side_effects}
                timeline={peptide.timeline}
              />
            </TabsContent>

            <TabsContent value="protocols" className="mt-3">
              <ProtocolsTab
                dosage_info={peptide.dosage_info}
                dosage_table={peptide.dosage_table}
                protocol_phases={peptide.protocol_phases}
                reconstitution={peptide.reconstitution}
                reconstitution_steps={peptide.reconstitution_steps}
                half_life={peptide.half_life}
              />
            </TabsContent>

            <TabsContent value="research" className="mt-3">
              <ResearchTab
                mechanism={peptide.mechanism}
                mechanism_points={peptide.mechanism_points}
                evidence_level={peptide.evidence_level}
                scientific_references={peptide.scientific_references}
              />
            </TabsContent>

            <TabsContent value="synergy" className="mt-3">
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
