-- Migration: Add asset_id column to gis_features table
-- This creates a proper foreign key relationship between features and assets
-- Instead of storing asset_id in the JSON properties field

-- Add the asset_id column (nullable, since features can exist without assets)
ALTER TABLE gis_features ADD COLUMN IF NOT EXISTS asset_id UUID;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_gis_features_asset_id ON gis_features(asset_id);

-- Migrate existing data: extract asset_id from properties JSON if it exists
-- This handles both JSON string and JSONB formats
UPDATE gis_features
SET asset_id = (
  CASE 
    WHEN properties::text LIKE '%"asset_id"%' THEN
      -- Extract asset_id from JSON properties
      (properties::json->>'asset_id')::UUID
    WHEN properties::jsonb ? 'asset_id' THEN
      (properties::jsonb->>'asset_id')::UUID
    ELSE NULL
  END
)
WHERE asset_id IS NULL
  AND properties IS NOT NULL;

-- Add foreign key constraint (optional - can be added later if needed)
-- This ensures referential integrity but allows NULL values
-- ALTER TABLE gis_features 
--   ADD CONSTRAINT fk_gis_features_asset_id 
--   FOREIGN KEY (asset_id) 
--   REFERENCES assets(id) 
--   ON DELETE CASCADE;

-- Add comment to document the column
COMMENT ON COLUMN gis_features.asset_id IS 'Foreign key to assets table. NULL if feature is not linked to an asset.';

