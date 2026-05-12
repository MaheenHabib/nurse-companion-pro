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
      alerts: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          patient_id: string | null
          severity: string
          source: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          patient_id?: string | null
          severity?: string
          source?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          patient_id?: string | null
          severity?: string
          source?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_queries: {
        Row: {
          ai_insight: string | null
          created_at: string
          doctor_response: string | null
          id: string
          nurse_id: string | null
          observation: string
          patient_id: string | null
          status: string | null
          urgency: string | null
        }
        Insert: {
          ai_insight?: string | null
          created_at?: string
          doctor_response?: string | null
          id?: string
          nurse_id?: string | null
          observation: string
          patient_id?: string | null
          status?: string | null
          urgency?: string | null
        }
        Update: {
          ai_insight?: string | null
          created_at?: string
          doctor_response?: string | null
          id?: string
          nurse_id?: string | null
          observation?: string
          patient_id?: string | null
          status?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_queries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      handovers: {
        Row: {
          created_at: string
          id: string
          narrative: string | null
          patient_id: string
          shift_from: string | null
          shift_to: string | null
          status: string
          structured: Json | null
          submitted_at: string | null
          submitted_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          narrative?: string | null
          patient_id: string
          shift_from?: string | null
          shift_to?: string | null
          status?: string
          structured?: Json | null
          submitted_at?: string | null
          submitted_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          narrative?: string | null
          patient_id?: string
          shift_from?: string | null
          shift_to?: string | null
          status?: string
          structured?: Json | null
          submitted_at?: string | null
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handovers_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          admission_date: string | null
          age: number | null
          allergies: string | null
          assigned_nurse_id: string | null
          attending_physician: string | null
          condition_notes: string | null
          created_at: string
          diagnosis: string | null
          full_name: string
          id: string
          mrn: string
          room: string | null
          sex: string | null
          status: string | null
          updated_at: string
          ward: string | null
        }
        Insert: {
          admission_date?: string | null
          age?: number | null
          allergies?: string | null
          assigned_nurse_id?: string | null
          attending_physician?: string | null
          condition_notes?: string | null
          created_at?: string
          diagnosis?: string | null
          full_name: string
          id?: string
          mrn: string
          room?: string | null
          sex?: string | null
          status?: string | null
          updated_at?: string
          ward?: string | null
        }
        Update: {
          admission_date?: string | null
          age?: number | null
          allergies?: string | null
          assigned_nurse_id?: string | null
          attending_physician?: string | null
          condition_notes?: string | null
          created_at?: string
          diagnosis?: string | null
          full_name?: string
          id?: string
          mrn?: string
          room?: string | null
          sex?: string | null
          status?: string | null
          updated_at?: string
          ward?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          notif_doctor_reply: boolean | null
          notif_handover: boolean | null
          notif_high_priority: boolean | null
          notif_vitals: boolean | null
          phone: string | null
          role: string | null
          shift: string | null
          theme_pref: string | null
          updated_at: string
          ward: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          notif_doctor_reply?: boolean | null
          notif_handover?: boolean | null
          notif_high_priority?: boolean | null
          notif_vitals?: boolean | null
          phone?: string | null
          role?: string | null
          shift?: string | null
          theme_pref?: string | null
          updated_at?: string
          ward?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          notif_doctor_reply?: boolean | null
          notif_handover?: boolean | null
          notif_high_priority?: boolean | null
          notif_vitals?: boolean | null
          phone?: string | null
          role?: string | null
          shift?: string | null
          theme_pref?: string | null
          updated_at?: string
          ward?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          due_at: string
          id: string
          patient_id: string
          priority: string
          status: string
          title: string
          type: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_at: string
          id?: string
          patient_id: string
          priority?: string
          status?: string
          title: string
          type?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_at?: string
          id?: string
          patient_id?: string
          priority?: string
          status?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vitals: {
        Row: {
          bp_dia: number | null
          bp_sys: number | null
          created_at: string
          hr: number | null
          id: string
          notes: string | null
          patient_id: string
          recorded_at: string
          recorded_by: string | null
          resp_rate: number | null
          spo2: number | null
          temp: number | null
        }
        Insert: {
          bp_dia?: number | null
          bp_sys?: number | null
          created_at?: string
          hr?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          recorded_at?: string
          recorded_by?: string | null
          resp_rate?: number | null
          spo2?: number | null
          temp?: number | null
        }
        Update: {
          bp_dia?: number | null
          bp_sys?: number | null
          created_at?: string
          hr?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          recorded_at?: string
          recorded_by?: string | null
          resp_rate?: number | null
          spo2?: number | null
          temp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vitals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "doctor" | "nurse"
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
      app_role: ["admin", "doctor", "nurse"],
    },
  },
} as const
