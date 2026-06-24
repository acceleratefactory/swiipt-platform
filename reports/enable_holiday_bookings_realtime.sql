-- Enable Realtime for holiday_bookings (required for live status updates)
-- Run in Supabase SQL Editor after deploying the code
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY holiday_bookings;
