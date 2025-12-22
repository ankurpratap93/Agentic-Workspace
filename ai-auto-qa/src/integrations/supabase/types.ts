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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      discovered_pages: {
        Row: {
          discovered_at: string
          forms_count: number | null
          id: string
          links_count: number | null
          page_type: string | null
          test_run_id: string
          title: string | null
          url: string
        }
        Insert: {
          discovered_at?: string
          forms_count?: number | null
          id?: string
          links_count?: number | null
          page_type?: string | null
          test_run_id: string
          title?: string | null
          url: string
        }
        Update: {
          discovered_at?: string
          forms_count?: number | null
          id?: string
          links_count?: number | null
          page_type?: string | null
          test_run_id?: string
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovered_pages_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_cases: {
        Row: {
          created_at: string
          description: string | null
          error_message: string | null
          execution_time: number | null
          expected_result: string | null
          id: string
          page_id: string | null
          severity: string | null
          status: string
          test_data: string | null
          test_name: string
          test_run_id: string
          test_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          error_message?: string | null
          execution_time?: number | null
          expected_result?: string | null
          id?: string
          page_id?: string | null
          severity?: string | null
          status?: string
          test_data?: string | null
          test_name: string
          test_run_id: string
          test_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          error_message?: string | null
          execution_time?: number | null
          expected_result?: string | null
          id?: string
          page_id?: string | null
          severity?: string | null
          status?: string
          test_data?: string | null
          test_name?: string
          test_run_id?: string
          test_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "discovered_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_cases_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_insights: {
        Row: {
          affected_pages: string[] | null
          created_at: string
          description: string
          id: string
          insight_type: string
          severity: string
          test_run_id: string
          title: string
        }
        Insert: {
          affected_pages?: string[] | null
          created_at?: string
          description: string
          id?: string
          insight_type: string
          severity: string
          test_run_id: string
          title: string
        }
        Update: {
          affected_pages?: string[] | null
          created_at?: string
          description?: string
          id?: string
          insight_type?: string
          severity?: string
          test_run_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_insights_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_recording_steps: {
        Row: {
          action_description: string
          action_type: string
          actual_result: string | null
          element_selector: string | null
          execution_time: number | null
          expected_result: string | null
          id: string
          input_data: Json | null
          narration_url: string | null
          recording_id: string
          screenshot_url: string | null
          status: string
          step_number: number
          test_case_id: string | null
          timestamp: string
        }
        Insert: {
          action_description: string
          action_type: string
          actual_result?: string | null
          element_selector?: string | null
          execution_time?: number | null
          expected_result?: string | null
          id?: string
          input_data?: Json | null
          narration_url?: string | null
          recording_id: string
          screenshot_url?: string | null
          status?: string
          step_number: number
          test_case_id?: string | null
          timestamp?: string
        }
        Update: {
          action_description?: string
          action_type?: string
          actual_result?: string | null
          element_selector?: string | null
          execution_time?: number | null
          expected_result?: string | null
          id?: string
          input_data?: Json | null
          narration_url?: string | null
          recording_id?: string
          screenshot_url?: string | null
          status?: string
          step_number?: number
          test_case_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_recording_steps_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "test_recordings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_recording_steps_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      test_recordings: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          duration: number | null
          id: string
          name: string
          narration_enabled: boolean | null
          status: string
          test_run_id: string
          total_steps: number | null
          video_url: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          name: string
          narration_enabled?: boolean | null
          status?: string
          test_run_id: string
          total_steps?: number | null
          video_url?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          name?: string
          narration_enabled?: boolean | null
          status?: string
          test_run_id?: string
          total_steps?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_recordings_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_runs: {
        Row: {
          browser: string | null
          completed_at: string | null
          created_at: string
          depth: string | null
          execution_time: number | null
          failed_tests: number | null
          framework: string
          headless: boolean | null
          id: string
          passed_tests: number | null
          started_at: string
          status: string
          total_pages: number | null
          total_tests: number | null
          url: string
          username: string | null
        }
        Insert: {
          browser?: string | null
          completed_at?: string | null
          created_at?: string
          depth?: string | null
          execution_time?: number | null
          failed_tests?: number | null
          framework?: string
          headless?: boolean | null
          id?: string
          passed_tests?: number | null
          started_at?: string
          status?: string
          total_pages?: number | null
          total_tests?: number | null
          url: string
          username?: string | null
        }
        Update: {
          browser?: string | null
          completed_at?: string | null
          created_at?: string
          depth?: string | null
          execution_time?: number | null
          failed_tests?: number | null
          framework?: string
          headless?: boolean | null
          id?: string
          passed_tests?: number | null
          started_at?: string
          status?: string
          total_pages?: number | null
          total_tests?: number | null
          url?: string
          username?: string | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const
