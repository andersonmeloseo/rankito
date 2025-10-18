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
      profiles: {
        Row: {
          company: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          parent_user_id: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          parent_user_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          parent_user_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rank_rent_clients: {
        Row: {
          access_token: string | null
          company: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          niche: string | null
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          company?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          niche?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          company?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          niche?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rank_rent_conversions: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          cta_text: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          ip_address: string | null
          metadata: Json | null
          page_id: string | null
          page_path: string
          page_url: string
          referrer: string | null
          region: string | null
          site_id: string
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          cta_text?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          page_id?: string | null
          page_path: string
          page_url: string
          referrer?: string | null
          region?: string | null
          site_id: string
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          cta_text?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          page_id?: string | null
          page_path?: string
          page_url?: string
          referrer?: string | null
          region?: string | null
          site_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_rent_conversions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_daily_stats"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "rank_rent_conversions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_financial_metrics"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "rank_rent_conversions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_page_metrics"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "rank_rent_conversions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_conversions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_conversions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "rank_rent_conversions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_conversions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_rent_financial_config: {
        Row: {
          acquisition_cost: number | null
          business_model: string | null
          cost_per_conversion: number | null
          created_at: string
          id: string
          monthly_fixed_costs: number | null
          notes: string | null
          page_id: string | null
          site_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acquisition_cost?: number | null
          business_model?: string | null
          cost_per_conversion?: number | null
          created_at?: string
          id?: string
          monthly_fixed_costs?: number | null
          notes?: string | null
          page_id?: string | null
          site_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acquisition_cost?: number | null
          business_model?: string | null
          cost_per_conversion?: number | null
          created_at?: string
          id?: string
          monthly_fixed_costs?: number | null
          notes?: string | null
          page_id?: string | null
          site_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_rent_financial_config_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_daily_stats"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "rank_rent_financial_config_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_financial_metrics"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "rank_rent_financial_config_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_page_metrics"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "rank_rent_financial_config_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_financial_config_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_financial_config_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "rank_rent_financial_config_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_financial_config_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_rent_pages: {
        Row: {
          client_id: string | null
          created_at: string
          cta_config: Json | null
          id: string
          is_rented: boolean | null
          last_scraped_at: string | null
          monthly_rent_value: number | null
          page_path: string
          page_title: string | null
          page_url: string
          phone_number: string | null
          site_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          cta_config?: Json | null
          id?: string
          is_rented?: boolean | null
          last_scraped_at?: string | null
          monthly_rent_value?: number | null
          page_path: string
          page_title?: string | null
          page_url: string
          phone_number?: string | null
          site_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          cta_config?: Json | null
          id?: string
          is_rented?: boolean | null
          last_scraped_at?: string | null
          monthly_rent_value?: number | null
          page_path?: string
          page_title?: string | null
          page_url?: string
          phone_number?: string | null
          site_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_rent_pages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_client_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "rank_rent_pages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_rent_payments: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          due_date: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          reference_month: string
          site_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          reference_month: string
          site_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          reference_month?: string
          site_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_rent_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_client_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "rank_rent_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_payments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_payments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "rank_rent_payments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_payments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_rent_pricing_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          location_type: string
          max_monthly_conversions: number | null
          min_monthly_conversions: number
          niche: string
          suggested_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          location_type: string
          max_monthly_conversions?: number | null
          min_monthly_conversions: number
          niche: string
          suggested_price: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          location_type?: string
          max_monthly_conversions?: number | null
          min_monthly_conversions?: number
          niche?: string
          suggested_price?: number
          user_id?: string
        }
        Relationships: []
      }
      rank_rent_sites: {
        Row: {
          auto_renew: boolean | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          contract_status: string | null
          created_at: string
          created_by_user_id: string
          id: string
          is_rented: boolean | null
          location: string
          monthly_rent_value: number | null
          next_payment_date: string | null
          niche: string
          notes: string | null
          owner_user_id: string | null
          payment_status: string | null
          site_name: string
          site_url: string
          tracking_pixel_installed: boolean | null
          tracking_token: string | null
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_status?: string | null
          created_at?: string
          created_by_user_id: string
          id?: string
          is_rented?: boolean | null
          location: string
          monthly_rent_value?: number | null
          next_payment_date?: string | null
          niche: string
          notes?: string | null
          owner_user_id?: string | null
          payment_status?: string | null
          site_name: string
          site_url: string
          tracking_pixel_installed?: boolean | null
          tracking_token?: string | null
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_status?: string | null
          created_at?: string
          created_by_user_id?: string
          id?: string
          is_rented?: boolean | null
          location?: string
          monthly_rent_value?: number | null
          next_payment_date?: string | null
          niche?: string
          notes?: string | null
          owner_user_id?: string | null
          payment_status?: string | null
          site_name?: string
          site_url?: string
          tracking_pixel_installed?: boolean | null
          tracking_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_rent_sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_client_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "rank_rent_sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_clients"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      rank_rent_client_metrics: {
        Row: {
          access_token: string | null
          client_id: string | null
          client_name: string | null
          company: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string | null
          email: string | null
          niche: string | null
          phone: string | null
          total_conversions: number | null
          total_monthly_value: number | null
          total_page_views: number | null
          total_pages_rented: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      rank_rent_contract_status: {
        Row: {
          auto_renew: boolean | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          computed_status: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          contract_status: string | null
          days_remaining: number | null
          id: string | null
          monthly_rent_value: number | null
          next_payment_date: string | null
          payment_status: string | null
          site_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_rent_sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_client_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "rank_rent_sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_rent_daily_stats: {
        Row: {
          client_id: string | null
          conversions: number | null
          date: string | null
          page_id: string | null
          page_views: number | null
          site_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_rent_pages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_client_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "rank_rent_pages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_rent_financial_metrics: {
        Row: {
          acquisition_cost: number | null
          business_model: string | null
          client_id: string | null
          client_name: string | null
          conversion_rate: number | null
          cost_per_conversion: number | null
          cost_revenue_ratio: number | null
          is_rented: boolean | null
          monthly_conversion_costs: number | null
          monthly_fixed_costs: number | null
          monthly_profit: number | null
          monthly_rent_value: number | null
          monthly_revenue: number | null
          page_id: string | null
          page_path: string | null
          page_title: string | null
          page_url: string | null
          profit_margin: number | null
          proportional_fixed_cost: number | null
          roi_percentage: number | null
          site_id: string | null
          total_conversions: number | null
          total_page_views: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_rent_pages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_client_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "rank_rent_pages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_rent_metrics: {
        Row: {
          client_name: string | null
          conversion_rate: number | null
          created_at: string | null
          is_rented: boolean | null
          last_conversion_at: string | null
          location: string | null
          monthly_rent_value: number | null
          niche: string | null
          site_id: string | null
          site_name: string | null
          site_url: string | null
          total_conversions: number | null
          total_page_views: number | null
          tracking_pixel_installed: boolean | null
          tracking_token: string | null
          unique_pages_with_traffic: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      rank_rent_page_metrics: {
        Row: {
          client_id: string | null
          client_name: string | null
          conversion_rate: number | null
          created_at: string | null
          is_rented: boolean | null
          last_conversion_at: string | null
          monthly_rent_value: number | null
          page_id: string | null
          page_path: string | null
          page_title: string | null
          page_url: string | null
          phone_number: string | null
          site_id: string | null
          site_name: string | null
          status: string | null
          total_conversions: number | null
          total_page_views: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_rent_pages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_client_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "rank_rent_pages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_rent_site_metrics: {
        Row: {
          auto_renew: boolean | null
          client_company: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          contract_status: string | null
          conversion_rate: number | null
          created_at: string | null
          id: string | null
          is_rented: boolean | null
          location: string | null
          monthly_rent_value: number | null
          next_payment_date: string | null
          niche: string | null
          notes: string | null
          payment_status: string | null
          site_name: string | null
          site_url: string | null
          total_conversions: number | null
          total_page_views: number | null
          total_pages: number | null
          tracking_pixel_installed: boolean | null
          tracking_token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_rent_sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_client_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "rank_rent_sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_parent_user_id: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_contract_statuses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "super_admin" | "client" | "end_client"
      event_type:
        | "page_view"
        | "phone_click"
        | "email_click"
        | "whatsapp_click"
        | "form_submit"
        | "button_click"
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
      app_role: ["super_admin", "client", "end_client"],
      event_type: [
        "page_view",
        "phone_click",
        "email_click",
        "whatsapp_click",
        "form_submit",
        "button_click",
      ],
    },
  },
} as const
