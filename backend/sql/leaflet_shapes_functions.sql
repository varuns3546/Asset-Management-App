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

-- Function to update a leaflet shape
CREATE OR REPLACE FUNCTION public.update_leaflet_shape(
    p_shape_id UUID,
    p_shape_type TEXT,
    p_geojson JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_shape JSONB;
BEGIN
    -- Update the shape
    WITH updated AS (
        UPDATE leaflet_shapes
        SET 
            shape_type = p_shape_type,
            geometry = ST_GeomFromGeoJSON(p_geojson->'geometry'),
            properties = COALESCE(p_geojson->'properties', '{}'::jsonb)
        WHERE id = p_shape_id
        RETURNING id, project_id, shape_type, geometry, created_at
    )
    SELECT jsonb_build_object(
        'id', updated.id,
        'project_id', updated.project_id,
        'shape_type', updated.shape_type,
        'geojson', ST_AsGeoJSON(updated.geometry)::jsonb,
        'created_at', updated.created_at
    ) INTO updated_shape
    FROM updated;
    
    RETURN updated_shape;
END;
$$;

-- Grant execute permissions (adjust role as needed)
GRANT EXECUTE ON FUNCTION get_leaflet_shapes_geojson(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_leaflet_shapes(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_leaflet_shape(UUID, TEXT, JSONB) TO authenticated;

