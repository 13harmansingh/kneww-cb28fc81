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
      access_requests: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      ai_analysis_cache: {
        Row: {
          analysis: Json
          article_hash: string
          article_url: string
          created_at: string | null
          expires_at: string | null
          id: string
          model_version: string
        }
        Insert: {
          analysis: Json
          article_hash: string
          article_url: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          model_version?: string
        }
        Update: {
          analysis?: Json
          article_hash?: string
          article_url?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          model_version?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          previous_value: Json | null
          updated_at: string | null
          updated_by: string | null
          value: Json
          version: number | null
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          previous_value?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          value: Json
          version?: number | null
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          previous_value?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
          version?: number | null
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          article_id: string
          article_image: string | null
          article_title: string
          article_url: string | null
          bias: string | null
          category: string | null
          claims: Json | null
          country: string | null
          created_at: string
          id: string
          language: string | null
          ownership: string | null
          sentiment: string | null
          summary: string | null
          user_id: string
        }
        Insert: {
          article_id: string
          article_image?: string | null
          article_title: string
          article_url?: string | null
          bias?: string | null
          category?: string | null
          claims?: Json | null
          country?: string | null
          created_at?: string
          id?: string
          language?: string | null
          ownership?: string | null
          sentiment?: string | null
          summary?: string | null
          user_id: string
        }
        Update: {
          article_id?: string
          article_image?: string | null
          article_title?: string
          article_url?: string | null
          bias?: string | null
          category?: string | null
          claims?: Json | null
          country?: string | null
          created_at?: string
          id?: string
          language?: string | null
          ownership?: string | null
          sentiment?: string | null
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_newspaper: {
        Row: {
          articles: Json
          created_at: string | null
          generated_date: string
          generation_progress: Json | null
          generation_status: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          articles?: Json
          created_at?: string | null
          generated_date?: string
          generation_progress?: Json | null
          generation_status?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          articles?: Json
          created_at?: string | null
          generated_date?: string
          generation_progress?: Json | null
          generation_status?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned: boolean | null
          created_at: string | null
          display_name: string | null
          id: string
          principal_language: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean | null
          created_at?: string | null
          display_name?: string | null
          id: string
          principal_language?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          principal_language?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          category: string
          created_at: string | null
          id: string
          state: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          state: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      system_events: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          severity: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          severity?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          severity?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      telemetry_logs: {
        Row: {
          created_at: string | null
          endpoint: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          follow_type: string
          id: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string | null
          follow_type: string
          id?: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string | null
          follow_type?: string
          id?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          auto_translate: boolean | null
          created_at: string | null
          dark_mode: boolean | null
          default_language: string | null
          id: string
          preferred_categories: string[] | null
          show_ai_analysis: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_translate?: boolean | null
          created_at?: string | null
          dark_mode?: boolean | null
          default_language?: string | null
          id?: string
          preferred_categories?: string[] | null
          show_ai_analysis?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_translate?: boolean | null
          created_at?: string | null
          dark_mode?: boolean | null
          default_language?: string | null
          id?: string
          preferred_categories?: string[] | null
          show_ai_analysis?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      cleanup_old_telemetry_logs: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      send_notification: {
        Args: {
          _description: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "editor"
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
      app_role: ["admin", "user", "editor"],
    },
  },
} as const
