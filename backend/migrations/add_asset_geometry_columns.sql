-- Migration: Add PostGIS geometry columns to assets table
-- This adds beginning_point and end_point geometry columns for spatial indexing and queries

-- Step 1: Add geometry columns
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS beginning_point geometry(Point, 4326),
ADD COLUMN IF NOT EXISTS end_point geometry(Point, 4326);

-- Step 2: Create spatial indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assets_beginning_point ON assets USING GIST (beginning_point);
CREATE INDEX IF NOT EXISTS idx_assets_end_point ON assets USING GIST (end_point);

-- Step 3: Migrate existing coordinate data to geometry columns
-- Convert beginning_latitude/beginning_longitude to beginning_point
UPDATE assets
SET beginning_point = ST_SetSRID(
  ST_MakePoint(
    beginning_longitude::double precision,
    beginning_latitude::double precision
  ),
  4326
)
WHERE beginning_latitude IS NOT NULL 
  AND beginning_longitude IS NOT NULL
  AND beginning_point IS NULL;

-- Convert end_latitude/end_longitude to end_point
UPDATE assets
SET end_point = ST_SetSRID(
  ST_MakePoint(
    end_longitude::double precision,
    end_latitude::double precision
  ),
  4326
)
WHERE end_latitude IS NOT NULL 
  AND end_longitude IS NOT NULL
  AND end_point IS NULL;

-- Step 4: Create trigger function to automatically update geometry when coordinates change
CREATE OR REPLACE FUNCTION update_asset_geometries()
RETURNS TRIGGER AS $$
BEGIN
  -- Update beginning_point when beginning coordinates change
  IF NEW.beginning_latitude IS NOT NULL AND NEW.beginning_longitude IS NOT NULL THEN
    NEW.beginning_point := ST_SetSRID(
      ST_MakePoint(
        NEW.beginning_longitude::double precision,
        NEW.beginning_latitude::double precision
      ),
      4326
    );
  ELSE
    NEW.beginning_point := NULL;
  END IF;

  -- Update end_point when end coordinates change
  IF NEW.end_latitude IS NOT NULL AND NEW.end_longitude IS NOT NULL THEN
    NEW.end_point := ST_SetSRID(
      ST_MakePoint(
        NEW.end_longitude::double precision,
        NEW.end_latitude::double precision
      ),
      4326
    );
  ELSE
    NEW.end_point := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to automatically update geometries
DROP TRIGGER IF EXISTS trigger_update_asset_geometries ON assets;
CREATE TRIGGER trigger_update_asset_geometries
BEFORE INSERT OR UPDATE OF beginning_latitude, beginning_longitude, end_latitude, end_longitude
ON assets
FOR EACH ROW
EXECUTE FUNCTION update_asset_geometries();

-- Step 6: Create RPC function to get assets with geometry as GeoJSON (optional, for easier querying)
CREATE OR REPLACE FUNCTION get_assets_with_geometries(p_project_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  item_type_id uuid,
  parent_id uuid,
  project_id uuid,
  beginning_latitude double precision,
  beginning_longitude double precision,
  end_latitude double precision,
  end_longitude double precision,
  beginning_point_geojson jsonb,
  end_point_geojson jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  order_index integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.item_type_id,
    a.parent_id,
    a.project_id,
    a.beginning_latitude,
    a.beginning_longitude,
    a.end_latitude,
    a.end_longitude,
    CASE 
      WHEN a.beginning_point IS NOT NULL 
      THEN ST_AsGeoJSON(a.beginning_point)::jsonb
      ELSE NULL
    END as beginning_point_geojson,
    CASE 
      WHEN a.end_point IS NOT NULL 
      THEN ST_AsGeoJSON(a.end_point)::jsonb
      ELSE NULL
    END as end_point_geojson,
    a.created_at,
    a.updated_at,
    a.order_index
  FROM assets a
  WHERE a.project_id = p_project_id
  ORDER BY a.order_index, a.created_at;
END;
$$ LANGUAGE plpgsql;

