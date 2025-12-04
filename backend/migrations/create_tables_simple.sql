-- Simplified GIS Tables Migration
-- Run this if the full migration had issues

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop tables if they exist (clean slate)
DROP TABLE IF EXISTS gis_features CASCADE;
DROP TABLE IF EXISTS gis_layers CASCADE;

-- Create gis_layers table
CREATE TABLE gis_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  layer_type VARCHAR(50) NOT NULL,
  geometry_type VARCHAR(50),
  srid INTEGER DEFAULT 4326,
  visible BOOLEAN DEFAULT true,
  style JSONB DEFAULT '{}',
  attributes JSONB DEFAULT '[]',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gis_features table
CREATE TABLE gis_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id UUID NOT NULL REFERENCES gis_layers(id) ON DELETE CASCADE,
  name VARCHAR(255),
  geometry geometry(Geometry, 4326),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_gis_layers_project_id ON gis_layers(project_id);
CREATE INDEX idx_gis_features_layer_id ON gis_features(layer_id);
CREATE INDEX idx_gis_features_geometry ON gis_features USING GIST(geometry);

-- Verify tables were created
SELECT 'gis_layers table created' as status, COUNT(*) as row_count FROM gis_layers;
SELECT 'gis_features table created' as status, COUNT(*) as row_count FROM gis_features;

