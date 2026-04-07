import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, BookOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { guides, categoryGradients } from "@/data/peptides";
import { cn } from "@/lib/utils";
import { useEntitlements } from "@/hooks/useEntitlements";

export default function GuideDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isPremium, isAdmin } = useEntitlements();
  const hasFullAccess = isPremium || isAdmin;

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

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-6 text-xs text-muted-foreground" onClick={() => navigate("/app/learn")}>
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar aos Guias
      </Button>

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
        <p className="text-sm text-muted-foreground leading-relaxed">
          {guide.description}
        </p>
      </div>

      <div className="rounded-xl border border-border/30 bg-card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Conteúdo do Guia</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          O conteúdo completo deste guia será disponibilizado em breve. Estamos finalizando a revisão técnica para garantir a máxima qualidade e precisão das informações.
        </p>
      </div>
    </div>
  );
}
