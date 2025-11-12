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
      alerts: {
        Row: {
          ambulance_id: string
          audit_log: Json | null
          completed_at: string | null
          created_at: string | null
          decline_reason: string | null
          distance: number | null
          eta: number | null
          hospital_id: string
          id: string
          patient_age: number | null
          patient_complaint: string | null
          patient_contact: string | null
          patient_gender: string | null
          patient_name: string
          previous_hospital_ids: string[] | null
          required_equipment: string[] | null
          status: string
          timestamp: string | null
          triage_level: string
          updated_at: string | null
          vitals: Json
        }
        Insert: {
          ambulance_id: string
          audit_log?: Json | null
          completed_at?: string | null
          created_at?: string | null
          decline_reason?: string | null
          distance?: number | null
          eta?: number | null
          hospital_id: string
          id: string
          patient_age?: number | null
          patient_complaint?: string | null
          patient_contact?: string | null
          patient_gender?: string | null
          patient_name: string
          previous_hospital_ids?: string[] | null
          required_equipment?: string[] | null
          status?: string
          timestamp?: string | null
          triage_level: string
          updated_at?: string | null
          vitals: Json
        }
        Update: {
          ambulance_id?: string
          audit_log?: Json | null
          completed_at?: string | null
          created_at?: string | null
          decline_reason?: string | null
          distance?: number | null
          eta?: number | null
          hospital_id?: string
          id?: string
          patient_age?: number | null
          patient_complaint?: string | null
          patient_contact?: string | null
          patient_gender?: string | null
          patient_name?: string
          previous_hospital_ids?: string[] | null
          required_equipment?: string[] | null
          status?: string
          timestamp?: string | null
          triage_level?: string
          updated_at?: string | null
          vitals?: Json
        }
        Relationships: [
          {
            foreignKeyName: "alerts_ambulance_id_fkey"
            columns: ["ambulance_id"]
            isOneToOne: false
            referencedRelation: "ambulances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      ambulances: {
        Row: {
          ambulance_number: string
          contact: string | null
          created_at: string | null
          current_latitude: number | null
          current_longitude: number | null
          equipment: string[] | null
          id: string
          updated_at: string | null
        }
        Insert: {
          ambulance_number: string
          contact?: string | null
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          equipment?: string[] | null
          id: string
          updated_at?: string | null
        }
        Update: {
          ambulance_number?: string
          contact?: string | null
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          equipment?: string[] | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      app_users: {
        Row: {
          auth_uid: string | null
          created_at: string | null
          id: string
          linked_entity: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          username: string
        }
        Insert: {
          auth_uid?: string | null
          created_at?: string | null
          id?: string
          linked_entity?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          username: string
        }
        Update: {
          auth_uid?: string | null
          created_at?: string | null
          id?: string
          linked_entity?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      hospitals: {
        Row: {
          address: string
          contact: string | null
          created_at: string | null
          distance: number | null
          equipment: string[] | null
          id: string
          latitude: number
          longitude: number
          name: string
          specialties: string[] | null
          updated_at: string | null
        }
        Insert: {
          address: string
          contact?: string | null
          created_at?: string | null
          distance?: number | null
          equipment?: string[] | null
          id: string
          latitude: number
          longitude: number
          name: string
          specialties?: string[] | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          contact?: string | null
          created_at?: string | null
          distance?: number | null
          equipment?: string[] | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          specialties?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      live_vitals: {
        Row: {
          device_id: string
          hr_bpm: number | null
          spo2_pct: number | null
          updated_at: string | null
        }
        Insert: {
          device_id: string
          hr_bpm?: number | null
          spo2_pct?: number | null
          updated_at?: string | null
        }
        Update: {
          device_id?: string
          hr_bpm?: number | null
          spo2_pct?: number | null
          updated_at?: string | null
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
      user_role: "hospital" | "ambulance" | "admin"
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
      user_role: ["hospital", "ambulance", "admin"],
    },
  },
} as const
