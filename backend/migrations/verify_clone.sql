-- Verify that all data from source project was cloned to target project
-- Source: a1ecc77b-8bf7-47c9-865b-083e253754b3
-- Target: 484274f6-ae36-4046-9b80-3e231879be4f

-- 1. Asset Types
SELECT 
  'asset_types' as table_name,
  (SELECT COUNT(*) FROM asset_types WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') as source_count,
  (SELECT COUNT(*) FROM asset_types WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f') as target_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM asset_types WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') = 
         (SELECT COUNT(*) FROM asset_types WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f')
    THEN '✓ MATCH'
    ELSE '✗ MISMATCH'
  END as status

UNION ALL

-- 2. Attributes
SELECT 
  'attributes' as table_name,
  (SELECT COUNT(*) FROM attributes WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') as source_count,
  (SELECT COUNT(*) FROM attributes WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f') as target_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM attributes WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') = 
         (SELECT COUNT(*) FROM attributes WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f')
    THEN '✓ MATCH'
    ELSE '✗ MISMATCH'
  END as status

UNION ALL

-- 3. Assets
SELECT 
  'assets' as table_name,
  (SELECT COUNT(*) FROM assets WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') as source_count,
  (SELECT COUNT(*) FROM assets WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f') as target_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM assets WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') = 
         (SELECT COUNT(*) FROM assets WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f')
    THEN '✓ MATCH'
    ELSE '✗ MISMATCH'
  END as status

UNION ALL

-- 4. GIS Layers
SELECT 
  'gis_layers' as table_name,
  (SELECT COUNT(*) FROM gis_layers WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') as source_count,
  (SELECT COUNT(*) FROM gis_layers WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f') as target_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM gis_layers WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') = 
         (SELECT COUNT(*) FROM gis_layers WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f')
    THEN '✓ MATCH'
    ELSE '✗ MISMATCH'
  END as status

UNION ALL

-- 5. GIS Features
SELECT 
  'gis_features' as table_name,
  (SELECT COUNT(*) FROM gis_features WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') as source_count,
  (SELECT COUNT(*) FROM gis_features WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f') as target_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM gis_features WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') = 
         (SELECT COUNT(*) FROM gis_features WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f')
    THEN '✓ MATCH'
    ELSE '✗ MISMATCH'
  END as status

UNION ALL

-- 6. Leaflet Shapes
SELECT 
  'leaflet_shapes' as table_name,
  (SELECT COUNT(*) FROM leaflet_shapes WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') as source_count,
  (SELECT COUNT(*) FROM leaflet_shapes WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f') as target_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM leaflet_shapes WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') = 
         (SELECT COUNT(*) FROM leaflet_shapes WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f')
    THEN '✓ MATCH'
    ELSE '✗ MISMATCH'
  END as status

UNION ALL

-- 7. Project Files
SELECT 
  'project_files' as table_name,
  (SELECT COUNT(*) FROM project_files WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') as source_count,
  (SELECT COUNT(*) FROM project_files WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f') as target_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM project_files WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') = 
         (SELECT COUNT(*) FROM project_files WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f')
    THEN '✓ MATCH'
    ELSE '✗ MISMATCH'
  END as status

UNION ALL

-- 8. Questionnaire Responses
SELECT 
  'questionnaire_responses' as table_name,
  (SELECT COUNT(*) FROM questionnaire_responses WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') as source_count,
  (SELECT COUNT(*) FROM questionnaire_responses WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f') as target_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM questionnaire_responses WHERE project_id = 'a1ecc77b-8bf7-47c9-865b-083e253754b3') = 
         (SELECT COUNT(*) FROM questionnaire_responses WHERE project_id = '484274f6-ae36-4046-9b80-3e231879be4f')
    THEN '✓ MATCH'
    ELSE '✗ MISMATCH'
  END as status

ORDER BY table_name;

