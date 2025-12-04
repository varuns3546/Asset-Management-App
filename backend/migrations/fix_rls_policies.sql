-- Fix RLS Policies for GIS Tables
-- Run this in Supabase SQL Editor

-- First, disable RLS temporarily to clean up
ALTER TABLE gis_layers DISABLE ROW LEVEL SECURITY;
ALTER TABLE gis_features DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view gis_layers from their projects" ON gis_layers;
DROP POLICY IF EXISTS "Users can insert gis_layers to their projects" ON gis_layers;
DROP POLICY IF EXISTS "Users can update gis_layers in their projects" ON gis_layers;
DROP POLICY IF EXISTS "Users can delete gis_layers from their projects" ON gis_layers;

DROP POLICY IF EXISTS "Users can view features from gis_layers in their projects" ON gis_features;
DROP POLICY IF EXISTS "Users can insert features to gis_layers in their projects" ON gis_features;
DROP POLICY IF EXISTS "Users can update features in gis_layers in their projects" ON gis_features;
DROP POLICY IF EXISTS "Users can delete features from gis_layers in their projects" ON gis_features;

-- Re-enable RLS
ALTER TABLE gis_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gis_features ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for gis_layers
CREATE POLICY "Allow all operations on gis_layers for authenticated users"
  ON gis_layers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = gis_layers.project_id 
      AND project_users.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = gis_layers.project_id 
      AND projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = gis_layers.project_id 
      AND project_users.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = gis_layers.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Create simplified policies for gis_features
CREATE POLICY "Allow all operations on gis_features for authenticated users"
  ON gis_features
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM gis_layers 
      JOIN project_users ON project_users.project_id = gis_layers.project_id
      WHERE gis_layers.id = gis_features.layer_id 
      AND project_users.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM gis_layers 
      JOIN projects ON projects.id = gis_layers.project_id
      WHERE gis_layers.id = gis_features.layer_id 
      AND projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gis_layers 
      JOIN project_users ON project_users.project_id = gis_layers.project_id
      WHERE gis_layers.id = gis_features.layer_id 
      AND project_users.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM gis_layers 
      JOIN projects ON projects.id = gis_layers.project_id
      WHERE gis_layers.id = gis_features.layer_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Verify policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('gis_layers', 'gis_features')
ORDER BY tablename, policyname;

