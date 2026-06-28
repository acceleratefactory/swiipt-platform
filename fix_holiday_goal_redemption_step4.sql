-- Step 4: Add goal_id to holiday_bookings for goal redemption linkage
-- Safe ALTER TABLE — adds column only, no data loss, no drop
ALTER TABLE holiday_bookings 
ADD COLUMN goal_id UUID REFERENCES savings_goals(id) ON DELETE SET NULL;
