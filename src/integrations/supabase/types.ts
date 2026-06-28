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
      clients: {
        Row: {
          alias: string | null
          chem_id: string
          created_at: string
          crystals_balance: number
          crystals_expire_at: string | null
          full_name: string
          id: string
          last_visit_at: string | null
          level_seq: number
          level_symbol: string
          phone: string
          visits_count: number
        }
        Insert: {
          alias?: string | null
          chem_id: string
          created_at?: string
          crystals_balance?: number
          crystals_expire_at?: string | null
          full_name: string
          id?: string
          last_visit_at?: string | null
          level_seq: number
          level_symbol?: string
          phone: string
          visits_count?: number
        }
        Update: {
          alias?: string | null
          chem_id?: string
          created_at?: string
          crystals_balance?: number
          crystals_expire_at?: string | null
          full_name?: string
          id?: string
          last_visit_at?: string | null
          level_seq?: number
          level_symbol?: string
          phone?: string
          visits_count?: number
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
        }
        Relationships: []
      }
      loyalty_settings: {
        Row: {
          bronze_discount: number
          bronze_visits: number
          crystals_per_peso: number
          crystals_redeem_rate: number
          expiry_days: number
          gold_discount: number
          gold_visits: number
          heisenberg_discount: number
          heisenberg_visits: number
          id: number
          inactivity_grace_days: number
          silver_discount: number
          silver_visits: number
          updated_at: string
        }
        Insert: {
          bronze_discount?: number
          bronze_visits?: number
          crystals_per_peso?: number
          crystals_redeem_rate?: number
          expiry_days?: number
          gold_discount?: number
          gold_visits?: number
          heisenberg_discount?: number
          heisenberg_visits?: number
          id?: number
          inactivity_grace_days?: number
          silver_discount?: number
          silver_visits?: number
          updated_at?: string
        }
        Update: {
          bronze_discount?: number
          bronze_visits?: number
          crystals_per_peso?: number
          crystals_redeem_rate?: number
          expiry_days?: number
          gold_discount?: number
          gold_visits?: number
          heisenberg_discount?: number
          heisenberg_visits?: number
          id?: number
          inactivity_grace_days?: number
          silver_discount?: number
          silver_visits?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alias: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          alias?: string | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
        }
        Update: {
          alias?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          commission_pct: number
          created_at: string
          display_order: number
          id: string
          is_locked: boolean
          kind: Database["public"]["Enums"]["service_kind"]
          name: string
          price: number
        }
        Insert: {
          active?: boolean
          commission_pct?: number
          created_at?: string
          display_order?: number
          id?: string
          is_locked?: boolean
          kind: Database["public"]["Enums"]["service_kind"]
          name: string
          price?: number
        }
        Update: {
          active?: boolean
          commission_pct?: number
          created_at?: string
          display_order?: number
          id?: string
          is_locked?: boolean
          kind?: Database["public"]["Enums"]["service_kind"]
          name?: string
          price?: number
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          commission_amount: number
          commission_pct: number
          id: string
          price: number
          service_id: string
          service_name: string
          transaction_id: string
        }
        Insert: {
          commission_amount: number
          commission_pct: number
          id?: string
          price: number
          service_id: string
          service_name: string
          transaction_id: string
        }
        Update: {
          commission_amount?: number
          commission_pct?: number
          id?: string
          price?: number
          service_id?: string
          service_name?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          barber_id: string
          client_id: string
          commission_total: number
          created_at: string
          crystals_discount_amount: number
          crystals_earned: number
          crystals_redeemed: number
          id: string
          level_after: string | null
          level_discount_amount: number
          level_discount_pct: number
          owner_net: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          subtotal: number
          total_paid: number
        }
        Insert: {
          barber_id: string
          client_id: string
          commission_total?: number
          created_at?: string
          crystals_discount_amount?: number
          crystals_earned?: number
          crystals_redeemed?: number
          id?: string
          level_after?: string | null
          level_discount_amount?: number
          level_discount_pct?: number
          owner_net?: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          subtotal: number
          total_paid: number
        }
        Update: {
          barber_id?: string
          client_id?: string
          commission_total?: number
          created_at?: string
          crystals_discount_amount?: number
          crystals_earned?: number
          crystals_redeemed?: number
          id?: string
          level_after?: string | null
          level_discount_amount?: number
          level_discount_pct?: number
          owner_net?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          subtotal?: number
          total_paid?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_settings: {
        Row: {
          id: number
          template: string
          updated_at: string
        }
        Insert: {
          id?: number
          template?: string
          updated_at?: string
        }
        Update: {
          id?: number
          template?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_remove_user: { Args: { _user_id: string }; Returns: undefined }
      admin_set_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_update_profile: {
        Args: {
          _alias?: string
          _full_name: string
          _phone?: string
          _user_id: string
        }
        Returns: undefined
      }
      create_client: {
        Args: { _alias?: string; _full_name: string; _phone: string }
        Returns: {
          alias: string | null
          chem_id: string
          created_at: string
          crystals_balance: number
          crystals_expire_at: string | null
          full_name: string
          id: string
          last_visit_at: string | null
          level_seq: number
          level_symbol: string
          phone: string
          visits_count: number
        }
        SetofOptions: {
          from: "*"
          to: "clients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_users: {
        Args: never
        Returns: {
          alias: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      register_transaction: {
        Args: {
          _client_id: string
          _crystals_to_redeem: number
          _payment_method: Database["public"]["Enums"]["payment_method"]
          _service_ids: string[]
        }
        Returns: {
          barber_id: string
          client_id: string
          commission_total: number
          created_at: string
          crystals_discount_amount: number
          crystals_earned: number
          crystals_redeemed: number
          id: string
          level_after: string | null
          level_discount_amount: number
          level_discount_pct: number
          owner_net: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          subtotal: number
          total_paid: number
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "owner" | "barber"
      payment_method: "cash" | "transfer"
      service_kind: "base" | "extra" | "combo"
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
      app_role: ["owner", "barber"],
      payment_method: ["cash", "transfer"],
      service_kind: ["base", "extra", "combo"],
    },
  },
} as const
