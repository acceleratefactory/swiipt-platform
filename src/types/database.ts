export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      // ── Existing tables ──

      users: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          country_of_residence: string | null
          preferred_currency: string
          profile_photo_url: string | null
          mobility_score: number
          alumni_status: boolean
          referral_code: string | null
          referred_by: string | null
          readiness_score: number
          readiness_destination: string | null
          readiness_last_calculated: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at" | "mobility_score" | "alumni_status" | "readiness_score" | "readiness_destination" | "readiness_last_calculated">
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>
        Relationships: []
      }

      wallets: {
        Row: {
          id: string
          user_id: string
          balance_ngn: number
          balance_usd: number
          balance_aed: number
          balance_qar: number
          balance_gbp: number
          balance_cad: number
          balance_eur: number
          total_locked_ngn: number
          total_credits_ngn: number
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["wallets"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["wallets"]["Insert"]>
        Relationships: []
      }

      currencies: {
        Row: {
          id: string
          code: string
          name: string
          symbol: string
          is_active: boolean
          ngn_exchange_rate: number
          last_updated_by: string | null
          last_updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["currencies"]["Row"], "id" | "last_updated_at">
        Update: Partial<Database["public"]["Tables"]["currencies"]["Insert"]>
        Relationships: []
      }

      savings_goals: {
        Row: {
          id: string
          user_id: string
          goal_name: string
          goal_category: string
          destination: string | null
          currency: string
          target_amount: number
          current_balance: number
          lock_period_months: number | null
          is_locked: boolean
          start_date: string | null
          maturity_date: string | null
          status: "active" | "completed" | "withdrawn" | "cancelled"
          early_exit_penalty_rate: number
          milestone_25_unlocked: boolean
          milestone_50_unlocked: boolean
          milestone_75_unlocked: boolean
          milestone_100_unlocked: boolean
          linked_service_package_id: string | null
          linked_holiday_package_id: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["savings_goals"]["Row"], "id" | "created_at" | "current_balance" | "milestone_25_unlocked" | "milestone_50_unlocked" | "milestone_75_unlocked" | "milestone_100_unlocked">
        Update: Partial<Database["public"]["Tables"]["savings_goals"]["Insert"]>
        Relationships: []
      }

      deposits: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          amount: number
          currency: string
          ngn_equivalent: number | null
          payment_reference: string
          status: "pending" | "confirmed" | "rejected" | "expired" | "cancelled" | "abandoned"
          user_confirmed_at: string | null
          admin_confirmed_at: string | null
          confirmed_by: string | null
          expires_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          goal_id: string | null
          amount: number
          currency: string
          ngn_equivalent: number | null
          payment_reference: string
          status?: "pending" | "confirmed" | "rejected" | "expired" | "cancelled" | "abandoned"
          user_confirmed_at?: string | null
          expires_at?: string | null
          notes?: string | null
        }
        Update: Partial<{
          user_id: string
          goal_id: string | null
          amount: number
          currency: string
          ngn_equivalent: number | null
          payment_reference: string
          status?: "pending" | "confirmed" | "rejected" | "expired" | "cancelled" | "abandoned"
          user_confirmed_at?: string | null
          expires_at?: string | null
          notes?: string | null
          admin_confirmed_at?: string | null
          confirmed_by?: string | null
        }>
        Relationships: []
      }

      notifications: {
        Row: {
          id: string
          user_id: string | null
          type: string
          title: string
          body: string
          is_read: boolean
          action_url: string | null
          target_segment: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at" | "is_read">
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>
        Relationships: []
      }

      email_subscribers: {
        Row: {
          id: string
          email: string
          source: string | null
          created_at: string
        }
        Insert: {
          email: string
          source: string | null
        }
        Update: Partial<{
          email: string
          source: string | null
        }>
        Relationships: []
      }

      activity_log: {
        Row: {
          id: string
          user_id: string
          event_type: string
          event_data: Json | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["activity_log"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Insert"]>
        Relationships: []
      }

      calculator_configs: {
        Row: {
          id: string
          destination: string
          service_type: string
          family_size: string
          service_fee_ngn: number
          government_fee_ngn: number
          document_prep_ngn: number
          travel_estimate_ngn: number
          first_month_setup_ngn: number
          processing_weeks_min: number
          processing_weeks_max: number
          success_rate: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["calculator_configs"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["calculator_configs"]["Insert"]>
        Relationships: []
      }

      eligibility_pathways: {
        Row: {
          id: string
          pathway_name: string
          destination: string
          match_type: "HIGH" | "GOOD" | "POSSIBLE"
          processing_weeks: string
          starting_price_ngn: number
          description: string
          requires_destination: string[]
          requires_employment: string[]
          requires_passport: string[]
          requires_income: string[]
          excludes_timeline: string[]
          priority_order: number
          is_active: boolean
          updated_by: string | null
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["eligibility_pathways"]["Row"], "id" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["eligibility_pathways"]["Insert"]>
        Relationships: []
      }

      resource_guides: {
        Row: {
          id: string
          slug: string
          title: string
          subtitle: string | null
          category: string
          destination: string | null
          content: string
          meta_description: string | null
          featured: boolean
          published: boolean
          view_count: number
          reading_time_minutes: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["resource_guides"]["Row"], "id" | "created_at" | "updated_at" | "view_count">
        Update: Partial<Database["public"]["Tables"]["resource_guides"]["Insert"]>
        Relationships: []
      }

      // ── New tables (previously missing) ──

      admin_audit_log: {
        Row: {
          id: string
          admin_id: string
          action_type: string | null
          action: string | null
          target_user_id: string | null
          target_record_id: string | null
          target_table: string | null
          table_name: string | null
          previous_value: Json | null
          new_value: Json | null
          note: string | null
          notes: string | null
          details: Json | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["admin_audit_log"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["admin_audit_log"]["Insert"]>
        Relationships: []
      }

      community_memberships: {
        Row: {
          id: string
          user_id: string
          group_id: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["community_memberships"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["community_memberships"]["Insert"]>
        Relationships: []
      }

      community_replies: {
        Row: {
          id: string
          thread_id: string
          author_id: string
          body: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["community_replies"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["community_replies"]["Insert"]>
        Relationships: []
      }

      community_threads: {
        Row: {
          id: string
          group_id: string
          author_id: string
          title: string
          body: string
          reply_count: number
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["community_threads"]["Row"], "id" | "created_at" | "reply_count">
        Update: Partial<Database["public"]["Tables"]["community_threads"]["Insert"]>
        Relationships: []
      }

      corporate_clients: {
        Row: {
          id: string
          company_name: string
          contact_name: string
          contact_email: string
          contact_phone: string | null
          retainer_currency: string | null
          retainer_amount: number | null
          status: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["corporate_clients"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["corporate_clients"]["Insert"]>
        Relationships: []
      }

      document_requests: {
        Row: {
          id: string
          user_id: string
          order_id: string
          document_name: string
          status: string
          file_url: string | null
          uploaded_at: string | null
          verified_at: string | null
          verified_by: string | null
          rejection_reason: string | null
          instructions: string | null
          is_required: boolean
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["document_requests"]["Row"], "id" | "created_at" | "status" | "uploaded_at" | "verified_at" | "verified_by">
        Update: Partial<Database["public"]["Tables"]["document_requests"]["Insert"]>
        Relationships: []
      }

      documents: {
        Row: {
          id: string
          user_id: string
          document_name: string | null
          document_type: string
          file_path: string
          expiry_date: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["documents"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>
        Relationships: []
      }

      float_ledger: {
        Row: {
          id: string
          entry_date: string
          total_locked_ngn: number
          tbill_allocation: number | null
          tbill_rate_pa: number | null
          projected_annual_income: number | null
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["float_ledger"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["float_ledger"]["Insert"]>
        Relationships: []
      }

      goal_gifts: {
        Row: {
          id: string
          giver_id: string
          giver_goal_id: string
          recipient_id: string
          recipient_goal_id: string
          amount: number
          currency: string
          ngn_equivalent: number
          message: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["goal_gifts"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["goal_gifts"]["Insert"]>
        Relationships: []
      }

      goal_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          destination: string | null
          target_amount_ngn: number
          lock_type: string | null
          lock_months: number | null
          icon: string | null
          segment: string | null
          related_niche_page_slug: string | null
          sort_order: number | null
          is_active: boolean
          updated_at: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["goal_templates"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["goal_templates"]["Insert"]>
        Relationships: []
      }

      holiday_packages: {
        Row: {
          id: string
          title: string
          destination: string
          description: string | null
          duration_nights: number
          price_per_person_ngn: number
          price_per_person_usd: number | null
          price_per_person_aed: number | null
          price_per_person_qar: number | null
          price_per_person_gbp: number | null
          price_per_person_cad: number | null
          price_per_person_eur: number | null
          original_price_ngn: number | null
          slots_available: number | null
          inclusions: Json | null
          is_active: boolean
          is_featured: boolean
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["holiday_packages"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["holiday_packages"]["Insert"]>
        Relationships: []
      }

      holiday_bookings: {
        Row: {
          id: string
          user_id: string
          package_id: string
          reference: string
          travellers: number
          currency: string
          total_price: number
          status: string
          goal_id: string | null
          case_manager_notes: string | null
          internal_notes: string | null
          documents_requested_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["holiday_bookings"]["Row"], "id" | "created_at" | "updated_at" | "status">
        Update: Partial<Database["public"]["Tables"]["holiday_bookings"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "holiday_bookings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holiday_bookings_package_id_fkey"
            columns: ["package_id"]
            referencedRelation: "holiday_packages"
            referencedColumns: ["id"]
          }
        ]
      }

      leaderboard_entries: {
        Row: {
          id: string
          user_id: string
          period_key: string
          rank: number
          referral_count: number
          prize_awarded: boolean
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["leaderboard_entries"]["Row"], "id" | "created_at" | "prize_awarded">
        Update: Partial<Database["public"]["Tables"]["leaderboard_entries"]["Insert"]>
        Relationships: []
      }

      leaderboard_prizes: {
        Row: {
          id: string
          rank_position: number
          period_type: string
          prize_label: string
          prize_description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["leaderboard_prizes"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["leaderboard_prizes"]["Insert"]>
        Relationships: []
      }

      milestone_rewards: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          milestone_type: string
          reward_type: string | null
          reward_label: string | null
          reward_value_description: string | null
          redeemed: boolean
          redeemed_at: string | null
          redeemed_as: string | null
          credit_amount_ngn: number | null
          expires_at: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["milestone_rewards"]["Row"], "id" | "created_at" | "redeemed" | "redeemed_at">
        Update: Partial<Database["public"]["Tables"]["milestone_rewards"]["Insert"]>
        Relationships: []
      }

      niche_pages: {
        Row: {
          id: string
          url_prefix: string
          slug: string
          title: string
          subtitle: string | null
          destination: string | null
          category: string | null
          segment: string | null
          hero_headline: string | null
          hero_subtext: string | null
          hero_cta_label: string | null
          hero_cta_url: string | null
          process_steps: Json | null
          requirements: string[] | null
          faqs: Json | null
          cost_calculator_destination: string | null
          cost_calculator_service_type: string | null
          success_story_name: string | null
          success_story_role: string | null
          success_story_quote: string | null
          success_story_destination: string | null
          related_page_slugs: string[] | null
          meta_title: string | null
          meta_description: string | null
          meta_keywords: string | null
          og_image_url: string | null
          recommended_goal_template_id: string | null
          published: boolean
          view_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["niche_pages"]["Row"], "id" | "created_at" | "updated_at" | "view_count">
        Update: Partial<Database["public"]["Tables"]["niche_pages"]["Insert"]>
        Relationships: []
      }

      platform_settings: {
        Row: {
          id: string
          key: string
          value: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["platform_settings"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["platform_settings"]["Insert"]>
        Relationships: []
      }

      promotions: {
        Row: {
          id: string
          title: string
          description: string | null
          promotion_type: string
          prize_label: string
          prize_value_ngn: number | null
          trigger_type: string | null
          trigger_value: string | null
          trigger_category: string | null
          quantity_cap: number | null
          starts_at: string
          ends_at: string | null
          status: string
          spin_config: Json | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["promotions"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["promotions"]["Insert"]>
        Relationships: []
      }

      promotion_awards: {
        Row: {
          id: string
          promotion_id: string
          user_id: string
          award_type: string
          award_value_ngn: number | null
          award_description: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["promotion_awards"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["promotion_awards"]["Insert"]>
        Relationships: []
      }

      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          commission_status: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["referrals"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["referrals"]["Insert"]>
        Relationships: []
      }

      service_orders: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          package_id: string
          payment_method: string
          payment_currency: string
          milestone_discount_pct: number
          original_price: number
          final_price: number
          ngn_equivalent: number
          status: string
          case_manager_notes: string | null
          internal_notes: string | null
          documents_requested_at: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["service_orders"]["Row"], "id" | "created_at" | "status" | "final_price" | "ngn_equivalent">
        Update: Partial<Database["public"]["Tables"]["service_orders"]["Insert"]>
        Relationships: []
      }

      service_packages: {
        Row: {
          id: string
          category: string
          destination: string | null
          name: string
          short_description: string | null
          full_description: string | null
          price_ngn: number
          price_usd: number | null
          price_aed: number | null
          price_qar: number | null
          price_gbp: number | null
          price_cad: number | null
          price_eur: number | null
          processing_weeks_min: number | null
          processing_weeks_max: number | null
          is_active: boolean
          is_featured: boolean
          badge_text: string | null
          sort_order: number | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["service_packages"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["service_packages"]["Insert"]>
        Relationships: []
      }

      user_preferences: {
        Row: {
          id: string
          user_id: string
          preference_key: string
          in_app: boolean
          email: boolean
          updated_at: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["user_preferences"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["user_preferences"]["Insert"]>
        Relationships: []
      }

      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["user_roles"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>
        Relationships: []
      }

      visa_redemptions: {
        Row: {
          id: string
          user_id: string
          reward_id: string
          booking_fee_usd: number
          booking_fee_ngn: number
          status: string
          nights: number
          total_fee_usd: number | null
          base_fee_usd: number | null
          extra_fee_usd: number | null
          payment_reference: string | null
          booking_fee_deposit_id: string | null
          deposit_id: string | null
          passport_photo_url: string | null
          passport_data_page_url: string | null
          expires_at: string | null
          reminder_sent_at: string | null
          final_reminder_sent_at: string | null
          abandoned_at: string | null
          updated_at: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["visa_redemptions"]["Row"], "id" | "created_at" | "updated_at" | "status" | "reminder_sent_at" | "final_reminder_sent_at" | "abandoned_at" | "passport_photo_url" | "passport_data_page_url" | "booking_fee_deposit_id" | "deposit_id">
        Update: Partial<Database["public"]["Tables"]["visa_redemptions"]["Insert"]>
        Relationships: []
      }

      withdrawals: {
        Row: {
          id: string
          user_id: string
          goal_id: string
          currency: string
          gross_amount: number
          penalty_rate: number
          penalty_amount: number
          net_amount: number
          is_early_exit: boolean
          bank_name: string
          account_number: string
          account_name: string
          status: string
          requested_at: string
          processed_at: string | null
          processed_by: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["withdrawals"]["Row"], "id" | "created_at" | "status" | "requested_at" | "processed_at" | "processed_by">
        Update: Partial<Database["public"]["Tables"]["withdrawals"]["Insert"]>
        Relationships: []
      }

      readiness_score_log: {
        Row: {
          id: string
          user_id: string
          event_type: string
          points_awarded: number
          running_total: number
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["readiness_score_log"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["readiness_score_log"]["Insert"]>
        Relationships: []
      }

      trade_shows: {
        Row: {
          id: string
          name: string
          location_city: string
          location_country: string
          venue: string | null
          event_date_start: string
          event_date_end: string
          registration_deadline: string | null
          category: string
          base_cost_solo_ngn: number
          base_cost_group_ngn: number | null
          min_group_size: number
          max_group_size: number
          description: string | null
          invitation_letter_fee_ngn: number
          image_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["trade_shows"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["trade_shows"]["Insert"]>
        Relationships: []
      }

      trade_show_groups: {
        Row: {
          id: string
          organizer_id: string
          trade_show_id: string
          title: string
          description: string | null
          target_group_size: number
          current_member_count: number
          cost_per_person_ngn: number
          status: string
          activation_threshold_pct: number
          invite_code: string
          savings_deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["trade_show_groups"]["Row"], "id" | "created_at" | "updated_at" | "current_member_count">
        Update: Partial<Database["public"]["Tables"]["trade_show_groups"]["Insert"]>
        Relationships: []
      }

      trade_show_group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string
          savings_goal_id: string | null
          status: string
          amount_saved_ngn: number
          funded_at: string | null
          joined_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["trade_show_group_members"]["Row"], "id" | "joined_at">
        Update: Partial<Database["public"]["Tables"]["trade_show_group_members"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_mobility_score: {
        Args: { user_id_input: string; points: number }
        Returns: void
      }
      deduct_goal_balance: {
        Args: { goal_id_input: string; amount_input: number }
        Returns: void
      }
      increment_goal_balance: {
        Args: { goal_id_input: string; amount_input: number }
        Returns: void
      }
      recalculate_wallet_locked: {
        Args: { user_id_input: string }
        Returns: void
      }
      confirm_deposit: {
        Args: Record<string, never>
        Returns: void
      }
      apply_credit_to_order: {
        Args: { order_id_input: string; user_id_input: string; credit_amount_to_apply: number }
        Returns: number
      }
      check_and_unlock_milestones_rpc: {
        Args: { goal_id_input: string; user_id_input: string; current_pct: number }
        Returns: void
      }
      update_leaderboard_entry: {
        Args: { user_id_input: string; period_key_input: string }
        Returns: void
      }
      get_current_period_key: {
        Args: Record<string, never>
        Returns: string
      }
      calculate_readiness_score: {
        Args: { user_id_input: string }
        Returns: number
      }
      check_and_update_trade_show_group_funding: {
        Args: { goal_id: string }
        Returns: void
      }
    }
  }
}
