/**
 * auto-apply-suggestions
 * ======================
 * Fetches all open audit findings, calls suggest-correction for each,
 * and auto-applies suggestions with high confidence.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const minConfidence = body.min_confidence ?? 60;
    const dryRun = body.dry_run ?? false;

    // Get all open findings with peptide data
    const { data: findings, error: fErr } = await admin
      .from("audit_findings")
      .select("id, category, severity, peptide_id, audit_run_id, description, value_a, value_b, source_a, source_b, peptides(name, alternative_names, sequence, source_origins, scientific_references, mechanism)")
      .eq("status", "open")
      .order("created_at", { ascending: true });

    if (fErr) throw fErr;
    if (!findings || findings.length === 0) {
      return new Response(JSON.stringify({ applied: 0, skipped: 0, errors: 0, message: "Nenhum finding aberto" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[auto-apply] Processing ${findings.length} open findings (min_confidence: ${minConfidence}, dry_run: ${dryRun})`);

    let applied = 0;
    let skipped = 0;
    let errors = 0;
    const details: any[] = [];

    // Categories that support auto-suggestions
    const supportedCategories = ["missing_sequence", "no_references", "no_source", "incomplete_data", "cross_source_conflict", "no_protocol"];

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (const finding of findings) {
      if (!supportedCategories.includes(finding.category)) {
        skipped++;
        continue;
      }

      const peptide = (finding as any).peptides;
      if (!peptide || !finding.peptide_id) {
        skipped++;
        continue;
      }

      // Check if data already exists (stale finding)
      if (isAlreadyResolved(finding.category, peptide)) {
        // Auto-resolve stale finding
        await admin.from("audit_findings").update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolution_note: "Auto-resolvido: condição não se reproduz nos dados atuais.",
        }).eq("id", finding.id);
        applied++;
        details.push({ finding_id: finding.id, peptide: peptide.name, action: "auto_resolved_stale" });
        continue;
      }

      try {
        // Rate-limit: wait between calls to avoid 429
        await delay(1500);
        // Call suggest-correction to get a suggestion
        const suggestPayload: Record<string, any> = {
          peptide_name: peptide.name,
          peptide_id: finding.peptide_id,
          category: finding.category,
          aliases: peptide.alternative_names || [],
        };
        // Pass finding metadata for cross_source_conflict
        if (finding.category === "cross_source_conflict") {
          suggestPayload.finding_data = {
            value_a: finding.value_a,
            value_b: finding.value_b,
            source_a: finding.source_a,
            source_b: finding.source_b,
            title: (finding as any).title,
            description: finding.description,
          };
        }
        const suggestRes = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/suggest-correction`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify(suggestPayload),
            signal: AbortSignal.timeout(30000),
          }
        );

        if (!suggestRes.ok) {
          console.log(`[auto-apply] suggest-correction failed for ${peptide.name}: ${suggestRes.status}`);
          errors++;
          continue;
        }

        const suggestData = await suggestRes.json();
        const suggestion = suggestData?.suggestion;

        if (!suggestion) {
          skipped++;
          details.push({ finding_id: finding.id, peptide: peptide.name, action: "no_suggestion" });
          continue;
        }

        if (suggestion.confidence < minConfidence) {
          skipped++;
          details.push({ finding_id: finding.id, peptide: peptide.name, action: "low_confidence", confidence: suggestion.confidence });
          continue;
        }

        // Block source_origins without real evidence
        if (suggestion.field === "source_origins" && !suggestion.source_id) {
          skipped++;
          continue;
        }

        if (dryRun) {
          applied++;
          details.push({ finding_id: finding.id, peptide: peptide.name, action: "would_apply", field: suggestion.field, confidence: suggestion.confidence, source: suggestion.source });
          continue;
        }

        // Apply the suggestion
        const VALID_FIELDS = new Set([
          "name","slug","category","description","benefits","dosage_info","side_effects",
          "mechanism","classification","half_life","reconstitution","alternative_names",
          "timeline","dosage_table","protocol_phases","reconstitution_steps","mechanism_points",
          "interactions","stacks","scientific_references","goals","application","sequence",
          "sequence_length","organism","biological_activity","structure_info","source_origins",
          "confidence_score","ncbi_protein_id","dramp_id","apd_id","peptipedia_id",
          "tier","access_level","evidence_level",
        ]);
        if (!VALID_FIELDS.has(suggestion.field)) {
          console.log(`[auto-apply] SKIP invalid field "${suggestion.field}" for ${peptide.name}`);
          skipped++;
          details.push({ finding_id: finding.id, peptide: peptide.name, action: "invalid_field", field: suggestion.field });
          continue;
        }

        const currentValue = (peptide as any)[suggestion.field] || null;
        const updatePayload: Record<string, any> = {};

        if (suggestion.change_type === "merge" && Array.isArray(currentValue)) {
          const toAdd = Array.isArray(suggestion.proposed_value) ? suggestion.proposed_value : [suggestion.proposed_value];
          updatePayload[suggestion.field] = [...currentValue, ...toAdd.filter((v: any) => !currentValue.includes(v))];
        } else if (suggestion.change_type === "merge" && suggestion.field === "scientific_references") {
          const current = currentValue || [];
          updatePayload[suggestion.field] = Array.isArray(suggestion.proposed_value)
            ? [...current, ...suggestion.proposed_value]
            : current;
        } else {
          updatePayload[suggestion.field] = suggestion.proposed_value;
        }
        updatePayload["updated_at"] = new Date().toISOString();

        // Update peptide
        const { error: updateErr } = await admin.from("peptides").update(updatePayload).eq("id", finding.peptide_id);
        if (updateErr) {
          console.error(`[auto-apply] Update failed for ${peptide.name}:`, updateErr.message);
          errors++;
          continue;
        }

        // Record correction
        const { data: correctionData } = await admin.from("audit_corrections").insert({
          audit_run_id: finding.audit_run_id,
          finding_id: finding.id,
          peptide_id: finding.peptide_id,
          field_name: suggestion.field,
          correction_type: suggestion.change_type,
          old_value: JSON.stringify(currentValue),
          new_value: JSON.stringify(updatePayload[suggestion.field]),
          source_provider: suggestion.source,
          source_record_id: suggestion.source_id || null,
          confidence_score: suggestion.confidence,
          confidence_level: suggestion.confidence_level,
          approved_at: new Date().toISOString(),
          status: "applied",
          notes: "Auto-aplicado pelo sistema de sugestões automáticas",
        }).select("id").single();

        // Record change history
        await admin.from("peptide_change_history").insert({
          peptide_id: finding.peptide_id,
          change_origin: "auto_suggestion",
          change_summary: suggestion.description,
          before_snapshot: { [suggestion.field]: currentValue },
          after_snapshot: { [suggestion.field]: updatePayload[suggestion.field] },
          correction_id: correctionData?.id || null,
          applied_at: new Date().toISOString(),
        });

        // Resolve finding
        await admin.from("audit_findings").update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolution_note: `Auto-aplicado: ${suggestion.change_type} em ${suggestion.field} (${suggestion.source}, confiança ${suggestion.confidence}%)`,
        }).eq("id", finding.id);

        applied++;
        details.push({
          finding_id: finding.id,
          peptide: peptide.name,
          action: "applied",
          field: suggestion.field,
          confidence: suggestion.confidence,
          source: suggestion.source,
        });

        console.log(`[auto-apply] ✓ Applied ${suggestion.field} for ${peptide.name} (${suggestion.confidence}% from ${suggestion.source})`);

      } catch (e) {
        console.error(`[auto-apply] Error processing ${peptide.name}:`, e.message);
        errors++;
      }
    }

    const summary = { applied, skipped, errors, total: findings.length, dry_run: dryRun, details };
    console.log(`[auto-apply] Done: ${applied} applied, ${skipped} skipped, ${errors} errors`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[auto-apply] Fatal:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function isAlreadyResolved(category: string, peptide: any): boolean {
  switch (category) {
    case "missing_sequence":
      return Boolean(peptide.sequence?.trim());
    case "no_source":
      return Array.isArray(peptide.source_origins) && peptide.source_origins.length > 0;
    case "no_references":
      return Array.isArray(peptide.scientific_references) && peptide.scientific_references.length > 0;
    case "incomplete_data":
      return Boolean(peptide.mechanism?.trim());
    default:
      return false;
  }
}
