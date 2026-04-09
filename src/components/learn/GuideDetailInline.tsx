import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Lock, CheckCircle2, AlertTriangle, Lightbulb, ShieldAlert, ClipboardList, BookOpen, Beaker, Calculator, Calendar, Syringe, Table2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { guides, categoryGradients } from "@/data/peptides";
import { guideContents, GuideContent, GuideStep, GuideSection } from "@/data/guideContent";
import { cn } from "@/lib/utils";
import { useEntitlements } from "@/hooks/useEntitlements";

interface Props {
  slug: string;
}

/* ── Sub-components ── */

function IntroBlock({ intro, videoUrl, title }: { intro: string; videoUrl?: string; title: string }) {
  return (
    <div className="rounded-xl border border-border/30 bg-gradient-to-br from-card to-card/80 p-5 sm:p-6">
      {videoUrl && (
        <div className="mb-5 rounded-lg overflow-hidden aspect-video bg-black/20 ring-1 ring-border/20">
          <iframe src={videoUrl} title={title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Visão Geral</h3>
          <p className="text-[13px] text-muted-foreground leading-[1.8]">{intro}</p>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ section, index }: { section: GuideSection; index: number }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardList className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-bold text-foreground">{section.title}</h3>
      </div>

      {section.items && (
        <ul className="space-y-2.5 ml-1">
          {section.items.map((item, j) => {
            const colonIdx = item.indexOf(":");
            const hasHighlight = colonIdx > 0 && colonIdx < 40;
            return (
              <li key={j} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary mt-1" />
                <span className="text-[12.5px] text-muted-foreground leading-[1.7]">
                  {hasHighlight ? (
                    <>
                      <span className="font-semibold text-foreground">{item.slice(0, colonIdx)}:</span>
                      {item.slice(colonIdx + 1)}
                    </>
                  ) : item}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {section.table && (
        <div className="rounded-lg border border-border/20 overflow-hidden">
          <div className="divide-y divide-border/15">
            {section.table.map((row, j) => (
              <div key={j} className={cn("flex items-start gap-3 px-4 py-2.5", j % 2 === 0 ? "bg-muted/20" : "bg-transparent")}>
                <span className="text-[12px] font-semibold text-primary min-w-[100px] sm:min-w-[140px] shrink-0">{row.label}</span>
                <span className="text-[12px] text-muted-foreground leading-[1.6]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepBlock({ step, index, totalSteps }: { step: GuideStep; index: number; totalSteps: number }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card p-5 sm:p-6 relative overflow-hidden">
      {/* Subtle gradient accent on left */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary/60 via-primary/30 to-transparent" />

      <div className="flex items-start gap-3 mb-4 pl-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15 text-primary text-xs font-bold">
          {index + 1}
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
          <span className="text-[10px] text-muted-foreground/50">Etapa {index + 1} de {totalSteps}</span>
        </div>
      </div>

      <div className="space-y-2.5 pl-2 mb-4">
        {step.content.map((line, j) => {
          const colonIdx = line.indexOf(":");
          const hasHighlight = colonIdx > 0 && colonIdx < 50;
          return (
            <div key={j} className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              </div>
              <p className="text-[12.5px] text-muted-foreground leading-[1.7]">
                {hasHighlight ? (
                  <>
                    <span className="font-semibold text-foreground">{line.slice(0, colonIdx)}:</span>
                    {line.slice(colonIdx + 1)}
                  </>
                ) : line}
              </p>
            </div>
          );
        })}
      </div>

      {step.tip && (
        <div className="flex items-start gap-2.5 rounded-lg bg-primary/5 border border-primary/15 p-3.5 ml-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/15">
            <Lightbulb className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Dica</span>
            <p className="text-[12px] text-primary/80 leading-[1.6] mt-0.5">{step.tip}</p>
          </div>
        </div>
      )}

      {step.warning && (
        <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15 p-3.5 ml-2 mt-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/15">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Atenção</span>
            <p className="text-[12px] text-amber-300/80 leading-[1.6] mt-0.5">{step.warning}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PrecautionsBlock({ precautions }: { precautions: { label: string; value: string }[] }) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/15">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
        </div>
        <h3 className="text-sm font-bold text-foreground">Precauções de Segurança</h3>
      </div>
      <div className="space-y-3">
        {precautions.map((p, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg bg-amber-500/5 border border-amber-500/10 p-3">
            <span className="text-[11px] font-bold text-amber-400 min-w-[100px] shrink-0">{p.label}</span>
            <span className="text-[12px] text-muted-foreground leading-[1.6]">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationsBlock({ recommendations }: { recommendations: { title: string; details: string[] }[] }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card p-5 sm:p-6">
      <h3 className="text-sm font-bold text-foreground mb-4">Canetas Recomendadas</h3>
      <div className="space-y-4">
        {recommendations.map((rec, i) => (
          <div key={i} className="rounded-lg bg-muted/20 border border-border/15 p-3.5">
            <p className="text-[12px] font-semibold text-primary mb-2">{rec.title}</p>
            <ul className="space-y-1.5">
              {rec.details.map((d, j) => (
                <li key={j} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400 mt-0.5" />
                  <span className="text-[11.5px] text-muted-foreground leading-[1.6]">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ── */

export default function GuideDetailInline({ slug }: Props) {
  const navigate = useNavigate();
  const { isPro, isAdmin } = useEntitlements();
  const hasFullAccess = isPro || isAdmin;

  const guide = guides.find((g) => g.slug === slug);

  if (!guide) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Guia não encontrado.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/app/learn")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  if (guide.isPro && !hasFullAccess) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <Lock className="mx-auto mb-4 h-10 w-10 text-amber-400" />
        <h1 className="text-xl font-bold text-foreground mb-2">{guide.title}</h1>
        <p className="text-sm text-muted-foreground mb-6">Este conteúdo é exclusivo para assinantes PRO.</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate("/app/learn")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button onClick={() => navigate("/app/billing")}>Assinar PRO</Button>
        </div>
      </div>
    );
  }

  const content = guideContents[slug];
  const totalSteps = content?.steps?.length || 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="mb-5 text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={() => navigate("/app/learn")}>
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar aos guias
      </Button>

      {/* Hero Header */}
      <div className="rounded-xl border border-border/30 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-7 mb-5 relative overflow-hidden">
        {/* Decorative accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/8 to-transparent rounded-bl-full" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
            <Badge className={cn("border-0 bg-gradient-to-r text-[9px] text-white px-2.5 py-0.5", categoryGradients[guide.category] || "from-primary to-primary")}>
              {guide.category}
            </Badge>
            <div className="flex items-center gap-1 text-muted-foreground/50">
              <Clock className="h-3 w-3" />
              <span className="text-[10px]">{guide.date}</span>
            </div>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {guide.title}
          </h1>
          {guide.description && (
            <p className="text-[12px] text-muted-foreground/70 mt-2 leading-relaxed max-w-xl">{guide.description}</p>
          )}
        </div>
      </div>

      {!content ? (
        <div className="rounded-xl border border-border/30 bg-card p-6 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-primary/40" />
          <p className="text-xs text-muted-foreground">O conteúdo completo deste guia será disponibilizado em breve.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Intro */}
          <IntroBlock intro={content.intro} videoUrl={content.videoUrl} title={guide.title} />

          {/* Table of contents when many steps */}
          {totalSteps >= 5 && (
            <div className="rounded-xl border border-border/20 bg-muted/15 p-4 sm:p-5">
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Índice do Guia</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {content.steps!.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground/70 py-0.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary text-[9px] font-bold">{i + 1}</span>
                    <span className="truncate">{step.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sections */}
          {content.sections?.map((section, i) => (
            <SectionBlock key={i} section={section} index={i} />
          ))}

          {/* Steps */}
          {content.steps?.map((step, i) => (
            <StepBlock key={i} step={step} index={i} totalSteps={totalSteps} />
          ))}

          {/* Precautions */}
          {content.precautions && content.precautions.length > 0 && (
            <PrecautionsBlock precautions={content.precautions} />
          )}

          {/* Recommendations */}
          {content.recommendations && content.recommendations.length > 0 && (
            <RecommendationsBlock recommendations={content.recommendations} />
          )}

          {/* Disclaimer */}
          {content.disclaimer && (
            <div className="rounded-xl border border-border/20 bg-gradient-to-r from-muted/20 to-muted/10 p-4 sm:p-5">
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 shrink-0 text-muted-foreground/50 mt-0.5" />
                <p className="text-[11px] text-muted-foreground/70 leading-[1.7] italic">
                  {content.disclaimer}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
