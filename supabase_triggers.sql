-- =====================================================
-- SQL Triggers for Asset and Asset Type Deletions
-- =====================================================
-- Paste this into Supabase SQL Editor
-- =====================================================

-- 1. Trigger: Delete GIS features when an asset is deleted
-- =====================================================
CREATE OR REPLACE FUNCTION delete_gis_features_on_asset_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all GIS features that reference the deleted asset
  DELETE FROM gis_features
  WHERE asset_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_delete_gis_features_on_asset_delete ON assets;
CREATE TRIGGER trigger_delete_gis_features_on_asset_delete
  AFTER DELETE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION delete_gis_features_on_asset_delete();

-- =====================================================
-- 2. Trigger: Update GIS layer name when asset type is deleted
-- =====================================================
CREATE OR REPLACE FUNCTION update_gis_layer_on_asset_type_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Update any GIS layers that have the same name as the deleted asset type
  -- Change the layer name to "Uncategorized Assets"
  UPDATE gis_layers
  SET name = 'Uncategorized Assets',
      description = COALESCE(description, '') || ' (Original asset type was deleted)'
  WHERE name = OLD.title
    AND name != 'Uncategorized Assets'; -- Prevent infinite loop if already uncategorized
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_gis_layer_on_asset_type_delete ON asset_types;
CREATE TRIGGER trigger_update_gis_layer_on_asset_type_delete
  AFTER DELETE ON asset_types
  FOR EACH ROW
  EXECUTE FUNCTION update_gis_layer_on_asset_type_delete();

-- =====================================================
-- 3. Trigger: Delete GIS features when a layer is deleted
-- (This ensures features are cleaned up, but assets remain untouched)
-- =====================================================
CREATE OR REPLACE FUNCTION delete_gis_features_on_layer_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all GIS features that belong to the deleted layer
  -- This does NOT delete the assets - only the GIS features
  DELETE FROM gis_features
  WHERE layer_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_delete_gis_features_on_layer_delete ON gis_layers;
CREATE TRIGGER trigger_delete_gis_features_on_layer_delete
  AFTER DELETE ON gis_layers
  FOR EACH ROW
  EXECUTE FUNCTION delete_gis_features_on_layer_delete();

-- =====================================================
-- Optional: Add foreign key constraint with CASCADE delete
-- (Only if asset_id column exists and doesn't already have this constraint)
-- =====================================================
-- Uncomment the following if you want database-level cascade deletion
-- This provides an additional safety net beyond the trigger
-- NOTE: This will delete features when assets are deleted, but NOT delete assets when features are deleted

-- ALTER TABLE gis_features
-- DROP CONSTRAINT IF EXISTS gis_features_asset_id_fkey;

-- ALTER TABLE gis_features
-- ADD CONSTRAINT gis_features_asset_id_fkey
-- FOREIGN KEY (asset_id)
-- REFERENCES assets(id)
-- ON DELETE CASCADE;

-- =====================================================
-- Verification Queries (run these to test)
-- =====================================================

-- Check if triggers exist:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name LIKE '%asset%delete%';

-- Test asset deletion (be careful - this will actually delete):
-- DELETE FROM assets WHERE id = '<some_asset_id>';
-- Then check: SELECT * FROM gis_features WHERE asset_id = '<some_asset_id>';

-- Test asset type deletion (be careful - this will actually delete):
-- DELETE FROM asset_types WHERE id = '<some_asset_type_id>';
-- Then check: SELECT * FROM gis_layers WHERE name = '<original_asset_type_name>';
