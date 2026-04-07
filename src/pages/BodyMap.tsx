import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin, Calendar, Check, RotateCcw, ChevronRight, X,
  Syringe, AlertTriangle, Lightbulb, Info
} from "lucide-react";

// ── Injection site data ──
interface InjectionSite {
  id: string;
  name: string;
  region: string;
  side: "frontal" | "dorsal";
  x: number; // % position on body
  y: number;
  angle: string;
  technique: string;
  tips: string[];
  idealFor: string[];
}

const injectionSites: InjectionSite[] = [
  // Frontal
  {
    id: "abd-sup-dir", name: "Abdômen Superior Direito", region: "Abdômen", side: "frontal",
    x: 42, y: 38, angle: "90° (tecido adiposo adequado) ou 45° (magros)",
    technique: "Pinçar a pele com dois dedos, inserir agulha 31G (8mm). Injeção lenta (2-3s por 10 unidades). Segurar 5s antes de retirar.",
    tips: ["Região mais usada – maior absorção", "Manter 2 dedos de distância do umbigo", "Não aplicar em área com cicatrizes"],
    idealFor: ["BPC-157", "Tirzepatida", "Semaglutida", "CJC/Ipamorelin"],
  },
  {
    id: "abd-sup-esq", name: "Abdômen Superior Esquerdo", region: "Abdômen", side: "frontal",
    x: 58, y: 38, angle: "90° ou 45° (magros)",
    technique: "Pinçar a pele, inserir agulha 31G. Injeção lenta, segurar 5s.",
    tips: ["Alternar com lado direito", "Evitar a linha alba (centro)"],
    idealFor: ["BPC-157", "Tirzepatida", "Semaglutida"],
  },
  {
    id: "abd-inf-dir", name: "Abdômen Inferior Direito", region: "Abdômen", side: "frontal",
    x: 42, y: 46, angle: "90° ou 45°",
    technique: "Mesmo procedimento. Região com mais tecido adiposo na maioria das pessoas.",
    tips: ["Ideal para iniciantes", "Mais confortável que a região superior"],
    idealFor: ["GLP-1s", "GHRPs", "BPC-157"],
  },
  {
    id: "abd-inf-esq", name: "Abdômen Inferior Esquerdo", region: "Abdômen", side: "frontal",
    x: 58, y: 46, angle: "90° ou 45°",
    technique: "Mesmo procedimento do inferior direito.",
    tips: ["Completar a rotação abdominal aqui", "Alternar semanal com superior"],
    idealFor: ["GLP-1s", "GHRPs"],
  },
  {
    id: "coxa-dir", name: "Coxa Externa Direita", region: "Coxa", side: "frontal",
    x: 38, y: 72, angle: "90° (recomendado) ou 45°",
    technique: "Vasto lateral (terço médio externo da coxa). Sentar com perna relaxada. Pinçar e inserir.",
    tips: ["Boa opção quando abdômen está sensível", "Menos absorção que abdômen", "Evitar face interna da coxa"],
    idealFor: ["TB-500", "GH peptides", "BPC-157"],
  },
  {
    id: "coxa-esq", name: "Coxa Externa Esquerda", region: "Coxa", side: "frontal",
    x: 62, y: 72, angle: "90° ou 45°",
    technique: "Mesmo procedimento no vasto lateral esquerdo.",
    tips: ["Alternar com direita semanalmente", "Marcar os pontos para consistência"],
    idealFor: ["TB-500", "GH peptides"],
  },
  // Dorsal
  {
    id: "triceps-dir", name: "Tríceps Direito", region: "Braço", side: "dorsal",
    x: 28, y: 38, angle: "45° (pouco tecido adiposo)",
    technique: "Parte posterior do braço (tríceps). Pode ser difícil auto-aplicar. Pinçar o tecido com a mão oposta.",
    tips: ["Pedir ajuda se necessário", "Agulha 31G de 8mm ideal", "Boa absorção para volumes pequenos"],
    idealFor: ["Melanotan II", "Peptídeos de dose baixa"],
  },
  {
    id: "triceps-esq", name: "Tríceps Esquerdo", region: "Braço", side: "dorsal",
    x: 72, y: 38, angle: "45°",
    technique: "Mesmo procedimento no tríceps esquerdo.",
    tips: ["Alternar com direito", "Ideal para microdoses"],
    idealFor: ["Melanotan II", "Peptídeos de dose baixa"],
  },
  {
    id: "gluteo-sup-dir", name: "Glúteo Superior Direito", region: "Glúteo", side: "dorsal",
    x: 42, y: 52, angle: "90° (abundância de tecido adiposo)",
    technique: "Quadrante superior externo do glúteo. Área grande e espessa. Inserir agulha 29G (12.7mm) ou 31G (8mm).",
    tips: ["Excelente para volumes maiores (0.5ml+)", "Menor dor reportada", "Pedir ajuda para melhor precisão"],
    idealFor: ["TB-500 (dose alta)", "HCG", "Peptídeos de volume grande"],
  },
  {
    id: "gluteo-sup-esq", name: "Glúteo Superior Esquerdo", region: "Glúteo", side: "dorsal",
    x: 58, y: 52, angle: "90°",
    technique: "Mesmo procedimento no quadrante superior externo esquerdo.",
    tips: ["Alternar semanalmente com direito", "Marcar o quadrante correto"],
    idealFor: ["TB-500", "HCG"],
  },
  {
    id: "lombar-dir", name: "Lombar Lateral Direita", region: "Lombar", side: "dorsal",
    x: 42, y: 44, angle: "45° a 90°",
    technique: "Região lateral lombar (love handles). Pinçar tecido e inserir.",
    tips: ["Bom tecido adiposo na maioria das pessoas", "Evitar a coluna vertebral", "Opção para rotação avançada"],
    idealFor: ["BPC-157 (lesão lombar)", "Peptídeos gerais"],
  },
  {
    id: "lombar-esq", name: "Lombar Lateral Esquerda", region: "Lombar", side: "dorsal",
    x: 58, y: 44, angle: "45° a 90°",
    technique: "Mesmo procedimento na lombar esquerda.",
    tips: ["Alternar com direita", "Boa opção para quem tem gordura lombar"],
    idealFor: ["BPC-157", "Peptídeos gerais"],
  },
];

