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
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_automation_rules: {
        Row: {
          actions: Json
          conditions: Json
          config: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          priority: number
          rule_name: string
          rule_type: Database["public"]["Enums"]["automation_rule_type"]
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          rule_name: string
          rule_type: Database["public"]["Enums"]["automation_rule_type"]
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          rule_name?: string
          rule_type?: Database["public"]["Enums"]["automation_rule_type"]
          updated_at?: string
        }
        Relationships: []
      }
      auto_conversion_settings: {
        Row: {
          created_at: string | null
          default_stage: string | null
          email_click_enabled: boolean | null
          email_score: number | null
          enabled: boolean | null
          form_score: number | null
          form_submit_enabled: boolean | null
          id: string
          phone_click_enabled: boolean | null
          phone_score: number | null
          updated_at: string | null
          user_id: string
          whatsapp_click_enabled: boolean | null
          whatsapp_score: number | null
        }
        Insert: {
          created_at?: string | null
          default_stage?: string | null
          email_click_enabled?: boolean | null
          email_score?: number | null
          enabled?: boolean | null
          form_score?: number | null
          form_submit_enabled?: boolean | null
          id?: string
          phone_click_enabled?: boolean | null
          phone_score?: number | null
          updated_at?: string | null
          user_id: string
          whatsapp_click_enabled?: boolean | null
          whatsapp_score?: number | null
        }
        Update: {
          created_at?: string | null
          default_stage?: string | null
          email_click_enabled?: boolean | null
          email_score?: number | null
          enabled?: boolean | null
          form_score?: number | null
          form_submit_enabled?: boolean | null
          id?: string
          phone_click_enabled?: boolean | null
          phone_score?: number | null
          updated_at?: string | null
          user_id?: string
          whatsapp_click_enabled?: boolean | null
          whatsapp_score?: number | null
        }
        Relationships: []
      }
      automation_execution_logs: {
        Row: {
          error_message: string | null
          executed_at: string
          execution_details: Json
          execution_status: Database["public"]["Enums"]["automation_execution_status"]
          id: string
          rule_id: string | null
          target_user_id: string | null
        }
        Insert: {
          error_message?: string | null
          executed_at?: string
          execution_details?: Json
          execution_status: Database["public"]["Enums"]["automation_execution_status"]
          id?: string
          rule_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          error_message?: string | null
          executed_at?: string
          execution_details?: Json
          execution_status?: Database["public"]["Enums"]["automation_execution_status"]
          id?: string
          rule_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_execution_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "admin_automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_analytics: {
        Row: {
          client_id: string
          created_at: string
          enabled: boolean | null
          id: string
          portal_token: string
          report_config: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          portal_token?: string
          report_config?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          portal_token?: string
          report_config?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_analytics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_portal_status"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_portal_analytics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_goals: {
        Row: {
          conversion_value: number | null
          created_at: string | null
          cta_exact_matches: string[] | null
          cta_patterns: string[] | null
          goal_name: string
          goal_type: string
          id: string
          is_active: boolean | null
          min_scroll_depth: number | null
          min_time_seconds: number | null
          page_urls: string[] | null
          priority: number | null
          site_id: string
          updated_at: string | null
          url_patterns: string[] | null
          user_id: string
        }
        Insert: {
          conversion_value?: number | null
          created_at?: string | null
          cta_exact_matches?: string[] | null
          cta_patterns?: string[] | null
          goal_name: string
          goal_type: string
          id?: string
          is_active?: boolean | null
          min_scroll_depth?: number | null
          min_time_seconds?: number | null
          page_urls?: string[] | null
          priority?: number | null
          site_id: string
          updated_at?: string | null
          url_patterns?: string[] | null
          user_id: string
        }
        Update: {
          conversion_value?: number | null
          created_at?: string | null
          cta_exact_matches?: string[] | null
          cta_patterns?: string[] | null
          goal_name?: string
          goal_type?: string
          id?: string
          is_active?: boolean | null
          min_scroll_depth?: number | null
          min_time_seconds?: number | null
          page_urls?: string[] | null
          priority?: number | null
          site_id?: string
          updated_at?: string | null
          url_patterns?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_goals_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_goals_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "conversion_goals_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_goals_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          activity_type: string
          client_id: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          id: string
          metadata: Json | null
          task_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          client_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          task_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          client_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          task_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_portal_status"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "crm_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "crm_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          card_color: string | null
          client_id: string | null
          closed_at: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          expected_close_date: string | null
          external_source: string | null
          follow_up_date: string | null
          id: string
          lead_score: number | null
          lost_reason: string | null
          probability: number | null
          site_id: string | null
          source: string | null
          source_metadata: Json | null
          stage: string
          target_location: string | null
          target_niche: string | null
          title: string
          updated_at: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          card_color?: string | null
          client_id?: string | null
          closed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          expected_close_date?: string | null
          external_source?: string | null
          follow_up_date?: string | null
          id?: string
          lead_score?: number | null
          lost_reason?: string | null
          probability?: number | null
          site_id?: string | null
          source?: string | null
          source_metadata?: Json | null
          stage?: string
          target_location?: string | null
          target_niche?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          card_color?: string | null
          client_id?: string | null
          closed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          expected_close_date?: string | null
          external_source?: string | null
          follow_up_date?: string | null
          id?: string
          lead_score?: number | null
          lost_reason?: string | null
          probability?: number | null
          site_id?: string | null
          source?: string | null
          source_metadata?: Json | null
          stage?: string
          target_location?: string | null
          target_niche?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_portal_status"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "crm_deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "crm_deals_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          subject: string | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          subject?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          subject?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_email_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notes: {
        Row: {
          client_id: string | null
          content: string
          created_at: string | null
          deal_id: string | null
          id: string
          is_pinned: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          content: string
          created_at?: string | null
          deal_id?: string | null
          id?: string
          is_pinned?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          content?: string
          created_at?: string | null
          deal_id?: string | null
          id?: string
          is_pinned?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_portal_status"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "crm_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          color: string | null
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          is_system: boolean | null
          label: string
          stage_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          label: string
          stage_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          label?: string
          stage_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_stages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          due_date: string
          id: string
          notes: string | null
          outcome: string | null
          priority: string | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_date: string
          id?: string
          notes?: string | null
          outcome?: string | null
          priority?: string | null
          status?: string | null
          title: string
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          outcome?: string | null
          priority?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_portal_status"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "crm_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      early_access_leads: {
        Row: {
          accept_communication: boolean | null
          campaign_id: string | null
          converted_to_user_id: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          main_pain: string
          num_sites: string
          referral_source: string | null
          status: string | null
          utm_params: Json | null
          whatsapp: string
        }
        Insert: {
          accept_communication?: boolean | null
          campaign_id?: string | null
          converted_to_user_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          main_pain: string
          num_sites: string
          referral_source?: string | null
          status?: string | null
          utm_params?: Json | null
          whatsapp: string
        }
        Update: {
          accept_communication?: boolean | null
          campaign_id?: string | null
          converted_to_user_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          main_pain?: string
          num_sites?: string
          referral_source?: string | null
          status?: string | null
          utm_params?: Json | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_early_access_campaign"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      external_lead_sources: {
        Row: {
          api_token: string
          created_at: string
          id: string
          is_active: boolean
          settings: Json | null
          site_url: string | null
          source_name: string
          source_type: Database["public"]["Enums"]["external_source_type"]
          stats: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_token?: string
          created_at?: string
          id?: string
          is_active?: boolean
          settings?: Json | null
          site_url?: string | null
          source_name: string
          source_type?: Database["public"]["Enums"]["external_source_type"]
          stats?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_token?: string
          created_at?: string
          id?: string
          is_active?: boolean
          settings?: Json | null
          site_url?: string | null
          source_name?: string
          source_type?: Database["public"]["Enums"]["external_source_type"]
          stats?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_request_votes: {
        Row: {
          created_at: string
          id: string
          request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_request_votes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "feature_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_request_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          admin_notes: string | null
          category: Database["public"]["Enums"]["request_category"]
          created_at: string
          description: string
          id: string
          linked_backlog_id: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
          user_id: string
          votes_count: number
        }
        Insert: {
          admin_notes?: string | null
          category?: Database["public"]["Enums"]["request_category"]
          created_at?: string
          description: string
          id?: string
          linked_backlog_id?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
          user_id: string
          votes_count?: number
        }
        Update: {
          admin_notes?: string | null
          category?: Database["public"]["Enums"]["request_category"]
          created_at?: string
          description?: string
          id?: string
          linked_backlog_id?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
          user_id?: string
          votes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "feature_requests_linked_backlog_id_fkey"
            columns: ["linked_backlog_id"]
            isOneToOne: false
            referencedRelation: "product_backlog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      geolocation_api_configs: {
        Row: {
          api_key: string
          created_at: string | null
          created_by: string | null
          display_name: string
          error_count: number | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_rotation_at: string | null
          last_used_at: string | null
          monthly_limit: number | null
          priority: number
          provider_name: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          api_key: string
          created_at?: string | null
          created_by?: string | null
          display_name: string
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_rotation_at?: string | null
          last_used_at?: string | null
          monthly_limit?: number | null
          priority?: number
          provider_name: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          created_by?: string | null
          display_name?: string
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_rotation_at?: string | null
          last_used_at?: string | null
          monthly_limit?: number | null
          priority?: number
          provider_name?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      google_search_console_integrations: {
        Row: {
          auto_submit_new_pages: boolean | null
          auto_submit_sitemaps: boolean | null
          avg_response_time_ms: number | null
          connection_name: string
          consecutive_failures: number | null
          created_at: string | null
          google_email: string | null
          gsc_permission_level: string | null
          gsc_property_url: string | null
          health_check_at: string | null
          health_status: string | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_performance_update: string | null
          last_sync_at: string | null
          service_account_json: Json | null
          site_id: string
          success_rate: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_submit_new_pages?: boolean | null
          auto_submit_sitemaps?: boolean | null
          avg_response_time_ms?: number | null
          connection_name?: string
          consecutive_failures?: number | null
          created_at?: string | null
          google_email?: string | null
          gsc_permission_level?: string | null
          gsc_property_url?: string | null
          health_check_at?: string | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_performance_update?: string | null
          last_sync_at?: string | null
          service_account_json?: Json | null
          site_id: string
          success_rate?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_submit_new_pages?: boolean | null
          auto_submit_sitemaps?: boolean | null
          avg_response_time_ms?: number | null
          connection_name?: string
          consecutive_failures?: number | null
          created_at?: string | null
          google_email?: string | null
          gsc_permission_level?: string | null
          gsc_property_url?: string | null
          health_check_at?: string | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_performance_update?: string | null
          last_sync_at?: string | null
          service_account_json?: Json | null
          site_id?: string
          success_rate?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_search_console_integrations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_search_console_integrations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "google_search_console_integrations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_search_console_integrations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_discovered_urls: {
        Row: {
          auto_schedule_enabled: boolean | null
          clicks: number | null
          created_at: string | null
          ctr: number | null
          current_status: string | null
          discovered_at: string | null
          google_inspection_data: Json | null
          google_inspection_status: string | null
          google_last_inspected_at: string | null
          gsc_data: boolean | null
          id: string
          impressions: number | null
          indexnow_data: boolean | null
          integration_id: string | null
          last_checked_at: string | null
          last_retry_at: string | null
          last_seen_at: string | null
          next_retry_at: string | null
          position: number | null
          priority: number | null
          retry_count: number | null
          retry_reason: string | null
          scheduled_for: string | null
          sent_to_indexnow: boolean | null
          site_id: string
          updated_at: string | null
          url: string
          validated_at: string | null
          validation_error: string | null
          validation_status: string | null
        }
        Insert: {
          auto_schedule_enabled?: boolean | null
          clicks?: number | null
          created_at?: string | null
          ctr?: number | null
          current_status?: string | null
          discovered_at?: string | null
          google_inspection_data?: Json | null
          google_inspection_status?: string | null
          google_last_inspected_at?: string | null
          gsc_data?: boolean | null
          id?: string
          impressions?: number | null
          indexnow_data?: boolean | null
          integration_id?: string | null
          last_checked_at?: string | null
          last_retry_at?: string | null
          last_seen_at?: string | null
          next_retry_at?: string | null
          position?: number | null
          priority?: number | null
          retry_count?: number | null
          retry_reason?: string | null
          scheduled_for?: string | null
          sent_to_indexnow?: boolean | null
          site_id: string
          updated_at?: string | null
          url: string
          validated_at?: string | null
          validation_error?: string | null
          validation_status?: string | null
        }
        Update: {
          auto_schedule_enabled?: boolean | null
          clicks?: number | null
          created_at?: string | null
          ctr?: number | null
          current_status?: string | null
          discovered_at?: string | null
          google_inspection_data?: Json | null
          google_inspection_status?: string | null
          google_last_inspected_at?: string | null
          gsc_data?: boolean | null
          id?: string
          impressions?: number | null
          indexnow_data?: boolean | null
          integration_id?: string | null
          last_checked_at?: string | null
          last_retry_at?: string | null
          last_seen_at?: string | null
          next_retry_at?: string | null
          position?: number | null
          priority?: number | null
          retry_count?: number | null
          retry_reason?: string | null
          scheduled_for?: string | null
          sent_to_indexnow?: boolean | null
          site_id?: string
          updated_at?: string | null
          url?: string
          validated_at?: string | null
          validation_error?: string | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gsc_discovered_urls_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_search_console_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_discovered_urls_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_discovered_urls_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "gsc_discovered_urls_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_discovered_urls_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_indexing_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          integration_id: string | null
          message: string
          metadata: Json | null
          resolved_at: string | null
          severity: string
          site_id: string
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          integration_id?: string | null
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          severity: string
          site_id: string
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          integration_id?: string | null
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string
          site_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gsc_indexing_alerts_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_search_console_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_indexing_alerts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_indexing_alerts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "gsc_indexing_alerts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_indexing_alerts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_indexing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          integration_id: string | null
          job_type: string
          results: Json | null
          site_id: string
          started_at: string | null
          status: string
          updated_at: string | null
          urls_failed: number | null
          urls_processed: number | null
          urls_successful: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string | null
          job_type: string
          results?: Json | null
          site_id: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          urls_failed?: number | null
          urls_processed?: number | null
          urls_successful?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string | null
          job_type?: string
          results?: Json | null
          site_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          urls_failed?: number | null
          urls_processed?: number | null
          urls_successful?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gsc_indexing_jobs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_search_console_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_indexing_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_indexing_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "gsc_indexing_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_indexing_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_schedule_config: {
        Row: {
          created_at: string | null
          distribute_across_day: boolean | null
          enabled: boolean | null
          frequency: string
          id: string
          interval_hours: number | null
          is_active: boolean | null
          last_run_at: string | null
          max_urls_per_run: number | null
          next_run_at: string | null
          pause_on_quota_exceeded: boolean | null
          schedule_name: string
          site_id: string
          specific_days: number[] | null
          specific_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          distribute_across_day?: boolean | null
          enabled?: boolean | null
          frequency?: string
          id?: string
          interval_hours?: number | null
          is_active?: boolean | null
          last_run_at?: string | null
          max_urls_per_run?: number | null
          next_run_at?: string | null
          pause_on_quota_exceeded?: boolean | null
          schedule_name?: string
          site_id: string
          specific_days?: number[] | null
          specific_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          distribute_across_day?: boolean | null
          enabled?: boolean | null
          frequency?: string
          id?: string
          interval_hours?: number | null
          is_active?: boolean | null
          last_run_at?: string | null
          max_urls_per_run?: number | null
          next_run_at?: string | null
          pause_on_quota_exceeded?: boolean | null
          schedule_name?: string
          site_id?: string
          specific_days?: number[] | null
          specific_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gsc_schedule_config_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_schedule_config_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "gsc_schedule_config_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_schedule_config_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_schedule_execution_logs: {
        Row: {
          created_at: string | null
          errors: Json | null
          execution_duration_ms: number | null
          execution_type: string
          id: string
          integrations_used: number | null
          sites_processed: number | null
          total_capacity: number | null
          urls_processed: number | null
          urls_scheduled: number | null
        }
        Insert: {
          created_at?: string | null
          errors?: Json | null
          execution_duration_ms?: number | null
          execution_type: string
          id?: string
          integrations_used?: number | null
          sites_processed?: number | null
          total_capacity?: number | null
          urls_processed?: number | null
          urls_scheduled?: number | null
        }
        Update: {
          created_at?: string | null
          errors?: Json | null
          execution_duration_ms?: number | null
          execution_type?: string
          id?: string
          integrations_used?: number | null
          sites_processed?: number | null
          total_capacity?: number | null
          urls_processed?: number | null
          urls_scheduled?: number | null
        }
        Relationships: []
      }
      gsc_scheduled_submissions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by_user_id: string | null
          error_message: string | null
          id: string
          integration_id: string | null
          priority: number | null
          response_data: Json | null
          scheduled_for: string
          site_id: string
          sitemap_url: string | null
          started_at: string | null
          status: string
          submission_type: string
          updated_at: string | null
          urls: string[] | null
          urls_failed: number | null
          urls_submitted: number | null
          urls_successful: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string | null
          priority?: number | null
          response_data?: Json | null
          scheduled_for: string
          site_id: string
          sitemap_url?: string | null
          started_at?: string | null
          status?: string
          submission_type: string
          updated_at?: string | null
          urls?: string[] | null
          urls_failed?: number | null
          urls_submitted?: number | null
          urls_successful?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string | null
          priority?: number | null
          response_data?: Json | null
          scheduled_for?: string
          site_id?: string
          sitemap_url?: string | null
          started_at?: string | null
          status?: string
          submission_type?: string
          updated_at?: string | null
          urls?: string[] | null
          urls_failed?: number | null
          urls_submitted?: number | null
          urls_successful?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gsc_scheduled_submissions_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_search_console_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_scheduled_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_scheduled_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "gsc_scheduled_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_scheduled_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_search_analytics: {
        Row: {
          clicks: number | null
          country: string | null
          created_at: string | null
          ctr: number | null
          date: string
          device: string | null
          id: string
          impressions: number | null
          integration_id: string
          page: string
          position: number | null
          query: string | null
          site_id: string
          updated_at: string | null
        }
        Insert: {
          clicks?: number | null
          country?: string | null
          created_at?: string | null
          ctr?: number | null
          date: string
          device?: string | null
          id?: string
          impressions?: number | null
          integration_id: string
          page: string
          position?: number | null
          query?: string | null
          site_id: string
          updated_at?: string | null
        }
        Update: {
          clicks?: number | null
          country?: string | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          device?: string | null
          id?: string
          impressions?: number | null
          integration_id?: string
          page?: string
          position?: number | null
          query?: string | null
          site_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gsc_search_analytics_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_search_console_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_search_analytics_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_search_analytics_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "gsc_search_analytics_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_search_analytics_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_sitemap_submissions: {
        Row: {
          created_at: string
          errors_count: number | null
          gsc_last_downloaded: string | null
          gsc_last_submitted: string | null
          gsc_status: string | null
          id: string
          integration_id: string
          page_count: number | null
          site_id: string
          sitemap_type: string | null
          sitemap_url: string
          updated_at: string
          warnings_count: number | null
        }
        Insert: {
          created_at?: string
          errors_count?: number | null
          gsc_last_downloaded?: string | null
          gsc_last_submitted?: string | null
          gsc_status?: string | null
          id?: string
          integration_id: string
          page_count?: number | null
          site_id: string
          sitemap_type?: string | null
          sitemap_url: string
          updated_at?: string
          warnings_count?: number | null
        }
        Update: {
          created_at?: string
          errors_count?: number | null
          gsc_last_downloaded?: string | null
          gsc_last_submitted?: string | null
          gsc_status?: string | null
          id?: string
          integration_id?: string
          page_count?: number | null
          site_id?: string
          sitemap_type?: string | null
          sitemap_url?: string
          updated_at?: string
          warnings_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gsc_sitemap_submissions_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_search_console_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_sitemap_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_sitemap_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "gsc_sitemap_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_sitemap_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_url_indexing_requests: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          integration_id: string
          response_data: Json | null
          site_id: string
          status: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          integration_id: string
          response_data?: Json | null
          site_id: string
          status: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          integration_id?: string
          response_data?: Json | null
          site_id?: string
          status?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gsc_url_indexing_requests_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_search_console_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_url_indexing_requests_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_url_indexing_requests_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "gsc_url_indexing_requests_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_url_indexing_requests_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      indexnow_submissions: {
        Row: {
          created_at: string | null
          id: string
          request_payload: Json | null
          response_data: string | null
          site_id: string
          status: string
          status_code: number | null
          updated_at: string | null
          urls_count: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          request_payload?: Json | null
          response_data?: string | null
          site_id: string
          status: string
          status_code?: number | null
          updated_at?: string | null
          urls_count?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          request_payload?: Json | null
          response_data?: string | null
          site_id?: string
          status?: string
          status_code?: number | null
          updated_at?: string | null
          urls_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "indexnow_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indexnow_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "indexnow_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indexnow_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      mapbox_usage_tracking: {
        Row: {
          created_at: string
          id: string
          last_reset_at: string | null
          limit_reached: boolean
          map_loads_count: number
          month_year: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reset_at?: string | null
          limit_reached?: boolean
          map_loads_count?: number
          month_year: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reset_at?: string | null
          limit_reached?: boolean
          map_loads_count?: number
          month_year?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_campaign_configs: {
        Row: {
          budget: number | null
          campaign_name: string
          created_at: string | null
          end_date: string | null
          goal_id: string | null
          id: string
          is_active: boolean | null
          site_id: string
          start_date: string | null
          updated_at: string | null
          user_id: string
          utm_campaign_pattern: string | null
          utm_medium_pattern: string | null
          utm_source_pattern: string | null
        }
        Insert: {
          budget?: number | null
          campaign_name: string
          created_at?: string | null
          end_date?: string | null
          goal_id?: string | null
          id?: string
          is_active?: boolean | null
          site_id: string
          start_date?: string | null
          updated_at?: string | null
          user_id: string
          utm_campaign_pattern?: string | null
          utm_medium_pattern?: string | null
          utm_source_pattern?: string | null
        }
        Update: {
          budget?: number | null
          campaign_name?: string
          created_at?: string | null
          end_date?: string | null
          goal_id?: string | null
          id?: string
          is_active?: boolean | null
          site_id?: string
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
          utm_campaign_pattern?: string | null
          utm_medium_pattern?: string | null
          utm_source_pattern?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaign_configs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "conversion_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaign_configs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaign_configs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "marketing_campaign_configs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaign_configs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          budget_spent: number | null
          budget_total: number | null
          channel: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          tracking_url: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          budget_spent?: number | null
          budget_total?: number | null
          channel: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          budget_spent?: number | null
          budget_total?: number | null
          channel?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      marketing_campaigns_v2: {
        Row: {
          budget_spent: number | null
          budget_total: number | null
          channel: string
          conversions: number | null
          cpa: number | null
          created_at: string | null
          end_date: string | null
          id: string
          leads: number | null
          metrics: Json | null
          name: string
          roi: number | null
          start_date: string | null
          status: string
          strategy_id: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          budget_spent?: number | null
          budget_total?: number | null
          channel: string
          conversions?: number | null
          cpa?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          leads?: number | null
          metrics?: Json | null
          name: string
          roi?: number | null
          start_date?: string | null
          status?: string
          strategy_id?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          budget_spent?: number | null
          budget_total?: number | null
          channel?: string
          conversions?: number | null
          cpa?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          leads?: number | null
          metrics?: Json | null
          name?: string
          roi?: number | null
          start_date?: string | null
          status?: string
          strategy_id?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_v2_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "marketing_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_content_calendar: {
        Row: {
          channel: string | null
          created_at: string | null
          id: string
          metrics: Json | null
          notes: string | null
          published_date: string | null
          scheduled_date: string | null
          status: string
          target_keywords: string[] | null
          title: string
          type: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          id?: string
          metrics?: Json | null
          notes?: string | null
          published_date?: string | null
          scheduled_date?: string | null
          status?: string
          target_keywords?: string[] | null
          title: string
          type?: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          id?: string
          metrics?: Json | null
          notes?: string | null
          published_date?: string | null
          scheduled_date?: string | null
          status?: string
          target_keywords?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      marketing_goals: {
        Row: {
          actual_conversions: number | null
          actual_leads: number | null
          actual_revenue: number | null
          created_at: string | null
          id: string
          month: number
          notes: string | null
          target_conversions: number | null
          target_leads: number | null
          target_revenue: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          actual_conversions?: number | null
          actual_leads?: number | null
          actual_revenue?: number | null
          created_at?: string | null
          id?: string
          month: number
          notes?: string | null
          target_conversions?: number | null
          target_leads?: number | null
          target_revenue?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          actual_conversions?: number | null
          actual_leads?: number | null
          actual_revenue?: number | null
          created_at?: string | null
          id?: string
          month?: number
          notes?: string | null
          target_conversions?: number | null
          target_leads?: number | null
          target_revenue?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      marketing_metrics: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          date: string
          id: string
          metadata: Json | null
          metric_type: string
          source: string | null
          value: number
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          metadata?: Json | null
          metric_type: string
          source?: string | null
          value?: number
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          source?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketing_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_strategies: {
        Row: {
          budget_monthly: number | null
          channel: string
          created_at: string | null
          end_date: string | null
          id: string
          kpis: Json | null
          learnings: string | null
          name: string
          notes: string | null
          priority: number | null
          responsible: string | null
          start_date: string | null
          status: string
          target_conversions: number | null
          target_leads: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          budget_monthly?: number | null
          channel: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          kpis?: Json | null
          learnings?: string | null
          name: string
          notes?: string | null
          priority?: number | null
          responsible?: string | null
          start_date?: string | null
          status?: string
          target_conversions?: number | null
          target_leads?: number | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          budget_monthly?: number | null
          channel?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          kpis?: Json | null
          learnings?: string | null
          name?: string
          notes?: string | null
          priority?: number | null
          responsible?: string | null
          start_date?: string | null
          status?: string
          target_conversions?: number | null
          target_leads?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_backlog: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          category: Database["public"]["Enums"]["backlog_category"]
          created_at: string
          description: string | null
          estimated_end_date: string | null
          estimated_start_date: string | null
          id: string
          is_public: boolean
          priority: Database["public"]["Enums"]["backlog_priority"]
          progress_percentage: number
          release_version: string | null
          status: Database["public"]["Enums"]["backlog_status"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          category?: Database["public"]["Enums"]["backlog_category"]
          created_at?: string
          description?: string | null
          estimated_end_date?: string | null
          estimated_start_date?: string | null
          id?: string
          is_public?: boolean
          priority?: Database["public"]["Enums"]["backlog_priority"]
          progress_percentage?: number
          release_version?: string | null
          status?: Database["public"]["Enums"]["backlog_status"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          category?: Database["public"]["Enums"]["backlog_category"]
          created_at?: string
          description?: string | null
          estimated_end_date?: string | null
          estimated_start_date?: string | null
          id?: string
          is_public?: boolean
          priority?: Database["public"]["Enums"]["backlog_priority"]
          progress_percentage?: number
          release_version?: string | null
          status?: Database["public"]["Enums"]["backlog_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          company: string | null
          country_code: string | null
          created_at: string | null
          email: string
          email_notifications: boolean | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_activity_at: string | null
          notifications_enabled: boolean | null
          onboarding_completed: boolean | null
          parent_user_id: string | null
          phone: string | null
          rejection_reason: string | null
          selected_plan_slug: string | null
          theme: string | null
          theme_preferences: Json | null
          timezone: string | null
          updated_at: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          country_code?: string | null
          created_at?: string | null
          email: string
          email_notifications?: boolean | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_activity_at?: string | null
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean | null
          parent_user_id?: string | null
          phone?: string | null
          rejection_reason?: string | null
          selected_plan_slug?: string | null
          theme?: string | null
          theme_preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          country_code?: string | null
          created_at?: string | null
          email?: string
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_activity_at?: string | null
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean | null
          parent_user_id?: string | null
          phone?: string | null
          rejection_reason?: string | null
          selected_plan_slug?: string | null
          theme?: string | null
          theme_preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
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
          end_client_user_id: string | null
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
          end_client_user_id?: string | null
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
          end_client_user_id?: string | null
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
          conversion_value: number | null
          country: string | null
          country_code: string | null
          created_at: string
          cta_text: string | null
          email_hash: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          fbc: string | null
          fbclid: string | null
          fbp: string | null
          gclid: string | null
          goal_id: string | null
          goal_name: string | null
          id: string
          ip_address: string | null
          is_ecommerce_event: boolean | null
          metadata: Json | null
          page_id: string | null
          page_path: string
          page_url: string
          phone_hash: string | null
          referrer: string | null
          region: string | null
          sequence_number: number | null
          session_id: string | null
          site_id: string
          time_spent_seconds: number | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          city?: string | null
          conversion_value?: number | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          cta_text?: string | null
          email_hash?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          gclid?: string | null
          goal_id?: string | null
          goal_name?: string | null
          id?: string
          ip_address?: string | null
          is_ecommerce_event?: boolean | null
          metadata?: Json | null
          page_id?: string | null
          page_path: string
          page_url: string
          phone_hash?: string | null
          referrer?: string | null
          region?: string | null
          sequence_number?: number | null
          session_id?: string | null
          site_id: string
          time_spent_seconds?: number | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          city?: string | null
          conversion_value?: number | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          cta_text?: string | null
          email_hash?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          gclid?: string | null
          goal_id?: string | null
          goal_name?: string | null
          id?: string
          ip_address?: string | null
          is_ecommerce_event?: boolean | null
          metadata?: Json | null
          page_id?: string | null
          page_path?: string
          page_url?: string
          phone_hash?: string | null
          referrer?: string | null
          region?: string | null
          sequence_number?: number | null
          session_id?: string | null
          site_id?: string
          time_spent_seconds?: number | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_rent_conversions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "conversion_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_conversions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages_with_indexnow_status"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "pages_with_indexnow_status"
            referencedColumns: ["id"]
          },
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
      rank_rent_page_visits: {
        Row: {
          created_at: string | null
          entry_time: string
          exit_time: string | null
          id: string
          page_title: string | null
          page_url: string
          sequence_number: number
          session_id: string
          site_id: string
          time_spent_seconds: number | null
        }
        Insert: {
          created_at?: string | null
          entry_time?: string
          exit_time?: string | null
          id?: string
          page_title?: string | null
          page_url: string
          sequence_number: number
          session_id: string
          site_id: string
          time_spent_seconds?: number | null
        }
        Update: {
          created_at?: string | null
          entry_time?: string
          exit_time?: string | null
          id?: string
          page_title?: string | null
          page_url?: string
          sequence_number?: number
          session_id?: string
          site_id?: string
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_rent_page_visits_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_page_visits_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_page_visits_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "rank_rent_page_visits_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_page_visits_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
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
          gsc_indexation_status: string | null
          gsc_indexed_at: string | null
          gsc_integration_used: string | null
          gsc_last_checked_at: string | null
          gsc_last_crawled_at: string | null
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
          gsc_indexation_status?: string | null
          gsc_indexed_at?: string | null
          gsc_integration_used?: string | null
          gsc_last_checked_at?: string | null
          gsc_last_crawled_at?: string | null
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
          gsc_indexation_status?: string | null
          gsc_indexed_at?: string | null
          gsc_integration_used?: string | null
          gsc_last_checked_at?: string | null
          gsc_last_crawled_at?: string | null
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
            referencedRelation: "client_portal_status"
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
            referencedRelation: "client_portal_status"
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
      rank_rent_sessions: {
        Row: {
          bot_name: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device: string | null
          entry_page_url: string
          entry_time: string
          exit_page_url: string | null
          exit_time: string | null
          id: string
          ip_address: string | null
          pages_visited: number | null
          referrer: string | null
          session_id: string
          site_id: string
          total_duration_seconds: number | null
        }
        Insert: {
          bot_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device?: string | null
          entry_page_url: string
          entry_time?: string
          exit_page_url?: string | null
          exit_time?: string | null
          id?: string
          ip_address?: string | null
          pages_visited?: number | null
          referrer?: string | null
          session_id: string
          site_id: string
          total_duration_seconds?: number | null
        }
        Update: {
          bot_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device?: string | null
          entry_page_url?: string
          entry_time?: string
          exit_page_url?: string | null
          exit_time?: string | null
          id?: string
          ip_address?: string | null
          pages_visited?: number | null
          referrer?: string | null
          session_id?: string
          site_id?: string
          total_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_rent_sessions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_sessions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "rank_rent_sessions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_rent_sessions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
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
          indexnow_key: string | null
          indexnow_validated: boolean | null
          is_ecommerce: boolean
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
          indexnow_key?: string | null
          indexnow_validated?: boolean | null
          is_ecommerce?: boolean
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
          indexnow_key?: string | null
          indexnow_validated?: boolean | null
          is_ecommerce?: boolean
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
            referencedRelation: "client_portal_status"
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
      report_shares: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          report_data: Json
          share_token: string
          site_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          report_data: Json
          share_token?: string
          site_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          report_data?: Json
          share_token?: string
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_shares_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_shares_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "report_shares_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_shares_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_reports: {
        Row: {
          client_id: string | null
          created_at: string | null
          financial_config: Json
          id: string
          report_data: Json
          report_html: string | null
          report_name: string
          site_id: string
          style: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          financial_config: Json
          id?: string
          report_data: Json
          report_html?: string | null
          report_name: string
          site_id: string
          style: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          financial_config?: Json
          id?: string
          report_data?: Json
          report_html?: string | null
          report_name?: string
          site_id?: string
          style?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_portal_status"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "saved_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_reports_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_reports_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "saved_reports_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_reports_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_views: {
        Row: {
          created_at: string
          filters: Json
          id: string
          is_default: boolean | null
          updated_at: string
          user_id: string
          view_mode: string | null
          view_name: string
          view_type: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean | null
          updated_at?: string
          user_id: string
          view_mode?: string | null
          view_name: string
          view_type: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean | null
          updated_at?: string
          user_id?: string
          view_mode?: string | null
          view_name?: string
          view_type?: string
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          created_at: string | null
          email_to: string
          frequency: string
          id: string
          is_active: boolean | null
          last_sent_at: string | null
          report_config: Json
          site_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_to: string
          frequency: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          report_config: Json
          site_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_to?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          report_config?: Json
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reports_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "scheduled_reports_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reports_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sitemap_import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by_user_id: string
          id: string
          is_complete: boolean | null
          site_id: string
          sitemap_url: string
          sitemaps_processed: number | null
          started_at: string | null
          total_sitemaps_found: number | null
          total_urls_expected: number | null
          updated_at: string | null
          urls_imported: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by_user_id: string
          id?: string
          is_complete?: boolean | null
          site_id: string
          sitemap_url: string
          sitemaps_processed?: number | null
          started_at?: string | null
          total_sitemaps_found?: number | null
          total_urls_expected?: number | null
          updated_at?: string | null
          urls_imported?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by_user_id?: string
          id?: string
          is_complete?: boolean | null
          site_id?: string
          sitemap_url?: string
          sitemaps_processed?: number | null
          started_at?: string | null
          total_sitemaps_found?: number | null
          total_urls_expected?: number | null
          updated_at?: string | null
          urls_imported?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sitemap_import_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sitemap_import_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "sitemap_import_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sitemap_import_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string | null
          id: string
          new_values: Json | null
          notes: string | null
          old_values: Json | null
          subscription_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          subscription_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: string
          invoice_url: string | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          reference_month: string
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          id?: string
          invoice_url?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          reference_month: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          invoice_url?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          reference_month?: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_period: string
          created_at: string | null
          description: string | null
          display_order: number | null
          features: Json | null
          has_advanced_tracking: boolean | null
          id: string
          is_active: boolean | null
          max_gsc_integrations: number | null
          max_pages_per_site: number | null
          max_sites: number | null
          name: string
          price: number
          slug: string
          stripe_checkout_url: string | null
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          billing_period?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          has_advanced_tracking?: boolean | null
          id?: string
          is_active?: boolean | null
          max_gsc_integrations?: number | null
          max_pages_per_site?: number | null
          max_sites?: number | null
          name: string
          price: number
          slug: string
          stripe_checkout_url?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_period?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          has_advanced_tracking?: boolean | null
          id?: string
          is_active?: boolean | null
          max_gsc_integrations?: number | null
          max_pages_per_site?: number | null
          max_sites?: number | null
          name?: string
          price?: number
          slug?: string
          stripe_checkout_url?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          edited_at: string | null
          id: string
          is_admin_reply: boolean
          is_internal_note: boolean
          is_read: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          edited_at?: string | null
          id?: string
          is_admin_reply?: boolean
          is_internal_note?: boolean
          is_read?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          edited_at?: string | null
          id?: string
          is_admin_reply?: boolean
          is_internal_note?: boolean
          is_read?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          archived: boolean | null
          assigned_to: string | null
          category: Database["public"]["Enums"]["support_category"]
          closed_at: string | null
          created_at: string
          id: string
          initiated_by: string
          is_broadcast: boolean
          last_message_at: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["support_priority"]
          recipient_user_id: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["support_status"]
          subject: string
          unread_admin_count: number
          unread_user_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["support_category"]
          closed_at?: string | null
          created_at?: string
          id?: string
          initiated_by?: string
          is_broadcast?: boolean
          last_message_at?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["support_priority"]
          recipient_user_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_status"]
          subject: string
          unread_admin_count?: number
          unread_user_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean | null
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["support_category"]
          closed_at?: string | null
          created_at?: string
          id?: string
          initiated_by?: string
          is_broadcast?: boolean
          last_message_at?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["support_priority"]
          recipient_user_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_status"]
          subject?: string
          unread_admin_count?: number
          unread_user_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_audit_reports: {
        Row: {
          created_at: string | null
          critical_count: number
          executed_at: string | null
          executed_by: string | null
          execution_time_ms: number | null
          id: string
          info_count: number
          overall_status: string
          report_data: Json
          total_issues: number
          warning_count: number
        }
        Insert: {
          created_at?: string | null
          critical_count?: number
          executed_at?: string | null
          executed_by?: string | null
          execution_time_ms?: number | null
          id?: string
          info_count?: number
          overall_status: string
          report_data?: Json
          total_issues?: number
          warning_count?: number
        }
        Update: {
          created_at?: string | null
          critical_count?: number
          executed_at?: string | null
          executed_by?: string | null
          execution_time_ms?: number | null
          id?: string
          info_count?: number
          overall_status?: string
          report_data?: Json
          total_issues?: number
          warning_count?: number
        }
        Relationships: []
      }
      training_modules: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_videos: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          duration_seconds: number | null
          id: string
          is_active: boolean
          is_free: boolean
          module_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_id: string
          video_provider: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          module_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_id: string
          video_provider: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          module_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_id?: string
          video_provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_videos_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string
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
      user_subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          notes: string | null
          paused_at: string | null
          paused_reason: string | null
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          notes?: string | null
          paused_at?: string | null
          paused_reason?: string | null
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          notes?: string | null
          paused_at?: string | null
          paused_reason?: string | null
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_video_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          last_position_seconds: number
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          last_position_seconds?: number
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          last_position_seconds?: number
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "training_videos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      client_portal_status: {
        Row: {
          client_id: string | null
          client_name: string | null
          company: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          conversions_30d: number | null
          created_at: string | null
          email: string | null
          end_client_active: boolean | null
          end_client_email: string | null
          end_client_user_id: string | null
          niche: string | null
          notes: string | null
          page_views_30d: number | null
          phone: string | null
          portal_created_at: string | null
          portal_enabled: boolean | null
          portal_token: string | null
          total_monthly_value: number | null
          total_pages: number | null
          total_sites: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      crm_conversion_metrics: {
        Row: {
          active_deals: number | null
          avg_days_to_close: number | null
          leads: number | null
          lost_deals: number | null
          total_won_value: number | null
          user_id: string | null
          win_rate: number | null
          won_deals: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sales_funnel: {
        Row: {
          avg_probability: number | null
          deal_count: number | null
          stage: string | null
          total_value: number | null
          user_id: string | null
          weighted_value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pages_with_indexnow_status: {
        Row: {
          client_id: string | null
          created_at: string | null
          cta_config: Json | null
          gsc_indexation_status: string | null
          gsc_indexed_at: string | null
          gsc_integration_used: string | null
          gsc_last_checked_at: string | null
          gsc_last_crawled_at: string | null
          id: string | null
          indexnow_status: string | null
          is_rented: boolean | null
          last_indexnow_submission: string | null
          last_scraped_at: string | null
          monthly_rent_value: number | null
          page_path: string | null
          page_title: string | null
          page_url: string | null
          phone_number: string | null
          site_id: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_rent_pages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_portal_status"
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
            referencedRelation: "client_portal_status"
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
            referencedRelation: "client_portal_status"
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
            referencedRelation: "client_portal_status"
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
          client_id: string | null
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
        Relationships: [
          {
            foreignKeyName: "rank_rent_sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_portal_status"
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
      rank_rent_page_metrics: {
        Row: {
          avg_engagement_score: number | null
          avg_scroll_depth: number | null
          avg_time_on_page: number | null
          avg_total_time: number | null
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
            referencedRelation: "client_portal_status"
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
            referencedRelation: "client_portal_status"
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
      subscription_metrics: {
        Row: {
          active_subscriptions: number | null
          canceled_subscriptions: number | null
          failed_count: number | null
          month: string | null
          paid_count: number | null
          pending_count: number | null
          pending_revenue: number | null
          revenue: number | null
          total_subscriptions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_oauth_states: { Args: never; Returns: undefined }
      generate_indexnow_key: { Args: never; Returns: string }
      get_database_health_metrics: { Args: never; Returns: Json }
      get_detected_ctas: {
        Args: { p_site_id: string }
        Returns: {
          click_count: number
          cta_text: string
          event_type: string
          first_seen: string
          last_seen: string
        }[]
      }
      get_event_distribution: {
        Args: {
          device_filter?: string
          end_date: string
          site_uuid: string
          start_date: string
        }
        Returns: {
          count: number
          event_type: string
        }[]
      }
      get_funnel_metrics: {
        Args: {
          device_filter?: string
          end_date: string
          site_uuid: string
          start_date: string
        }
        Returns: {
          conversions: number
          interactions: number
          page_views: number
        }[]
      }
      get_parent_user_id: { Args: { _user_id: string }; Returns: string }
      get_plan_distribution: {
        Args: never
        Returns: {
          pages_count: number
          plan_name: string
          sites_count: number
          user_count: number
        }[]
      }
      get_system_consumption_counts: { Args: never; Returns: Json }
      get_top_pages: {
        Args: {
          device_filter?: string
          end_date: string
          limit_count?: number
          site_uuid: string
          start_date: string
        }
        Returns: {
          conversions: number
          page: string
          page_views: number
        }[]
      }
      get_top_projects_performance: {
        Args: { days_ago?: number; limit_count?: number; user_id: string }
        Returns: {
          conversion_events: number
          is_rented: boolean
          page_views: number
          site_id: string
          site_name: string
          site_url: string
          total_conversions: number
        }[]
      }
      get_top_users_by_consumption: {
        Args: { limit_count?: number }
        Returns: {
          total_conversions: number
          total_pages: number
          total_sites: number
          user_email: string
          user_id: string
          user_name: string
        }[]
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
      normalize_page_url: { Args: { url: string }; Returns: string }
      reset_gsc_integration_health: { Args: never; Returns: undefined }
      trigger_all_notification_checks: {
        Args: never
        Returns: {
          job_name: string
          result: string
        }[]
      }
      update_contract_statuses: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "super_admin" | "client" | "end_client"
      automation_execution_status: "success" | "failed" | "skipped"
      automation_rule_type:
        | "auto_approval"
        | "trial_expiration"
        | "plan_renewal"
        | "plan_upgrade"
        | "custom_notification"
      backlog_category: "new_feature" | "improvement" | "bugfix" | "security"
      backlog_priority: "low" | "medium" | "high" | "critical"
      backlog_status:
        | "planned"
        | "in_progress"
        | "testing"
        | "completed"
        | "cancelled"
      event_type:
        | "page_view"
        | "phone_click"
        | "email_click"
        | "whatsapp_click"
        | "form_submit"
        | "button_click"
        | "product_view"
        | "add_to_cart"
        | "remove_from_cart"
        | "begin_checkout"
        | "purchase"
        | "search"
        | "page_exit"
        | "scroll_depth"
        | "time_on_page"
      external_source_type:
        | "wordpress"
        | "webhook"
        | "chatbot"
        | "api"
        | "manual"
      notification_type: "broadcast_sent"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      request_category: "new_feature" | "improvement" | "integration" | "other"
      request_status:
        | "pending"
        | "under_review"
        | "accepted"
        | "rejected"
        | "implemented"
      subscription_status:
        | "trial"
        | "active"
        | "past_due"
        | "canceled"
        | "expired"
      support_category:
        | "bug_report"
        | "feature_request"
        | "question"
        | "technical_support"
        | "other"
      support_priority: "low" | "medium" | "high" | "urgent"
      support_status:
        | "open"
        | "in_progress"
        | "waiting_user"
        | "resolved"
        | "closed"
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
      automation_execution_status: ["success", "failed", "skipped"],
      automation_rule_type: [
        "auto_approval",
        "trial_expiration",
        "plan_renewal",
        "plan_upgrade",
        "custom_notification",
      ],
      backlog_category: ["new_feature", "improvement", "bugfix", "security"],
      backlog_priority: ["low", "medium", "high", "critical"],
      backlog_status: [
        "planned",
        "in_progress",
        "testing",
        "completed",
        "cancelled",
      ],
      event_type: [
        "page_view",
        "phone_click",
        "email_click",
        "whatsapp_click",
        "form_submit",
        "button_click",
        "product_view",
        "add_to_cart",
        "remove_from_cart",
        "begin_checkout",
        "purchase",
        "search",
        "page_exit",
        "scroll_depth",
        "time_on_page",
      ],
      external_source_type: [
        "wordpress",
        "webhook",
        "chatbot",
        "api",
        "manual",
      ],
      notification_type: ["broadcast_sent"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      request_category: ["new_feature", "improvement", "integration", "other"],
      request_status: [
        "pending",
        "under_review",
        "accepted",
        "rejected",
        "implemented",
      ],
      subscription_status: [
        "trial",
        "active",
        "past_due",
        "canceled",
        "expired",
      ],
      support_category: [
        "bug_report",
        "feature_request",
        "question",
        "technical_support",
        "other",
      ],
      support_priority: ["low", "medium", "high", "urgent"],
      support_status: [
        "open",
        "in_progress",
        "waiting_user",
        "resolved",
        "closed",
      ],
    },
  },
} as const
