/**
 * audit-engine
 * ════════════
 * Compares internal peptide data against external sources and
 * internal consistency rules. Generates audit findings.
 *
 * POST body:
 *   { scope?: "full"|"internal"|"cross_source", peptide_id?: string }
 */
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, handleCors, jsonResponse } from "../_shared/cors.ts";

// Canonical source names
const SOURCE_NAMES: Record<string, string> = {
  pubmed: "PubMed",
  uniprot: "UniProt",
  pdb: "PDB",
  openfda: "openFDA",
  peptipedia: "Peptipedia",
  dramp: "DRAMP",
  apd: "APD",
  ncbi: "NCBI",
  ncbi_protein: "NCBI",
};

function canonicalSource(raw: string | null | undefined): string {
  if (!raw) return "Unknown";
  const key = raw.toLowerCase().replace(/[\s_-]+/g, "");
  return SOURCE_NAMES[key] || raw;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Validate admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const { data: role } = await sb.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
        if (!role) return jsonResponse({ error: "Admin required" }, 403);
      }
    }

    const body = await req.json().catch(() => ({}));
    const scope: string = body.scope || "full";
    const peptideId: string | null = body.peptide_id || null;

    // Create audit run
    const { data: auditRun } = await sb.from("audit_runs").insert({
      status: "running",
      scope,
    }).select("id").single();
    const runId = auditRun!.id;

    // Get peptides
    let pepQuery = sb.from("peptides").select("*");
    if (peptideId) pepQuery = pepQuery.eq("id", peptideId);
    const { data: peptides } = await pepQuery;

    // Pre-load all existing open findings for idempotency
    const { data: existingFindings } = await sb.from("audit_findings")
      .select("peptide_id, category")
      .eq("status", "open");
    const existingSet = new Set(
      (existingFindings || []).map((f: any) => `${f.peptide_id || "null"}::${f.category}`)
    );

    let critical = 0, medium = 0, low = 0;
    let skipped = 0;

    const addFindingChecked = async (finding: Record<string, any>) => {
      const key = `${finding.peptide_id || "null"}::${finding.category}`;
      if (existingSet.has(key)) {
        skipped++;
        return;
      }
      existingSet.add(key);
      const { error } = await sb.from("audit_findings").insert({
        ...finding,
        source_a: finding.source_a ? canonicalSource(finding.source_a) : undefined,
        source_b: finding.source_b ? canonicalSource(finding.source_b) : undefined,
      });
      if (error) console.error("Failed to add finding:", error.message);
    };

    // ── 1. Internal consistency checks ──
    if (scope === "full" || scope === "internal") {
      const r = await auditInternal(sb, runId, peptides || [], addFindingChecked);
      critical += r.critical; medium += r.medium; low += r.low;
    }

    // ── 2. Cross-source conflict detection ──
    if (scope === "full" || scope === "cross_source") {
      const r = await auditCrossSource(sb, runId, peptides || [], addFindingChecked);
      critical += r.critical; medium += r.medium; low += r.low;
    }

    // ── 3. Detected changes review ──
    if (scope === "full") {
      const r = await auditPendingChanges(sb, runId, addFindingChecked);
      critical += r.critical; medium += r.medium; low += r.low;
    }

    const total = critical + medium + low;

    // Update audit run
    await sb.from("audit_runs").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      total_findings: total,
      critical_count: critical,
      medium_count: medium,
      low_count: low,
      summary: {
        peptides_audited: peptides?.length || 0,
        scope,
        skipped_duplicates: skipped,
        timestamp: new Date().toISOString(),
      },
    }).eq("id", runId);

    // Create notification if critical findings
    if (critical > 0) {
      await sb.from("admin_notifications").insert({
        type: "audit_critical",
        title: `Auditoria encontrou ${critical} finding(s) crítico(s)`,
        message: `A auditoria ${scope} detectou ${total} findings novos (${skipped} duplicatas ignoradas), sendo ${critical} críticos.`,
        severity: "critical",
      });
    }

    return jsonResponse({
      success: true,
      audit_run_id: runId,
      total_findings: total,
      critical_count: critical,
      medium_count: medium,
      low_count: low,
      skipped_duplicates: skipped,
    });
  } catch (err: any) {
    console.error("audit-engine error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});

// ── Type for the idempotent inserter ──
type FindingInserter = (finding: Record<string, any>) => Promise<void>;

// ── Internal Consistency Audit ──

async function auditInternal(sb: SupabaseClient, runId: string, peptides: any[], addFinding: FindingInserter) {
  let critical = 0, medium = 0, low = 0;

  for (const pep of peptides) {
    const missingFields: string[] = [];
    if (!pep.description) missingFields.push("description");
    if (!pep.mechanism) missingFields.push("mechanism");
    if (!pep.category) missingFields.push("category");
    if (!pep.benefits?.length) missingFields.push("benefits");
    if (!pep.dosage_info) missingFields.push("dosage_info");

    if (missingFields.length >= 3) {
      await addFinding({
        audit_run_id: runId, peptide_id: pep.id,
        category: "incomplete_data", severity: "medium",
        title: `Peptídeo com ${missingFields.length} campos essenciais vazios`,
        description: `${pep.name} não possui: ${missingFields.join(", ")}`,
        recommendation: "Preencher campos essenciais para publicação completa",
      });
      medium++;
    } else if (missingFields.length > 0) {
      await addFinding({
        audit_run_id: runId, peptide_id: pep.id,
        category: "incomplete_data", severity: "low",
        title: `Campo(s) secundário(s) ausente(s)`,
        description: `${pep.name}: ${missingFields.join(", ")}`,
        recommendation: "Complementar dados quando possível",
      });
      low++;
    }

    if (!pep.sequence) {
      await addFinding({
        audit_run_id: runId, peptide_id: pep.id,
        category: "missing_sequence", severity: "medium",
        title: "Sequência não informada",
        description: `${pep.name} não possui sequência peptídica registrada`,
        recommendation: "Verificar correspondência nas fontes ativas ou buscar manualmente",
      });
      medium++;
    }

    const { count: refCount } = await sb.from("peptide_references")
      .select("*", { count: "exact", head: true })
      .eq("peptide_id", pep.id);

    if (!refCount || refCount === 0) {
      await addFinding({
        audit_run_id: runId, peptide_id: pep.id,
        category: "no_references", severity: "medium",
        title: "Sem referências científicas",
        description: `${pep.name} não possui referências vinculadas no banco`,
        recommendation: "Buscar referências via motor de sugestão ou adicionar manualmente",
      });
      medium++;
    }

    if (!pep.source_origins?.length) {
      await addFinding({
        audit_run_id: runId, peptide_id: pep.id,
        category: "no_source", severity: "low",
        title: "Sem fonte verificável",
        description: `${pep.name} não possui origem de dados rastreável`,
        recommendation: "Verificar correspondência nas fontes ativas ou registrar origem manualmente",
      });
      low++;
    }

    if (!pep.dosage_table && !pep.protocol_phases) {
      await addFinding({
        audit_run_id: runId, peptide_id: pep.id,
        category: "no_protocol", severity: "low",
        title: "Sem dados de protocolo",
        description: `${pep.name} não possui tabela de dosagem nem fases de protocolo`,
        recommendation: "Adicionar dados de protocolo baseado na literatura",
      });
      low++;
    }

    const expectedSlug = pep.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (pep.slug !== expectedSlug && !pep.slug.includes(pep.name.toLowerCase().split(" ")[0])) {
      await addFinding({
        audit_run_id: runId, peptide_id: pep.id,
        category: "data_inconsistency", severity: "low",
        title: "Slug potencialmente inconsistente",
        description: `Slug "${pep.slug}" pode não corresponder ao nome "${pep.name}"`,
        source_a: "name", value_a: pep.name,
        source_b: "slug", value_b: pep.slug,
        recommendation: "Verificar se o slug está correto",
      });
      low++;
    }
  }

  return { critical, medium, low };
}

// ── Cross-Source Conflict Detection ──

async function auditCrossSource(sb: SupabaseClient, runId: string, peptides: any[], addFinding: FindingInserter) {
  let critical = 0, medium = 0, low = 0;

  const { data: conflicts } = await sb.from("detected_changes")
    .select("*, integration_sources(name)")
    .eq("status", "pending")
    .in("severity", ["critical", "medium"])
    .order("severity")
    .limit(100);

  for (const conflict of (conflicts || [])) {
    const severity = conflict.severity === "critical" ? "critical" : "medium";
    const sourceName = canonicalSource(conflict.integration_sources?.name);

    await addFinding({
      audit_run_id: runId,
      peptide_id: conflict.peptide_id,
      category: "cross_source_conflict",
      severity,
      title: `Conflito: ${conflict.change_type} (${sourceName})`,
      description: `Divergência detectada no campo "${conflict.field_name}" entre PeptLabs e ${sourceName}`,
      source_a: "PeptLabs",
      source_b: sourceName,
      value_a: conflict.old_value,
      value_b: conflict.new_value,
      recommendation: severity === "critical"
        ? "Revisão manual obrigatória antes de sincronizar"
        : "Avaliar se atualização é segura",
    });

    if (severity === "critical") critical++;
    else medium++;
  }

  for (const pep of peptides) {
    const origins = pep.source_origins || [];
    if (origins.length < 2) continue;

    if (origins.includes("NCBI_Protein") && (origins.includes("DRAMP") || origins.includes("Peptipedia"))) {
      await addFinding({
        audit_run_id: runId, peptide_id: pep.id,
        category: "multi_source", severity: "low",
        title: "Dados de múltiplas fontes",
        description: `${pep.name} possui dados de: ${origins.join(", ")}. Verificar consistência.`,
        recommendation: "Validar que dados entre fontes são coerentes",
      });
      low++;
    }
  }

  return { critical, medium, low };
}

// ── Pending Changes Audit ──

async function auditPendingChanges(sb: SupabaseClient, runId: string, addFinding: FindingInserter) {
  let critical = 0, medium = 0, low = 0;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await sb.from("detected_changes")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("created_at", sevenDaysAgo);

  if (count && count > 0) {
    await addFinding({
      audit_run_id: runId,
      category: "stale_changes", severity: "medium",
      title: `${count} atualização(ões) pendente(s) há mais de 7 dias`,
      description: "Mudanças detectadas que não foram revisadas. Podem conter dados importantes.",
      recommendation: "Revisar e tomar ação sobre mudanças pendentes",
    });
    medium++;
  }

  const { count: stuckImports } = await sb.from("peptide_import_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("created_at", sevenDaysAgo);

  if (stuckImports && stuckImports > 0) {
    await addFinding({
      audit_run_id: runId,
      category: "stale_imports", severity: "low",
      title: `${stuckImports} peptídeo(s) na fila de importação há mais de 7 dias`,
      description: "Peptídeos novos aguardando revisão de publicação",
      recommendation: "Revisar fila de importação e aprovar ou rejeitar",
    });
    low++;
  }

  return { critical, medium, low };
}
