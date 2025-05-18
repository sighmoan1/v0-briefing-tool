-- Create incidents table if it doesn't exist
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_sensitive BOOLEAN DEFAULT FALSE,
  editor_password_hash TEXT,
  created_by UUID
);

-- Create briefings table if it doesn't exist
CREATE TABLE IF NOT EXISTS briefings (
  id UUID PRIMARY KEY,
  incident_id UUID NOT NULL,
  type TEXT NOT NULL,
  shift TEXT NOT NULL,
  content JSONB,
  viewer_password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Create access_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL,
  resource_type TEXT NOT NULL,
  user_id UUID,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_granted BOOLEAN NOT NULL
);

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
