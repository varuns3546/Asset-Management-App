import asyncHandler from 'express-async-handler';
import { GeoPackageAPI, GeometryType } from '@ngageoint/geopackage';
import AdmZip from 'adm-zip';

// Get all GIS layers for a project
const getGisLayers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify user has access to the project
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', req.user.id)
    .single();

  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    const { data: layers, error } = await req.supabase
      .from('gis_layers')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');

    if (error) {
      console.error('Error fetching GIS layers:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch GIS layers'
      });
    }

    res.status(200).json({
      success: true,
      data: layers || []
    });

  } catch (error) {
    console.error('Error in getGisLayers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create a new GIS layer
const createGisLayer = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { name, description, layerType, geometryType, attributes, style } = req.body;

  if (!projectId || !name || !layerType) {
    return res.status(400).json({
      success: false,
      error: 'Project ID, name, and layer type are required'
    });
  }

  // Verify user has access to the project
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', req.user.id)
    .single();

  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    // Check for duplicate layer name in the project
    const { data: existingLayer, error: checkError } = await req.supabase
      .from('gis_layers')
      .select('id, name')
      .eq('project_id', projectId)
      .eq('name', name.trim())
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking for duplicate layer:', checkError);
      return res.status(500).json({
        success: false,
        error: 'Failed to check for duplicate layer name'
      });
    }

    if (existingLayer) {
      return res.status(400).json({
        success: false,
        error: `A layer named "${name.trim()}" already exists in this project`
      });
    }

    const layerData = {
      project_id: projectId,
      name: name.trim(),
      description: description || null,
      layer_type: layerType.toLowerCase(),
      geometry_type: geometryType ? geometryType.toLowerCase() : null,
      attributes: attributes || [],
      style: style || {},
      visible: true,
      created_by: req.user.id
    };


    const { data: layer, error } = await req.supabase
      .from('gis_layers')
      .insert(layerData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating GIS layer:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create GIS layer',
        code: error.code
      });
    }


    res.status(201).json({
      success: true,
      data: layer
    });

  } catch (error) {
    console.error('Exception in createGisLayer:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Update a GIS layer
const updateGisLayer = asyncHandler(async (req, res) => {
  const { projectId, layerId } = req.params;
  const { name, description, visible, style, attributes } = req.body;

  if (!projectId || !layerId) {
    return res.status(400).json({
      success: false,
      error: 'Project ID and Layer ID are required'
    });
  }

  // Verify user has access
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', req.user.id)
    .single();

  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (visible !== undefined) updateData.visible = visible;
    if (style !== undefined) updateData.style = style;
    if (attributes !== undefined) updateData.attributes = attributes;

    const { data: layer, error } = await req.supabase
      .from('gis_layers')
      .update(updateData)
      .eq('id', layerId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating GIS layer:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update GIS layer'
      });
    }

    res.status(200).json({
      success: true,
      data: layer
    });

  } catch (error) {
    console.error('Error in updateGisLayer:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete a GIS layer
const deleteGisLayer = asyncHandler(async (req, res) => {
  const { projectId, layerId } = req.params;

  if (!projectId || !layerId) {
    return res.status(400).json({
      success: false,
      error: 'Project ID and Layer ID are required'
    });
  }

  // Verify user has access
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', req.user.id)
    .single();

  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    // First, delete all features in this layer to avoid foreign key constraint errors
    const { error: featuresDeleteError } = await req.supabase
      .from('gis_features')
      .delete()
      .eq('layer_id', layerId);

    if (featuresDeleteError) {
      console.error('Error deleting features for layer:', featuresDeleteError);
      // Continue anyway - the layer might have no features or already be deleted
    }

    // Now delete the layer
    const { error } = await req.supabase
      .from('gis_layers')
      .delete()
      .eq('id', layerId)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting GIS layer:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete GIS layer'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Layer deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteGisLayer:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all features for a layer
const getLayerFeatures = asyncHandler(async (req, res) => {
  const { projectId, layerId } = req.params;

  if (!projectId || !layerId) {
    return res.status(400).json({
      success: false,
      error: 'Project ID and Layer ID are required'
    });
  }

  // Verify user has access
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', req.user.id)
    .single();

  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    // Fetch features directly from the table with all fields
    const { data: rawFeatures, error: fetchError } = await req.supabase
      .from('gis_features')
      .select('*')
      .eq('layer_id', layerId)
      .order('created_at');

    if (fetchError) {
      console.error('Error fetching features for layer', layerId, ':', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch features'
      });
    }

    // Extract coordinates from geometry_geojson for map display
    const features = (rawFeatures || []).map(feature => {
      // If coordinates aren't already set, extract them from geometry_geojson
      if (feature.geometry_geojson && !feature.beginning_latitude) {
        try {
          const geom = typeof feature.geometry_geojson === 'string' 
            ? JSON.parse(feature.geometry_geojson) 
            : feature.geometry_geojson;
          
          if (geom && geom.coordinates) {
            if (geom.type === 'Point') {
              feature.beginning_longitude = geom.coordinates[0];
              feature.beginning_latitude = geom.coordinates[1];
            } else if (geom.type === 'LineString' && geom.coordinates.length > 0) {
              // Use first point of line
              feature.beginning_longitude = geom.coordinates[0][0];
              feature.beginning_latitude = geom.coordinates[0][1];
            } else if (geom.type === 'Polygon' && geom.coordinates.length > 0 && geom.coordinates[0].length > 0) {
              // Use first point of outer ring
              feature.beginning_longitude = geom.coordinates[0][0][0];
              feature.beginning_latitude = geom.coordinates[0][0][1];
            }
          }
        } catch (e) {
          console.warn(`Error extracting coordinates from feature ${feature.id}:`, e);
        }
      }
      return feature;
    });

    // Debug logging
    const featuresWithCoords = features.filter(f => f.beginning_latitude && f.beginning_longitude);
    console.log(`Layer ${layerId}: Returned ${features.length} features, ${featuresWithCoords.length} have coordinates`);
    if (features.length > 0) {
      const firstFeature = features[0];
      console.log(`  First feature:`, {
        id: firstFeature.id,
        name: firstFeature.name,
        has_geometry_geojson: !!firstFeature.geometry_geojson,
        beginning_latitude: firstFeature.beginning_latitude,
        beginning_longitude: firstFeature.beginning_longitude
      });
    }

    res.status(200).json({
      success: true,
      data: features
    });

  } catch (error) {
    console.error('Error in getLayerFeatures:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Add a feature to a layer
const addFeature = asyncHandler(async (req, res) => {
  const { projectId, layerId } = req.params;
  const { name, coordinates, properties } = req.body;

  if (!projectId || !layerId || !coordinates) {
    return res.status(400).json({
      success: false,
      error: 'Project ID, Layer ID, and coordinates are required'
    });
  }

  // Verify user has access
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', req.user.id)
    .single();

  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    // Get layer info to determine geometry type
    const { data: layer, error: layerError } = await req.supabase
      .from('gis_layers')
      .select('geometry_type')
      .eq('id', layerId)
      .single();

    if (layerError || !layer) {
      return res.status(404).json({
        success: false,
        error: 'Layer not found'
      });
    }

    // Normalize geometry type (line -> linestring)
    const geometryType = layer.geometry_type === 'line' ? 'linestring' : layer.geometry_type;

    // Convert coordinates to PostGIS geometry
    let geometryWKT;
    if (geometryType === 'point' && coordinates.length === 1) {
      const [lng, lat] = coordinates[0];
      geometryWKT = `POINT(${lng} ${lat})`;
    } else if (geometryType === 'linestring' && coordinates.length >= 2) {
      const points = coordinates.map(([lng, lat]) => `${lng} ${lat}`).join(',');
      geometryWKT = `LINESTRING(${points})`;
    } else if (geometryType === 'polygon' && coordinates.length >= 3) {
      // Ensure polygon is closed
      const coords = [...coordinates];
      if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
        coords.push(coords[0]);
      }
      const points = coords.map(([lng, lat]) => `${lng} ${lat}`).join(',');
      geometryWKT = `POLYGON((${points}))`;
    } else {
      console.error('Invalid geometry:', {
        geometryType,
        coordinatesLength: coordinates.length,
        expectedMin: geometryType === 'point' ? 1 : geometryType === 'linestring' ? 2 : 3
      });
      return res.status(400).json({
        success: false,
        error: `Invalid coordinates for geometry type '${geometryType}'. Expected ${geometryType === 'point' ? '1' : geometryType === 'linestring' ? 'at least 2' : 'at least 3'} coordinates, got ${coordinates.length}`
      });
    }


    // Extract asset_id from properties if it exists
    let assetId = null;
    if (properties && properties.asset_id) {
      assetId = properties.asset_id;
    }

    // Use raw SQL to insert with PostGIS function
    const { data: feature, error } = await req.supabase
      .rpc('insert_gis_feature', {
        p_layer_id: layerId,
        p_name: name || null,
        p_geometry_wkt: geometryWKT,
        p_properties: properties || {}
      });

    if (error) {
      console.error('Error adding feature:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add feature'
      });
    }

    // Update the feature to set asset_id column if it exists in properties
    // This creates a proper foreign key relationship instead of storing it in JSON
    // Note: Only set asset_id if it was provided in properties (i.e., feature came from an asset)
    // Manually created features won't have asset_id in properties, so asset_id stays NULL (correct)
    if (assetId && feature && feature.id) {
      const { error: updateError } = await req.supabase
        .from('gis_features')
        .update({ asset_id: assetId })
        .eq('id', feature.id);

      if (updateError) {
        console.error('[addFeature] CRITICAL: Failed to set asset_id column on feature:', updateError);
        console.error('[addFeature] Update error details:', JSON.stringify(updateError, null, 2));
        // Log error but continue - feature was created, just without asset_id
      } else {
        // Verify asset_id was set
        const { data: verifyFeature } = await req.supabase
          .from('gis_features')
          .select('id, asset_id')
          .eq('id', feature.id)
          .single();
        
        if (verifyFeature && verifyFeature.asset_id === assetId) {
          console.log(`[addFeature] ✓ Set asset_id=${assetId} for feature ${feature.id} (verified)`);
          
          // Remove asset_id from properties JSON since it's now in the column
          if (properties && properties.asset_id) {
            const { asset_id, ...otherProperties } = properties;
            if (Object.keys(otherProperties).length > 0) {
              await req.supabase
                .from('gis_features')
                .update({ properties: otherProperties })
                .eq('id', feature.id);
            } else {
              await req.supabase
                .from('gis_features')
                .update({ properties: null })
                .eq('id', feature.id);
            }
          }
        } else {
          console.error(`[addFeature] CRITICAL: asset_id verification failed. Expected: ${assetId}, Got: ${verifyFeature?.asset_id}`);
        }
      }
    } else if (!assetId) {
      // This is a manually created feature (no asset_id in properties) - this is correct
      console.log(`[addFeature] Feature ${feature?.id} created without asset_id (manually created)`);
    }

    res.status(201).json({
      success: true,
      data: feature
    });

  } catch (error) {
    console.error('Error in addFeature:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete a feature
const deleteFeature = asyncHandler(async (req, res) => {
  const { projectId, layerId, featureId } = req.params;

  if (!projectId || !layerId || !featureId) {
    return res.status(400).json({
      success: false,
      error: 'Project ID, Layer ID, and Feature ID are required'
    });
  }

  // Verify user has access
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', req.user.id)
    .single();

  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    // First, fetch the feature to check if it has a connected asset
    // Try to get asset_id column first (new approach), fallback to properties JSON (backward compatibility)
    const { data: feature, error: fetchError } = await req.supabase
      .from('gis_features')
      .select('asset_id, properties')
      .eq('id', featureId)
      .eq('layer_id', layerId)
      .single();

    if (fetchError) {
      console.error('Error fetching feature:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch feature'
      });
    }

    // Check if the feature has a connected asset
    // Priority: 1) asset_id column (new), 2) properties.asset_id (legacy)
    let assetId = feature?.asset_id || null;
    
    // Fallback to properties JSON if asset_id column is not set (backward compatibility)
    if (!assetId && feature && feature.properties) {
      // Handle both JSON string and object formats
      const properties = typeof feature.properties === 'string' 
        ? JSON.parse(feature.properties) 
        : feature.properties;
      
      if (properties && properties.asset_id) {
        assetId = properties.asset_id;
      }
    }

    // Delete the connected asset if it exists
    if (assetId) {
      const { error: assetDeleteError } = await req.supabase
        .from('assets')
        .delete()
        .eq('id', assetId)
        .eq('project_id', projectId);

      if (assetDeleteError) {
        console.error('Error deleting connected asset:', assetDeleteError);
        // Continue with feature deletion even if asset deletion fails
        // (asset might have been deleted already or doesn't exist)
      }
    }

    // Delete the GIS feature
    const { error } = await req.supabase
      .from('gis_features')
      .delete()
      .eq('id', featureId)
      .eq('layer_id', layerId);

    if (error) {
      console.error('Error deleting feature:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete feature'
      });
    }

    res.status(200).json({
      success: true,
      message: assetId 
        ? 'Feature and connected asset deleted successfully' 
        : 'Feature deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteFeature:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Export layers to GeoPackage format
const exportLayersToGeoPackage = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { layerIds } = req.body; // Optional array of layer IDs, if empty exports all

  if (!projectId) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify user has access to the project
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', req.user.id)
    .single();

  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    // Get project name for filename
    const { data: project } = await req.supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    const projectName = project?.name || 'project';

    // Fetch layers to export
    let query = req.supabase
      .from('gis_layers')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');

    if (layerIds && Array.isArray(layerIds) && layerIds.length > 0) {
      query = query.in('id', layerIds);
    }

    const { data: layers, error: layersError } = await query;

    if (layersError) {
      console.error('Error fetching layers:', layersError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch layers'
      });
    }

    if (!layers || layers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No layers found to export'
      });
    }

    // Import required modules
    const Database = (await import('better-sqlite3')).default;
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');

    // Create temporary file path
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `export_${Date.now()}.gpkg`);

    // Helper to convert GeoJSON to GeoPackage binary format using wkx library
    // GeoPackage uses a specific binary format: magic byte (0x47) + version (0x00) + flags + srs_id + WKB
    const geojsonToGeoPackageBinary = (geojson) => {
      if (!geojson || !geojson.type) {
        throw new Error('Invalid GeoJSON geometry');
      }

      // Use wkx library to create proper WKB from GeoJSON
      const geometry = wkx.Geometry.parseGeoJSON(geojson);
      const wkb = geometry.toWkb();

      // Build GeoPackage binary format according to GeoPackage spec
      // Format: magic (1) + version (1) + flags (1) + srs_id (4) + WKB
      const headerSize = 1 + 1 + 1 + 4; // magic + version + flags + srs_id (no envelope)
      const totalSize = headerSize + wkb.length;
      
      const gpkgBuffer = Buffer.allocUnsafe(totalSize);
      let offset = 0;

      // Magic byte (0x47 = 'G')
      gpkgBuffer.writeUInt8(0x47, offset++);
      
      // Version (0x00)
      gpkgBuffer.writeUInt8(0x00, offset++);
      
      // Flags byte (8 bits):
      // - Bit 0 (0x01): Binary type (0=GP, 1=Standard) - use 1 for Standard
      // - Bits 1-3 (0x0E): Envelope contents: 0=no envelope, 1=XY, 2=XYZ, 3=XYM, 4=XYZM
      // - Bit 4 (0x10): Empty geometry flag (0=non-empty, 1=empty)
      // - Bit 5 (0x20): Endianness of SRID (0=Big Endian, 1=Little Endian)
      // - Bits 6-7: Reserved (must be 0)
      // Use Big Endian for SRID (bit 5 = 0) which is more standard
      // The WKB has its own endianness indicator (first byte of WKB)
      // Value: 0x01 (standard GP binary, no envelope, not empty, big endian SRID)
      gpkgBuffer.writeUInt8(0x01, offset++)
      
      // SRID (Spatial Reference System ID) - 4326 for WGS84
      // Write in Big Endian to match the flags byte (bit 5 = 0)
      gpkgBuffer.writeInt32BE(4326, offset);
      offset += 4;
      
      // Append WKB
      wkb.copy(gpkgBuffer, offset);

      return gpkgBuffer;
    };

    // Create SQLite database (better-sqlite3 is synchronous)
    const db = new Database(tempFilePath);

    // Set GeoPackage application ID and user version
    // This marks the file as a GeoPackage
    db.pragma('application_id = 0x47504B47'); // 'GPKG' in hex
    db.pragma('user_version = 10200'); // GeoPackage version 1.2.0

    // Initialize GeoPackage metadata tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS gpkg_spatial_ref_sys (
        srs_name TEXT NOT NULL,
        srs_id INTEGER PRIMARY KEY,
        organization TEXT NOT NULL,
        organization_coordsys_id INTEGER NOT NULL,
        definition TEXT NOT NULL,
        description TEXT
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS gpkg_contents (
        table_name TEXT NOT NULL PRIMARY KEY,
        data_type TEXT NOT NULL,
        identifier TEXT UNIQUE,
        description TEXT,
        last_change DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        min_x DOUBLE,
        min_y DOUBLE,
        max_x DOUBLE,
        max_y DOUBLE,
        srs_id INTEGER,
        CONSTRAINT fk_gc_srs FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS gpkg_geometry_columns (
        table_name TEXT NOT NULL,
        column_name TEXT NOT NULL,
        geometry_type_name TEXT NOT NULL,
        srs_id INTEGER NOT NULL,
        z TINYINT NOT NULL,
        m TINYINT NOT NULL,
        CONSTRAINT pk_geom_cols PRIMARY KEY (table_name, column_name),
        CONSTRAINT fk_gc_tn FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name),
        CONSTRAINT fk_gc_srs FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id)
      )
    `);

    // Create gpkg_extensions table (helps QGIS recognize geometry columns)
    db.exec(`
      CREATE TABLE IF NOT EXISTS gpkg_extensions (
        table_name TEXT,
        column_name TEXT,
        extension_name TEXT NOT NULL,
        definition TEXT NOT NULL,
        scope TEXT NOT NULL,
        CONSTRAINT ge_tce UNIQUE (table_name, column_name, extension_name)
      )
    `);

    // Insert WGS84 spatial reference system (EPSG:4326)
    db.prepare(`
      INSERT OR REPLACE INTO gpkg_spatial_ref_sys 
      (srs_name, srs_id, organization, organization_coordsys_id, definition, description)
      VALUES 
      ('WGS 84', 4326, 'EPSG', 4326, 
       'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]',
       'WGS 84')
    `).run();

    // Also insert Web Mercator (EPSG:3857) since user's project uses it
    db.prepare(`
      INSERT OR REPLACE INTO gpkg_spatial_ref_sys 
      (srs_name, srs_id, organization, organization_coordsys_id, definition, description)
      VALUES 
      ('WGS 84 / Pseudo-Mercator', 3857, 'EPSG', 3857,
       'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENT[-20037508.34,-20037508.34,20037508.34,20037508.34],AUTHORITY["EPSG","3857"]]',
       'Web Mercator')
    `).run();

    // Track used table names to avoid duplicates
    const usedTableNames = new Set();

    // Process each layer
    for (const layer of layers) {
      try {
        // Fetch features for this layer - we'll get geometry as WKT/GeoJSON
        // First try the RPC function if it exists
        let rpcFeatures = null;
        let rpcError = null;
        
        try {
          const result = await req.supabase
            .rpc('get_gis_features_geojson', { p_layer_id: layer.id });
          rpcFeatures = result.data;
          rpcError = result.error;
        } catch (e) {
          console.log(`RPC function get_gis_features_geojson not available, using direct query`);
          rpcError = e;
        }

        // If RPC fails, fetch features directly
        if (rpcError || !rpcFeatures) {
          const { data: rawFeatures, error: fetchError } = await req.supabase
            .from('gis_features')
            .select('*')
            .eq('layer_id', layer.id)
            .order('created_at');

          if (fetchError) {
            console.warn(`Error fetching features for layer ${layer.name}:`, fetchError);
            continue;
          }
          
          rpcFeatures = rawFeatures;
        }

        if (!rpcFeatures || rpcFeatures.length === 0) {
          console.log(`Layer ${layer.name} has no features, skipping`);
          continue;
        }
        
        console.log(`Layer ${layer.name}: fetched ${rpcFeatures.length} features`);
        
        // Check if any features have geometry_geojson
        const featuresWithGeometry = rpcFeatures.filter(f => f.geometry_geojson);
        if (featuresWithGeometry.length === 0) {
          console.warn(`Layer ${layer.name}: No features have geometry_geojson data! This suggests the PostGIS geometry column needs to be converted. Run the migration: backend/migrations/create_gis_geojson_functions.sql`);
          // Continue anyway to export the layer table structure and attribute data
        } else {
          console.log(`Layer ${layer.name}: ${featuresWithGeometry.length} features have geometry data`);
        }

        // Fetch asset_id for features (RPC might not include it)
        const featureIds = rpcFeatures.map(f => f.id).filter(id => id != null);
        let assetIdMap = new Map();
        
        if (featureIds.length > 0) {
          const { data: featuresWithAssetId, error: assetIdError } = await req.supabase
            .from('gis_features')
            .select('id, asset_id')
            .in('id', featureIds);

          if (!assetIdError && featuresWithAssetId) {
            featuresWithAssetId.forEach(f => {
              if (f.asset_id) {
                assetIdMap.set(f.id, f.asset_id);
              }
            });
          }
        }

        // Merge asset_id into features
        const features = rpcFeatures.map(f => ({
          ...f,
          asset_id: assetIdMap.get(f.id) || f.asset_id || null
        }));

        if (!features || features.length === 0) {
          console.log(`Layer ${layer.name} has no features, skipping`);
          continue;
        }

        // Sanitize layer name for table name and ensure uniqueness
        let baseTableName = layer.name
          .replace(/[^a-zA-Z0-9_]/g, '_')
          .replace(/^[0-9]/, '_$&')
          .substring(0, 63);
        
        let tableName = baseTableName;
        let counter = 1;
        while (usedTableNames.has(tableName)) {
          // Append counter to make unique, ensuring total length doesn't exceed 63
          const suffix = `_${counter}`;
          const maxLength = 63 - suffix.length;
          tableName = baseTableName.substring(0, maxLength) + suffix;
          counter++;
        }
        usedTableNames.add(tableName);

        // Determine geometry type from all features (check multiple features to find the type)
        // QGIS requires specific geometry types (POINT, LINESTRING, POLYGON) not generic GEOMETRY
        let geometryTypeName = 'GEOMETRY';
        let geometryTypeCode = 0; // Generic geometry

        const typeMap = {
          'Point': { name: 'POINT', code: 1 },
          'LineString': { name: 'LINESTRING', code: 2 },
          'Polygon': { name: 'POLYGON', code: 3 },
          'MultiPoint': { name: 'MULTIPOINT', code: 4 },
          'MultiLineString': { name: 'MULTILINESTRING', code: 5 },
          'MultiPolygon': { name: 'MULTIPOLYGON', code: 6 },
          // Also handle lowercase and variations
          'point': { name: 'POINT', code: 1 },
          'linestring': { name: 'LINESTRING', code: 2 },
          'polygon': { name: 'POLYGON', code: 3 },
          'line': { name: 'LINESTRING', code: 2 }
        };

        // Check all features to find the geometry type
        for (const feature of features) {
          if (feature.geometry_geojson) {
            try {
              const geom = typeof feature.geometry_geojson === 'string'
                ? JSON.parse(feature.geometry_geojson)
                : feature.geometry_geojson;

              if (geom && geom.type && typeMap[geom.type]) {
                geometryTypeName = typeMap[geom.type].name;
                geometryTypeCode = typeMap[geom.type].code;
                break; // Found a valid geometry type, use it
              }
            } catch (e) {
              // Continue to next feature
            }
          }
        }
        
        // Fallback to layer's geometry_type if no features had geometry
        if (geometryTypeName === 'GEOMETRY' && layer.geometry_type) {
          const layerGeometryType = layer.geometry_type.toLowerCase();
          if (typeMap[layerGeometryType]) {
            geometryTypeName = typeMap[layerGeometryType].name;
            geometryTypeCode = typeMap[layerGeometryType].code;
            console.log(`Layer ${layer.name}: Using layer geometry_type: ${layerGeometryType} -> ${geometryTypeName}`);
          }
        }
        
        console.log(`Layer ${layer.name}: Determined geometry type: ${geometryTypeName} (code: ${geometryTypeCode})`);

        // Collect asset IDs from features
        const assetIds = new Set();
        features.forEach(f => {
          // Check asset_id column first, then properties
          if (f.asset_id) {
            assetIds.add(f.asset_id);
          } else if (f.properties) {
            const props = typeof f.properties === 'string' ? JSON.parse(f.properties) : f.properties;
            if (props.asset_id) {
              assetIds.add(props.asset_id);
            }
          }
        });

        // Fetch asset data for all assets linked to features in this layer
        let assetsMap = new Map();
        let assetAttributesMap = new Map(); // Map of asset_id -> {attribute_name: value}
        
        if (assetIds.size > 0) {
          const assetIdsArray = Array.from(assetIds);
          
          // Fetch assets
          const { data: assets, error: assetsError } = await req.supabase
            .from('assets')
            .select('*')
            .in('id', assetIdsArray)
            .eq('project_id', projectId);

          if (!assetsError && assets) {
            assets.forEach(asset => {
              assetsMap.set(asset.id, asset);
            });

            // Fetch attribute values for these assets
            const { data: attributeValues, error: attrError } = await req.supabase
              .from('attribute_values')
              .select('asset_id, attribute_id, value')
              .in('asset_id', assetIdsArray)
              .eq('project_id', projectId);

            if (!attrError && attributeValues) {
              // Get attribute names
              const attributeIds = [...new Set(attributeValues.map(av => av.attribute_id))];
              if (attributeIds.length > 0) {
                const { data: attributes, error: attrsError } = await req.supabase
                  .from('attributes')
                  .select('id, title')
                  .in('id', attributeIds);

                if (!attrsError && attributes) {
                  const attrIdToName = new Map();
                  attributes.forEach(attr => {
                    attrIdToName.set(attr.id, attr.title);
                  });

                  // Build map of asset_id -> {attribute_name: value}
                  attributeValues.forEach(av => {
                    const attrName = attrIdToName.get(av.attribute_id);
                    if (attrName) {
                      if (!assetAttributesMap.has(av.asset_id)) {
                        assetAttributesMap.set(av.asset_id, {});
                      }
                      assetAttributesMap.get(av.asset_id)[attrName] = av.value;
                    }
                  });
                }
              }
            }
          }
        }

        // Extract all unique property keys from feature properties
        const propertyKeys = new Set();
        features.forEach(f => {
          if (f.properties) {
            const props = typeof f.properties === 'string' ? JSON.parse(f.properties) : f.properties;
            Object.keys(props).forEach(key => {
              if (key !== 'asset_id') {
                propertyKeys.add(key);
              }
            });
          }
        });

        // Check if any assets have beginning or end coordinates
        let hasBeginningCoords = false;
        let hasEndCoords = false;
        assetsMap.forEach(asset => {
          if (asset.beginning_latitude != null && asset.beginning_longitude != null) {
            hasBeginningCoords = true;
          }
          if (asset.end_latitude != null && asset.end_longitude != null) {
            hasEndCoords = true;
          }
        });

        // Add asset fields to column set
        const assetFields = new Set(['title', 'beginning_latitude', 'beginning_longitude', 'end_latitude', 'end_longitude', 'asset_type_id', 'parent_id']);
        const allAttributeNames = new Set();
        assetAttributesMap.forEach(attrs => {
          Object.keys(attrs).forEach(attrName => {
            allAttributeNames.add(attrName);
          });
        });

        // Build column definitions
        let createTableSQL = `CREATE TABLE "${tableName}" (id INTEGER PRIMARY KEY AUTOINCREMENT, geometry BLOB NOT NULL`;
        
        if (features.some(f => f.name)) {
          createTableSQL += ', name TEXT';
        }

        // Add feature property columns
        propertyKeys.forEach(key => {
          const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 63);
          createTableSQL += `, "${sanitizedKey}" TEXT`;
        });

        // Add asset columns (only if we have assets)
        if (assetsMap.size > 0) {
          assetFields.forEach(field => {
            const sanitizedKey = field.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 63);
            createTableSQL += `, "asset_${sanitizedKey}" TEXT`;
          });

          // Add attribute columns
          allAttributeNames.forEach(attrName => {
            const sanitizedKey = attrName.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 63);
            createTableSQL += `, "attr_${sanitizedKey}" TEXT`;
          });

          // Add geometry columns for beginning and end points
          if (hasBeginningCoords) {
            createTableSQL += ', beginning_point BLOB';
          }
          if (hasEndCoords) {
            createTableSQL += ', end_point BLOB';
          }
        }

        createTableSQL += ')';

        // Drop table if it exists (in case of duplicate names from previous iterations)
        db.exec(`DROP TABLE IF EXISTS "${tableName}"`);
        db.exec(createTableSQL);

        // Calculate bounding box for the layer
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        features.forEach(f => {
          if (f.geometry_geojson) {
            try {
              const geom = typeof f.geometry_geojson === 'string'
                ? JSON.parse(f.geometry_geojson)
                : f.geometry_geojson;
              
              const extractCoords = (coords) => {
                if (Array.isArray(coords[0])) {
                  coords.forEach(coord => extractCoords(coord));
                } else {
                  const [x, y] = coords;
                  minX = Math.min(minX, x);
                  minY = Math.min(minY, y);
                  maxX = Math.max(maxX, x);
                  maxY = Math.max(maxY, y);
                }
              };
              extractCoords(geom.coordinates);
            } catch (e) {
              // Skip if geometry parsing fails
            }
          }
        });

        // Register in gpkg_contents with bounding box
        // Use tableName as identifier to ensure uniqueness (layer.name may be duplicated)
        // Delete any existing entry first to avoid conflicts
        db.prepare(`DELETE FROM gpkg_contents WHERE table_name = ?`).run(tableName);
        db.prepare(`
          INSERT INTO gpkg_contents 
          (table_name, data_type, identifier, description, last_change, min_x, min_y, max_x, max_y, srs_id)
          VALUES (?, 'features', ?, ?, datetime('now'), ?, ?, ?, ?, 4326)
        `).run(
          tableName, 
          tableName, // Use unique tableName as identifier instead of layer.name
          layer.description || null,
          isFinite(minX) ? minX : null,
          isFinite(minY) ? minY : null,
          isFinite(maxX) ? maxX : null,
          isFinite(maxY) ? maxY : null
        );

        // Register ONLY the primary geometry column in gpkg_geometry_columns
        // Do NOT register beginning_point and end_point - they are just BLOB columns for additional data
        // GeoPackage spec requires only ONE geometry column per table to be registered for display
        db.prepare(`DELETE FROM gpkg_geometry_columns WHERE table_name = ?`).run(tableName);
        db.prepare(`
          INSERT INTO gpkg_geometry_columns 
          (table_name, column_name, geometry_type_name, srs_id, z, m)
          VALUES (?, 'geometry', ?, 4326, 0, 0)
        `).run(tableName, geometryTypeName);

        // Insert features
        let insertedCount = 0;
        let skippedCount = 0;
        for (const feature of features) {
          try {
            if (!feature.geometry_geojson) {
              skippedCount++;
              continue;
            }

            const geom = typeof feature.geometry_geojson === 'string'
              ? JSON.parse(feature.geometry_geojson)
              : feature.geometry_geojson;

            // Convert GeoJSON to GeoPackage binary format
            let geometryWKB;
            try {
              geometryWKB = geojsonToGeoPackageBinary(geom);
              // Log first feature's geometry details
              if (insertedCount === 0) {
                console.log(`Layer ${layer.name}: First feature geometry type: ${geom.type}, WKB size: ${geometryWKB.length} bytes`);
                console.log(`Layer ${layer.name}: First feature coordinates:`, geom.coordinates);
                // Log first 20 bytes of geometry in hex for debugging
                const hexBytes = Array.from(geometryWKB.slice(0, Math.min(30, geometryWKB.length)))
                  .map(b => b.toString(16).padStart(2, '0'))
                  .join(' ');
                console.log(`Layer ${layer.name}: First feature geometry hex (first 30 bytes): ${hexBytes}`);
              }
            } catch (gpkgError) {
              console.warn('Error converting geometry to GeoPackage format:', gpkgError);
              // Skip this feature if geometry conversion fails
              skippedCount++;
              continue;
            }

            // Get asset_id from feature
            let assetId = feature.asset_id || null;
            if (!assetId && feature.properties) {
              const props = typeof feature.properties === 'string'
                ? JSON.parse(feature.properties)
                : feature.properties;
              assetId = props.asset_id || null;
            }

            // Get asset data if available
            const asset = assetId ? assetsMap.get(assetId) : null;
            const assetAttributes = assetId ? assetAttributesMap.get(assetId) : null;

            // Create Point geometries from asset coordinates
            let beginningPointWKB = null;
            let endPointWKB = null;

            if (asset) {
              // Create beginning point if coordinates exist
              if (asset.beginning_latitude != null && asset.beginning_longitude != null) {
                try {
                  const beginningPoint = {
                    type: 'Point',
                    coordinates: [parseFloat(asset.beginning_longitude), parseFloat(asset.beginning_latitude)]
                  };
                  beginningPointWKB = geojsonToGeoPackageBinary(beginningPoint);
                } catch (e) {
                  console.warn('Error creating beginning point geometry:', e);
                }
              }

              // Create end point if coordinates exist
              if (asset.end_latitude != null && asset.end_longitude != null) {
                try {
                  const endPoint = {
                    type: 'Point',
                    coordinates: [parseFloat(asset.end_longitude), parseFloat(asset.end_latitude)]
                  };
                  endPointWKB = geojsonToGeoPackageBinary(endPoint);
                } catch (e) {
                  console.warn('Error creating end point geometry:', e);
                }
              }
            }

            // Verify geometry is not null before insertion
            if (!geometryWKB || !Buffer.isBuffer(geometryWKB)) {
              console.error(`Feature ${feature.id} in layer ${layer.name}: geometryWKB is invalid:`, geometryWKB);
              skippedCount++;
              continue;
            }

            let insertSQL = `INSERT INTO "${tableName}" (geometry`;
            let values = [geometryWKB];
            let placeholders = '?';

            if (feature.name) {
              insertSQL += ', name';
              values.push(feature.name);
              placeholders += ', ?';
            }

            // Add feature properties
            if (feature.properties) {
              const props = typeof feature.properties === 'string'
                ? JSON.parse(feature.properties)
                : feature.properties;

              Object.keys(props).forEach(key => {
                if (key !== 'asset_id') {
                  const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 63);
                  insertSQL += `, "${sanitizedKey}"`;
                  const value = props[key];
                  values.push(value !== null && value !== undefined ? String(value) : null);
                  placeholders += ', ?';
                }
              });
            }

            // Add asset fields
            if (assetsMap.size > 0) {
              assetFields.forEach(field => {
                const sanitizedKey = field.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 63);
                insertSQL += `, "asset_${sanitizedKey}"`;
                const value = asset ? asset[field] : null;
                values.push(value !== null && value !== undefined ? String(value) : null);
                placeholders += ', ?';
              });

              // Add attribute values
              allAttributeNames.forEach(attrName => {
                const sanitizedKey = attrName.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 63);
                insertSQL += `, "attr_${sanitizedKey}"`;
                const value = assetAttributes ? assetAttributes[attrName] : null;
                values.push(value !== null && value !== undefined ? String(value) : null);
                placeholders += ', ?';
              });

              // Add beginning_point geometry if column exists
              if (hasBeginningCoords) {
                insertSQL += ', beginning_point';
                values.push(beginningPointWKB);
                placeholders += ', ?';
              }

              // Add end_point geometry if column exists
              if (hasEndCoords) {
                insertSQL += ', end_point';
                values.push(endPointWKB);
                placeholders += ', ?';
              }
            }

            insertSQL += `) VALUES (${placeholders})`;
            const insertResult = db.prepare(insertSQL).run(...values);
            
            // Verify the geometry was written for the first feature
            if (insertedCount === 0) {
              const checkGeom = db.prepare(`SELECT geometry FROM "${tableName}" WHERE ROWID = ?`).get(insertResult.lastInsertRowid);
              if (!checkGeom || !checkGeom.geometry) {
                console.error(`Layer ${layer.name}: First feature geometry was NOT written to database!`);
                console.error(`Insert result:`, insertResult);
                console.error(`geometryWKB type:`, typeof geometryWKB, 'isBuffer:', Buffer.isBuffer(geometryWKB), 'length:', geometryWKB ? geometryWKB.length : 0);
              } else {
                console.log(`Layer ${layer.name}: First feature geometry WAS written, size: ${checkGeom.geometry.length} bytes`);
              }
            }
            
            insertedCount++;
          } catch (insertError) {
            console.warn(`Error inserting feature in layer ${layer.name}:`, insertError);
            skippedCount++;
          }
        }
        
        // Summary for this layer
        console.log(`Layer ${layer.name}: Successfully inserted ${insertedCount} features, skipped ${skippedCount} features`);
        
        // Verify data was written
        const rowCount = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get();
        console.log(`Layer ${layer.name}: Table "${tableName}" has ${rowCount.count} total rows`);
        
        // Check if geometry column has data
        const geomCount = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}" WHERE geometry IS NOT NULL`).get();
        console.log(`Layer ${layer.name}: ${geomCount.count} rows have geometry data`);
        
      } catch (layerError) {
        console.error(`Error processing layer ${layer.name}:`, layerError);
      }
    }

    // Create a separate "Assets" table with ALL assets from the project
    // This includes assets whether they have GIS features or not
    try {
      const { data: allAssets, error: allAssetsError } = await req.supabase
        .from('assets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');

      if (!allAssetsError && allAssets && allAssets.length > 0) {
        // Fetch all attribute values for all assets
        const allAssetIds = allAssets.map(a => a.id);
        
        // Fetch GIS features for all assets to get their geometries
        // We need to get all features across all layers for this project that have asset_ids
        const { data: allLayers, error: allLayersError } = await req.supabase
          .from('gis_layers')
          .select('id')
          .eq('project_id', projectId);
        
        // Create a map of asset_id -> geometry (GeoJSON)
        const assetGeometryMap = new Map();
        if (!allLayersError && allLayers && allLayers.length > 0) {
          // Fetch features from all layers that have asset_ids
          let totalFeaturesWithAssets = 0;
          for (const layer of allLayers) {
            // Fetch features directly - select all columns to get geometry_geojson
            const { data: layerFeatures, error: layerFeaturesError } = await req.supabase
              .from('gis_features')
              .select('*')
              .eq('layer_id', layer.id)
              .not('asset_id', 'is', null);
            
            if (!layerFeaturesError && layerFeatures) {
              totalFeaturesWithAssets += layerFeatures.length;
              layerFeatures.forEach(feature => {
                if (feature.asset_id && feature.geometry_geojson && !assetGeometryMap.has(feature.asset_id)) {
                  try {
                    const geom = typeof feature.geometry_geojson === 'string'
                      ? JSON.parse(feature.geometry_geojson)
                      : feature.geometry_geojson;
                    assetGeometryMap.set(feature.asset_id, geom);
                  } catch (e) {
                    console.warn('Error parsing feature geometry for asset:', feature.asset_id, e);
                  }
                }
              });
            }
          }
          console.log(`Found ${totalFeaturesWithAssets} features with asset_ids, fetched geometries for ${assetGeometryMap.size} assets from gis_features table`);
          if (totalFeaturesWithAssets > 0 && assetGeometryMap.size === 0) {
            console.warn('WARNING: Features have asset_ids but no geometry_geojson data! Run migration: backend/migrations/create_gis_geojson_functions.sql');
          }
        }
        
        const { data: allAttributeValues, error: allAttrError } = await req.supabase
          .from('attribute_values')
          .select('asset_id, attribute_id, value')
          .in('asset_id', allAssetIds)
          .eq('project_id', projectId);

        // Get attribute names
        let allAssetAttributesMap = new Map();
        if (!allAttrError && allAttributeValues) {
          const allAttributeIds = [...new Set(allAttributeValues.map(av => av.attribute_id))];
          if (allAttributeIds.length > 0) {
            const { data: allAttributes, error: allAttrsError } = await req.supabase
              .from('attributes')
              .select('id, title')
              .in('id', allAttributeIds);

            if (!allAttrsError && allAttributes) {
              const allAttrIdToName = new Map();
              allAttributes.forEach(attr => {
                allAttrIdToName.set(attr.id, attr.title);
              });

              allAttributeValues.forEach(av => {
                const attrName = allAttrIdToName.get(av.attribute_id);
                if (attrName) {
                  if (!allAssetAttributesMap.has(av.asset_id)) {
                    allAssetAttributesMap.set(av.asset_id, {});
                  }
                  allAssetAttributesMap.get(av.asset_id)[attrName] = av.value;
                }
              });
            }
          }
        }

        // Check if any assets have coordinates
        let hasBeginningCoords = false;
        let hasEndCoords = false;
        allAssets.forEach(asset => {
          if (asset.beginning_latitude != null && asset.beginning_longitude != null) {
            hasBeginningCoords = true;
          }
          if (asset.end_latitude != null && asset.end_longitude != null) {
            hasEndCoords = true;
          }
        });

        // Build assets table
        const assetsTableName = 'Assets';
        let createAssetsTableSQL = `CREATE TABLE "${assetsTableName}" (id TEXT PRIMARY KEY`;

        // Add all asset fields
        const assetFields = ['title', 'asset_type_id', 'parent_id', 'beginning_latitude', 'beginning_longitude', 'end_latitude', 'end_longitude', 'order_index', 'created_at', 'updated_at'];
        assetFields.forEach(field => {
          createAssetsTableSQL += `, "${field}" TEXT`;
        });

        // Add attribute columns
        const allAssetAttributeNames = new Set();
        allAssetAttributesMap.forEach(attrs => {
          Object.keys(attrs).forEach(attrName => {
            allAssetAttributeNames.add(attrName);
          });
        });

        allAssetAttributeNames.forEach(attrName => {
          const sanitizedKey = attrName.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 63);
          createAssetsTableSQL += `, "attr_${sanitizedKey}" TEXT`;
        });

        // Add primary geometry column for displaying assets in QGIS
        // This is required for QGIS to recognize and display the layer
        // NOTE: We do NOT include beginning_point and end_point columns here
        // to avoid confusing QGIS - the geometry column contains the primary geometry data
        const hasAnyCoords = hasBeginningCoords || hasEndCoords;
        const hasGisFeatureGeometries = assetGeometryMap.size > 0;
        if (hasAnyCoords || hasGisFeatureGeometries) {
          createAssetsTableSQL += ', geometry BLOB';
        }

        createAssetsTableSQL += ')';

        console.log('Creating Assets table with SQL:', createAssetsTableSQL);
        console.log('hasAnyCoords:', hasAnyCoords, 'hasBeginningCoords:', hasBeginningCoords, 'hasEndCoords:', hasEndCoords);
        console.log('Table SQL includes geometry column:', createAssetsTableSQL.includes('geometry BLOB'));
        
        db.exec(createAssetsTableSQL);

        // Calculate bounding box for assets
        let assetsMinX = Infinity, assetsMinY = Infinity, assetsMaxX = -Infinity, assetsMaxY = -Infinity;
        
        // Helper to extract coordinates from geometry and update bounding box
        const updateBoundsFromGeometry = (geom) => {
          if (!geom || !geom.coordinates) return;
          
          const extractCoords = (coords) => {
            if (Array.isArray(coords[0])) {
              coords.forEach(coord => extractCoords(coord));
            } else {
              const [x, y] = coords;
              assetsMinX = Math.min(assetsMinX, x);
              assetsMinY = Math.min(assetsMinY, y);
              assetsMaxX = Math.max(assetsMaxX, x);
              assetsMaxY = Math.max(assetsMaxY, y);
            }
          };
          
          extractCoords(geom.coordinates);
        };
        
        allAssets.forEach(asset => {
          // First try to use geometry from gis_features
          const featureGeometry = assetGeometryMap.get(asset.id);
          if (featureGeometry) {
            updateBoundsFromGeometry(featureGeometry);
          } else {
            // Fallback to coordinate fields
            if (asset.beginning_latitude != null && asset.beginning_longitude != null) {
              const x = parseFloat(asset.beginning_longitude);
              const y = parseFloat(asset.beginning_latitude);
              assetsMinX = Math.min(assetsMinX, x);
              assetsMinY = Math.min(assetsMinY, y);
              assetsMaxX = Math.max(assetsMaxX, x);
              assetsMaxY = Math.max(assetsMaxY, y);
            }
            if (asset.end_latitude != null && asset.end_longitude != null) {
              const x = parseFloat(asset.end_longitude);
              const y = parseFloat(asset.end_latitude);
              assetsMinX = Math.min(assetsMinX, x);
              assetsMinY = Math.min(assetsMinY, y);
              assetsMaxX = Math.max(assetsMaxX, x);
              assetsMaxY = Math.max(assetsMaxY, y);
            }
          }
        });

        // Register in gpkg_contents with bounding box
        // Delete any existing entry first to avoid conflicts
        db.prepare(`DELETE FROM gpkg_contents WHERE table_name = ?`).run(assetsTableName);
        db.prepare(`
          INSERT INTO gpkg_contents 
          (table_name, data_type, identifier, description, last_change, min_x, min_y, max_x, max_y, srs_id)
          VALUES (?, 'features', ?, ?, datetime('now'), ?, ?, ?, ?, 4326)
        `).run(
          assetsTableName, 
          'All Assets', 
          'All assets from the project, including those without GIS features',
          isFinite(assetsMinX) ? assetsMinX : null,
          isFinite(assetsMinY) ? assetsMinY : null,
          isFinite(assetsMaxX) ? assetsMaxX : null,
          isFinite(assetsMaxY) ? assetsMaxY : null
        );

        // Register ONLY the primary geometry column (required for QGIS display)
        // Do NOT register beginning_point and end_point as geometry columns - 
        // they are just BLOB columns for additional data, not display geometries
        // Delete any existing geometry column registrations first to avoid conflicts
        db.prepare(`DELETE FROM gpkg_geometry_columns WHERE table_name = ?`).run(assetsTableName);
        if (hasAnyCoords || assetGeometryMap.size > 0) {
          console.log('Registering geometry column for Assets table');
          // Use 'GEOMETRY' as the type since assets may have different geometry types (Point, LineString, Polygon)
          // from their linked GIS features
          db.prepare(`
            INSERT INTO gpkg_geometry_columns 
            (table_name, column_name, geometry_type_name, srs_id, z, m)
            VALUES (?, 'geometry', 'GEOMETRY', 4326, 0, 0)
          `).run(assetsTableName);
          
          // Verify registration
          const checkGeom = db.prepare(`SELECT * FROM gpkg_geometry_columns WHERE table_name = ?`).all(assetsTableName);
          console.log('Registered geometry columns for Assets:', JSON.stringify(checkGeom, null, 2));
        } else {
          console.log('WARNING: No coordinates or geometries found in assets, geometry column NOT created!');
        }

        // Insert all assets
        let assetsWithGeometry = 0;
        let assetsWithoutGeometry = 0;
        for (const asset of allAssets) {
          try {
            // Create primary geometry
            // Priority: 1) Use geometry from gis_features table if available
            //           2) Fallback to creating point from beginning coordinates
            //           3) Fallback to creating point from end coordinates
            let geometryWKB = null;
            
            // First, try to get geometry from gis_features table
            const featureGeometry = assetGeometryMap.get(asset.id);
            if (featureGeometry) {
              try {
                // Log first few assets to verify we're using feature geometry
                if (allAssets.indexOf(asset) < 3) {
                  console.log(`Asset ${asset.id} using geometry from gis_features:`, featureGeometry.type);
                }
                geometryWKB = geojsonToGeoPackageBinary(featureGeometry);
              } catch (e) {
                console.warn('Error converting feature geometry for asset:', asset.id, e);
              }
            }
            
            // Fallback: Create point from beginning coordinates if no feature geometry
            if (!geometryWKB && asset.beginning_latitude != null && asset.beginning_longitude != null) {
              try {
                const lng = parseFloat(asset.beginning_longitude);
                const lat = parseFloat(asset.beginning_latitude);
                // Log first few assets to verify coordinates
                if (allAssets.indexOf(asset) < 3) {
                  console.log(`Asset ${asset.id} using beginning coordinates: lng=${lng}, lat=${lat}`);
                }
                const point = {
                  type: 'Point',
                  coordinates: [lng, lat]
                };
                geometryWKB = geojsonToGeoPackageBinary(point);
              } catch (e) {
                console.warn('Error creating primary geometry from beginning coordinates:', e);
              }
            }
            
            // Second fallback: Use end coordinates if available
            if (!geometryWKB && asset.end_latitude != null && asset.end_longitude != null) {
              try {
                const lng = parseFloat(asset.end_longitude);
                const lat = parseFloat(asset.end_latitude);
                // Log first few assets to verify coordinates
                if (allAssets.indexOf(asset) < 3) {
                  console.log(`Asset ${asset.id} using end coordinates: lng=${lng}, lat=${lat}`);
                }
                const point = {
                  type: 'Point',
                  coordinates: [lng, lat]
                };
                geometryWKB = geojsonToGeoPackageBinary(point);
              } catch (e) {
                console.warn('Error creating primary geometry from end coordinates:', e);
              }
            }

            const assetAttributes = allAssetAttributesMap.get(asset.id) || {};

            let insertSQL = `INSERT INTO "${assetsTableName}" (id`;
            let values = [asset.id];
            let placeholders = '?';

            // Add asset fields
            assetFields.forEach(field => {
              insertSQL += `, "${field}"`;
              const value = asset[field];
              values.push(value !== null && value !== undefined ? String(value) : null);
              placeholders += ', ?';
            });

            // Add attribute values
            allAssetAttributeNames.forEach(attrName => {
              const sanitizedKey = attrName.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 63);
              insertSQL += `, "attr_${sanitizedKey}"`;
              const value = assetAttributes[attrName];
              values.push(value !== null && value !== undefined ? String(value) : null);
              placeholders += ', ?';
            });

            // Add primary geometry column (required for QGIS display)
            // NOTE: We do NOT include beginning_point and end_point columns
            // to avoid confusing QGIS - the geometry column contains the primary geometry data
            if (hasAnyCoords || hasGisFeatureGeometries) {
              insertSQL += ', geometry';
              values.push(geometryWKB);
              placeholders += ', ?';
            }

            insertSQL += `) VALUES (${placeholders})`;
            
            // Count assets with/without geometry
            if (geometryWKB !== null) {
              assetsWithGeometry++;
            } else {
              assetsWithoutGeometry++;
            }
            
            // Log first asset insert to verify geometry column is included
            if (asset === allAssets[0]) {
              console.log('First asset INSERT SQL:', insertSQL.substring(0, 300));
              console.log('First asset has geometryWKB:', geometryWKB !== null, 'Size:', geometryWKB ? geometryWKB.length : 0);
            }
            
            db.prepare(insertSQL).run(...values);
          } catch (insertError) {
            console.warn(`Error inserting asset ${asset.id}:`, insertError);
          }
        }
        
        // Verify geometry column exists in table
        try {
          const tableInfo = db.prepare(`PRAGMA table_info("${assetsTableName}")`).all();
          const geometryColumn = tableInfo.find(col => col.name === 'geometry');
          console.log('Geometry column in Assets table:', geometryColumn ? 'EXISTS' : 'MISSING');
          if (geometryColumn) {
            console.log('Geometry column details:', geometryColumn);
          }
          
          // Count how many assets have geometry data
          const assetsWithGeomCount = db.prepare(`SELECT COUNT(*) as count FROM "${assetsTableName}" WHERE geometry IS NOT NULL`).get();
          console.log(`Assets with geometry data: ${assetsWithGeomCount.count} out of ${allAssets.length} total`);
          console.log(`Assets without geometry: ${assetsWithoutGeometry}, Assets with geometry: ${assetsWithGeometry}`);
        } catch (e) {
          console.error('Error checking table info:', e);
        }
      }
    } catch (assetsTableError) {
      console.error('Error creating assets table:', assetsTableError);
      // Continue even if assets table fails - at least the layers are exported
    }

    // Verify GeoPackage metadata before closing
    try {
      const contents = db.prepare(`SELECT * FROM gpkg_contents`).all();
      console.log(`\n=== GeoPackage Summary ===`);
      console.log(`Total tables in gpkg_contents: ${contents.length}`);
      contents.forEach(c => {
        console.log(`  - ${c.table_name} (${c.data_type}): bbox [${c.min_x}, ${c.min_y}, ${c.max_x}, ${c.max_y}]`);
      });
      
      const geomCols = db.prepare(`SELECT * FROM gpkg_geometry_columns`).all();
      console.log(`\nGeometry columns registered: ${geomCols.length}`);
      geomCols.forEach(g => {
        console.log(`  - ${g.table_name}.${g.column_name}: ${g.geometry_type_name}`);
      });
      console.log(`=========================\n`);
    } catch (e) {
      console.error('Error verifying GeoPackage metadata:', e);
    }
    
    // Close database
    db.close();

    // Read the file and send it
    const fileBuffer = fs.readFileSync(tempFilePath);

    // Clean up temp file
    fs.unlinkSync(tempFilePath);

    // Set response headers
    const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedProjectName}.gpkg`;

    res.setHeader('Content-Type', 'application/geopackage+sqlite3');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileBuffer.length);

    res.status(200).send(fileBuffer);

  } catch (error) {
    console.error('Error exporting to GeoPackage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export layers to GeoPackage',
      message: error.message
    });
  }
});

// Export layers to GeoJSON format (much simpler than GeoPackage!)
const exportLayersToGeoJSON = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { layerIds } = req.body; // Optional array of layer IDs

  if (!projectId) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify user has access to the project
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', req.user.id)
    .single();

  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    // Get project name
    const { data: project } = await req.supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    const projectName = project?.name || 'project';

    // Fetch layers to export
    let query = req.supabase
      .from('gis_layers')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');

    if (layerIds && Array.isArray(layerIds) && layerIds.length > 0) {
      query = query.in('id', layerIds);
    }

    const { data: layers, error: layersError } = await query;

    if (layersError) {
      console.error('Error fetching layers:', layersError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch layers'
      });
    }

    if (!layers || layers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No layers found to export'
      });
    }

    // Create separate GeoJSON files for each layer (so they import as separate layers in QGIS)
    const layerGeoJSONs = [];

    for (const layer of layers) {
      // Fetch features with geometry_geojson
      const { data: features, error: fetchError } = await req.supabase
        .rpc('get_gis_features_geojson', { p_layer_id: layer.id });

      if (fetchError || !features) {
        console.warn(`Error fetching features for layer ${layer.name}:`, fetchError);
        continue;
      }

      // Parse layer style
      const layerStyle = typeof layer.style === 'string' 
        ? JSON.parse(layer.style) 
        : layer.style || {};

      // Create features array with layer style info
      const layerFeatures = features
        .filter(f => f.geometry_geojson)
        .map(f => {
          const geom = typeof f.geometry_geojson === 'string' 
            ? JSON.parse(f.geometry_geojson) 
            : f.geometry_geojson;

          return {
            type: 'Feature',
            geometry: geom,
            properties: {
              id: f.id,
              name: f.name || 'Unnamed Feature',
              label: f.name || 'Unnamed Feature',
              asset_id: f.asset_id,
              // Include layer style for QGIS rendering
              symbol: layerStyle.symbol || 'marker',
              color: layerStyle.color || '#3388ff',
              fill_color: layerStyle.fillColor || layerStyle.color || '#3388ff',
              opacity: layerStyle.opacity || 1,
              fill_opacity: layerStyle.fillOpacity || 0.2,
              weight: layerStyle.weight || 3,
              ...(f.properties || {})
            }
          };
        });

      layerGeoJSONs.push({
        name: layer.name,
        style: layerStyle,
        geojson: {
          type: 'FeatureCollection',
          name: layer.name,
          crs: {
            type: 'name',
            properties: {
              name: 'urn:ogc:def:crs:EPSG::4326'
            }
          },
          features: layerFeatures
        }
      });
    }

    // Create a QML style file with symbols and labels matching MapScreen
    const createQMLStyle = (layerStyle) => {
      // Map symbols to QGIS marker shapes
      const symbolMap = {
        'marker': 'circle',
        'circle': 'circle',
        'square': 'square',
        'diamond': 'diamond',
        'triangle': 'triangle',
        'star': 'star',
        'cross': 'cross',
        'bar': 'rectangle',
        'hexagon': 'hexagon',
        'pin': 'arrowhead'
      };

      const symbol = layerStyle.symbol || 'marker';
      const qgisShape = symbolMap[symbol] || 'circle';
      const color = layerStyle.color || '#3388ff';
      
      // Convert hex color to RGB
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 51, g: 136, b: 255 };
      };
      
      // Parse rgba color to RGB + Alpha
      const parseRgba = (rgba) => {
        const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(rgba);
        if (match) {
          return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3]),
            a: match[4] ? Math.round(parseFloat(match[4]) * 255) : 255
          };
        }
        return { r: 255, g: 255, b: 255, a: 153 };
      };
      
      const rgb = hexToRgb(color);
      const labelTextRgb = hexToRgb('#000000'); // Default black text
      const labelBgRgba = parseRgba('rgba(255, 255, 255, 0.6)'); // Default translucent white

      return `<!DOCTYPE qgis PUBLIC 'http://mrcc.com/qgis.dtd' 'SYSTEM'>
