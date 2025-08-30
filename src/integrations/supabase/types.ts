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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_archived: boolean
          name: string
          notes: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_archived?: boolean
          name: string
          notes?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_archived?: boolean
          name?: string
          notes?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      inspection_results: {
        Row: {
          created_at: string
          id: string
          inspection_data: Json | null
          member_id: string
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_data?: Json | null
          member_id: string
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inspection_data?: Json | null
          member_id?: string
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_results_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inspection_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_sessions: {
        Row: {
          anlass: string
          created_at: string
          end_time: string | null
          event_id: string | null
          id: string
          is_active: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          anlass: string
          created_at?: string
          end_time?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string
        }
        Update: {
          anlass?: string
          created_at?: string
          end_time?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string | null
          family_name_particle: string | null
          first_name: string
          id: string
          is_active: boolean
          join_year: number | null
          last_name: string
          nickname: string | null
          phone: string | null
          profile_photo: string | null
          rank: Database["public"]["Enums"]["member_rank"] | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          family_name_particle?: string | null
          first_name: string
          id?: string
          is_active?: boolean
          join_year?: number | null
          last_name: string
          nickname?: string | null
          phone?: string | null
          profile_photo?: string | null
          rank?: Database["public"]["Enums"]["member_rank"] | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          family_name_particle?: string | null
          first_name?: string
          id?: string
          is_active?: boolean
          join_year?: number | null
          last_name?: string
          nickname?: string | null
          phone?: string | null
          profile_photo?: string | null
          rank?: Database["public"]["Enums"]["member_rank"] | null
          updated_at?: string
        }
        Relationships: []
      }
      penalties: {
        Row: {
          amount: number
          assigned_by_user_id: string | null
          created_at: string
          created_time: string | null
          date: string
          event_id: string | null
          id: string
          location_latitude: number | null
          location_longitude: number | null
          member_id: string
          multiplier: number | null
          notes: string | null
          penalty_type_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          assigned_by_user_id?: string | null
          created_at?: string
          created_time?: string | null
          date?: string
          event_id?: string | null
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          member_id: string
          multiplier?: number | null
          notes?: string | null
          penalty_type_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          assigned_by_user_id?: string | null
          created_at?: string
          created_time?: string | null
          date?: string
          event_id?: string | null
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          member_id?: string
          multiplier?: number | null
          notes?: string | null
          penalty_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "penalties_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalties_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalties_penalty_type_id_fkey"
            columns: ["penalty_type_id"]
            isOneToOne: false
            referencedRelation: "penalty_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      penalty_catalog: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          has_multiplier: boolean
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          description?: string | null
          has_multiplier?: boolean
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          has_multiplier?: boolean
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          is_oberadmin: boolean
          member_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_oberadmin?: boolean
          member_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_oberadmin?: boolean
          member_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_active_event: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          end_date: string
          id: string
          is_archived: boolean
          name: string
          notes: string
          start_date: string
          updated_at: string
        }[]
      }
      get_user_profile: {
        Args: { _user_id: string }
        Returns: {
          is_chargierte: boolean
          is_oberadmin: boolean
          member_data: Json
          member_id: string
          user_id: string
        }[]
      }
      has_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      link_user_to_member_on_signup: {
        Args: { _is_oberadmin?: boolean; _member_id: string; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      member_rank:
        | "rekrut"
        | "schuetze"
        | "gefreiter"
        | "obergefreiter"
        | "unteroffizier"
        | "feldwebel"
        | "oberfeldwebel"
        | "leutnant"
        | "oberleutnant"
        | "hauptmann"
        | "major"
        | "oberst"
        | "gastschuetze"
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
      member_rank: [
        "rekrut",
        "schuetze",
        "gefreiter",
        "obergefreiter",
        "unteroffizier",
        "feldwebel",
        "oberfeldwebel",
        "leutnant",
        "oberleutnant",
        "hauptmann",
        "major",
        "oberst",
        "gastschuetze",
      ],
    },
  },
} as const
