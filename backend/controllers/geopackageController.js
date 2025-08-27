import asyncHandler from 'express-async-handler';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import GeoPackage from '@ngageoint/geopackage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create GeoPackage from user data
const createGeoPackage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  console.log('GeoPackage export requested for user:', userId);
  
  try {
    // Get all user data
    const [entriesData, mapsData, locationsData] = await Promise.all([
      req.supabase
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      req.supabase
        .from('maps')
        .select('*')
        .eq('user_id', userId),
      req.supabase
        .from('locations')
        .select('*')
        .eq('user_id', userId)
    ]);

    if (entriesData.error) throw new Error(entriesData.error.message);
    if (mapsData.error) throw new Error(mapsData.error.message);
    if (locationsData.error) throw new Error(locationsData.error.message);

    const entries = entriesData.data || [];
    const maps = mapsData.data || [];
    const locations = locationsData.data || [];

    // Create temporary file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `asset_data_${timestamp}.gpkg`;
    const filePath = path.join(__dirname, '..', 'temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create a new GeoPackage
    const geopackage = new GeoPackage();
    
    // Add metadata
    geopackage.setMetadata({
      name: `Asset_Management_Data_${new Date().toISOString().split('T')[0]}`,
      description: "Asset Management App Data Export",
      created: new Date().toISOString(),
      user_id: userId
    });

    // Create feature table for locations
    if (locations.length > 0) {
      const locationFeatures = locations.map(location => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        },
        properties: {
          id: location.id,
          title: location.title,
          description: location.description,
          map_id: location.map_id,
          created_at: location.created_at,
          type: 'location'
        }
      }));

      geopackage.addFeatureTable('locations', {
        type: 'FeatureCollection',
        features: locationFeatures
      });
    }

    // Create table for entries (non-spatial data)
    if (entries.length > 0) {
      const entryTable = entries.map(entry => ({
        id: entry.id,
        title: entry.title,
        description: entry.description,
        category: entry.category,
        status: entry.status,
        priority: entry.priority,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        user_id: entry.user_id
      }));

      geopackage.addTable('entries', entryTable);
    }

    // Create table for maps (non-spatial data)
    if (maps.length > 0) {
      const mapTable = maps.map(map => ({
        id: map.id,
        name: map.name,
        description: map.description,
        created_at: map.created_at,
        updated_at: map.updated_at,
        user_id: map.user_id
      }));

      geopackage.addTable('maps', mapTable);
    }

    // Write GeoPackage to file
    await geopackage.write(filePath);
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
  const userId = req.user.id;
  console.log('Getting export stats for user:', userId);
  
  try {
    const [entriesCount, mapsCount, locationsCount] = await Promise.all([
      req.supabase
        .from('entries')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),
      req.supabase
        .from('maps')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),
      req.supabase
        .from('locations')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
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
