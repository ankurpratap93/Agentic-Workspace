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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_generation_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          job_type: string
          project_id: string
          result: Json | null
          source_url: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          project_id: string
          result?: Json | null
          source_url?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          project_id?: string
          result?: Json | null
          source_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      azure_connections: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          organization_url: string
          pat_token_encrypted: string
          project_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          organization_url: string
          pat_token_encrypted: string
          project_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          organization_url?: string
          pat_token_encrypted?: string
          project_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bugs: {
        Row: {
          assigned_to: string | null
          azure_work_item_id: number | null
          bug_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          last_synced_at: string | null
          linked_test_case_ids: string[] | null
          priority: Database["public"]["Enums"]["test_case_priority"] | null
          project_id: string
          severity: Database["public"]["Enums"]["bug_severity"] | null
          status: Database["public"]["Enums"]["bug_status"] | null
          steps_to_reproduce: string | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          azure_work_item_id?: number | null
          bug_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          linked_test_case_ids?: string[] | null
          priority?: Database["public"]["Enums"]["test_case_priority"] | null
          project_id: string
          severity?: Database["public"]["Enums"]["bug_severity"] | null
          status?: Database["public"]["Enums"]["bug_status"] | null
          steps_to_reproduce?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          azure_work_item_id?: number | null
          bug_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          linked_test_case_ids?: string[] | null
          priority?: Database["public"]["Enums"]["test_case_priority"] | null
          project_id?: string
          severity?: Database["public"]["Enums"]["bug_severity"] | null
          status?: Database["public"]["Enums"]["bug_status"] | null
          steps_to_reproduce?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bugs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          organization: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          azure_project_name: string | null
          bugs_count: number | null
          created_at: string
          created_by: string | null
          description: string | null
          figma_url: string | null
          id: string
          modules_count: number | null
          name: string
          test_cases_count: number | null
          updated_at: string
          web_url: string | null
        }
        Insert: {
          azure_project_name?: string | null
          bugs_count?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          figma_url?: string | null
          id?: string
          modules_count?: number | null
          name: string
          test_cases_count?: number | null
          updated_at?: string
          web_url?: string | null
        }
        Update: {
          azure_project_name?: string | null
          bugs_count?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          figma_url?: string | null
          id?: string
          modules_count?: number | null
          name?: string
          test_cases_count?: number | null
          updated_at?: string
          web_url?: string | null
        }
        Relationships: []
      }
      test_case_versions: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string
          data: Json
          id: string
          test_case_id: string
          version: number
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          data: Json
          id?: string
          test_case_id: string
          version: number
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          data?: Json
          id?: string
          test_case_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_case_versions_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      test_cases: {
        Row: {
          automation_feasibility: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          expected_result: string | null
          id: string
          preconditions: string | null
          priority: Database["public"]["Enums"]["test_case_priority"] | null
          project_id: string
          source: Database["public"]["Enums"]["test_case_source"] | null
          status: Database["public"]["Enums"]["test_case_status"] | null
          steps: Json | null
          tags: string[] | null
          test_case_id: string
          test_type: Database["public"]["Enums"]["test_case_type"] | null
          title: string
          updated_at: string
          updated_by: string | null
          version: number | null
        }
        Insert: {
          automation_feasibility?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_result?: string | null
          id?: string
          preconditions?: string | null
          priority?: Database["public"]["Enums"]["test_case_priority"] | null
          project_id: string
          source?: Database["public"]["Enums"]["test_case_source"] | null
          status?: Database["public"]["Enums"]["test_case_status"] | null
          steps?: Json | null
          tags?: string[] | null
          test_case_id: string
          test_type?: Database["public"]["Enums"]["test_case_type"] | null
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          automation_feasibility?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_result?: string | null
          id?: string
          preconditions?: string | null
          priority?: Database["public"]["Enums"]["test_case_priority"] | null
          project_id?: string
          source?: Database["public"]["Enums"]["test_case_source"] | null
          status?: Database["public"]["Enums"]["test_case_status"] | null
          steps?: Json | null
          tags?: string[] | null
          test_case_id?: string
          test_type?: Database["public"]["Enums"]["test_case_type"] | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "qa_engineer" | "viewer"
      bug_severity: "low" | "medium" | "high" | "critical"
      bug_status: "new" | "active" | "resolved" | "closed"
      sync_status: "synced" | "pending" | "failed" | "not_synced"
      test_case_priority: "low" | "medium" | "high" | "critical"
      test_case_source:
        | "manual"
        | "figma"
        | "web_crawler"
        | "excel"
        | "ai_generated"
      test_case_status: "draft" | "approved" | "deprecated" | "in_review"
      test_case_type:
        | "functional"
        | "regression"
        | "integration"
        | "performance"
        | "security"
        | "usability"
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
      app_role: ["admin", "qa_engineer", "viewer"],
      bug_severity: ["low", "medium", "high", "critical"],
      bug_status: ["new", "active", "resolved", "closed"],
      sync_status: ["synced", "pending", "failed", "not_synced"],
      test_case_priority: ["low", "medium", "high", "critical"],
      test_case_source: [
        "manual",
        "figma",
        "web_crawler",
        "excel",
        "ai_generated",
      ],
      test_case_status: ["draft", "approved", "deprecated", "in_review"],
      test_case_type: [
        "functional",
        "regression",
        "integration",
        "performance",
        "security",
        "usability",
      ],
    },
  },
} as const