<qgis version="3.28.0" styleCategories="AllStyleCategories">
  <renderer-v2 type="singleSymbol" symbollevels="0" forceraster="0" enableorderby="0">
    <symbols>
      <symbol type="marker" name="0" alpha="1" clip_to_extent="1" force_rhr="0">
        <data_defined_properties>
          <Option type="Map">
            <Option type="QString" name="name" value=""/>
            <Option name="properties"/>
            <Option type="QString" name="type" value="collection"/>
          </Option>
        </data_defined_properties>
        <layer class="SimpleMarker" enabled="1" locked="0" pass="0">
          <Option type="Map">
            <Option type="QString" name="angle" value="0"/>
            <Option type="QString" name="cap_style" value="square"/>
            <Option type="QString" name="color" value="${rgb.r},${rgb.g},${rgb.b},255"/>
            <Option type="QString" name="horizontal_anchor_point" value="1"/>
            <Option type="QString" name="joinstyle" value="bevel"/>
            <Option type="QString" name="name" value="${qgisShape}"/>
            <Option type="QString" name="offset" value="0,0"/>
            <Option type="QString" name="offset_map_unit_scale" value="3x:0,0,0,0,0,0"/>
            <Option type="QString" name="offset_unit" value="MM"/>
            <Option type="QString" name="outline_color" value="${rgb.r},${rgb.g},${rgb.b},255"/>
            <Option type="QString" name="outline_style" value="solid"/>
            <Option type="QString" name="outline_width" value="0.4"/>
            <Option type="QString" name="outline_width_map_unit_scale" value="3x:0,0,0,0,0,0"/>
            <Option type="QString" name="outline_width_unit" value="MM"/>
            <Option type="QString" name="scale_method" value="diameter"/>
            <Option type="QString" name="size" value="3"/>
            <Option type="QString" name="size_map_unit_scale" value="3x:0,0,0,0,0,0"/>
            <Option type="QString" name="size_unit" value="MM"/>
            <Option type="QString" name="vertical_anchor_point" value="1"/>
          </Option>
          <data_defined_properties>
            <Option type="Map">
              <Option type="QString" name="name" value=""/>
              <Option name="properties"/>
              <Option type="QString" name="type" value="collection"/>
            </Option>
          </data_defined_properties>
        </layer>
      </symbol>
    </symbols>
  </renderer-v2>
  <labeling type="simple">
    <settings calloutType="simple">
      <text-style fontFamily="Arial" fontSizeUnit="Point" textColor="${labelTextRgb.r},${labelTextRgb.g},${labelTextRgb.b},255" fontSize="10" fieldName="label" isExpression="0" textOpacity="1">
        <text-buffer bufferDraw="1" bufferSize="0.8" bufferColor="${labelBgRgba.r},${labelBgRgba.g},${labelBgRgba.b},${labelBgRgba.a}" bufferSizeUnits="MM" bufferOpacity="1"/>
        <background shapeDraw="1" shapeType="0" shapeSizeType="1" shapeSizeX="1" shapeSizeY="1" shapeRotationType="0" shapeRotation="0" shapeOffsetX="0" shapeOffsetY="0" shapeRadiiX="0.2" shapeRadiiY="0.2" shapeFillColor="${labelBgRgba.r},${labelBgRgba.g},${labelBgRgba.b},${labelBgRgba.a}" shapeBorderColor="255,255,255,0" shapeBorderWidth="0" shapeBorderWidthUnit="MM" shapeJoinStyle="64" shapeSizeUnit="MM" shapeOffsetUnit="MM" shapeRadiiUnit="MM"/>
      </text-style>
      <placement placement="1" dist="5" priority="5" offsetType="1" quadOffset="2" yOffset="-3" xOffset="3" distUnits="MM" placementFlags="10" repeatDistance="0" maxCurvedCharAngleIn="25" maxCurvedCharAngleOut="-25"/>
      <rendering scaleVisibility="0" fontLimitPixelSize="0" labelPerPart="0" limitNumLabels="0" maxNumLabels="2000" minFeatureSize="0" scaleMin="0" scaleMax="0" displayAll="1" obstacleType="1" obstacle="1" obstacleFactor="1" zIndex="0" mergeLines="0" upsidedownLabels="0"/>
    </settings>
  </labeling>
