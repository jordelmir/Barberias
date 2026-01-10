-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS / ORGANIZATIONS (Strict Isolation Root)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USERS (Shared pool, linked to Organization)
-- Using Supabase Auth reference ideally, but for this standalone app we manage a profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'BARBER', 'CLIENT')),
    name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BARBERS (Staff Members)
-- Admins are also Barbers effectively if they cut hair, but this table tracks specific barber attributes
CREATE TABLE barbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    profile_id UUID REFERENCES profiles(id), -- If the barber is a login user
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    tier TEXT DEFAULT 'JUNIOR' CHECK (tier IN ('JUNIOR', 'SENIOR', 'MASTER')),
    speed_factor DECIMAL(3, 2) DEFAULT 1.0,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE, -- Admin user can be listed here
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SERVICES
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CLIENTS (CRM)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    access_code TEXT, -- Legacy simple auth
    points INTEGER DEFAULT 0,
    notes TEXT,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. APPOINTMENTS
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    client_id UUID REFERENCES clients(id),
    barber_id UUID REFERENCES barbers(id),
    service_id UUID REFERENCES services(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED')),
    price INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES (THE CRITICAL PART)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's org ID
CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Policy: Users can only see data from their own Organization
CREATE POLICY "Orgs are viewable by members" ON organizations
    FOR SELECT USING (id = get_current_org_id());

CREATE POLICY "Profiles viewable by org members" ON profiles
    FOR ALL USING (organization_id = get_current_org_id());

CREATE POLICY "Barbers viewable by org members" ON barbers
    FOR ALL USING (organization_id = get_current_org_id());

CREATE POLICY "Services viewable by org members" ON services
    FOR ALL USING (organization_id = get_current_org_id());

CREATE POLICY "Clients viewable by org members" ON clients
    FOR ALL USING (organization_id = get_current_org_id());

CREATE POLICY "Appointments viewable by org members" ON appointments
    FOR ALL USING (organization_id = get_current_org_id());

-- SEED 100 ADMINS (Pseudo-code for migration)
-- This part is usually done via a script, but we can insert orgs here
DO $$
DECLARE
    i INTEGER;
    new_org_id UUID;
    new_user_id UUID;
BEGIN
    FOR i IN 1..100 LOOP
        -- Create Organization
        INSERT INTO organizations (name) VALUES ('Barber Shop Tenant ' || i) RETURNING id INTO new_org_id;
        
        -- Create Service Catalog for this tenant
        INSERT INTO services (organization_id, name, duration_minutes, price) VALUES 
        (new_org_id, 'Corte Clásico', 45, 12000),
        (new_org_id, 'Barba', 30, 8000),
        (new_org_id, 'Servicio Completo', 75, 20000);

        -- Create Admin Barber
        INSERT INTO barbers (organization_id, name, email, tier, is_admin) VALUES
        (new_org_id, 'Admin Barber ' || i, 'admin' || i || '@barberias.com', 'MASTER', TRUE);

        -- Note: Actual Auth Users need to be created in auth.users via Supabase Auth API/Dashboard, 
        -- but this sets up the data structure.
    END LOOP;
END $$;