// ── Weekly rotation schedule ──
const weeklySchedule = [
  { day: "Segunda", abbr: "Se", site: "abd-inf-dir" },
  { day: "Terça", abbr: "Te", site: "abd-inf-esq" },
  { day: "Quarta", abbr: "Qu", site: "coxa-dir" },
  { day: "Quinta", abbr: "Qu", site: "coxa-esq" },
  { day: "Sexta", abbr: "Se", site: "triceps-dir" },
  { day: "Sábado", abbr: "Sá", site: "triceps-esq" },
  { day: "Domingo", abbr: "Do", site: "gluteo-sup-dir" },
];

const regionColors: Record<string, string> = {
  "Abdômen": "bg-primary",
  "Coxa": "bg-primary",
  "Braço": "bg-primary",
  "Glúteo": "bg-primary",
  "Lombar": "bg-primary/60",
};

function getSiteById(id: string) {
  return injectionSites.find((s) => s.id === id);
}

export default function BodyMap() {
  const [selectedSite, setSelectedSite] = useState<InjectionSite | null>(null);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());

  const todayIndex = new Date().getDay(); // 0=Sun, 1=Mon...
  const scheduleIndex = todayIndex === 0 ? 6 : todayIndex - 1; // Map to our Mon-Sun array
  const todaySite = getSiteById(weeklySchedule[scheduleIndex].site);
  const todayName = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][todayIndex];

  const nextUncompletedIndex = weeklySchedule.findIndex((_, i) => i > scheduleIndex && !completedDays.has(i));
  const nextSuggestion = nextUncompletedIndex >= 0 ? weeklySchedule[nextUncompletedIndex] : null;

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    injectionSites.forEach((s) => {
      counts[s.region] = (counts[s.region] || 0) + 1;
    });
    return counts;
  }, []);

  const toggleDay = (index: number) => {
    setCompletedDays((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const resetDays = () => setCompletedDays(new Set());

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground sm:text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <MapPin className="inline h-4.5 w-4.5 mr-2 text-primary" />
          Mapa de Aplicação Corporal
        </h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Locais de injeção subcutânea com técnica detalhada e diário de rotação semanal
        </p>
      </div>

      {/* Today's application card */}
      {todaySite && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                <Syringe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-primary font-medium">Aplicação de Hoje ({todayName})</p>
                <p className="text-sm font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {todaySite.name}
                </p>
                <p className="text-[10px] text-muted-foreground">Ângulo: {todaySite.angle.split(" ")[0]}</p>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-1.5 text-[11px] h-8"
              onClick={() => toggleDay(scheduleIndex)}
              variant={completedDays.has(scheduleIndex) ? "secondary" : "default"}
            >
              <Check className="h-3.5 w-3.5" />
              {completedDays.has(scheduleIndex) ? "Feito ✓" : "Marcar Feito"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="map" className="space-y-4">
        <TabsList className="h-9 bg-secondary/60 p-0.5 w-full grid grid-cols-2">
          <TabsTrigger value="map" className="text-[11px] gap-1.5 data-[state=active]:bg-card h-8">
            <Syringe className="h-3.5 w-3.5" /> Mapa Corporal
          </TabsTrigger>
          <TabsTrigger value="schedule" className="text-[11px] gap-1.5 data-[state=active]:bg-card h-8">
            <Calendar className="h-3.5 w-3.5" /> Diário Semanal
          </TabsTrigger>
        </TabsList>

        {/* ═══════════ TAB: MAPA CORPORAL ═══════════ */}
        <TabsContent value="map" className="space-y-4">
          <Card className="border-border/40 bg-card/80">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* FRONTAL */}
                <div className="text-center">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-3">Frontal</p>
                  <BodySilhouette
                    side="frontal"
                    sites={injectionSites.filter((s) => s.side === "frontal")}
                    completedSites={new Set(
                      weeklySchedule
                        .filter((_, i) => completedDays.has(i))
                        .map((s) => s.site)
                    )}
                    onSiteClick={setSelectedSite}
                  />
                </div>
                {/* DORSAL */}
                <div className="text-center">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-3">Dorsal</p>
                  <BodySilhouette
                    side="dorsal"
                    sites={injectionSites.filter((s) => s.side === "dorsal")}
                    completedSites={new Set(
                      weeklySchedule
                        .filter((_, i) => completedDays.has(i))
                        .map((s) => s.site)
                    )}
                    onSiteClick={setSelectedSite}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info + Legend */}
          <Card className="border-border/40 bg-card/40">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground">
                  Clique nos pontos pulsantes para ver a técnica detalhada de cada local.
                  Pontos <span className="text-primary font-semibold">verdes</span> = já aplicados esta semana.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                {Object.entries(regionCounts).map(([region, count]) => (
                  <div key={region} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${regionColors[region] || "bg-primary"}`} />
                    <span className="text-[10px] text-muted-foreground">
                      {region} ({count})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ TAB: DIÁRIO SEMANAL ═══════════ */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Rotação Semanal
              </p>
              <p className="text-[10px] text-muted-foreground">
                {completedDays.size}/7 aplicações realizadas
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-[11px] h-8" onClick={resetDays}>
              <RotateCcw className="h-3 w-3" /> Resetar
            </Button>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(completedDays.size / 7) * 100}%` }}
            />
          </div>

          {/* Schedule list */}
          <div className="space-y-2">
            {weeklySchedule.map((entry, i) => {
              const site = getSiteById(entry.site);
              const isToday = i === scheduleIndex;
              const isDone = completedDays.has(i);
              return (
                <button
                  key={i}
                  onClick={() => site && setSelectedSite(site)}
                  className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                    isToday
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/20 bg-card/60 hover:border-border/40"
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${
                    isDone ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>
                    {isDone ? <Check className="h-3.5 w-3.5" /> : entry.abbr}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-foreground">{entry.day}</span>
                      {isToday && <Badge className="text-[8px] h-4 bg-primary/20 text-primary border-0">Hoje</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {site?.name} · {site?.region}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Next suggestion */}
          {nextSuggestion && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-3">
                <p className="text-[10px] text-primary font-medium mb-0.5">📍 Próxima aplicação sugerida</p>
                <p className="text-[12px] font-bold text-foreground">
                  {nextSuggestion.day} → {getSiteById(nextSuggestion.site)?.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Região: {getSiteById(nextSuggestion.site)?.region} · Ângulo: {getSiteById(nextSuggestion.site)?.angle.split(" ")[0]}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      {selectedSite && (
        <SiteDetailModal site={selectedSite} onClose={() => setSelectedSite(null)} />
      )}
    </div>
  );
}

// ── Body Silhouette SVG with clickable dots ──
function BodySilhouette({
  side,
  sites,
  completedSites,
  selectedSiteId,
  onSiteClick,
}: {
  side: "frontal" | "dorsal";
  sites: InjectionSite[];
  completedSites: Set<string>;
  selectedSiteId: string | null;
  onSiteClick: (site: InjectionSite) => void;
}) {
  return (
    <div className="relative mx-auto" style={{ width: "200px", height: "400px" }}>
      {/* Body shape SVG - improved anatomical silhouette */}
      <svg viewBox="0 0 200 400" className="w-full h-full">
        <defs>
          <linearGradient id={`bodyGrad-${side}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.2" />
          </linearGradient>
          <filter id="bodyShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="hsl(var(--primary))" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Head */}
        <ellipse cx="100" cy="32" rx="22" ry="26" fill={`url(#bodyGrad-${side})`} stroke="hsl(var(--border))" strokeWidth="0.8" strokeOpacity="0.4" />
        {/* Neck */}
        <rect x="90" y="56" width="20" height="14" rx="6" fill={`url(#bodyGrad-${side})`} stroke="hsl(var(--border))" strokeWidth="0.6" strokeOpacity="0.3" />

        {/* Torso */}
        <path
          d="M62 70 C58 75, 52 95, 50 120 L48 175 C48 178, 50 182, 55 184 L70 186 L70 180 L100 182 L130 180 L130 186 L145 184 C150 182, 152 178, 152 175 L150 120 C148 95, 142 75, 138 70 L120 68 C110 66, 90 66, 80 68 Z"
          fill={`url(#bodyGrad-${side})`}
          stroke="hsl(var(--border))"
          strokeWidth="0.8"
          strokeOpacity="0.35"
          filter="url(#bodyShadow)"
        />

        {/* Left shoulder + arm */}
        <path
          d="M62 70 C55 72, 42 80, 36 95 L28 130 C26 138, 24 150, 23 165 L22 175 C22 178, 24 180, 28 180 L32 180 C35 180, 37 178, 37 175 L40 140 L46 110 L52 85"
          fill={`url(#bodyGrad-${side})`}
          stroke="hsl(var(--border))"
          strokeWidth="0.7"
          strokeOpacity="0.3"
        />
        {/* Right shoulder + arm */}
        <path
          d="M138 70 C145 72, 158 80, 164 95 L172 130 C174 138, 176 150, 177 165 L178 175 C178 178, 176 180, 172 180 L168 180 C165 180, 163 178, 163 175 L160 140 L154 110 L148 85"
          fill={`url(#bodyGrad-${side})`}
          stroke="hsl(var(--border))"
          strokeWidth="0.7"
          strokeOpacity="0.3"
        />

        {/* Left leg */}
        <path
          d="M70 184 C68 195, 64 220, 60 250 L56 300 C55 310, 54 325, 53 340 L52 360 C52 363, 54 366, 58 366 L66 366 C69 366, 71 363, 70 360 L72 330 L76 280 L80 230 L82 186"
          fill={`url(#bodyGrad-${side})`}
          stroke="hsl(var(--border))"
          strokeWidth="0.7"
          strokeOpacity="0.3"
        />
        {/* Right leg */}
        <path
          d="M130 184 C132 195, 136 220, 140 250 L144 300 C145 310, 146 325, 147 340 L148 360 C148 363, 146 366, 142 366 L134 366 C131 366, 129 363, 130 360 L128 330 L124 280 L120 230 L118 186"
          fill={`url(#bodyGrad-${side})`}
          stroke="hsl(var(--border))"
          strokeWidth="0.7"
          strokeOpacity="0.3"
        />

        {/* Center line for dorsal */}
        {side === "dorsal" && (
          <line x1="100" y1="70" x2="100" y2="180" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        )}
      </svg>

      {/* Injection point dots */}
      {sites.map((site) => {
        const isCompleted = completedSites.has(site.id);
        const isSelected = selectedSiteId === site.id;
        return (
          <button
            key={site.id}
            onClick={() => onSiteClick(site)}
            className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
            style={{ left: `${site.x}%`, top: `${site.y}%` }}
            title={site.name}
          >
            {/* Outer glow ring */}
            <span
              className={`absolute rounded-full transition-all duration-300 ${
                isSelected
                  ? "bg-primary/40 scale-100"
                  : "bg-primary/15 scale-100 animate-ping"
              }`}
              style={{ width: "24px", height: "24px", left: "-6px", top: "-6px" }}
            />
            {/* Middle ring */}
            <span
              className={`absolute rounded-full border-2 transition-all duration-300 ${
                isSelected
                  ? "border-primary bg-primary/30 scale-110"
                  : isCompleted
                    ? "border-primary/60 bg-primary/20"
                    : "border-primary/40 bg-primary/10"
              }`}
              style={{ width: "18px", height: "18px", left: "-3px", top: "-3px" }}
            />
            {/* Center dot */}
            <span
              className={`relative block h-3 w-3 rounded-full shadow-lg transition-all duration-200 group-hover:scale-125 ${
                isSelected
                  ? "bg-primary shadow-primary/50 scale-125"
                  : isCompleted
                    ? "bg-primary shadow-primary/30"
                    : "bg-primary/70 shadow-primary/20"
              }`}
            />
            {/* Label on hover */}
            <span className="absolute left-1/2 -translate-x-1/2 -top-5 whitespace-nowrap rounded bg-card/95 border border-border/40 px-1.5 py-0.5 text-[7px] font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg backdrop-blur-sm">
              {site.name.replace("Abdômen ", "Abd. ").replace("Superior ", "Sup. ").replace("Inferior ", "Inf. ").replace("Direito", "Dir.").replace("Direita", "Dir.").replace("Esquerdo", "Esq.").replace("Esquerda", "Esq.").replace("Externa ", "Ext. ").replace("Lateral ", "Lat. ")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Site Detail Modal ──
function SiteDetailModal({ site, onClose }: { site: InjectionSite; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border/40 bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-2 mb-3">
          <Syringe className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
          <h3 className="text-sm font-bold text-foreground pr-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {site.name}
          </h3>
        </div>

        <Badge variant="secondary" className="text-[10px] mb-3">{site.region}</Badge>

        {/* Angle */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 mb-3">
          <p className="text-[10px] font-semibold text-primary mb-0.5">🏷️ Ângulo de Agulha</p>
          <p className="text-[12px] text-foreground">{site.angle}</p>
        </div>

        {/* Technique */}
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-foreground mb-1">Técnica de Aplicação</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{site.technique}</p>
        </div>

        {/* Tips */}
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-foreground mb-1 flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-amber-400" /> Dicas
          </p>
          <ul className="space-y-1">
            {site.tips.map((tip) => (
              <li key={tip} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                <span className="text-foreground mt-0.5">•</span> {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Ideal for */}
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-foreground mb-1.5 flex items-center gap-1">
            <Syringe className="h-3 w-3 text-primary" /> Ideal Para
          </p>
          <div className="flex flex-wrap gap-1.5">
            {site.idealFor.map((p) => (
              <Badge key={p} variant="outline" className="text-[9px] bg-secondary/50">{p}</Badge>
            ))}
          </div>
        </div>

        {/* Assepsia warning */}
        <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-2.5">
          <p className="text-[10px] text-muted-foreground">
            <strong className="text-destructive">Assepsia:</strong> Sempre limpe o local com swab de álcool 70% em movimentos circulares de dentro para fora antes de aplicar.
          </p>
        </div>
      </div>
    </div>
  );
}
