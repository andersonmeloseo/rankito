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
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
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
      google_search_console_integrations: {
        Row: {
          auto_submit_new_pages: boolean | null
          auto_submit_sitemaps: boolean | null
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
          last_sync_at: string | null
          service_account_json: Json | null
          site_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_submit_new_pages?: boolean | null
          auto_submit_sitemaps?: boolean | null
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
          last_sync_at?: string | null
          service_account_json?: Json | null
          site_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_submit_new_pages?: boolean | null
          auto_submit_sitemaps?: boolean | null
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
          last_sync_at?: string | null
          service_account_json?: Json | null
          site_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_search_console_integrations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
          },
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
      gsc_indexing_batches: {
        Row: {
          completed_at: string | null
          completed_urls: number
          created_at: string
          failed_urls: number
          id: string
          integration_id: string
          started_at: string | null
          status: string
          total_urls: number
        }
        Insert: {
          completed_at?: string | null
          completed_urls?: number
          created_at?: string
          failed_urls?: number
          id?: string
          integration_id: string
          started_at?: string | null
          status?: string
          total_urls?: number
        }
        Update: {
          completed_at?: string | null
          completed_urls?: number
          created_at?: string
          failed_urls?: number
          id?: string
          integration_id?: string
          started_at?: string | null
          status?: string
          total_urls?: number
        }
        Relationships: [
          {
            foreignKeyName: "gsc_indexing_batches_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_search_console_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_indexing_queue: {
        Row: {
          attempts: number
          batch_id: string | null
          created_at: string
          error_message: string | null
          id: string
          integration_id: string
          page_id: string | null
          processed_at: string | null
          scheduled_for: string
          status: string
          url: string
        }
        Insert: {
          attempts?: number
          batch_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          integration_id: string
          page_id?: string | null
          processed_at?: string | null
          scheduled_for?: string
          status?: string
          url: string
        }
        Update: {
          attempts?: number
          batch_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          integration_id?: string
          page_id?: string | null
          processed_at?: string | null
          scheduled_for?: string
          status?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gsc_indexing_queue_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_search_console_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_indexing_queue_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages_with_indexnow_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_indexing_queue_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_daily_stats"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "gsc_indexing_queue_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_financial_metrics"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "gsc_indexing_queue_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_page_metrics"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "gsc_indexing_queue_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_integration_usage_logs: {
        Row: {
          avg_response_time_ms: number | null
          created_at: string
          date: string
          id: string
          integration_id: string
          quota_used_percent: number | null
          urls_failed: number
          urls_indexed: number
        }
        Insert: {
          avg_response_time_ms?: number | null
          created_at?: string
          date?: string
          id?: string
          integration_id: string
          quota_used_percent?: number | null
          urls_failed?: number
          urls_indexed?: number
        }
        Update: {
          avg_response_time_ms?: number | null
          created_at?: string
          date?: string
          id?: string
          integration_id?: string
          quota_used_percent?: number | null
          urls_failed?: number
          urls_indexed?: number
        }
        Relationships: [
          {
            foreignKeyName: "gsc_integration_usage_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_search_console_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_queue_execution_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          executed_at: string
          execution_type: string
          id: string
          total_failed: number
          total_processed: number
          total_skipped: number
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string
          execution_type: string
          id?: string
          total_failed?: number
          total_processed?: number
          total_skipped?: number
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string
          execution_type?: string
          id?: string
          total_failed?: number
          total_processed?: number
          total_skipped?: number
        }
        Relationships: []
      }
      gsc_schedule_execution_logs: {
        Row: {
          error_message: string | null
          executed_at: string
          execution_duration_ms: number | null
          id: string
          integration_id: string | null
          integration_name: string | null
          schedule_id: string
          sitemaps_attempted: string[]
          sitemaps_failed: string[] | null
          sitemaps_succeeded: string[] | null
          status: string
        }
        Insert: {
          error_message?: string | null
          executed_at?: string
          execution_duration_ms?: number | null
          id?: string
          integration_id?: string | null
          integration_name?: string | null
          schedule_id: string
          sitemaps_attempted: string[]
          sitemaps_failed?: string[] | null
          sitemaps_succeeded?: string[] | null
          status: string
        }
        Update: {
          error_message?: string | null
          executed_at?: string
          execution_duration_ms?: number | null
          id?: string
          integration_id?: string | null
          integration_name?: string | null
          schedule_id?: string
          sitemaps_attempted?: string[]
          sitemaps_failed?: string[] | null
          sitemaps_succeeded?: string[] | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "gsc_schedule_execution_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_search_console_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_schedule_execution_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "gsc_sitemap_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_sitemap_schedules: {
        Row: {
          created_at: string
          id: string
          integration_id: string | null
          interval_hours: number | null
          is_active: boolean
          last_run_at: string | null
          next_run_at: string
          schedule_name: string
          schedule_type: string
          site_id: string
          sitemap_paths: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          integration_id?: string | null
          interval_hours?: number | null
          is_active?: boolean
          last_run_at?: string | null
          next_run_at: string
          schedule_name: string
          schedule_type: string
          site_id: string
          sitemap_paths?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          integration_id?: string | null
          interval_hours?: number | null
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string
          schedule_name?: string
          schedule_type?: string
          site_id?: string
          sitemap_paths?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gsc_sitemap_schedules_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "google_search_console_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_sitemap_schedules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "gsc_sitemap_schedules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_contract_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_sitemap_schedules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_metrics"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "gsc_sitemap_schedules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_site_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_sitemap_schedules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_sitemap_submissions: {
        Row: {
          created_at: string | null
          gsc_errors_count: number | null
          gsc_last_downloaded: string | null
          gsc_last_submitted: string | null
          gsc_status: string | null
          gsc_warnings_count: number | null
          id: string
          integration_id: string
          site_id: string
          sitemap_type: string | null
          sitemap_url: string
          updated_at: string | null
          urls_indexed: number | null
          urls_submitted: number | null
        }
        Insert: {
          created_at?: string | null
          gsc_errors_count?: number | null
          gsc_last_downloaded?: string | null
          gsc_last_submitted?: string | null
          gsc_status?: string | null
          gsc_warnings_count?: number | null
          id?: string
          integration_id: string
          site_id: string
          sitemap_type?: string | null
          sitemap_url: string
          updated_at?: string | null
          urls_indexed?: number | null
          urls_submitted?: number | null
        }
        Update: {
          created_at?: string | null
          gsc_errors_count?: number | null
          gsc_last_downloaded?: string | null
          gsc_last_submitted?: string | null
          gsc_status?: string | null
          gsc_warnings_count?: number | null
          id?: string
          integration_id?: string
          site_id?: string
          sitemap_type?: string | null
          sitemap_url?: string
          updated_at?: string | null
          urls_indexed?: number | null
          urls_submitted?: number | null
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
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
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
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          gsc_notification_id: string | null
          gsc_response: Json | null
          id: string
          integration_id: string
          page_id: string | null
          request_type: string
          status: string | null
          submitted_at: string | null
          url: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          gsc_notification_id?: string | null
          gsc_response?: Json | null
          id?: string
          integration_id: string
          page_id?: string | null
          request_type?: string
          status?: string | null
          submitted_at?: string | null
          url: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          gsc_notification_id?: string | null
          gsc_response?: Json | null
          id?: string
          integration_id?: string
          page_id?: string | null
          request_type?: string
          status?: string | null
          submitted_at?: string | null
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
            foreignKeyName: "gsc_url_indexing_requests_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages_with_indexnow_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gsc_url_indexing_requests_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_daily_stats"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "gsc_url_indexing_requests_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_financial_metrics"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "gsc_url_indexing_requests_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_page_metrics"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "gsc_url_indexing_requests_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "rank_rent_pages"
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
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
          },
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
          country: string | null
          country_code: string | null
          created_at: string
          cta_text: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          ip_address: string | null
          is_ecommerce_event: boolean | null
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
          is_ecommerce_event?: boolean | null
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
          is_ecommerce_event?: boolean | null
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
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
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
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
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
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
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
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
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
          indexnow_key: string | null
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
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
          },
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
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
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
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
          },
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
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
          },
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
      gsc_aggregated_quota_status: {
        Row: {
          site_id: string | null
          site_name: string | null
          total_daily_limit: number | null
          total_integrations: number | null
          total_remaining_today: number | null
          total_used_today: number | null
          user_id: string | null
        }
        Relationships: []
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
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
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
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
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
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
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
            referencedRelation: "gsc_aggregated_quota_status"
            referencedColumns: ["site_id"]
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
      reset_gsc_integration_health: { Args: never; Returns: undefined }
      update_contract_statuses: { Args: never; Returns: undefined }
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
        | "product_view"
        | "add_to_cart"
        | "remove_from_cart"
        | "begin_checkout"
        | "purchase"
        | "search"
      external_source_type:
        | "wordpress"
        | "webhook"
        | "chatbot"
        | "api"
        | "manual"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      subscription_status:
        | "trial"
        | "active"
        | "past_due"
        | "canceled"
        | "expired"
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
        "product_view",
        "add_to_cart",
        "remove_from_cart",
        "begin_checkout",
        "purchase",
        "search",
      ],
      external_source_type: [
        "wordpress",
        "webhook",
        "chatbot",
        "api",
        "manual",
      ],
      payment_status: ["pending", "paid", "failed", "refunded"],
      subscription_status: [
        "trial",
        "active",
        "past_due",
        "canceled",
        "expired",
      ],
    },
  },
} as const
