/**
 * auto-update
 * ═══════════
 * Intelligent Auto-Update Engine for peptide data.
 * 
 * 1. Runs sync-orchestrator to fetch latest data from APIs
 * 2. Runs audit-engine to detect findings
 * 3. For high-confidence findings, auto-applies corrections
 * 4. Records everything in peptide_change_history
 * 
 * POST body:
 *   { mode?: "dry_run"|"auto"|"manual", min_confidence?: number }
 */
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, handleCors, jsonResponse } from "../_shared/cors.ts";

const AUTO_APPLY_THRESHOLD = 75; // minimum confidence to auto-apply

interface UpdateResult {
  peptideId: string;
  peptideName: string;
  field: string;
  oldValue: any;
  newValue: any;
  source: string;
  confidence: number;
  applied: boolean;
  reason: string;
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
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        userId = user.id;
        const { data: role } = await sb.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
        if (!role) return jsonResponse({ error: "Admin required" }, 403);
      }
    }

    const body = await req.json().catch(() => ({}));
    const mode: string = body.mode || "dry_run";
    const minConfidence: number = body.min_confidence || AUTO_APPLY_THRESHOLD;

    console.log(`[AutoUpdate] Starting mode=${mode} minConfidence=${minConfidence}`);

    // Step 1: Get all pending detected_changes with high confidence
    const { data: pendingChanges } = await sb
      .from("detected_changes")
      .select("*, integration_sources(name, slug, priority), peptides!detected_changes_peptide_id_fkey(id, name, slug, sequence, description, mechanism, benefits, scientific_references, source_origins)")
      .eq("status", "pending")
      .order("severity", { ascending: true }) // critical first
      .limit(200);

    if (!pendingChanges?.length) {
      return jsonResponse({ success: true, message: "No pending changes", results: [], stats: { total: 0, applied: 0, skipped: 0 } });
    }

    const results: UpdateResult[] = [];
    let applied = 0, skipped = 0;

    // Step 2: Evaluate and apply changes
    for (const change of pendingChanges) {
      const peptide = (change as any).peptides;
      const source = (change as any).integration_sources;
      if (!peptide) { skipped++; continue; }

      const evaluation = evaluateChange(change, peptide, source, minConfidence);

      if (mode === "auto" && evaluation.confidence >= minConfidence && evaluation.safe) {
        // Apply the change
        const applyResult = await applyChange(sb, change, peptide, source, userId);
        results.push({
          peptideId: peptide.id,
          peptideName: peptide.name,
          field: change.field_name || "unknown",
          oldValue: change.old_value,
          newValue: change.new_value,
          source: source?.name || "Unknown",
          confidence: evaluation.confidence,
          applied: applyResult.success,
          reason: applyResult.success ? "Auto-applied" : applyResult.error || "Failed",
        });
        if (applyResult.success) applied++;
        else skipped++;
      } else {
        results.push({
          peptideId: peptide.id,
          peptideName: peptide.name,
          field: change.field_name || "unknown",
          oldValue: change.old_value,
          newValue: change.new_value,
          source: source?.name || "Unknown",
          confidence: evaluation.confidence,
          applied: false,
          reason: mode === "dry_run" ? "Dry run" : evaluation.reason,
        });
        skipped++;
      }
    }

    // Step 3: Recalculate scores for updated peptides
    if (mode === "auto" && applied > 0) {
      const updatedPeptideIds = [...new Set(results.filter(r => r.applied).map(r => r.peptideId))];
      for (const pid of updatedPeptideIds) {
        await recalculateScore(sb, pid);
      }
    }

    console.log(`[AutoUpdate] Done. Applied=${applied} Skipped=${skipped}`);

    return jsonResponse({
      success: true,
      mode,
      stats: { total: pendingChanges.length, applied, skipped },
      results,
    });
  } catch (err: any) {
    console.error("[AutoUpdate] Error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});

// ── Evaluate if a change is safe to auto-apply ──

interface Evaluation {
  confidence: number;
  safe: boolean;
  reason: string;
}

function evaluateChange(change: any, peptide: any, source: any, threshold: number): Evaluation {
  const field = change.field_name;
  const severity = change.severity;

  // Critical severity = never auto-apply
  if (severity === "critical") {
    return { confidence: 20, safe: false, reason: "Severidade crítica requer revisão manual" };
  }

  // Sequence changes are sensitive
  if (field === "sequence") {
    if (!peptide.sequence && change.new_value) {
      // Adding new sequence (peptide had none) — medium confidence
      return { confidence: 70, safe: change.new_value.length < 200, reason: "Nova sequência para peptídeo sem dados" };
    }
    // Replacing existing sequence — never auto
    return { confidence: 30, safe: false, reason: "Substituição de sequência requer revisão manual" };
  }

  // New references — safe to add
  if (change.change_type === "new_reference") {
    return { confidence: 85, safe: true, reason: "Nova referência científica" };
  }

  // New data (no existing value) — safe
  if (change.change_type === "new_data") {
    return { confidence: 80, safe: true, reason: "Dados novos para campo vazio" };
  }

  // Structure updates — safe if additive
  if (change.change_type === "structure_update") {
    return { confidence: 75, safe: true, reason: "Atualização estrutural" };
  }

  // Regulatory updates — medium caution
  if (change.change_type === "regulatory_update") {
    return { confidence: 60, safe: false, reason: "Dados regulatórios requerem revisão" };
  }

  // Default: depends on source priority
  const priority = source?.priority || 50;
  const confidence = Math.min(90, priority + 20);
  return { confidence, safe: confidence >= threshold, reason: `Confiança baseada na prioridade da fonte (${priority})` };
}

// ── Apply a single change ──

async function applyChange(
  sb: SupabaseClient,
  change: any,
  peptide: any,
  source: any,
  userId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const field = change.field_name;
    if (!field || !change.new_value) return { success: false, error: "No field or value" };

    // Build the before snapshot (just the affected field)
    const beforeSnapshot: Record<string, any> = { [field]: peptide[field] || null };

    // Build the update
    const update: Record<string, any> = {};

    if (change.change_type === "new_reference") {
      // References go to peptide_references table, not peptides
      const { error } = await sb.from("peptide_references").insert({
        peptide_id: peptide.id,
        pmid: change.metadata?.pmid || null,
        title: `Referência via ${source?.name || "sync"}`,
        source: source?.name || "auto-update",
      });
      if (error) return { success: false, error: error.message };
    } else {
      // Direct field update on peptides table
      update[field] = change.new_value;
      update.updated_at = new Date().toISOString();

      // Merge source_origins
      const currentOrigins = peptide.source_origins || [];
      if (source?.name && !currentOrigins.includes(source.name)) {
        update.source_origins = [...currentOrigins, source.name];
      }

      update.last_synced_at = new Date().toISOString();

      const { error } = await sb.from("peptides").update(update).eq("id", peptide.id);
      if (error) return { success: false, error: error.message };
    }

    // Record in change history
    const afterSnapshot: Record<string, any> = { [field]: change.new_value };
    await sb.from("peptide_change_history").insert({
      peptide_id: peptide.id,
      change_origin: "auto_update",
      change_summary: `Auto-update: ${field} via ${source?.name || "sync"}`,
      before_snapshot: beforeSnapshot,
      after_snapshot: afterSnapshot,
      applied_by: userId,
    });

    // Mark detected_change as applied
    await sb.from("detected_changes").update({
      status: "applied",
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    }).eq("id", change.id);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Recalculate peptide score ──

async function recalculateScore(sb: SupabaseClient, peptideId: string) {
  try {
    const { data: pep } = await sb.from("peptides").select("*").eq("id", peptideId).single();
    if (!pep) return;

    let score = 0;

    // Evidence: has description + mechanism
    if (pep.description) score += 10;
    if (pep.mechanism) score += 10;
    if (pep.mechanism_points?.length) score += 5;

    // Benefits
    if (pep.benefits?.length) score += Math.min(10, pep.benefits.length * 2);

    // Dosage data
    if (pep.dosage_info) score += 5;
    if (pep.dosage_table) score += 5;
    if (pep.protocol_phases) score += 5;

    // Sequence
    if (pep.sequence) score += 10;

    // References
    const { count: refCount } = await sb.from("peptide_references")
      .select("*", { count: "exact", head: true })
      .eq("peptide_id", peptideId);
    if (refCount && refCount > 0) score += Math.min(20, refCount * 2);

    // Structure
    if (pep.structure_info) score += 5;

    // External IDs
    if (pep.ncbi_protein_id) score += 3;
    if (pep.dramp_id) score += 3;
    if (pep.apd_id) score += 3;
    if (pep.peptipedia_id) score += 3;

    // Interactions
    if (pep.interactions) score += 5;

    // Source origins
    if (pep.source_origins?.length) score += Math.min(5, pep.source_origins.length);

    // Reconstitution
    if (pep.reconstitution) score += 3;

    // Cap at 100
    score = Math.min(100, score);

    await sb.from("peptides").update({ confidence_score: score }).eq("id", peptideId);
    console.log(`[AutoUpdate] Score recalculated for ${pep.name}: ${score}`);
  } catch (err: any) {
    console.error("[AutoUpdate] Score recalc error:", err.message);
  }
}
