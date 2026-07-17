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
          global_profile_complete: boolean
          trust_score: number
          income_estimate_usd_monthly: number | null
          skills: string[] | null
          languages: string[] | null
          linkedin_url: string | null
          user_tier: string
          tier_unlocked_via: string | null
          tier_unlocked_at: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at" | "mobility_score" | "alumni_status" | "readiness_score" | "readiness_destination" | "readiness_last_calculated" | "global_profile_complete" | "trust_score" | "income_estimate_usd_monthly" | "skills" | "languages" | "linkedin_url" | "user_tier" | "tier_unlocked_via" | "tier_unlocked_at">
        Update: Partial<Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at">>
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

      financial_profiles: {
        Row: {
          id: string
          user_id: string
          total_deposited_ngn: number
          total_goals_created: number
          total_goals_completed: number
          average_monthly_deposit_ngn: number
          deposit_consistency_score: number
          longest_streak_weeks: number
          primary_destination: string | null
          secondary_destination: string | null
          estimated_move_timeline: string | null
          relocation_intent_score: number
          has_uk_company: boolean
          has_us_llc: boolean
          has_uae_company: boolean
          is_sme_owner: boolean
          identity_verified: boolean
          documents_verified_count: number
          services_completed: number
          platform_tenure_days: number
          trust_score: number
          last_calculated: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["financial_profiles"]["Row"], "id" | "created_at" | "last_calculated">
        Update: Partial<Database["public"]["Tables"]["financial_profiles"]["Insert"]>
        Relationships: []
      }

      platform_certificates: {
        Row: {
          id: string
          user_id: string
          certificate_type: string
          certificate_number: string
          goal_id: string | null
          data_snapshot: Json
          verification_url: string
          is_valid: boolean
          expires_at: string
          fee_paid_ngn: number
          fee_deposit_id: string | null
          issued_at: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["platform_certificates"]["Row"], "id" | "created_at" | "issued_at">
        Update: Partial<Database["public"]["Tables"]["platform_certificates"]["Insert"]>
        Relationships: []
      }

      platform_partners: {
        Row: {
          id: string
          name: string
          business_name: string | null
          email: string
          phone: string | null
          partner_type: string
          status: string
          verification_documents: Json
          verified_by: string | null
          verified_at: string | null
          cac_number: string | null
          professional_licence_number: string | null
          years_in_operation: number | null
          specialisations: string[] | null
          destinations_served: string[] | null
          average_rating: number
          total_reviews: number
          total_escrow_volume_ngn: number
          total_escrow_transactions: number
          platform_fee_pct: number
          stripe_account_id: string | null
          is_available: boolean
          api_key: string | null
          api_key_hash: string | null
          daily_submission_limit: number
          submissions_today: number
          submission_reset_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["platform_partners"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["platform_partners"]["Insert"]>
        Relationships: []
      }

      partner_submissions: {
        Row: {
          id: string
          partner_id: string
          title: string
          organisation: string | null
          description: string | null
          url: string | null
          location: string | null
          type: string | null
          deadline: string | null
          salary: string | null
          raw_data: Json
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          opportunity_id: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["partner_submissions"]["Row"], "id" | "created_at" | "reviewed_by" | "reviewed_at" | "review_notes" | "opportunity_id">
        Update: Partial<Database["public"]["Tables"]["partner_submissions"]["Insert"]>
        Relationships: []
      }

      escrow_deals: {
        Row: {
          id: string
          partner_id: string
          client_user_id: string
          title: string
          description: string | null
          total_amount_ngn: number
          platform_fee_ngn: number
          partner_payout_ngn: number
          status: string
          milestones: Json
          savings_goal_id: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["escrow_deals"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["escrow_deals"]["Insert"]>
        Relationships: []
      }

      diaspora_gifts: {
        Row: {
          id: string
          goal_id: string
          recipient_user_id: string
          giver_name: string
          giver_email: string | null
          giver_country: string | null
          amount_paid_foreign: number
          foreign_currency: string
          fx_rate_used: number
          amount_credited_ngn: number
          platform_fee_ngn: number
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          gift_message: string | null
          status: string
          completed_at: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["diaspora_gifts"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["diaspora_gifts"]["Insert"]>
        Relationships: []
      }

      // ── Sprint 18 tables ──

      // ── Pre-Sprint 19: Data-driven types ──

      opportunity_types: {
        Row: {
          slug: string
          name: string
          emoji: string | null
          bg_color: string
          text_color: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["opportunity_types"]["Row"], "created_at">
        Update: Partial<Database["public"]["Tables"]["opportunity_types"]["Insert"]>
        Relationships: []
      }

      career_segments: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          icon: string | null
          bg_color: string | null
          text_color: string | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["career_segments"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["career_segments"]["Insert"]>
        Relationships: []
      }

      opportunities: {
        Row: {
          id: string
          segment_slug: string
          title: string
          organisation: string
          location_country: string
          location_city: string | null
          type: string
          description: string
          requirements: string | null
          salary_range: string | null
          funding_amount: string | null
          deadline: string | null
          application_url: string
          normalized_url: string | null
          is_featured: boolean
          related_service_slug: string | null
          related_goal_template_id: string | null
          source_url: string | null
          source_name: string | null
          ai_generated: boolean
          ai_relevance_score: number | null
          ai_quality_score: number | null
          is_scam_risk: boolean | null
          quality_reason: string | null
          is_active: boolean
          view_count: number
          apply_click_count: number
          cover_image_url: string | null
          video_url: string | null
          media_type: string | null
          thumbnail_url: string | null
          media_source: string | null
          media_aspect_ratio: string | null
          org_logo_url: string | null
          published_at: string | null
          service_cta_type: string | null
          service_url: string | null
          provenance: Json
          needs_review: boolean | null
          review_reason: string | null
          language: string | null
          is_non_english: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["opportunities"]["Row"], "id" | "created_at" | "updated_at" | "view_count" | "apply_click_count">
        Update: Partial<Database["public"]["Tables"]["opportunities"]["Insert"]>
        Relationships: []
      }

      user_opportunity_feed: {
        Row: {
          id: string
          user_id: string
          opportunity_id: string
          relevance_score: number
          is_saved: boolean
          is_applied: boolean
          is_dismissed: boolean
          applied_at: string | null
          saved_at: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["user_opportunity_feed"]["Row"], "id" | "created_at" | "relevance_score" | "is_saved" | "is_applied" | "is_dismissed">
        Update: Partial<Database["public"]["Tables"]["user_opportunity_feed"]["Insert"]>
        Relationships: []
      }

      career_profiles: {
        Row: {
          id: string
          user_id: string
          segment_slug: string | null
          current_role: string | null
          years_experience: number | null
          highest_qualification: string | null
          field_of_study: string | null
          certifications: string[] | null
          desired_roles: string[] | null
          desired_countries: string[] | null
          desired_salary_usd_monthly: number | null
          employment_type: string[] | null
          current_level: string | null
          gpa: number | null
          ielts_score: number | null
          gre_score: number | null
          study_fields: string[] | null
          target_universities: string[] | null
          scholarship_interest: boolean
          sport: string | null
          position: string | null
          current_club: string | null
          target_leagues: string[] | null
          video_url: string | null
          freelancer_platforms: string[] | null
          hourly_rate_usd: number | null
          portfolio_url: string | null
          availability: string | null
          visa_status: string | null
          passport_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["career_profiles"]["Row"], "id" | "created_at" | "updated_at" | "scholarship_interest">
        Update: Partial<Database["public"]["Tables"]["career_profiles"]["Insert"]>
        Relationships: []
      }

      affiliate_modules: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          content_type: string
          content_url: string | null
          content_body: string | null
          duration_minutes: number | null
          order_in_course: number
          is_free: boolean
          min_affiliate_tier: string | null
          points_on_completion: number
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["affiliate_modules"]["Row"], "id" | "created_at" | "is_free" | "points_on_completion">
        Update: Partial<Database["public"]["Tables"]["affiliate_modules"]["Insert"]>
        Relationships: []
      }

      affiliate_module_progress: {
        Row: {
          id: string
          user_id: string
          module_id: string
          status: string
          score: number | null
          completed_at: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["affiliate_module_progress"]["Row"], "id" | "created_at" | "status">
        Update: Partial<Database["public"]["Tables"]["affiliate_module_progress"]["Insert"]>
        Relationships: []
      }

      affiliate_status: {
        Row: {
          id: string
          user_id: string
          tier: string
          tier_upgraded_at: string | null
          total_earned_ngn: number
          pending_earnings_ngn: number
          withdrawn_earnings_ngn: number
          total_referrals: number
          converting_referrals: number
          conversion_rate_pct: number
          custom_affiliate_code: string | null
          custom_landing_page_slug: string | null
          tracking_pixel_code: string | null
          modules_completed: number
          university_points: number
          university_certificate_issued: boolean
          monthly_rank: number | null
          all_time_rank: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["affiliate_status"]["Row"], "id" | "created_at" | "updated_at" | "tier" | "total_earned_ngn" | "pending_earnings_ngn" | "withdrawn_earnings_ngn" | "total_referrals" | "converting_referrals" | "conversion_rate_pct" | "modules_completed" | "university_points" | "university_certificate_issued">
        Update: Partial<Omit<Database["public"]["Tables"]["affiliate_status"]["Row"], "id" | "created_at" | "updated_at">>
        Relationships: []
      }

      affiliate_withdrawals: {
        Row: {
          id: string
          user_id: string
          amount_ngn: number
          status: string
          admin_id: string | null
          admin_note: string | null
          requested_at: string
          processed_at: string | null
        }
        Insert: Omit<Database["public"]["Tables"]["affiliate_withdrawals"]["Row"], "id" | "status" | "admin_id" | "admin_note" | "requested_at" | "processed_at">
        Update: Partial<Omit<Database["public"]["Tables"]["affiliate_withdrawals"]["Row"], "id">>
        Relationships: []
      }

      achievement_cards: {
        Row: {
          id: string
          user_id: string
          card_type: string
          title: string
          subtitle: string
          data: Json
          is_shared_whatsapp: boolean
          is_shared_instagram: boolean
          is_dismissed: boolean
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["achievement_cards"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["achievement_cards"]["Insert"]>
        Relationships: []
      }

      viral_campaigns: {
        Row: {
          id: string
          title: string
          description: string | null
          reward_type: string
          reward_amount_ngn: number
          reward_per_invite: boolean
          invites_target: number | null
          requires_segment: string | null
          min_readiness_score: number
          starts_at: string
          ends_at: string
          max_participants: number | null
          current_participants: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["viral_campaigns"]["Row"], "id" | "created_at" | "current_participants" | "min_readiness_score" | "reward_per_invite">
        Update: Partial<Database["public"]["Tables"]["viral_campaigns"]["Insert"]>
        Relationships: []
      }

      ai_providers: {
        Row: {
          id: string
          name: string
          provider_slug: string
          base_url: string
          api_key: string
          model: string
          is_active: boolean
          priority: number
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["ai_providers"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["ai_providers"]["Insert"]>
        Relationships: []
      }

      campaign_participations: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          invites_sent: number
          invites_converted: number
          reward_earned_ngn: number
          reward_paid: boolean
          joined_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["campaign_participations"]["Row"], "id" | "joined_at" | "invites_sent" | "invites_converted" | "reward_earned_ngn" | "reward_paid">
        Update: Partial<Database["public"]["Tables"]["campaign_participations"]["Insert"]>
        Relationships: []
      }

      success_stories: {
        Row: {
          id: string
          user_id: string
          order_id: string | null
          first_name: string
          destination_country: string
          service_completed: string
          journey_duration: string | null
          approximate_cost_range: string | null
          hardest_part: string | null
          advice: string | null
          photo_url: string | null
          open_to_contact: boolean
          status: string
          published_at: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["success_stories"]["Row"], "id" | "created_at" | "status" | "open_to_contact">
        Update: Partial<Database["public"]["Tables"]["success_stories"]["Insert"]>
        Relationships: []
      }

      opportunity_signals: {
        Row: {
          id: string
          user_id: string
          opportunity_id: string
          signal_type: string
          opportunity_segment: string | null
          opportunity_type: string | null
          opportunity_country: string | null
          opportunity_organisation: string | null
          signal_weight: number
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["opportunity_signals"]["Row"], "id" | "created_at" | "signal_weight">
        Update: Partial<Database["public"]["Tables"]["opportunity_signals"]["Insert"]>
        Relationships: []
      }

      user_interest_model: {
        Row: {
          id: string
          user_id: string
          segment_scores: Json
          country_scores: Json
          type_scores: Json
          org_affinity: Json
          suppressed_countries: Json
          suppressed_types: Json
          total_signals: number
          last_updated: string
          model_confidence: string
        }
        Insert: Omit<Database["public"]["Tables"]["user_interest_model"]["Row"], "id" | "total_signals" | "last_updated" | "model_confidence">
        Update: Partial<Database["public"]["Tables"]["user_interest_model"]["Insert"]>
        Relationships: []
      }

      opportunity_comments: {
        Row: {
          id: string
          opportunity_id: string
          user_id: string
          body: string
          status: string
          like_count: number
          parent_id: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["opportunity_comments"]["Row"], "id" | "created_at" | "status" | "like_count">
        Update: Partial<Database["public"]["Tables"]["opportunity_comments"]["Insert"]>
        Relationships: []
      }

      evidence: {
        Row: {
          id: string
          evidence_type: string
          raw_data: Json
          source_url: string | null
          source_name: string | null
          content_hash: string | null
          captured_at: string
          enrichment_status: string
          opportunity_id: string | null
          enriched_data: Json
          ai_model: string | null
          ai_confidence: number | null
          normalized_url: string | null
          quality_score: number | null
          is_scam_risk: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["evidence"]["Row"], "id" | "captured_at" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["evidence"]["Insert"]>
        Relationships: []
      }

      opportunity_queue: {
        Row: {
          id: string
          raw_title: string | null
          raw_organisation: string | null
          raw_location: string | null
          raw_description: string | null
          raw_salary: string | null
          raw_deadline: string | null
          raw_url: string
          raw_requirements: string | null
          source_name: string
          source_url: string | null
          ingest_method: string
          status: string
          confidence_score: number | null
          ai_enriched_data: Json
          rejection_reason: string | null
          review_notes: string | null
          ingested_at: string
          processed_at: string | null
          published_opportunity_id: string | null
        }
        Insert: Omit<Database["public"]["Tables"]["opportunity_queue"]["Row"], "id" | "ingested_at" | "status" | "processed_at" | "confidence_score" | "ai_enriched_data" | "rejection_reason" | "review_notes" | "published_opportunity_id">
        Update: Partial<Database["public"]["Tables"]["opportunity_queue"]["Insert"]>
        Relationships: []
      }

      opportunity_sources: {
        Row: {
          id: string
          name: string
          source_type: string
          source_url: string
          segment_slug: string | null
          is_active: boolean
          source_status: string
          is_degraded: boolean
          pull_frequency_hours: number
          last_pulled_at: string | null
          total_ingested: number
          total_published: number
          trust_tier: string
          consecutive_errors: number
          last_error: string | null
          last_error_at: string | null
          max_concurrent: number
          rate_limit_per_hour: number
          rate_used_this_hour: number
          rate_window_start: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["opportunity_sources"]["Row"], "id" | "created_at" | "is_active" | "total_ingested" | "total_published" | "last_pulled_at" | "consecutive_errors" | "rate_used_this_hour">
        Update: Partial<Database["public"]["Tables"]["opportunity_sources"]["Insert"]>
        Relationships: []
      }

      source_health_log: {
        Row: {
          id: string
          source_id: string
          pulled_at: string | null
          items_found: number
          items_new: number
          items_duplicate: number
          duration_ms: number | null
          error_message: string | null
          success: boolean
        }
        Insert: Omit<Database["public"]["Tables"]["source_health_log"]["Row"], "id" | "pulled_at">
        Update: Partial<Database["public"]["Tables"]["source_health_log"]["Insert"]>
        Relationships: []
      }

      page_hashes: {
        Row: {
          id: string
          source_id: string
          page_url: string
          content_hash: string
          content_snapshot: string | null
          last_checked_at: string | null
          last_changed_at: string | null
          change_count: number
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["page_hashes"]["Row"], "id" | "created_at" | "change_count">
        Update: Partial<Database["public"]["Tables"]["page_hashes"]["Insert"]>
        Relationships: []
      }

      feed_ads: {
        Row: {
          id: string
          ad_type: string
          advertiser_name: string | null
          headline: string
          body: string | null
          cover_image_url: string | null
          video_url: string | null
          media_type: string
          cta_label: string
          cta_url: string
          target_segments: string[] | null
          target_countries: string[] | null
          frequency: number
          priority: number
          status: string
          starts_at: string | null
          ends_at: string | null
          budget_impressions: number | null
          impression_count: number
          click_count: number
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["feed_ads"]["Row"], "id" | "created_at" | "impression_count" | "click_count">
        Update: Partial<Database["public"]["Tables"]["feed_ads"]["Insert"]>
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
      calculate_financial_profile: {
        Args: { user_id_input: string }
        Returns: void
      }
      next_certificate_number: {
        Args: { cert_prefix: string }
        Returns: string
      }
      check_and_update_trade_show_group_funding: {
        Args: { goal_id: string }
        Returns: void
      }
      check_and_upgrade_tier: {
        Args: { user_id_input: string }
        Returns: string
      }
    }
  }
}
