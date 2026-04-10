import { useState } from "react";
import PremiumGateModal from "@/components/PremiumGateModal";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  FileText, Lock, Crown, Clock, Beaker, ChevronRight,
  Shield, Brain, Flame, Heart, Moon, Dumbbell, Filter,
} from "lucide-react";
import ProBadge from "@/components/ProBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlements } from "@/hooks/useEntitlements";
import UsageBadge from "@/components/UsageBadge";

interface TemplatePeptide {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
}

interface TemplateContent {
  peptides: TemplatePeptide[];
  notes?: string;
}

interface Template {
  id: string;
  title: string;
  description: string | null;
  content: TemplateContent;
  access_level: string;
  category: string | null;
}

const CATEGORY_ICONS: Record<string, typeof Beaker> = {
  "Recuperação": Dumbbell,
  "GH / Secretagogos": Crown,
  "Imunidade": Shield,
  "Emagrecimento": Flame,
  "Anti-aging": Heart,
  "Sono / Recuperação": Moon,
  "Nootrópicos": Brain,
};

const TABS = ["Todos", "PRO"] as const;

export default function Templates() {
  const navigate = useNavigate();
  const { plan, isActive: planActive, isPro, isAdmin } = useEntitlements();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("Todos");
  const [gateOpen, setGateOpen] = useState(false);
  const [gateReason, setGateReason] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["protocol-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocol_templates")
        .select("*")
        .order("access_level")
        .order("title");
      if (error) throw error;
      return (data ?? []) as unknown as Template[];
    },
  });

  const filtered = activeTab === "Todos"
    ? templates
    : templates.filter((t) => t.access_level === "pro");

  const canAccess = (level: string) => {
    if (isAdmin) return true;
    if (level === "pro") return isPro && planActive;
    // starter-level templates are accessible to any PRO user
    if (level === "starter") return isPro && planActive;
    return false;
  };

  const handleUseTemplate = (template: Template) => {
    if (!canAccess(template.access_level)) {
      setGateReason("Este template é exclusivo do plano PRO.");
      setGateOpen(true);
      return;
    }
    navigate("/app/finder", { state: { template: template.content } });
  };

  const Icon = ({ category }: { category: string | null }) => {
    const Ic = CATEGORY_ICONS[category ?? ""] ?? Beaker;
    return <Ic className="h-4 w-4" />;
  };

  return (
    <>
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Templates de Protocolo
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Protocolos prontos para usar. Escolha um template e personalize.
        </p>
        <UsageBadge feature="template" className="mt-1" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <Button
            key={tab}
            size="sm"
            variant={activeTab === tab ? "default" : "outline"}
            className="text-xs h-8"
            onClick={() => setActiveTab(tab)}
          >
            {tab === "PRO" && <Crown className="h-3 w-3 mr-1" />}
            {tab === "Todos" && <Filter className="h-3 w-3 mr-1" />}
            {tab}
            <Badge variant="secondary" className="ml-1.5 text-[9px] px-1.5 py-0">
              {tab === "Todos"
                ? templates.length
                : templates.filter((t) => t.access_level === "pro").length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-border/40 animate-pulse">
              <CardContent className="p-5 h-48" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => {
            const locked = !canAccess(template.access_level);
            const peptides = template.content?.peptides ?? [];

            return (
              <Card
                key={template.id}
                className={`relative overflow-hidden border transition-all hover:shadow-md group cursor-pointer ${
                  locked ? "opacity-80" : ""
                } border-border/40`}
                onClick={() => handleUseTemplate(template)}
              >
                {/* Plan badge */}
                <div className="absolute top-3 right-3">
                  <ProBadge />
                </div>

                {/* Lock overlay */}
                {locked && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                    <Lock className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground font-medium">
                      Exclusivo PRO
                    </p>
                    <Button
                      size="sm"
                      className="mt-3 text-[10px] h-7 gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTemplate(template);
                      }}
                    >
                      <Crown className="h-3 w-3" /> Fazer Upgrade
                    </Button>
                  </div>
                )}

                <CardContent className="p-5">
                  {/* Category + icon */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon category={template.category} />
                    </div>
                    {template.category && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {template.category}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-1">
                    {template.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Peptides preview */}
                  <div className="space-y-1.5 mb-3">
                    {peptides.slice(0, 3).map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-[10px] px-2 py-1 rounded-md bg-muted/50"
                      >
                        <span className="font-medium text-foreground">{p.name}</span>
                        <span className="text-muted-foreground">{p.dose}</span>
                      </div>
                    ))}
                    {peptides.length > 3 && (
                      <p className="text-[9px] text-muted-foreground text-center">
                        +{peptides.length - 3} peptídeo(s)
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {peptides[0]?.duration ?? "—"}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-primary font-medium group-hover:underline">
                      Usar template <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum template encontrado.</p>
        </div>
      )}

      <PremiumGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        reason={gateReason}
        upgradeTo="pro"
      />
    </div>
    </>
  );
}