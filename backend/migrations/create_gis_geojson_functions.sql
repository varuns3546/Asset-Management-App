-- Create RPC function to get GIS features with geometry as GeoJSON
-- This function converts the PostGIS geometry column to GeoJSON format for easy consumption
-- AND extracts beginning_latitude/beginning_longitude for frontend map display

-- Drop existing function first (if it exists with different signature)
-- NOTE: Run this entire file again if you previously ran an older version
DROP FUNCTION IF EXISTS get_gis_features_geojson(uuid);

CREATE OR REPLACE FUNCTION get_gis_features_geojson(p_layer_id uuid)
RETURNS TABLE (
  id uuid,
  name varchar(255),
  properties jsonb,
  asset_id uuid,
  layer_id uuid,
  project_id uuid,
  geometry_geojson jsonb,
  beginning_latitude double precision,
  beginning_longitude double precision,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gf.id,
    gf.name,
    gf.properties,
    gf.asset_id,
    gf.layer_id,
    gf.project_id,
    CASE 
      WHEN gf.geometry IS NOT NULL 
      THEN ST_AsGeoJSON(gf.geometry)::jsonb
      ELSE NULL
    END as geometry_geojson,
    -- Extract coordinates for frontend map display
    -- For Point geometries, get the Y coordinate (latitude)
    CASE 
      WHEN gf.geometry IS NOT NULL AND ST_GeometryType(gf.geometry) = 'ST_Point'
      THEN ST_Y(gf.geometry)
      WHEN gf.geometry IS NOT NULL AND ST_GeometryType(gf.geometry) IN ('ST_LineString', 'ST_Polygon')
      THEN ST_Y(ST_Centroid(gf.geometry))
      ELSE NULL
    END as beginning_latitude,
    -- For Point geometries, get the X coordinate (longitude)
    CASE 
      WHEN gf.geometry IS NOT NULL AND ST_GeometryType(gf.geometry) = 'ST_Point'
      THEN ST_X(gf.geometry)
      WHEN gf.geometry IS NOT NULL AND ST_GeometryType(gf.geometry) IN ('ST_LineString', 'ST_Polygon')
      THEN ST_X(ST_Centroid(gf.geometry))
      ELSE NULL
    END as beginning_longitude,
    gf.created_at,
    gf.updated_at
  FROM gis_features gf
  WHERE gf.layer_id = p_layer_id
  ORDER BY gf.created_at;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_gis_features_geojson(uuid) TO authenticated;

-- Add geometry_geojson column if it doesn't exist and populate it
-- This ensures geometry_geojson is always in sync with the PostGIS geometry column

-- Add the column if it doesn't exist
ALTER TABLE gis_features ADD COLUMN IF NOT EXISTS geometry_geojson jsonb;

-- Create a trigger to keep geometry_geojson in sync with geometry
CREATE OR REPLACE FUNCTION sync_geometry_geojson()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.geometry IS NOT NULL THEN
    NEW.geometry_geojson := ST_AsGeoJSON(NEW.geometry)::jsonb;
  ELSE
    NEW.geometry_geojson := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_geometry_geojson ON gis_features;
CREATE TRIGGER trigger_sync_geometry_geojson
BEFORE INSERT OR UPDATE OF geometry
ON gis_features
FOR EACH ROW
EXECUTE FUNCTION sync_geometry_geojson();

-- Backfill existing features - convert PostGIS geometry to GeoJSON
UPDATE gis_features 
SET geometry_geojson = ST_AsGeoJSON(geometry)::jsonb 
WHERE geometry IS NOT NULL;

