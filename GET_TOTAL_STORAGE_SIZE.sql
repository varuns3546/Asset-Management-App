-- ==========================================
-- GET TOTAL STORAGE SIZE FROM storage.objects
-- ==========================================
-- This function returns the ACTUAL total storage
-- across all buckets (what Supabase counts/bills)

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_total_storage_size();

-- Create function to get real storage size
CREATE OR REPLACE FUNCTION get_total_storage_size()
RETURNS TABLE(
  total_size bigint,
  file_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM((metadata->>'size')::bigint), 0)::bigint as total_size,
    COUNT(*)::bigint as file_count
  FROM storage.objects;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_total_storage_size() TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_storage_size() TO service_role;
GRANT EXECUTE ON FUNCTION get_total_storage_size() TO anon;

-- Test the function
SELECT 
  pg_size_pretty(total_size) as "Total Storage",
  file_count as "File Count"
FROM get_total_storage_size();

-- Should show: 163 KB, 17 files

