import asyncHandler from 'express-async-handler';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create GeoPackage from project data using SQLite directly
const createGeoPackage = asyncHandler(async (req, res) => {
  const { project_id } = req.query;
  
  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify the project belongs to the authenticated user
  const { data: project, error: projectError } = await req.supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', req.user.id)
    .single();

  if (projectError || !project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found or access denied'
    });
  }

  console.log('GeoPackage export requested for project:', project_id);
  
  try {
    // Get all project data
    const [entriesData, mapsData, locationsData] = await Promise.all([
      req.supabase
        .from('entries')
        .select('*')
        .eq('project_id', project_id)
        .order('created_at', { ascending: false }),
      req.supabase
        .from('maps')
        .select('*')
        .eq('project_id', project_id),
      req.supabase
        .from('locations')
        .select('*')
        .eq('project_id', project_id)
    ]);

    if (entriesData.error) throw new Error(entriesData.error.message);
    if (mapsData.error) throw new Error(mapsData.error.message);
    if (locationsData.error) throw new Error(locationsData.error.message);

    const entries = entriesData.data || [];
    const maps = mapsData.data || [];
    const locations = locationsData.data || [];

    // Create temporary file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `project_${project_id}_data_${timestamp}.gpkg`;
    const filePath = path.join(__dirname, '..', 'temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create SQLite database (GeoPackage is SQLite with extensions)
    const db = new Database(filePath);
    
    // Enable SpatiaLite extension if available (optional)
    try {
      db.loadExtension('mod_spatialite');
    } catch (e) {
      console.log('SpatiaLite extension not available, creating basic GeoPackage');
    }

    // Create GeoPackage required tables
    db.exec(`
      -- Application ID for GeoPackage
      PRAGMA application_id = 1196444487;
      
      -- Required GeoPackage metadata tables
      CREATE TABLE gpkg_spatial_ref_sys (
        srs_name TEXT NOT NULL,
        srs_id INTEGER NOT NULL PRIMARY KEY,
        organization TEXT NOT NULL,
        organization_coordsys_id INTEGER NOT NULL,
        definition TEXT NOT NULL,
        description TEXT
      );
      
      -- Insert standard SRS (WGS84)
      INSERT INTO gpkg_spatial_ref_sys VALUES 
      ('WGS 84', 4326, 'EPSG', 4326, 
       'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]', 
       'longitude/latitude coordinates in decimal degrees on the WGS 84 spheroid');
      
      CREATE TABLE gpkg_contents (
        table_name TEXT NOT NULL PRIMARY KEY,
        data_type TEXT NOT NULL,
        identifier TEXT UNIQUE,
        description TEXT DEFAULT '',
        last_change DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        min_x DOUBLE,
        min_y DOUBLE,
        max_x DOUBLE,
        max_y DOUBLE,
        srs_id INTEGER,
        CONSTRAINT fk_gc_r_srs_id FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id)
      );
    `);

    // Create locations feature table if locations exist
    if (locations.length > 0) {
      db.exec(`
        CREATE TABLE gpkg_geometry_columns (
          table_name TEXT NOT NULL,
          column_name TEXT NOT NULL,
          geometry_type_name TEXT NOT NULL,
          srs_id INTEGER NOT NULL,
          z TINYINT NOT NULL,
          m TINYINT NOT NULL,
          CONSTRAINT pk_geom_cols PRIMARY KEY (table_name, column_name),
          CONSTRAINT fk_gc_tn FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name),
          CONSTRAINT fk_gc_srs FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id)
        );
        
        CREATE TABLE locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          description TEXT,
          map_id TEXT,
          project_id TEXT,
          created_at TEXT,
          geom GEOMETRY
        );
      `);

      // Register the locations table in GeoPackage metadata
      db.prepare(`
        INSERT INTO gpkg_contents (table_name, data_type, identifier, description, srs_id) 
        VALUES (?, ?, ?, ?, ?)
      `).run('locations', 'features', 'Asset Locations', 'Location data from asset management system', 4326);

      db.prepare(`
        INSERT INTO gpkg_geometry_columns (table_name, column_name, geometry_type_name, srs_id, z, m) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('locations', 'geom', 'POINT', 4326, 0, 0);

      // Insert location data
      const insertLocation = db.prepare(`
        INSERT INTO locations (title, description, map_id, project_id, created_at, geom) 
        VALUES (?, ?, ?, ?, ?, GeomFromText('POINT(' || ? || ' ' || ? || ')', 4326))
      `);

      for (const location of locations) {
        insertLocation.run(
          location.title || '',
          location.description || '',
          location.map_id || '',
          location.project_id || '',
          location.created_at || '',
          location.longitude,
          location.latitude
        );
      }
    }

    // Create entries table
    if (entries.length > 0) {
      db.exec(`
        CREATE TABLE entries (
          id TEXT PRIMARY KEY,
          title TEXT,
          content TEXT,
          project_id TEXT,
          created_at TEXT,
          updated_at TEXT,
          user_id TEXT
        );
      `);

      // Register in contents table as attributes
      db.prepare(`
        INSERT INTO gpkg_contents (table_name, data_type, identifier, description) 
        VALUES (?, ?, ?, ?)
      `).run('entries', 'attributes', 'Journal Entries', 'Journal entries from asset management system');

      const insertEntry = db.prepare(`
        INSERT INTO entries (id, title, content, project_id, created_at, updated_at, user_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const entry of entries) {
        insertEntry.run(
          entry.id,
          entry.title || '',
          entry.content || '',
          entry.project_id || '',
          entry.created_at || '',
          entry.updated_at || '',
          entry.user_id || ''
        );
      }
    }

    // Create maps table
    if (maps.length > 0) {
      db.exec(`
        CREATE TABLE maps (
          id TEXT PRIMARY KEY,
          title TEXT,
          description TEXT,
          project_id TEXT,
          created_at TEXT,
          updated_at TEXT,
          user_id TEXT
        );
      `);

      // Register in contents table as attributes
      db.prepare(`
        INSERT INTO gpkg_contents (table_name, data_type, identifier, description) 
        VALUES (?, ?, ?, ?)
      `).run('maps', 'attributes', 'Maps', 'Maps from asset management system');

      const insertMap = db.prepare(`
        INSERT INTO maps (id, title, description, project_id, created_at, updated_at, user_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const map of maps) {
        insertMap.run(
          map.id,
          map.title || '',
          map.description || '',
          map.project_id || '',
          map.created_at || '',
          map.updated_at || '',
          map.user_id || ''
        );
      }
    }

    // Close database connection
    db.close();
    
    console.log('GeoPackage file created:', filePath);

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/geopackage+sqlite3');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // Send file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up file after sending
    fileStream.on('end', () => {
      try {
        fs.unlinkSync(filePath);
        console.log('Temporary GeoPackage file cleaned up');
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
    });

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file after stream error:', cleanupError);
      }
    });

  } catch (error) {
    console.error('Error creating GeoPackage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create GeoPackage: ' + error.message
    });
  }
});

// Get export statistics
const getExportStats = asyncHandler(async (req, res) => {
  const { project_id } = req.query;
  
  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify the project belongs to the authenticated user
  const { data: project, error: projectError } = await req.supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', req.user.id)
    .single();

  if (projectError || !project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found or access denied'
    });
  }

  console.log('Getting export stats for project:', project_id);
  
  try {
    const [entriesCount, mapsCount, locationsCount] = await Promise.all([
      req.supabase
        .from('entries')
        .select('id', { count: 'exact' })
        .eq('project_id', project_id),
      req.supabase
        .from('maps')
        .select('id', { count: 'exact' })
        .eq('project_id', project_id),
      req.supabase
        .from('locations')
        .select('id', { count: 'exact' })
        .eq('project_id', project_id)
    ]);

    const stats = {
      entries: entriesCount.count || 0,
      maps: mapsCount.count || 0,
      locations: locationsCount.count || 0,
      total: (entriesCount.count || 0) + (mapsCount.count || 0) + (locationsCount.count || 0)
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting export stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get export statistics: ' + error.message
    });
  }
});

export default {
  createGeoPackage,
  getExportStats
};