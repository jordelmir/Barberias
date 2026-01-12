-- RESET DATABASE FOR PRODUCTION
-- WARNING: THIS DELETES ALL BUSINESS DATA
-- Run this in Supabase SQL Editor

-- 1. Truncate Tables (Cascade to remove related rows)
TRUNCATE TABLE appointments CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE barbers CASCADE;
TRUNCATE TABLE services CASCADE;
TRUNCATE TABLE organizations CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- 2. Clean Auth Users?
-- We can't TRUNCATE auth.users easily from here without superuser, 
-- but the `generate_sales_batch.ts` script should be updated to handle existing users or we leave them.
-- For a "True" reset, one would delete users from the Dashboard > Authentication > Users.
-- OR via SQL if enabled:
-- DELETE FROM auth.users; -- CAREFUL. 
