export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      billing_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          provider: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          provider: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          provider?: string
          user_id?: string
        }
        Relationships: []
      }
      calculations: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          input: Json
          output: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          input?: Json
          output?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          input?: Json
          output?: Json
          user_id?: string
        }
        Relationships: []
      }
      entitlements: {
        Row: {
          billing_type: string
          created_at: string
          current_period_end: string | null
          is_active: boolean
          limits: Json
          plan: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_type?: string
          created_at?: string
          current_period_end?: string | null
          is_active?: boolean
          limits?: Json
          plan?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_type?: string
          created_at?: string
          current_period_end?: string | null
          is_active?: boolean
          limits?: Json
          plan?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gateway_settings: {
        Row: {
          config: Json | null
          configured_at: string | null
          created_at: string
          environment: string | null
          id: string
          is_active: boolean | null
          provider: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          config?: Json | null
          configured_at?: string | null
          created_at?: string
          environment?: string | null
          id?: string
          is_active?: boolean | null
          provider: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          config?: Json | null
          configured_at?: string | null
          created_at?: string
          environment?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      history: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["history_kind"]
          metadata: Json | null
          ref_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["history_kind"]
          metadata?: Json | null
          ref_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["history_kind"]
          metadata?: Json | null
          ref_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          mp_order_id: string | null
          payment_method: string
          payment_status: string
          product_id: string | null
          quantity: number
          total_amount: number
          updated_at: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          mp_order_id?: string | null
          payment_method?: string
          payment_status?: string
          product_id?: string | null
          quantity?: number
          total_amount?: number
          updated_at?: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          mp_order_id?: string | null
          payment_method?: string
          payment_status?: string
          product_id?: string | null
          quantity?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      peptide_references: {
        Row: {
          abstract_text: string | null
          authors: string[] | null
          created_at: string
          doi: string | null
          id: string
          journal: string | null
          peptide_id: string
          pmid: string | null
          source: string
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          abstract_text?: string | null
          authors?: string[] | null
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string | null
          peptide_id: string
          pmid?: string | null
          source?: string
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          abstract_text?: string | null
          authors?: string[] | null
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string | null
          peptide_id?: string
          pmid?: string | null
          source?: string
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "peptide_references_peptide_id_fkey"
            columns: ["peptide_id"]
            isOneToOne: false
            referencedRelation: "peptides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peptide_references_peptide_id_fkey"
            columns: ["peptide_id"]
            isOneToOne: false
            referencedRelation: "v_peptides_visible"
            referencedColumns: ["id"]
          },
        ]
      }
      peptides: {
        Row: {
          access_level: string
          alternative_names: string[] | null
          apd_id: string | null
          application: string | null
          benefits: string[] | null
          biological_activity: string[] | null
          category: string
          classification: string | null
          confidence_score: number | null
          created_at: string
          description: string | null
          dosage_info: string | null
          dosage_table: Json | null
          dramp_id: string | null
          evidence_level: string | null
          goals: string[] | null
          half_life: string | null
          id: string
          interactions: Json | null
          last_synced_at: string | null
          mechanism: string | null
          mechanism_points: string[] | null
          name: string
          ncbi_protein_id: string | null
          organism: string | null
          peptipedia_id: string | null
          protocol_phases: Json | null
          reconstitution: string | null
          reconstitution_steps: string[] | null
          scientific_references: Json | null
          sequence: string | null
          sequence_length: number | null
          side_effects: string | null
          slug: string
          source_origins: string[] | null
          stacks: Json | null
          structure_info: Json | null
          tier: string
          timeline: Json | null
          updated_at: string
        }
        Insert: {
          access_level?: string
          alternative_names?: string[] | null
          apd_id?: string | null
          application?: string | null
          benefits?: string[] | null
          biological_activity?: string[] | null
          category: string
          classification?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          dosage_info?: string | null
          dosage_table?: Json | null
          dramp_id?: string | null
          evidence_level?: string | null
          goals?: string[] | null
          half_life?: string | null
          id?: string
          interactions?: Json | null
          last_synced_at?: string | null
          mechanism?: string | null
          mechanism_points?: string[] | null
          name: string
          ncbi_protein_id?: string | null
          organism?: string | null
          peptipedia_id?: string | null
          protocol_phases?: Json | null
          reconstitution?: string | null
          reconstitution_steps?: string[] | null
          scientific_references?: Json | null
          sequence?: string | null
          sequence_length?: number | null
          side_effects?: string | null
          slug: string
          source_origins?: string[] | null
          stacks?: Json | null
          structure_info?: Json | null
          tier?: string
          timeline?: Json | null
          updated_at?: string
        }
        Update: {
          access_level?: string
          alternative_names?: string[] | null
          apd_id?: string | null
          application?: string | null
          benefits?: string[] | null
          biological_activity?: string[] | null
          category?: string
          classification?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          dosage_info?: string | null
          dosage_table?: Json | null
          dramp_id?: string | null
          evidence_level?: string | null
          goals?: string[] | null
          half_life?: string | null
          id?: string
          interactions?: Json | null
          last_synced_at?: string | null
          mechanism?: string | null
          mechanism_points?: string[] | null
          name?: string
          ncbi_protein_id?: string | null
          organism?: string | null
          peptipedia_id?: string | null
          protocol_phases?: Json | null
          reconstitution?: string | null
          reconstitution_steps?: string[] | null
          scientific_references?: Json | null
          sequence?: string | null
          sequence_length?: number | null
          side_effects?: string | null
          slug?: string
          source_origins?: string[] | null
          stacks?: Json | null
          structure_info?: Json | null
          tier?: string
          timeline?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      plan_links: {
        Row: {
          checkout_url: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          plan_id: string
          updated_at: string
        }
        Insert: {
          checkout_url: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          plan_id: string
          updated_at?: string
        }
        Update: {
          checkout_url?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          plan_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          color_hex: string | null
          color_name: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          price: number
          product_id: string
          stock: number
          updated_at: string
        }
        Insert: {
          color_hex?: string | null
          color_name: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          product_id: string
          stock?: number
          updated_at?: string
        }
        Update: {
          color_hex?: string | null
          color_name?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          product_id?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          flagged_at: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          flagged_at?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          flagged_at?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      protocol_history: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          protocol_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          protocol_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          protocol_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_history_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_templates: {
        Row: {
          access_level: string
          category: string | null
          content: Json
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          access_level?: string
          category?: string | null
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          access_level?: string
          category?: string | null
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      protocols: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          peptides: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          peptides?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          peptides?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string
          goals: Json
          id: string
          notes: string | null
          recommended_peptides: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          goals: Json
          id?: string
          notes?: string | null
          recommended_peptides: Json
          user_id: string
        }
        Update: {
          created_at?: string
          goals?: Json
          id?: string
          notes?: string | null
          recommended_peptides?: Json
          user_id?: string
        }
        Relationships: []
      }
      stacks: {
        Row: {
          benefits: string[] | null
          category: string
          created_at: string
          deleted_at: string | null
          description: string | null
          duration: string | null
          icon: string | null
          id: string
          name: string
          peptides: Json
          subtitle: string | null
          timing: string | null
          updated_at: string
          warnings: string[] | null
        }
        Insert: {
          benefits?: string[] | null
          category: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration?: string | null
          icon?: string | null
          id?: string
          name: string
          peptides?: Json
          subtitle?: string | null
          timing?: string | null
          updated_at?: string
          warnings?: string[] | null
        }
        Update: {
          benefits?: string[] | null
          category?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration?: string | null
          icon?: string | null
          id?: string
          name?: string
          peptides?: Json
          subtitle?: string | null
          timing?: string | null
          updated_at?: string
          warnings?: string[] | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          id: string
          payment_provider: string | null
          plan_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          payment_provider?: string | null
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          payment_provider?: string | null
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_log: {
        Row: {
          completed_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          records_added: number | null
          records_processed: number | null
          records_updated: number | null
          source: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          records_added?: number | null
          records_processed?: number | null
          records_updated?: number | null
          source: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          records_added?: number | null
          records_processed?: number | null
          records_updated?: number | null
          source?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          calcs_made: number
          comparisons_made: number
          exports_made: number
          interactions_checked: number
          month: string
          protocols_created: number
          stacks_viewed: number
          templates_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calcs_made?: number
          comparisons_made?: number
          exports_made?: number
          interactions_checked?: number
          month: string
          protocols_created?: number
          stacks_viewed?: number
          templates_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calcs_made?: number
          comparisons_made?: number
          exports_made?: number
          interactions_checked?: number
          month?: string
          protocols_created?: number
          stacks_viewed?: number
          templates_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
          provider: string
          provider_event_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          provider: string
          provider_event_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          provider?: string
          provider_event_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_peptides_visible: {
        Row: {
          access_level: string | null
          alternative_names: string[] | null
          apd_id: string | null
          application: string | null
          benefits: string[] | null
          biological_activity: string[] | null
          category: string | null
          classification: string | null
          confidence_score: number | null
          created_at: string | null
          description: string | null
          dosage_info: string | null
          dosage_table: Json | null
          dramp_id: string | null
          evidence_level: string | null
          goals: string[] | null
          half_life: string | null
          id: string | null
          interactions: Json | null
          last_synced_at: string | null
          mechanism: string | null
          mechanism_points: string[] | null
          name: string | null
          ncbi_protein_id: string | null
          organism: string | null
          peptipedia_id: string | null
          protocol_phases: Json | null
          reconstitution: string | null
          reconstitution_steps: string[] | null
          scientific_references: Json | null
          sequence: string | null
          sequence_length: number | null
          side_effects: string | null
          slug: string | null
          source_origins: string[] | null
          stacks: Json | null
          structure_info: Json | null
          tier: string | null
          timeline: Json | null
          updated_at: string | null
        }
        Insert: {
          access_level?: string | null
          alternative_names?: string[] | null
          apd_id?: string | null
          application?: string | null
          benefits?: string[] | null
          biological_activity?: string[] | null
          category?: string | null
          classification?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          dosage_info?: string | null
          dosage_table?: Json | null
          dramp_id?: string | null
          evidence_level?: string | null
          goals?: string[] | null
          half_life?: string | null
          id?: string | null
          interactions?: Json | null
          last_synced_at?: string | null
          mechanism?: string | null
          mechanism_points?: string[] | null
          name?: string | null
          ncbi_protein_id?: string | null
          organism?: string | null
          peptipedia_id?: string | null
          protocol_phases?: Json | null
          reconstitution?: string | null
          reconstitution_steps?: string[] | null
          scientific_references?: Json | null
          sequence?: string | null
          sequence_length?: number | null
          side_effects?: string | null
          slug?: string | null
          source_origins?: string[] | null
          stacks?: Json | null
          structure_info?: Json | null
          tier?: string | null
          timeline?: Json | null
          updated_at?: string | null
        }
        Update: {
          access_level?: string | null
          alternative_names?: string[] | null
          apd_id?: string | null
          application?: string | null
          benefits?: string[] | null
          biological_activity?: string[] | null
          category?: string | null
          classification?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          dosage_info?: string | null
          dosage_table?: Json | null
          dramp_id?: string | null
          evidence_level?: string | null
          goals?: string[] | null
          half_life?: string | null
          id?: string | null
          interactions?: Json | null
          last_synced_at?: string | null
          mechanism?: string | null
          mechanism_points?: string[] | null
          name?: string | null
          ncbi_protein_id?: string | null
          organism?: string | null
          peptipedia_id?: string | null
          protocol_phases?: Json | null
          reconstitution?: string | null
          reconstitution_steps?: string[] | null
          scientific_references?: Json | null
          sequence?: string | null
          sequence_length?: number | null
          side_effects?: string | null
          slug?: string | null
          source_origins?: string[] | null
          stacks?: Json | null
          structure_info?: Json | null
          tier?: string | null
          timeline?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      decrement_stock_safe: {
        Args: { p_quantity: number; p_variant_id: string }
        Returns: number
      }
      has_role:
        | {
            Args: { _role: Database["public"]["Enums"]["app_role"] }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      is_pro: { Args: never; Returns: boolean }
      is_starter_or_above: { Args: never; Returns: boolean }
    }
    Enums: {
      access_level: "starter" | "pro"
      app_role: "admin" | "user"
      content_tier: "essential" | "advanced"
      history_kind:
        | "protocol"
        | "stack"
        | "calculation"
        | "compare"
        | "ai"
        | "premium_gate"
        | "security"
      plan_tier: "free" | "starter" | "pro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_level: ["starter", "pro"],
      app_role: ["admin", "user"],
      content_tier: ["essential", "advanced"],
      history_kind: [
        "protocol",
        "stack",
        "calculation",
        "compare",
        "ai",
        "premium_gate",
        "security",
      ],
      plan_tier: ["free", "starter", "pro"],
    },
  },
} as const
