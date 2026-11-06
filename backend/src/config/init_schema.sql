-- Create the application role when it is missing.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'elts_admin') THEN
        EXECUTE format('CREATE ROLE %I WITH LOGIN PASSWORD %L', 'elts_admin', 'root');
    END IF;
END;
$$;

-- Create custom enums if they do not exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Admin', 'Document_Clerk', 'Official', 'Private_Citizen');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. USERS LAYER
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'Private_Citizen',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. LEGISLATURE TERMS CONFIGURATION
CREATE TABLE IF NOT EXISTS legislatures (
    id SERIAL PRIMARY KEY,
    term_label VARCHAR(100) NOT NULL UNIQUE, -- e.g., '22ND SANGGUNIANG BAYAN (2025-2028)'
    is_active BOOLEAN DEFAULT FALSE,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. COMMITTEES REGISTRY
CREATE TABLE IF NOT EXISTS committees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. LEGISLATIVE TRACKING MATRIX
CREATE TABLE IF NOT EXISTS legislative_measures (
    id SERIAL PRIMARY KEY,
    tracking_number VARCHAR(50) NOT NULL,
    subject_text TEXT NOT NULL,
    cr_number VARCHAR(50) NOT NULL,
    committee_id INTEGER REFERENCES committees(id) NOT NULL,
    committee_hearing_date DATE NOT NULL,
    ordinance_resolution_number VARCHAR(50) DEFAULT NULL,
    remarks TEXT,
    legislature_id INTEGER REFERENCES legislatures(id) NOT NULL,

    -- Storage system parameters for paths
    doc_received_url TEXT DEFAULT NULL,
    committee_report_url TEXT DEFAULT NULL,
    scanned_measure_url TEXT DEFAULT NULL,

    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast local data access lookups
CREATE INDEX IF NOT EXISTS idx_measures_legislature ON legislative_measures(legislature_id);
CREATE INDEX IF NOT EXISTS idx_measures_tracking ON legislative_measures(tracking_number);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO elts_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO elts_admin;