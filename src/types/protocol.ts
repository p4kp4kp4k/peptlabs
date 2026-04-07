import type { Json } from "@/integrations/supabase/types";

export interface Protocol {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  peptides: ProtocolPeptide[] | null;
  status: ProtocolStatus;
  created_at: string;
  updated_at: string;
}

export interface ProtocolPeptide {
  name: string;
  slug?: string;
  dose: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export type ProtocolStatus = "draft" | "active" | "completed" | "archived";

export interface ProtocolHistoryEntry {
  id: string;
  protocol_id: string;
  user_id: string;
  action: string;
  details: Json | null;
  created_at: string;
}
