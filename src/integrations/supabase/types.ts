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
      campaigns: {
        Row: {
          closed_at: string | null
          created_at: string
          days_worked: number | null
          end_date: string
          id: string
          name: string | null
          number: number
          start_date: string
          status: string
          supervisor_id: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          days_worked?: number | null
          end_date: string
          id?: string
          name?: string | null
          number: number
          start_date: string
          status?: string
          supervisor_id?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          days_worked?: number | null
          end_date?: string
          id?: string
          name?: string | null
          number?: number
          start_date?: string
          status?: string
          supervisor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      location_pings: {
        Row: {
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          seller_id: string
        }
        Insert: {
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          seller_id: string
        }
        Update: {
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_pings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          note: string | null
          product_id: string | null
          quantity: number
          seller_id: string | null
          type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          product_id?: string | null
          quantity: number
          seller_id?: string | null
          type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          product_id?: string | null
          quantity?: number
          seller_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "movements_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category: string | null
          central_stock: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          low_stock_threshold: number
          name: string
          sale_price: number
          unit_cost: number
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          central_stock?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          name: string
          sale_price?: number
          unit_cost?: number
        }
        Update: {
          barcode?: string | null
          category?: string | null
          central_stock?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          name?: string
          sale_price?: number
          unit_cost?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          id: string
          phone: string | null
          team_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          team_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          id: string
          product_id: string | null
          quantity: number
          sale_id: string
          unit_price: number
        }
        Insert: {
          id?: string
          product_id?: string | null
          quantity: number
          sale_id: string
          unit_price?: number
        }
        Update: {
          id?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          campaign_id: string | null
          created_at: string
          customer_name: string | null
          day_number: number | null
          id: string
          latitude: number | null
          longitude: number | null
          payment_method: string
          photo_url: string | null
          registered_by: string | null
          seller_id: string
          signature_url: string | null
          total: number
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          customer_name?: string | null
          day_number?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          payment_method?: string
          photo_url?: string | null
          registered_by?: string | null
          seller_id: string
          signature_url?: string | null
          total?: number
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          customer_name?: string | null
          day_number?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          payment_method?: string
          photo_url?: string | null
          registered_by?: string | null
          seller_id?: string
          signature_url?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_stock: {
        Row: {
          id: string
          product_id: string
          quantity: number
          seller_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity?: number
          seller_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_stock_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          supervisor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          supervisor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          supervisor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_central_stock: {
        Args: { p_delta: number; p_note?: string; p_product_id: string }
        Returns: undefined
      }
      clear_movements: { Args: never; Returns: number }
      delete_sale: { Args: { p_sale_id: string }; Returns: undefined }
      deliver_to_seller: {
        Args: { p_items: Json; p_seller_id: string }
        Returns: undefined
      }
      ensure_profile: { Args: { p_full_name: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_supervisor: {
        Args: { p_seller: string; p_supervisor: string }
        Returns: boolean
      }
      register_sale: {
        Args: {
          p_customer?: string
          p_items: Json
          p_latitude?: number
          p_longitude?: number
          p_payment?: string
          p_photo?: string
          p_signature?: string
        }
        Returns: string
      }
      register_sale_for_seller: {
        Args: {
          p_customer?: string
          p_payment: string
          p_photo?: string
          p_seller_id: string
          p_total: number
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "owner" | "supervisor" | "seller"
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
    Enums: {
      app_role: ["owner", "supervisor", "seller"],
    },
  },
} as const
