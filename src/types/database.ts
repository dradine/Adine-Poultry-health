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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assay_kits: {
        Row: {
          assay_type: string
          breakthrough_titer: number | null
          breakthrough_unit: string | null
          catalog_number: string | null
          created_at: string
          dilution_factor: number | null
          disease_code: string
          formula_spec: Json
          id: string
          kit_name: string
          kit_version: string | null
          manufacturer: string
          minimum_sample_count: number | null
          protocol_version: string | null
          reference_url: string | null
          result_units: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_document: string | null
          source_document_hash: string | null
          source_version: string | null
          species: string
          target_antigen: string | null
          validation_status: string
          wavelength_nm: number | null
        }
        Insert: {
          assay_type: string
          breakthrough_titer?: number | null
          breakthrough_unit?: string | null
          catalog_number?: string | null
          created_at?: string
          dilution_factor?: number | null
          disease_code: string
          formula_spec?: Json
          id?: string
          kit_name: string
          kit_version?: string | null
          manufacturer: string
          minimum_sample_count?: number | null
          protocol_version?: string | null
          reference_url?: string | null
          result_units?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_document?: string | null
          source_document_hash?: string | null
          source_version?: string | null
          species?: string
          target_antigen?: string | null
          validation_status?: string
          wavelength_nm?: number | null
        }
        Update: {
          assay_type?: string
          breakthrough_titer?: number | null
          breakthrough_unit?: string | null
          catalog_number?: string | null
          created_at?: string
          dilution_factor?: number | null
          disease_code?: string
          formula_spec?: Json
          id?: string
          kit_name?: string
          kit_version?: string | null
          manufacturer?: string
          minimum_sample_count?: number | null
          protocol_version?: string | null
          reference_url?: string | null
          result_units?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_document?: string | null
          source_document_hash?: string | null
          source_version?: string | null
          species?: string
          target_antigen?: string | null
          validation_status?: string
          wavelength_nm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assay_kits_disease_code_fkey"
            columns: ["disease_code"]
            isOneToOne: false
            referencedRelation: "diseases"
            referencedColumns: ["code"]
          },
        ]
      }
      diseases: {
        Row: {
          code: string
          created_at: string
          is_active: boolean
          name_en: string
          name_fa: string
        }
        Insert: {
          code: string
          created_at?: string
          is_active?: boolean
          name_en: string
          name_fa: string
        }
        Update: {
          code?: string
          created_at?: string
          is_active?: boolean
          name_en?: string
          name_fa?: string
        }
        Relationships: []
      }
      flocks: {
        Row: {
          bird_count: number | null
          breed: string | null
          created_at: string
          flock_name: string
          hatch_date: string | null
          id: string
          location_label: string | null
          notes: string | null
          owner_id: string
          placement_date: string
          species: string
          timezone: string
          updated_at: string
        }
        Insert: {
          bird_count?: number | null
          breed?: string | null
          created_at?: string
          flock_name: string
          hatch_date?: string | null
          id?: string
          location_label?: string | null
          notes?: string | null
          owner_id?: string
          placement_date: string
          species?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          bird_count?: number | null
          breed?: string | null
          created_at?: string
          flock_name?: string
          hatch_date?: string | null
          id?: string
          location_label?: string | null
          notes?: string | null
          owner_id?: string
          placement_date?: string
          species?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      model_runs: {
        Row: {
          confidence_level: string
          created_at: string
          decision_status: string
          disease_code: string
          flock_id: string
          id: string
          input_schema_version: string | null
          input_snapshot: Json
          limitations: string[]
          model_assumptions: Json
          model_family: string
          model_version: string
          output_snapshot: Json
          owner_id: string
          qc_summary: Json
          reviewed_at: string | null
          reviewed_by: string | null
          source_references: Json
        }
        Insert: {
          confidence_level?: string
          created_at?: string
          decision_status?: string
          disease_code: string
          flock_id: string
          id?: string
          input_schema_version?: string | null
          input_snapshot: Json
          limitations?: string[]
          model_assumptions?: Json
          model_family: string
          model_version: string
          output_snapshot: Json
          owner_id?: string
          qc_summary?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_references?: Json
        }
        Update: {
          confidence_level?: string
          created_at?: string
          decision_status?: string
          disease_code?: string
          flock_id?: string
          id?: string
          input_schema_version?: string | null
          input_snapshot?: Json
          limitations?: string[]
          model_assumptions?: Json
          model_family?: string
          model_version?: string
          output_snapshot?: Json
          owner_id?: string
          qc_summary?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_references?: Json
        }
        Relationships: [
          {
            foreignKeyName: "model_runs_disease_code_fkey"
            columns: ["disease_code"]
            isOneToOne: false
            referencedRelation: "diseases"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "model_runs_flock_id_fkey"
            columns: ["flock_id"]
            isOneToOne: false
            referencedRelation: "flocks"
            referencedColumns: ["id"]
          },
        ]
      }
      serology_batches: {
        Row: {
          assay_kit_id: string | null
          assay_software_name: string | null
          assay_software_version: string | null
          assay_type: string
          created_at: string
          disease_code: string
          flock_id: string
          id: string
          ifu_version: string | null
          kit_lot: string | null
          laboratory_name: string | null
          negative_control_mean_od: number | null
          operator_label: string | null
          owner_id: string
          plate_id: string | null
          plate_reader_model: string | null
          plate_reader_serial: string | null
          positive_control_mean_od: number | null
          protocol_metadata: Json
          qc_notes: string | null
          qc_reviewed_at: string | null
          qc_reviewed_by: string | null
          qc_status: string
          reference_control_code: string | null
          reference_control_expected_max: number | null
          reference_control_expected_min: number | null
          reference_control_result: number | null
          sample_count: number
          sampling_age_days: number
          sampling_date: string
          updated_at: string
        }
        Insert: {
          assay_kit_id?: string | null
          assay_software_name?: string | null
          assay_software_version?: string | null
          assay_type: string
          created_at?: string
          disease_code: string
          flock_id: string
          id?: string
          ifu_version?: string | null
          kit_lot?: string | null
          laboratory_name?: string | null
          negative_control_mean_od?: number | null
          operator_label?: string | null
          owner_id?: string
          plate_id?: string | null
          plate_reader_model?: string | null
          plate_reader_serial?: string | null
          positive_control_mean_od?: number | null
          protocol_metadata?: Json
          qc_notes?: string | null
          qc_reviewed_at?: string | null
          qc_reviewed_by?: string | null
          qc_status?: string
          reference_control_code?: string | null
          reference_control_expected_max?: number | null
          reference_control_expected_min?: number | null
          reference_control_result?: number | null
          sample_count: number
          sampling_age_days: number
          sampling_date: string
          updated_at?: string
        }
        Update: {
          assay_kit_id?: string | null
          assay_software_name?: string | null
          assay_software_version?: string | null
          assay_type?: string
          created_at?: string
          disease_code?: string
          flock_id?: string
          id?: string
          ifu_version?: string | null
          kit_lot?: string | null
          laboratory_name?: string | null
          negative_control_mean_od?: number | null
          operator_label?: string | null
          owner_id?: string
          plate_id?: string | null
          plate_reader_model?: string | null
          plate_reader_serial?: string | null
          positive_control_mean_od?: number | null
          protocol_metadata?: Json
          qc_notes?: string | null
          qc_reviewed_at?: string | null
          qc_reviewed_by?: string | null
          qc_status?: string
          reference_control_code?: string | null
          reference_control_expected_max?: number | null
          reference_control_expected_min?: number | null
          reference_control_result?: number | null
          sample_count?: number
          sampling_age_days?: number
          sampling_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "serology_batches_assay_kit_id_fkey"
            columns: ["assay_kit_id"]
            isOneToOne: false
            referencedRelation: "assay_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serology_batches_disease_code_fkey"
            columns: ["disease_code"]
            isOneToOne: false
            referencedRelation: "diseases"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "serology_batches_flock_id_fkey"
            columns: ["flock_id"]
            isOneToOne: false
            referencedRelation: "flocks"
            referencedColumns: ["id"]
          },
        ]
      }
      serology_results: {
        Row: {
          batch_id: string
          created_at: string
          dilution_factor: number | null
          id: string
          owner_id: string
          raw_od: number | null
          raw_result: Json
          replicate_no: number | null
          reported_titer: number | null
          reported_titer_unit: string | null
          result_flags: string[] | null
          result_status: string
          sample_code: string
          sn_ratio: number | null
          sp_ratio: number | null
          titer_log2: number | null
          well_position: string | null
        }
        Insert: {
          batch_id: string
          created_at?: string
          dilution_factor?: number | null
          id?: string
          owner_id?: string
          raw_od?: number | null
          raw_result?: Json
          replicate_no?: number | null
          reported_titer?: number | null
          reported_titer_unit?: string | null
          result_flags?: string[] | null
          result_status?: string
          sample_code: string
          sn_ratio?: number | null
          sp_ratio?: number | null
          titer_log2?: number | null
          well_position?: string | null
        }
        Update: {
          batch_id?: string
          created_at?: string
          dilution_factor?: number | null
          id?: string
          owner_id?: string
          raw_od?: number | null
          raw_result?: Json
          replicate_no?: number | null
          reported_titer?: number | null
          reported_titer_unit?: string | null
          result_flags?: string[] | null
          result_status?: string
          sample_code?: string
          sn_ratio?: number | null
          sp_ratio?: number | null
          titer_log2?: number | null
          well_position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serology_results_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "serology_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccine_products: {
        Row: {
          breakthrough_titer: number | null
          breakthrough_unit: string | null
          btt_assay_kit_id: string | null
          btt_definition: string | null
          btt_reference_url: string | null
          created_at: string
          deventer_minimum_sample_count: number | null
          deventer_sample_size_basis: string | null
          disease_code: string
          duration_of_immunity_weeks: number | null
          id: string
          label_version: string | null
          manufacturer: string
          market_code: string | null
          marketing_authorisation_holder: string | null
          model_family: string
          onset_of_immunity_days: number | null
          platform: string
          product_name: string
          registration_number: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_document: string | null
          source_version: string | null
          strain: string | null
          vaccine_age_max_days: number | null
          vaccine_age_min_days: number | null
          vaccine_class: string | null
          vaccine_route: string | null
          validation_status: string
        }
        Insert: {
          breakthrough_titer?: number | null
          breakthrough_unit?: string | null
          btt_assay_kit_id?: string | null
          btt_definition?: string | null
          btt_reference_url?: string | null
          created_at?: string
          deventer_minimum_sample_count?: number | null
          deventer_sample_size_basis?: string | null
          disease_code: string
          duration_of_immunity_weeks?: number | null
          id?: string
          label_version?: string | null
          manufacturer: string
          market_code?: string | null
          marketing_authorisation_holder?: string | null
          model_family?: string
          onset_of_immunity_days?: number | null
          platform: string
          product_name: string
          registration_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_document?: string | null
          source_version?: string | null
          strain?: string | null
          vaccine_age_max_days?: number | null
          vaccine_age_min_days?: number | null
          vaccine_class?: string | null
          vaccine_route?: string | null
          validation_status?: string
        }
        Update: {
          breakthrough_titer?: number | null
          breakthrough_unit?: string | null
          btt_assay_kit_id?: string | null
          btt_definition?: string | null
          btt_reference_url?: string | null
          created_at?: string
          deventer_minimum_sample_count?: number | null
          deventer_sample_size_basis?: string | null
          disease_code?: string
          duration_of_immunity_weeks?: number | null
          id?: string
          label_version?: string | null
          manufacturer?: string
          market_code?: string | null
          marketing_authorisation_holder?: string | null
          model_family?: string
          onset_of_immunity_days?: number | null
          platform?: string
          product_name?: string
          registration_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_document?: string | null
          source_version?: string | null
          strain?: string | null
          vaccine_age_max_days?: number | null
          vaccine_age_min_days?: number | null
          vaccine_class?: string | null
          vaccine_route?: string | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccine_products_btt_assay_kit_id_fkey"
            columns: ["btt_assay_kit_id"]
            isOneToOne: false
            referencedRelation: "assay_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccine_products_disease_code_fkey"
            columns: ["disease_code"]
            isOneToOne: false
            referencedRelation: "diseases"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
