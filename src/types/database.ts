export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
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
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'mobility_score' | 'alumni_status'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['wallets']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['wallets']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['currencies']['Row'], 'id' | 'last_updated_at'>
        Update: Partial<Database['public']['Tables']['currencies']['Insert']>
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
          status: 'active' | 'completed' | 'withdrawn' | 'cancelled'
          early_exit_penalty_rate: number
          milestone_25_unlocked: boolean
          milestone_50_unlocked: boolean
          milestone_75_unlocked: boolean
          milestone_100_unlocked: boolean
          linked_service_package_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['savings_goals']['Row'], 'id' | 'created_at' | 'current_balance' | 'milestone_25_unlocked' | 'milestone_50_unlocked' | 'milestone_75_unlocked' | 'milestone_100_unlocked'>
        Update: Partial<Database['public']['Tables']['savings_goals']['Insert']>
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
          status: 'pending' | 'confirmed' | 'rejected'
          user_confirmed_at: string | null
          admin_confirmed_at: string | null
          confirmed_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['deposits']['Row'], 'id' | 'created_at' | 'status' | 'user_confirmed_at' | 'admin_confirmed_at' | 'confirmed_by'>
        Update: Partial<Database['public']['Tables']['deposits']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'is_read'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
  }
}
