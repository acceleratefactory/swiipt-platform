SELECT
  (SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'confirm_deposit'))::text AS confirm_deposit_exists,
  (SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_and_unlock_milestones'))::text AS milestones_function_exists,
  (SELECT COUNT(*)::text FROM platform_settings WHERE key IN ('bank_name','bank_account_number','bank_account_name','milestone_25_label','milestone_50_label','milestone_75_label','milestone_100_label','milestone_100_discount_pct')) AS platform_settings_found;
