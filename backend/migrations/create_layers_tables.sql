-- Enable PostGIS extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create custom GIS layers table (separate from hierarchy features)
CREATE TABLE IF NOT EXISTS gis_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  layer_type VARCHAR(50) NOT NULL, -- 'vector' or 'raster'
  geometry_type VARCHAR(50), -- 'point', 'linestring', 'polygon', 'multipoint', 'multilinestring', 'multipolygon'
  srid INTEGER DEFAULT 4326, -- Spatial Reference System ID (4326 = WGS84/GPS coordinates)
  visible BOOLEAN DEFAULT true,
  style JSONB DEFAULT '{}', -- Store styling info (color, weight, fillColor, opacity, etc.)
  attributes JSONB DEFAULT '[]', -- Array of attribute field definitions: [{name: '', type: '', required: false}]
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create layer_features table using PostGIS geometry types
CREATE TABLE IF NOT EXISTS gis_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id UUID NOT NULL REFERENCES gis_layers(id) ON DELETE CASCADE,
  name VARCHAR(255),
  geometry geometry(Geometry, 4326), -- PostGIS geometry column (supports any geometry type with SRID 4326)
  properties JSONB DEFAULT '{}', -- Store custom attribute values: {attr_name: value, ...}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gis_layers_project_id ON gis_layers(project_id);
CREATE INDEX IF NOT EXISTS idx_gis_layers_created_by ON gis_layers(created_by);
CREATE INDEX IF NOT EXISTS idx_gis_features_layer_id ON gis_features(layer_id);

-- Create spatial index on geometry column for fast spatial queries
CREATE INDEX IF NOT EXISTS idx_gis_features_geometry ON gis_features USING GIST(geometry);

-- Enable Row Level Security (RLS)
ALTER TABLE gis_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gis_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gis_layers table
CREATE POLICY "Users can view gis_layers from their projects"
  ON gis_layers FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert gis_layers to their projects"
  ON gis_layers FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update gis_layers in their projects"
  ON gis_layers FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete gis_layers from their projects"
  ON gis_layers FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
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
    )
  );

CREATE POLICY "Users can insert features to gis_layers in their projects"
  ON gis_features FOR INSERT
  WITH CHECK (
    layer_id IN (
      SELECT id FROM gis_layers WHERE project_id IN (
        SELECT project_id FROM project_users WHERE user_id = auth.uid()
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
    )
  );

CREATE POLICY "Users can delete features from gis_layers in their projects"
  ON gis_features FOR DELETE
  USING (
    layer_id IN (
      SELECT id FROM gis_layers WHERE project_id IN (
        SELECT project_id FROM project_users WHERE user_id = auth.uid()
      )
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_gis_layers_updated_at
  BEFORE UPDATE ON gis_layers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gis_features_updated_at
  BEFORE UPDATE ON gis_features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper functions for PostGIS

-- Function to get features with GeoJSON geometry
CREATE OR REPLACE FUNCTION get_gis_features_geojson(p_layer_id UUID)
RETURNS TABLE (
  id UUID,
  layer_id UUID,
  name VARCHAR(255),
  geometry_geojson TEXT,
  properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gf.id,
    gf.layer_id,
    gf.name,
    ST_AsGeoJSON(gf.geometry)::TEXT as geometry_geojson,
    gf.properties,
    gf.created_at
  FROM gis_features gf
  WHERE gf.layer_id = p_layer_id
  ORDER BY gf.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to insert a feature with WKT geometry
CREATE OR REPLACE FUNCTION insert_gis_feature(
  p_layer_id UUID,
  p_name VARCHAR(255),
  p_geometry_wkt TEXT,
  p_properties JSONB
)
RETURNS TABLE (
  id UUID,
  layer_id UUID,
  name VARCHAR(255),
  geometry_geojson TEXT,
  properties JSONB
) AS $$
DECLARE
  v_feature_id UUID;
BEGIN
  INSERT INTO gis_features (layer_id, name, geometry, properties)
  VALUES (
    p_layer_id,
    p_name,
    ST_GeomFromText(p_geometry_wkt, 4326),
    p_properties
  )
  RETURNING gis_features.id INTO v_feature_id;

  RETURN QUERY
  SELECT 
    gf.id,
    gf.layer_id,
    gf.name,
    ST_AsGeoJSON(gf.geometry)::TEXT as geometry_geojson,
    gf.properties
  FROM gis_features gf
  WHERE gf.id = v_feature_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get features within a bounding box (for map viewport queries)
CREATE OR REPLACE FUNCTION get_features_in_bounds(
  p_layer_id UUID,
  p_min_lat FLOAT,
  p_min_lng FLOAT,
  p_max_lat FLOAT,
  p_max_lng FLOAT
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  geometry_geojson TEXT,
  properties JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gf.id,
    gf.name,
    ST_AsGeoJSON(gf.geometry)::TEXT as geometry_geojson,
    gf.properties
  FROM gis_features gf
  WHERE gf.layer_id = p_layer_id
    AND ST_Intersects(
      gf.geometry,
      ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get features within a radius of a point
CREATE OR REPLACE FUNCTION get_features_near_point(
  p_layer_id UUID,
  p_lat FLOAT,
  p_lng FLOAT,
  p_radius_meters FLOAT
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  geometry_geojson TEXT,
  properties JSONB,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gf.id,
    gf.name,
    ST_AsGeoJSON(gf.geometry)::TEXT as geometry_geojson,
    gf.properties,
    ST_Distance(
      gf.geometry::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) as distance_meters
  FROM gis_features gf
  WHERE gf.layer_id = p_layer_id
    AND ST_DWithin(
      gf.geometry::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_meters
    )
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

