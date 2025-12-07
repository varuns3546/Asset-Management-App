-- Migration: Create project_files table for Supabase Storage metadata
-- Run this in Supabase SQL Editor

-- Create the project_files table
CREATE TABLE IF NOT EXISTS project_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_by ON project_files(uploaded_by);

-- Enable RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access files from projects they have access to
CREATE POLICY "Users can view project files" ON project_files
FOR SELECT USING (
  project_id IN (
    SELECT project_id FROM project_users WHERE user_id = auth.uid()
  )
  OR
  project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert project files" ON project_files
FOR INSERT WITH CHECK (
  project_id IN (
    SELECT project_id FROM project_users WHERE user_id = auth.uid()
  )
  OR
  project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete project files" ON project_files
FOR DELETE USING (
  project_id IN (
    SELECT project_id FROM project_users WHERE user_id = auth.uid()
  )
  OR
  project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  )
);

-- Add comment
COMMENT ON TABLE project_files IS 'Stores metadata for files uploaded to Supabase Storage';

