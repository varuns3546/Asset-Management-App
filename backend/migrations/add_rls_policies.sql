-- Add RLS Policies for GIS Tables
-- Run this in Supabase SQL Editor

-- Enable Row Level Security
ALTER TABLE gis_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gis_features ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view gis_layers from their projects" ON gis_layers;
DROP POLICY IF EXISTS "Users can insert gis_layers to their projects" ON gis_layers;
DROP POLICY IF EXISTS "Users can update gis_layers in their projects" ON gis_layers;
DROP POLICY IF EXISTS "Users can delete gis_layers from their projects" ON gis_layers;

DROP POLICY IF EXISTS "Users can view features from gis_layers in their projects" ON gis_features;
DROP POLICY IF EXISTS "Users can insert features to gis_layers in their projects" ON gis_features;
DROP POLICY IF EXISTS "Users can update features in gis_layers in their projects" ON gis_features;
DROP POLICY IF EXISTS "Users can delete features from gis_layers in their projects" ON gis_features;

-- RLS Policies for gis_layers table
CREATE POLICY "Users can view gis_layers from their projects"
  ON gis_layers FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
    )
    OR
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert gis_layers to their projects"
  ON gis_layers FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
    )
    OR
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update gis_layers in their projects"
  ON gis_layers FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
    )
    OR
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete gis_layers from their projects"
  ON gis_layers FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
    )
    OR
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for gis_features table
CREATE POLICY "Users can view features from gis_layers in their projects"
  ON gis_features FOR SELECT
  USING (
    layer_id IN (
      SELECT id FROM gis_layers WHERE project_id IN (
        SELECT project_id FROM project_users WHERE user_id = auth.uid()
      )
      OR project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert features to gis_layers in their projects"
  ON gis_features FOR INSERT
  WITH CHECK (
    layer_id IN (
      SELECT id FROM gis_layers WHERE project_id IN (
        SELECT project_id FROM project_users WHERE user_id = auth.uid()
      )
      OR project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update features in gis_layers in their projects"
  ON gis_features FOR UPDATE
  USING (
    layer_id IN (
      SELECT id FROM gis_layers WHERE project_id IN (
        SELECT project_id FROM project_users WHERE user_id = auth.uid()
      )
      OR project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete features from gis_layers in their projects"
  ON gis_features FOR DELETE
  USING (
    layer_id IN (
      SELECT id FROM gis_layers WHERE project_id IN (
        SELECT project_id FROM project_users WHERE user_id = auth.uid()
      )
      OR project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
      )
    )
  );

-- Verify policies were created
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('gis_layers', 'gis_features')
ORDER BY tablename, policyname;

