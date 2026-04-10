import { useState, useMemo } from "react";
import FreeGateOverlay from "@/components/FreeGateOverlay";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin, Calendar, Check, RotateCcw, ChevronRight, X,
  Syringe, AlertTriangle, Lightbulb, Info, Lock
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

  const todayIndex = new Date().getDay();
  const scheduleIndex = todayIndex === 0 ? 6 : todayIndex - 1;
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
  <FreeGateOverlay
    pageTitle="Mapa de Aplicação Corporal"
    description="Assine para acessar o mapa interativo de locais de injeção com técnica detalhada e diário de rotação semanal."
    comparisonRows={[
      ["Mapa interativo de locais", "✗", "✓"],
      ["Técnica detalhada por local", "✗", "✓"],
      ["Diário de rotação semanal", "✗", "✓"],
      ["Sugestão automática de próximo local", "✗", "✓"],
      ["Ângulos e tipos de agulha", "✗", "✓"],
      ["Prevenção de lipohipertrofia", "✗", "✓"],
    ]}
  >
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
                    selectedSiteId={selectedSite?.id || null}
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
                    selectedSiteId={selectedSite?.id || null}
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
  </FreeGateOverlay>
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
    <div className="relative mx-auto" style={{ width: "220px", height: "460px" }}>
      <svg viewBox="0 0 220 410" className="w-full h-full">
        <defs>
          <linearGradient id={`bodyFill-${side}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id={`bodyStroke-${side}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
          </linearGradient>
          <filter id={`glow-${side}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Radial glow for injection points */}
          <radialGradient id="dotGlow">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Head */}
        <ellipse cx="110" cy="32" rx="20" ry="24"
          fill={`url(#bodyFill-${side})`}
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="1"
        />
        {/* Ears */}
        <ellipse cx="89" cy="32" rx="4" ry="7"
          fill={`url(#bodyFill-${side})`}
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="0.6"
        />
        <ellipse cx="131" cy="32" rx="4" ry="7"
          fill={`url(#bodyFill-${side})`}
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="0.6"
        />
        {/* Neck */}
        <path
          d="M103 54 C103 60, 103 66, 100 70 L120 70 C117 66, 117 60, 117 54"
          fill={`url(#bodyFill-${side})`}
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="0.8"
        />

        {/* Torso */}
        <path
          d={`
            M100 70
            C82 72, 68 78, 62 88
            L58 100 L58 130 L60 160 L62 185
            L68 190 L68 195
            L152 195 L152 190
            L158 185 L160 160 L162 130 L162 100
            L158 88
            C152 78, 138 72, 120 70
            Z
          `}
          fill={`url(#bodyFill-${side})`}
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="1"
          strokeLinejoin="round"
        />

        {/* Left shoulder + upper arm */}
        <path
          d={`
            M62 88
            C54 82, 46 84, 40 92
            L34 110 L30 135 L28 160 L26 180
            C26 183, 28 185, 30 185
            L36 186 L38 185
            L40 165 L42 140 L46 118 L52 100
          `}
          fill={`url(#bodyFill-${side})`}
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="0.8"
        />
        {/* Left hand */}
        <path
          d={`
            M26 180
            L24 188 L22 194
            C21 196, 21 198, 22 199
            L24 199 L25 196
            L24 194 L25 192 L26 196
            C26 198, 27 199, 28 199
            L29 198 L28 194
            L27 190 L28 192 L29 197
            C29 199, 30 200, 31 200
            L32 199 L31 195
            L30 190 L31 192 L32 196
            C32 198, 33 199, 34 198
            L34 196 L33 192
            L32 188 L34 186
          `}
          fill={`url(#bodyFill-${side})`}
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />

        {/* Right shoulder + upper arm */}
        <path
          d={`
            M158 88
            C166 82, 174 84, 180 92
            L186 110 L190 135 L192 160 L194 180
            C194 183, 192 185, 190 185
            L184 186 L182 185
            L180 165 L178 140 L174 118 L168 100
          `}
          fill={`url(#bodyFill-${side})`}
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="0.8"
        />
        {/* Right hand */}
        <path
          d={`
            M194 180
            L196 188 L198 194
            C199 196, 199 198, 198 199
            L196 199 L195 196
            L196 194 L195 192 L194 196
            C194 198, 193 199, 192 199
            L191 198 L192 194
            L193 190 L192 192 L191 197
            C191 199, 190 200, 189 200
            L188 199 L189 195
            L190 190 L189 192 L188 196
            C188 198, 187 199, 186 198
            L186 196 L187 192
            L188 188 L186 186
          `}
          fill={`url(#bodyFill-${side})`}
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />

        {/* Left leg */}
        <path
          d={`
            M68 195
            L66 210 L64 240 L62 270 L60 300
            L58 330 L56 355 L54 375
            L52 390
            C52 392, 53 394, 55 394
            L58 394
          `}
          fill={`url(#bodyFill-${side})`}
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="0.8"
        />
        <path
          d={`
            M96 195
            L94 210 L92 240 L88 270 L84 300
            L80 330 L78 355 L76 375
            L74 390
            C74 392, 73 394, 71 394
            L68 394
          `}
          fill={`url(#bodyFill-${side})`}
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="0.8"
        />
        {/* Left foot */}
        <path
          d={`
            M55 394
            L50 396 L44 398
            C42 399, 41 401, 42 403
            L44 404 L50 403 L56 401
            L62 400 L68 400 L71 400
            C73 399, 74 397, 73 395
            L71 394 L68 394
          `}
          fill={`url(#bodyFill-${side})`}
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="0.6"
          strokeLinejoin="round"
        />

        {/* Right leg */}
        <path
          d={`
            M124 195
            L126 210 L128 240 L132 270 L136 300
            L140 330 L142 355 L144 375
            L146 390
            C146 392, 147 394, 149 394
            L152 394
          `}
          fill={`url(#bodyFill-${side})`}
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="0.8"
        />
        <path
          d={`
            M152 195
            L154 210 L156 240 L158 270 L160 300
            L162 330 L164 355 L166 375
            L168 390
            C168 392, 167 394, 165 394
            L162 394
          `}
          fill={`url(#bodyFill-${side})`}
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="0.8"
        />
        {/* Right foot */}
        <path
          d={`
            M165 394
            L170 396 L176 398
            C178 399, 179 401, 178 403
            L176 404 L170 403 L164 401
            L158 400 L152 400 L149 400
            C147 399, 146 397, 147 395
            L149 394 L152 394
          `}
          fill={`url(#bodyFill-${side})`}
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="0.6"
          strokeLinejoin="round"
        />

        {/* ── Anatomical details ── */}
        {/* Clavicles */}
        <path
          d="M100 74 C95 72, 85 76, 72 82"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.6"
          opacity="0.18"
        />
        <path
          d="M120 74 C125 72, 135 76, 148 82"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.6"
          opacity="0.18"
        />

        {/* Pectoral lines (frontal only) */}
        {side === "frontal" && (
          <>
            <path
              d="M78 88 C85 96, 95 100, 110 98"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
              opacity="0.12"
            />
            <path
              d="M142 88 C135 96, 125 100, 110 98"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
              opacity="0.12"
            />
          </>
        )}

        {/* Abdominal center line (frontal) */}
        {side === "frontal" && (
          <>
            <line x1="110" y1="100" x2="110" y2="185"
              stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.1"
            />
            {/* Ab horizontal lines */}
            <line x1="100" y1="110" x2="120" y2="110"
              stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.08"
            />
            <line x1="98" y1="125" x2="122" y2="125"
              stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.08"
            />
            <line x1="97" y1="140" x2="123" y2="140"
              stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.08"
            />
            <line x1="98" y1="155" x2="122" y2="155"
              stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.08"
            />
          </>
        )}

        {/* Scapula lines (dorsal only) */}
        {side === "dorsal" && (
          <>
            <path
              d="M78 86 C82 95, 90 100, 100 100"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
              opacity="0.12"
            />
            <path
              d="M142 86 C138 95, 130 100, 120 100"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
              opacity="0.12"
            />
            {/* Spine line */}
            <line x1="110" y1="70" x2="110" y2="195"
              stroke="hsl(var(--primary))" strokeWidth="0.6" strokeDasharray="3 5" opacity="0.15"
            />
            {/* Lower back dimples */}
            <circle cx="102" cy="178" r="2"
              fill="none" stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.1"
            />
            <circle cx="118" cy="178" r="2"
              fill="none" stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.1"
            />
          </>
        )}

        {/* Bicep lines on arms */}
        <path
          d="M42 120 C40 130, 38 140, 36 150"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.4"
          opacity="0.1"
        />
        <path
          d="M178 120 C180 130, 182 140, 184 150"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.4"
          opacity="0.1"
        />

        {/* Knee definition - left */}
        <ellipse cx="76" cy="310" rx="8" ry="5"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.5"
          opacity="0.12"
        />
        {/* Kneecap highlight left */}
        <ellipse cx="76" cy="308" rx="4" ry="3"
          fill="hsl(var(--primary))"
          opacity="0.04"
        />

        {/* Knee definition - right */}
        <ellipse cx="144" cy="310" rx="8" ry="5"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.5"
          opacity="0.12"
        />
        {/* Kneecap highlight right */}
        <ellipse cx="144" cy="308" rx="4" ry="3"
          fill="hsl(var(--primary))"
          opacity="0.04"
        />

        {/* Quadriceps muscle lines (frontal) */}
        {side === "frontal" && (
          <>
            <path d="M72 220 C74 250, 74 270, 76 295" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.35" opacity="0.08" />
            <path d="M86 220 C84 250, 82 270, 78 295" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.35" opacity="0.08" />
            <path d="M140 220 C138 250, 138 270, 136 295" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.35" opacity="0.08" />
            <path d="M148 220 C150 250, 150 270, 148 295" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.35" opacity="0.08" />
          </>
        )}

        {/* Calf muscle lines (dorsal) */}
        {side === "dorsal" && (
          <>
            <path d="M70 320 C72 335, 74 345, 72 360" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.35" opacity="0.08" />
            <path d="M82 320 C80 335, 78 345, 80 360" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.35" opacity="0.08" />
            <path d="M138 320 C140 335, 142 345, 140 360" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.35" opacity="0.08" />
            <path d="M150 320 C148 335, 146 345, 148 360" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.35" opacity="0.08" />
          </>
        )}

        {/* Navel (frontal) */}
        {side === "frontal" && (
          <ellipse cx="110" cy="160" rx="2.5" ry="3"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.5"
            opacity="0.15"
          />
        )}

        {/* Crotch divider */}
        <line x1="110" y1="190" x2="110" y2="210"
          stroke={`url(#bodyStroke-${side})`}
          strokeWidth="0.6"
          opacity="0.4"
        />
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
            {/* Slow outer pulse */}
            <span
              className={`absolute rounded-full transition-all duration-500 ${
                isSelected
                  ? "bg-primary/30 scale-110"
                  : "bg-primary/10"
              }`}
              style={{
                width: "28px", height: "28px", left: "-8px", top: "-8px",
                animation: isSelected ? "none" : "slowPulse 3s ease-in-out infinite",
              }}
            />
            {/* Middle ring */}
            <span
              className={`absolute rounded-full border transition-all duration-300 ${
                isSelected
                  ? "border-primary bg-primary/25 scale-110"
                  : isCompleted
                    ? "border-primary/50 bg-primary/15"
                    : "border-primary/30 bg-primary/8"
              }`}
              style={{ width: "20px", height: "20px", left: "-4px", top: "-4px" }}
            />
            {/* Center dot */}
            <span
              className={`relative block h-3 w-3 rounded-full transition-all duration-200 group-hover:scale-125 ${
                isSelected
                  ? "bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)] scale-125"
                  : isCompleted
                    ? "bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.3)]"
                    : "bg-primary/70 shadow-[0_0_4px_hsl(var(--primary)/0.2)]"
              }`}
            />
            {/* Lock icon */}
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-card border border-border/50 shadow-sm z-10">
              <Lock className="h-2 w-2 text-muted-foreground" />
            </span>
            {/* Hover label */}
            <span className="absolute left-1/2 -translate-x-1/2 -top-6 whitespace-nowrap rounded-md bg-card border border-border/50 px-2 py-1 text-[8px] font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl backdrop-blur-md">
              {site.name.replace("Abdômen ", "Abd. ").replace("Superior ", "Sup. ").replace("Inferior ", "Inf. ").replace("Direito", "Dir.").replace("Direita", "Dir.").replace("Esquerdo", "Esq.").replace("Esquerda", "Esq.").replace("Externa ", "Ext. ").replace("Lateral ", "Lat. ")}
            </span>
          </button>
        );
      })}

      {/* Inject slow pulse keyframes */}
      <style>{`
        @keyframes slowPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
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
