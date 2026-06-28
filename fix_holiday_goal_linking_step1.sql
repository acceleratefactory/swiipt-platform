-- Step 1: Add linked_holiday_package_id to savings_goals
-- Safe ALTER TABLE — adds column only, no data loss, no drop
ALTER TABLE savings_goals 
ADD COLUMN linked_holiday_package_id UUID REFERENCES holiday_packages(id) ON DELETE SET NULL;
