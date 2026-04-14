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

    let critical = 0, medium = 0, low = 0;

    // ── 1. Internal consistency checks ──
    if (scope === "full" || scope === "internal") {
      const internalFindings = await auditInternal(sb, runId, peptides || []);
      critical += internalFindings.critical;
      medium += internalFindings.medium;
      low += internalFindings.low;
    }

    // ── 2. Cross-source conflict detection ──
    if (scope === "full" || scope === "cross_source") {
      const crossFindings = await auditCrossSource(sb, runId, peptides || []);
      critical += crossFindings.critical;
      medium += crossFindings.medium;
      low += crossFindings.low;
    }

    // ── 3. Detected changes review ──
    if (scope === "full") {
      const changeFindings = await auditPendingChanges(sb, runId);
      critical += changeFindings.critical;
      medium += changeFindings.medium;
      low += changeFindings.low;
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
        timestamp: new Date().toISOString(),
      },
    }).eq("id", runId);

    // Create notification if critical findings
    if (critical > 0) {
      await sb.from("admin_notifications").insert({
        type: "audit_critical",
        title: `Auditoria encontrou ${critical} finding(s) crítico(s)`,
        message: `A auditoria ${scope} detectou ${total} findings, sendo ${critical} críticos. Revise imediatamente.`,
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
    });
  } catch (err: any) {
    console.error("audit-engine error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});

// ── Internal Consistency Audit ──

async function auditInternal(sb: SupabaseClient, runId: string, peptides: any[]) {
  let critical = 0, medium = 0, low = 0;

  for (const pep of peptides) {
    // Missing critical fields
    const missingFields: string[] = [];
    if (!pep.description) missingFields.push("description");
    if (!pep.mechanism) missingFields.push("mechanism");
    if (!pep.category) missingFields.push("category");
    if (!pep.benefits?.length) missingFields.push("benefits");
    if (!pep.dosage_info) missingFields.push("dosage_info");

    if (missingFields.length >= 3) {
      await addFinding(sb, {
        audit_run_id: runId,
        peptide_id: pep.id,
        category: "incomplete_data",
        severity: "medium",
        title: `Peptídeo com ${missingFields.length} campos essenciais vazios`,
        description: `${pep.name} não possui: ${missingFields.join(", ")}`,
        recommendation: "Preencher campos essenciais para publicação completa",
      });
      medium++;
    } else if (missingFields.length > 0) {
      await addFinding(sb, {
        audit_run_id: runId,
        peptide_id: pep.id,
        category: "incomplete_data",
        severity: "low",
        title: `Campo(s) secundário(s) ausente(s)`,
        description: `${pep.name}: ${missingFields.join(", ")}`,
        recommendation: "Complementar dados quando possível",
      });
      low++;
    }

    // Missing sequence
    if (!pep.sequence) {
      await addFinding(sb, {
        audit_run_id: runId,
        peptide_id: pep.id,
        category: "missing_sequence",
        severity: "medium",
        title: "Sequência não informada",
        description: `${pep.name} não possui sequência peptídica registrada`,
        recommendation: "Sincronizar com UniProt ou adicionar manualmente",
      });
      medium++;
    }

    // No scientific references
    const { count: refCount } = await sb.from("peptide_references")
      .select("*", { count: "exact", head: true })
      .eq("peptide_id", pep.id);

    if (!refCount || refCount === 0) {
      await addFinding(sb, {
        audit_run_id: runId,
        peptide_id: pep.id,
        category: "no_references",
        severity: "medium",
        title: "Sem referências científicas",
        description: `${pep.name} não possui nenhuma referência PubMed vinculada`,
        recommendation: "Executar sincronização PubMed para este peptídeo",
      });
      medium++;
    }

    // No source origins
    if (!pep.source_origins?.length) {
      await addFinding(sb, {
        audit_run_id: runId,
        peptide_id: pep.id,
        category: "no_source",
        severity: "low",
        title: "Sem fonte verificável",
        description: `${pep.name} não possui nenhuma fonte de dados registrada`,
        recommendation: "Vincular a pelo menos uma fonte científica confiável",
      });
      low++;
    }

    // Missing protocol/dosage data
    if (!pep.dosage_table && !pep.protocol_phases) {
      await addFinding(sb, {
        audit_run_id: runId,
        peptide_id: pep.id,
        category: "no_protocol",
        severity: "low",
        title: "Sem dados de protocolo",
        description: `${pep.name} não possui tabela de dosagem nem fases de protocolo`,
        recommendation: "Adicionar dados de protocolo baseado na literatura",
      });
      low++;
    }

    // Slug consistency check
    const expectedSlug = pep.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (pep.slug !== expectedSlug && !pep.slug.includes(pep.name.toLowerCase().split(" ")[0])) {
      await addFinding(sb, {
        audit_run_id: runId,
        peptide_id: pep.id,
        category: "data_inconsistency",
        severity: "low",
        title: "Slug potencialmente inconsistente",
        description: `Slug "${pep.slug}" pode não corresponder ao nome "${pep.name}"`,
        source_a: "name",
        value_a: pep.name,
        source_b: "slug",
        value_b: pep.slug,
        recommendation: "Verificar se o slug está correto",
      });
      low++;
    }
  }

  return { critical, medium, low };
}

// ── Cross-Source Conflict Detection ──

async function auditCrossSource(sb: SupabaseClient, runId: string, peptides: any[]) {
  let critical = 0, medium = 0, low = 0;

  // Check detected_changes for unresolved conflicts
  const { data: conflicts } = await sb.from("detected_changes")
    .select("*, integration_sources(name)")
    .eq("status", "pending")
    .in("severity", ["critical", "medium"])
    .order("severity")
    .limit(100);

  for (const conflict of (conflicts || [])) {
    const severity = conflict.severity === "critical" ? "critical" : "medium";

    await addFinding(sb, {
      audit_run_id: runId,
      peptide_id: conflict.peptide_id,
      category: "cross_source_conflict",
      severity,
      title: `Conflito: ${conflict.change_type} (${conflict.integration_sources?.name || "?"})`,
      description: `Divergência detectada no campo "${conflict.field_name}" entre site e ${conflict.integration_sources?.name}`,
      source_a: "PeptLabs",
      source_b: conflict.integration_sources?.name || "External",
      value_a: conflict.old_value,
      value_b: conflict.new_value,
      recommendation: severity === "critical"
        ? "Revisão manual obrigatória antes de sincronizar"
        : "Avaliar se atualização é segura",
    });

    if (severity === "critical") critical++;
    else medium++;
  }

  // Check for peptides with data from multiple sources that might conflict
  for (const pep of peptides) {
    const origins = pep.source_origins || [];
    if (origins.length < 2) continue;

    // If peptide has sequence from multiple sources, flag for review
    if (origins.includes("NCBI_Protein") && (origins.includes("DRAMP") || origins.includes("Peptipedia"))) {
      // This is informational - multiple sources is actually good
      await addFinding(sb, {
        audit_run_id: runId,
        peptide_id: pep.id,
        category: "multi_source",
        severity: "low",
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

async function auditPendingChanges(sb: SupabaseClient, runId: string) {
  let critical = 0, medium = 0, low = 0;

  // Count stale pending changes (older than 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: staleChanges, count } = await sb.from("detected_changes")
    .select("*", { count: "exact" })
    .eq("status", "pending")
    .lt("created_at", sevenDaysAgo)
    .limit(1);

  if (count && count > 0) {
    await addFinding(sb, {
      audit_run_id: runId,
      category: "stale_changes",
      severity: "medium",
      title: `${count} atualização(ões) pendente(s) há mais de 7 dias`,
      description: "Mudanças detectadas que não foram revisadas. Podem conter dados importantes.",
      recommendation: "Revisar e tomar ação sobre mudanças pendentes",
    });
    medium++;
  }

  // Check import queue items stuck
  const { count: stuckImports } = await sb.from("peptide_import_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("created_at", sevenDaysAgo);

  if (stuckImports && stuckImports > 0) {
    await addFinding(sb, {
      audit_run_id: runId,
      category: "stale_imports",
      severity: "low",
      title: `${stuckImports} peptídeo(s) na fila de importação há mais de 7 dias`,
      description: "Peptídeos novos aguardando revisão de publicação",
      recommendation: "Revisar fila de importação e aprovar ou rejeitar",
    });
    low++;
  }

  return { critical, medium, low };
}

// ── Helpers ──

async function addFinding(sb: SupabaseClient, finding: Record<string, any>) {
  const { error } = await sb.from("audit_findings").insert(finding);
  if (error) console.error("Failed to add finding:", error.message);
}