</qgis>`;
    };

    // Set response headers for download
    const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Create a ZIP file containing separate GeoJSON and QML files for each layer
    const zip = new AdmZip();
    let totalFeatures = 0;

    // Add each layer as a separate GeoJSON + QML pair
    for (const layerData of layerGeoJSONs) {
      const sanitizedLayerName = layerData.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const layerFilename = layerGeoJSONs.length === 1 
        ? sanitizedProjectName 
        : `${sanitizedProjectName}_${sanitizedLayerName}`;
      
      // Add GeoJSON file
      zip.addFile(
        `${layerFilename}.geojson`,
        Buffer.from(JSON.stringify(layerData.geojson, null, 2), 'utf-8')
      );
      
      // Add QML style file with same basename so QGIS auto-applies it
      zip.addFile(
        `${layerFilename}.qml`,
        Buffer.from(createQMLStyle(layerData.style), 'utf-8')
      );

      totalFeatures += layerData.geojson.features.length;
    }

    // Generate ZIP buffer
    const zipBuffer = zip.toBuffer();
    
    console.log(`Generated ZIP file: ${sanitizedProjectName}_geojson.zip (${zipBuffer.length} bytes)`);
    console.log(`ZIP contains ${totalFeatures} feature(s) across ${layerGeoJSONs.length} layer(s)`);

    // Send the ZIP file
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedProjectName}_geojson.zip"`);
    res.setHeader('Content-Length', zipBuffer.length);
    return res.status(200).send(zipBuffer);

  } catch (error) {
    console.error('Error exporting to GeoJSON:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export layers to GeoJSON',
      message: error.message
    });
  }
});

export default {
  getGisLayers,
  createGisLayer,
  updateGisLayer,
  deleteGisLayer,
  getLayerFeatures,
  addFeature,
  deleteFeature,
  exportLayersToGeoPackage,
  exportLayersToGeoJSON
};



