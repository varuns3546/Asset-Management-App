-- Migration: Link hierarchy_features to gis_features
-- This creates a foreign key relationship so hierarchy items can be displayed on the map

-- Add gis_feature_id column to hierarchy_features table
ALTER TABLE hierarchy_features 
ADD COLUMN IF NOT EXISTS gis_feature_id UUID REFERENCES gis_features(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_hierarchy_features_gis_feature_id 
ON hierarchy_features(gis_feature_id);

-- Add comment for documentation
COMMENT ON COLUMN hierarchy_features.gis_feature_id IS 'Optional link to a GIS feature for map visualization';

