import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, BookOpen, Lock, CheckCircle2, AlertTriangle, Lightbulb, ShieldAlert, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { guides, categoryGradients } from "@/data/peptides";
import { guideContents } from "@/data/guideContent";
import { cn } from "@/lib/utils";
import { useEntitlements } from "@/hooks/useEntitlements";

export default function GuideDetail() {
  const { slug } = useParams<{ slug: string }>();
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

  const content = slug ? guideContents[slug] : undefined;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-6 text-xs text-muted-foreground" onClick={() => navigate("/app/learn")}>
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar aos Guias
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge className={cn("border-0 bg-gradient-to-r text-[9px] text-white", categoryGradients[guide.category] || "from-primary to-primary")}>
            {guide.category}
          </Badge>
          <div className="flex items-center gap-1 text-muted-foreground/60">
            <Clock className="h-3 w-3" />
            <span className="text-[10px]">{guide.date}</span>
          </div>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {guide.title}
        </h1>
      </div>

      {!content ? (
        <div className="rounded-xl border border-border/30 bg-card p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Conteúdo do Guia</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            O conteúdo completo deste guia será disponibilizado em breve.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Intro */}
          <div className="rounded-xl border border-border/30 bg-card p-5">
            <p className="text-sm text-muted-foreground leading-relaxed">{content.intro}</p>
          </div>

          {/* Sections (materials, etc) */}
          {content.sections?.map((section, i) => (
            <div key={i} className="rounded-xl border border-border/30 bg-card p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <ClipboardList className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              </div>
              {section.items && (
                <ul className="space-y-1.5 ml-1">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                      <span className="text-xs text-muted-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.table && (
                <div className="space-y-1.5 ml-1">
                  {section.table.map((row, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span className="text-xs font-medium text-foreground min-w-[80px]">{row.label}:</span>
                      <span className="text-xs text-muted-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Steps */}
          {content.steps?.map((step, i) => (
            <div key={i} className="rounded-xl border border-border/30 bg-card p-5">
              <div className="flex items-start gap-2.5 mb-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-bold">
                  {i + 1}
                </div>
                <h3 className="text-sm font-semibold text-foreground pt-0.5">{step.title}</h3>
              </div>

              <ul className="space-y-1.5 ml-1 mb-3">
                {step.content.map((line, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
                    <span className="text-xs text-muted-foreground leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>

              {step.tip && (
                <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <Lightbulb className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                  <span className="text-[11px] text-primary leading-relaxed">{step.tip}</span>
                </div>
              )}

              {step.warning && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/5 border border-amber-500/15 p-3 mt-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                  <span className="text-[11px] text-amber-300 leading-relaxed">{step.warning}</span>
                </div>
              )}
            </div>
          ))}

          {/* Precautions */}
          {content.precautions && content.precautions.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-card p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Precauções de Segurança</h3>
              </div>
              <div className="space-y-2">
                {content.precautions.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-amber-400 min-w-[90px]">{p.label}</span>
                    <span className="text-xs text-muted-foreground">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {content.recommendations && content.recommendations.length > 0 && (
            <div className="rounded-xl border border-border/30 bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Canetas Recomendadas</h3>
              {content.recommendations.map((rec, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <p className="text-xs font-medium text-primary mb-1.5">{rec.title}</p>
                  <ul className="space-y-1">
                    {rec.details.map((d, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400 mt-0.5" />
                        <span className="text-[11px] text-muted-foreground">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          {content.disclaimer && (
            <div className="rounded-xl border border-border/20 bg-muted/30 p-4">
              <p className="text-[10px] text-muted-foreground leading-relaxed text-center italic">
                ⚠️ {content.disclaimer}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
