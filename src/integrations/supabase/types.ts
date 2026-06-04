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
      ad_videos: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          position: number
          poster_url: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          position?: number
          poster_url?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          position?: number
          poster_url?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_videos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          emoji: string | null
          label: string
          position: number
          slug: string
        }
        Insert: {
          emoji?: string | null
          label: string
          position?: number
          slug: string
        }
        Update: {
          emoji?: string | null
          label?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          client_id: string
          couturier_id: string
          created_at: string
          id: string
          last_message_at: string
          listing_id: string | null
        }
        Insert: {
          client_id: string
          couturier_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id?: string | null
        }
        Update: {
          client_id?: string
          couturier_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          position: number | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          position?: number | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          position?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          ai_reviewed_at: string | null
          ai_spam_score: number | null
          category: string
          city: string | null
          couturier_id: string
          cover_image_url: string | null
          created_at: string
          delivery_available: boolean
          delivery_days: number | null
          description: string | null
          fabric: string | null
          gender: string | null
          id: string
          is_premium: boolean
          premium_until: string | null
          price_xof: number
          rejection_reason: string | null
          shop_id: string | null
          status: Database["public"]["Enums"]["listing_status"]
          stock: number
          tags: string[]
          title: string
          updated_at: string
          views_count: number
          whatsapp_number: string | null
        }
        Insert: {
          ai_reviewed_at?: string | null
          ai_spam_score?: number | null
          category: string
          city?: string | null
          couturier_id: string
          cover_image_url?: string | null
          created_at?: string
          delivery_available?: boolean
          delivery_days?: number | null
          description?: string | null
          fabric?: string | null
          gender?: string | null
          id?: string
          is_premium?: boolean
          premium_until?: string | null
          price_xof: number
          rejection_reason?: string | null
          shop_id?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          stock?: number
          tags?: string[]
          title: string
          updated_at?: string
          views_count?: number
          whatsapp_number?: string | null
        }
        Update: {
          ai_reviewed_at?: string | null
          ai_spam_score?: number | null
          category?: string
          city?: string | null
          couturier_id?: string
          cover_image_url?: string | null
          created_at?: string
          delivery_available?: boolean
          delivery_days?: number | null
          description?: string | null
          fabric?: string | null
          gender?: string | null
          id?: string
          is_premium?: boolean
          premium_until?: string | null
          price_xof?: number
          rejection_reason?: string | null
          shop_id?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          stock?: number
          tags?: string[]
          title?: string
          updated_at?: string
          views_count?: number
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_xof: number
          client_id: string
          couturier_id: string
          created_at: string
          delivery_address: string | null
          id: string
          kind: Database["public"]["Enums"]["order_kind"]
          listing_id: string | null
          measurements: Json | null
          notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          amount_xof: number
          client_id: string
          couturier_id: string
          created_at?: string
          delivery_address?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["order_kind"]
          listing_id?: string | null
          measurements?: Json | null
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          amount_xof?: number
          client_id?: string
          couturier_id?: string
          created_at?: string
          delivery_address?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["order_kind"]
          listing_id?: string | null
          measurements?: Json | null
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_transactions: {
        Row: {
          amount_xof: number
          couturier_id: string
          created_at: string
          duration_days: number
          id: string
          listing_id: string
          payment_method: string
          status: string
        }
        Insert: {
          amount_xof: number
          couturier_id: string
          created_at?: string
          duration_days: number
          id?: string
          listing_id: string
          payment_method?: string
          status?: string
        }
        Update: {
          amount_xof?: number
          couturier_id?: string
          created_at?: string
          duration_days?: number
          id?: string
          listing_id?: string
          payment_method?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          atelier_name: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          phone: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          atelier_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          atelier_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_id: string
          comment: string | null
          created_at: string
          id: string
          listing_id: string
          rating: number
        }
        Insert: {
          author_id: string
          comment?: string | null
          created_at?: string
          id?: string
          listing_id: string
          rating: number
        }
        Update: {
          author_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_followers: {
        Row: {
          created_at: string
          shop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          shop_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_followers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          kind: string
          position: number
          r2_key: string | null
          shop_id: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          kind: string
          position?: number
          r2_key?: string | null
          shop_id: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          kind?: string
          position?: number
          r2_key?: string | null
          shop_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_media_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          couturier_id: string
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          facebook: string | null
          followers_count: number
          id: string
          instagram: string | null
          is_active: boolean
          is_verified: boolean
          logo_url: string | null
          name: string
          phone: string | null
          rating_avg: number
          rating_count: number
          slug: string
          tagline: string | null
          tiktok: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          couturier_id: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          followers_count?: number
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_verified?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          slug: string
          tagline?: string | null
          tiktok?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          couturier_id?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          followers_count?: number
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_verified?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          slug?: string
          tagline?: string | null
          tiktok?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      upload_failures: {
        Row: {
          content_type: string | null
          created_at: string
          error: string | null
          file_name: string | null
          file_size: number | null
          folder: string | null
          id: string
          request_id: string | null
          status_code: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          error?: string | null
          file_name?: string | null
          file_size?: number | null
          folder?: string | null
          id?: string
          request_id?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          error?: string | null
          file_name?: string | null
          file_size?: number | null
          folder?: string | null
          id?: string
          request_id?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      become_couturier: {
        Args: { _display_name?: string }
        Returns: {
          address: string | null
          city: string | null
          country: string | null
          couturier_id: string
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          facebook: string | null
          followers_count: number
          id: string
          instagram: string | null
          is_active: boolean
          is_verified: boolean
          logo_url: string | null
          name: string
          phone: string | null
          rating_avg: number
          rating_count: number
          slug: string
          tagline: string | null
          tiktok: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        SetofOptions: {
          from: "*"
          to: "shops"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      gen_shop_slug: { Args: { _base: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "couturier" | "admin"
      listing_status:
        | "draft"
        | "active"
        | "paused"
        | "sold"
        | "pending"
        | "rejected"
      order_kind: "standard" | "sur_mesure"
      order_status:
        | "pending"
        | "accepted"
        | "in_production"
        | "shipped"
        | "delivered"
        | "cancelled"
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
      app_role: ["client", "couturier", "admin"],
      listing_status: [
        "draft",
        "active",
        "paused",
        "sold",
        "pending",
        "rejected",
      ],
      order_kind: ["standard", "sur_mesure"],
      order_status: [
        "pending",
        "accepted",
        "in_production",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
