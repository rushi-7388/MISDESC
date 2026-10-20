-- ==============================================================================
-- MISDESC National Cheque Truncation & Sovereign Clearing System
-- PostgreSQL 16+ Database Initialization Script
-- ==============================================================================

-- Enable required cryptographic and performance extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Set standard timezone & Indian locale formatting defaults
SET timezone = 'Asia/Kolkata';

-- Create dedicated application schema if not exists
CREATE SCHEMA IF NOT EXISTS public;

-- Grant permissions
GRANT ALL ON SCHEMA public TO CURRENT_USER;

-- Comment for regulatory audits
COMMENT ON SCHEMA public IS 'MISDESC Sovereign Clearing & Cheque Truncation System (CTS-2010)';
