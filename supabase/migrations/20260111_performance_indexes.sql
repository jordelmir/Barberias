-- 20260111_performance_indexes.sql
-- CRITICAL PERFORMANCE FIX: Indexing Foreign Keys for RLS Optimization

-- 1. Profiles (Used in almost every query for permission checks)
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);

-- 2. Clients (High volume table, filtered by org)
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id);

-- 3. Appointments (High volume, time-series data, filtered by org)
CREATE INDEX IF NOT EXISTS idx_appointments_organization_id ON appointments(organization_id);
-- Also index status and date range for dashboard speed
CREATE INDEX IF NOT EXISTS idx_appointments_date_range ON appointments(organization_id, start_time, expected_end_time);

-- 4. Barbers (Joined frequently)
CREATE INDEX IF NOT EXISTS idx_barbers_organization_id ON barbers(organization_id);

-- 5. Services (Joined frequently)
CREATE INDEX IF NOT EXISTS idx_services_organization_id ON services(organization_id);
