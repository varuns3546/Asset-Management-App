-- Verify GIS tables exist
-- Run this in Supabase SQL Editor to check if tables were created

-- 1. Check if PostGIS extension is enabled
SELECT * FROM pg_extension WHERE extname = 'postgis';

-- 2. Check if gis_layers table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'gis_layers'
) as gis_layers_exists;

-- 3. Check if gis_features table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'gis_features'
) as gis_features_exists;

-- 4. Show all columns in gis_layers if it exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'gis_layers'
ORDER BY ordinal_position;

-- 5. Show all columns in gis_features if it exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'gis_features'
ORDER BY ordinal_position;

-- 6. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('gis_layers', 'gis_features');

