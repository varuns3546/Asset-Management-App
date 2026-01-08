-- Migration: Create RPC function to update GIS feature geometry
-- This function allows updating the geometry column in gis_features table
-- when asset coordinates are updated

-- Drop the function if it exists (to allow re-running the migration)
DROP FUNCTION IF EXISTS update_gis_feature_geometry(uuid, text);

-- Create the function to update GIS feature geometry
CREATE OR REPLACE FUNCTION update_gis_feature_geometry(
  p_feature_id uuid,
  p_geometry_wkt text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_geometry geometry;
  v_geojson jsonb;
BEGIN
  -- Create geometry from WKT with SRID 4326
  v_geometry := ST_SetSRID(ST_GeomFromText(p_geometry_wkt), 4326);
  
  -- Convert geometry to GeoJSON
  v_geojson := ST_AsGeoJSON(v_geometry)::jsonb;
  
  -- Update both geometry and geometry_geojson columns
  UPDATE gis_features
  SET 
    geometry = v_geometry,
    geometry_geojson = v_geojson
  WHERE id = p_feature_id;
  
  -- Check if any rows were updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'GIS feature with id % not found', p_feature_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_gis_feature_geometry(uuid, text) TO authenticated;

COMMENT ON FUNCTION update_gis_feature_geometry(uuid, text) IS 
'Updates the geometry of a GIS feature using WKT format. The geometry is set with SRID 4326 (WGS84).';

