# Fix for GeoPackage Export - NULL Geometry Issue

## Problem
When exporting to GeoPackage, the `geometry` column (shown as `wkt_geom` in QGIS) is NULL, preventing features from displaying on the map.

## Root Cause
The `gis_features` table stores geometry in a PostGIS `geometry` column, but the export code needs the geometry in GeoJSON format. The required RPC function `get_gis_features_geojson()` is missing from the database.

## Solution

### Step 1: Run the SQL Migration

You need to run the SQL migration file to create the missing database function:

1. **Connect to your Supabase database** (or PostgreSQL database)
   - Using Supabase Dashboard: Go to SQL Editor
   - Using psql: `psql -h your-host -U your-user -d your-database`

2. **Execute the migration file**: `create_gis_geojson_functions.sql`

```sql
-- Copy and paste the contents of create_gis_geojson_functions.sql
-- into your SQL editor and run it
```

### Step 2: Optional - Add geometry_geojson Column with Trigger

If you want to store GeoJSON alongside the PostGIS geometry for faster queries, uncomment the trigger section in the SQL file:

```sql
-- This will:
-- 1. Add a geometry_geojson column
-- 2. Create a trigger to keep it in sync with the geometry column
-- 3. Backfill existing features
```

### Step 3: Restart Your Backend

After running the migration:

```bash
cd backend
npm restart
# or
# Stop and start your backend server
```

### Step 4: Re-export to GeoPackage

1. Go to your application
2. Export the project to GeoPackage again
3. Open in QGIS
4. The `geometry` column should now be populated with WKB data
5. Features should display on the map with proper geometries

## Verification

After re-exporting, check the GeoPackage in QGIS:

1. **Attribute Table**: The `geometry` column should show "Geometry" instead of NULL
2. **Map View**: Features should be visible as points, lines, or polygons
3. **Zoom to Layer**: Should zoom to the correct extent
4. **Labels**: Should display if configured

## Troubleshooting

### If geometries are still NULL:

1. **Check the backend logs** during export for these messages:
   - `"Layer X: Y features have geometry data"` - Good!
   - `"No features have geometry_geojson data!"` - The migration wasn't applied correctly

2. **Verify the RPC function exists**:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'get_gis_features_geojson';
   ```

3. **Check if features have geometry in the database**:
   ```sql
   SELECT id, name, 
          geometry IS NOT NULL as has_postgis_geom,
          geometry_geojson IS NOT NULL as has_geojson
   FROM gis_features 
   LIMIT 10;
   ```

4. **Manually test the RPC function**:
   ```sql
   SELECT * FROM get_gis_features_geojson('your-layer-id-here');
   ```

## Technical Details

The export process now:
1. First tries to call `get_gis_features_geojson()` RPC function
2. Falls back to direct table query if RPC doesn't exist
3. For Assets table: fetches geometries from linked GIS features first, then falls back to coordinate fields
4. Converts GeoJSON to WKB (Well-Known Binary) format for GeoPackage
5. Registers geometry columns properly in GeoPackage metadata

## Need Help?

If you're still experiencing issues:
- Check the backend console logs for detailed error messages
- Verify your database schema includes the required PostGIS extension
- Ensure your user has permissions to create functions in the database

