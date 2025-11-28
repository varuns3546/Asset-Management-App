-- Function to get leaflet shapes as GeoJSON
CREATE OR REPLACE FUNCTION public.get_leaflet_shapes_geojson(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ordered_shapes.id,
            'project_id', ordered_shapes.project_id,
            'shape_type', ordered_shapes.shape_type,
            'geojson', ST_AsGeoJSON(ordered_shapes.geometry)::jsonb,
            'created_at', ordered_shapes.created_at
        )
    ) INTO result
    FROM (
        SELECT id, project_id, shape_type, geometry, created_at
        FROM leaflet_shapes
        WHERE project_id = p_project_id
        ORDER BY created_at DESC
    ) AS ordered_shapes;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Function to insert leaflet shapes with PostGIS geometry
CREATE OR REPLACE FUNCTION public.insert_leaflet_shapes(
    p_project_id UUID,
    p_shapes JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    shape JSONB;
    inserted_shapes JSONB := '[]'::jsonb;
    new_shape JSONB;
BEGIN
    -- Loop through each shape in the JSON array
    FOR shape IN SELECT * FROM jsonb_array_elements(p_shapes)
    LOOP
        -- Insert and get the result
        WITH inserted AS (
            INSERT INTO leaflet_shapes (
                project_id,
                shape_type,
                geometry,
                properties
            ) VALUES (
                p_project_id,
                shape->>'shape_type',
                ST_GeomFromGeoJSON(shape->'geojson'->'geometry'),
                COALESCE(shape->'geojson'->'properties', '{}'::jsonb)
            )
            RETURNING id, project_id, shape_type, geometry, created_at
        )
        SELECT jsonb_build_object(
            'id', inserted.id,
            'project_id', inserted.project_id,
            'shape_type', inserted.shape_type,
            'geojson', ST_AsGeoJSON(inserted.geometry)::jsonb,
            'created_at', inserted.created_at
        ) INTO new_shape
        FROM inserted;
        
        -- Add to results array
        inserted_shapes := inserted_shapes || jsonb_build_array(new_shape);
    END LOOP;

    RETURN inserted_shapes;
END;
$$;

-- Grant execute permissions (adjust role as needed)
GRANT EXECUTE ON FUNCTION get_leaflet_shapes_geojson(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_leaflet_shapes(UUID, JSONB) TO authenticated;

