import asyncHandler from 'express-async-handler';

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
    // Use PostGIS function to get features with GeoJSON geometry
    const { data: features, error } = await req.supabase
      .rpc('get_gis_features_geojson', { p_layer_id: layerId });

    if (error) {
      console.error('Error fetching features:', error);
      // Fallback to regular query if function doesn't exist
      const { data: fallbackFeatures, error: fallbackError } = await req.supabase
        .from('gis_features')
        .select('*')
        .eq('layer_id', layerId)
        .order('created_at');

      if (fallbackError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch features'
        });
      }

      return res.status(200).json({
        success: true,
        data: fallbackFeatures || []
      });
    }

    res.status(200).json({
      success: true,
      data: features || []
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
    if (assetId && feature && feature.id) {
      const { error: updateError } = await req.supabase
        .from('gis_features')
        .update({ asset_id: assetId })
        .eq('id', feature.id);

      if (updateError) {
        console.warn('Warning: Could not set asset_id column on feature:', updateError);
        // Continue anyway - asset_id is still in properties JSON as fallback
      } else {
        // Remove asset_id from properties JSON since it's now in the column
        // Keep other properties intact
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
      }
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

    // Helper to convert GeoJSON to GeoPackage binary format
    // GeoPackage uses a specific binary format: magic byte (0x47) + version (0x00) + flags + envelope + WKB
    const geojsonToGeoPackageBinary = (geojson) => {
      if (!geojson || !geojson.type) {
        throw new Error('Invalid GeoJSON geometry');
      }

      // First, create WKB
      const wkbBuffer = Buffer.allocUnsafe(1024);
      let wkbOffset = 0;

      // Write byte order (1 = little endian)
      wkbBuffer.writeUInt8(1, wkbOffset++);

      // Write geometry type (with Z and M flags set to 0)
      const typeMap = {
        'Point': 1,
        'LineString': 2,
        'Polygon': 3,
        'MultiPoint': 4,
        'MultiLineString': 5,
        'MultiPolygon': 6
      };

      const typeCode = typeMap[geojson.type] || 0;
      wkbBuffer.writeUInt32LE(typeCode, wkbOffset);
      wkbOffset += 4;

      // Write coordinates based on type
      if (geojson.type === 'Point' && geojson.coordinates) {
        const [x, y] = geojson.coordinates;
        wkbBuffer.writeDoubleLE(x, wkbOffset);
        wkbOffset += 8;
        wkbBuffer.writeDoubleLE(y, wkbOffset);
        wkbOffset += 8;
      } else if (geojson.type === 'LineString' && geojson.coordinates) {
        wkbBuffer.writeUInt32LE(geojson.coordinates.length, wkbOffset);
        wkbOffset += 4;
        for (const [x, y] of geojson.coordinates) {
          wkbBuffer.writeDoubleLE(x, wkbOffset);
          wkbOffset += 8;
          wkbBuffer.writeDoubleLE(y, wkbOffset);
          wkbOffset += 8;
        }
      } else if (geojson.type === 'Polygon' && geojson.coordinates) {
        // Polygon has rings (exterior + holes)
        wkbBuffer.writeUInt32LE(geojson.coordinates.length, wkbOffset);
        wkbOffset += 4;
        for (const ring of geojson.coordinates) {
          wkbBuffer.writeUInt32LE(ring.length, wkbOffset);
          wkbOffset += 4;
          for (const [x, y] of ring) {
            wkbBuffer.writeDoubleLE(x, wkbOffset);
            wkbOffset += 8;
            wkbBuffer.writeDoubleLE(y, wkbOffset);
            wkbOffset += 8;
          }
        }
      } else {
        throw new Error(`Unsupported geometry type: ${geojson.type}`);
      }

      const wkb = wkbBuffer.slice(0, wkbOffset);

      // Calculate envelope (bounding box)
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
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
      
      extractCoords(geojson.coordinates);

      // Build GeoPackage binary format
      // Header: magic (1 byte) + version (1 byte) + flags (1 byte) + envelope (varies)
      const envelopeSize = 32; // 4 doubles (minX, maxX, minY, maxY) = 32 bytes
      const headerSize = 1 + 1 + 1 + envelopeSize; // magic + version + flags + envelope
      const totalSize = headerSize + wkb.length;
      
      const gpkgBuffer = Buffer.allocUnsafe(totalSize);
      let offset = 0;

      // Magic byte (0x47 = 'G')
      gpkgBuffer.writeUInt8(0x47, offset++);
      
      // Version (0x00)
      gpkgBuffer.writeUInt8(0x00, offset++);
      
      // Flags byte: standard geometry (0x01 = standard, no extended)
      gpkgBuffer.writeUInt8(0x01, offset++);
      
      // Envelope: minX, maxX, minY, maxY (all doubles)
      gpkgBuffer.writeDoubleLE(minX, offset);
      offset += 8;
      gpkgBuffer.writeDoubleLE(maxX, offset);
      offset += 8;
      gpkgBuffer.writeDoubleLE(minY, offset);
      offset += 8;
      gpkgBuffer.writeDoubleLE(maxY, offset);
      offset += 8;
      
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
        // Fetch features for this layer with GeoJSON geometry
        const { data: rpcFeatures, error: rpcError } = await req.supabase
          .rpc('get_gis_features_geojson', { p_layer_id: layer.id });

        if (rpcError) {
          console.warn(`Error fetching features for layer ${layer.name}:`, rpcError);
          continue;
        }

        if (!rpcFeatures || rpcFeatures.length === 0) {
          console.log(`Layer ${layer.name} has no features, skipping`);
          continue;
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

        // Determine geometry type from first feature
        let geometryTypeName = 'GEOMETRY';
        let geometryTypeCode = 0; // Generic geometry

        if (features.length > 0 && features[0].geometry_geojson) {
          try {
            const geom = typeof features[0].geometry_geojson === 'string'
              ? JSON.parse(features[0].geometry_geojson)
              : features[0].geometry_geojson;

            const typeMap = {
              'Point': { name: 'POINT', code: 1 },
              'LineString': { name: 'LINESTRING', code: 2 },
              'Polygon': { name: 'POLYGON', code: 3 },
              'MultiPoint': { name: 'MULTIPOINT', code: 4 },
              'MultiLineString': { name: 'MULTILINESTRING', code: 5 },
              'MultiPolygon': { name: 'MULTIPOLYGON', code: 6 }
            };

            if (typeMap[geom.type]) {
              geometryTypeName = typeMap[geom.type].name;
              geometryTypeCode = typeMap[geom.type].code;
            }
          } catch (e) {
            console.warn('Error parsing geometry type:', e);
          }
        }

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
        const assetFields = new Set(['title', 'beginning_latitude', 'beginning_longitude', 'end_latitude', 'end_longitude', 'item_type_id', 'parent_id']);
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
        for (const feature of features) {
          try {
            if (!feature.geometry_geojson) continue;

            const geom = typeof feature.geometry_geojson === 'string'
              ? JSON.parse(feature.geometry_geojson)
              : feature.geometry_geojson;

            // Convert GeoJSON to GeoPackage binary format
            let geometryWKB;
            try {
              geometryWKB = geojsonToGeoPackageBinary(geom);
            } catch (gpkgError) {
              console.warn('Error converting geometry to GeoPackage format:', gpkgError);
              // Skip this feature if geometry conversion fails
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
            db.prepare(insertSQL).run(...values);
          } catch (insertError) {
            console.warn(`Error inserting feature in layer ${layer.name}:`, insertError);
          }
        }
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
        const assetFields = ['title', 'item_type_id', 'parent_id', 'beginning_latitude', 'beginning_longitude', 'end_latitude', 'end_longitude', 'order_index', 'created_at', 'updated_at'];
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
        if (hasAnyCoords) {
          createAssetsTableSQL += ', geometry BLOB';
        }

        createAssetsTableSQL += ')';

        console.log('Creating Assets table with SQL:', createAssetsTableSQL);
        console.log('hasAnyCoords:', hasAnyCoords, 'hasBeginningCoords:', hasBeginningCoords, 'hasEndCoords:', hasEndCoords);
        console.log('Table SQL includes geometry column:', createAssetsTableSQL.includes('geometry BLOB'));
        
        db.exec(createAssetsTableSQL);

        // Calculate bounding box for assets
        let assetsMinX = Infinity, assetsMinY = Infinity, assetsMaxX = -Infinity, assetsMaxY = -Infinity;
        allAssets.forEach(asset => {
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
        if (hasAnyCoords) {
          console.log('Registering geometry column for Assets table');
          db.prepare(`
            INSERT INTO gpkg_geometry_columns 
            (table_name, column_name, geometry_type_name, srs_id, z, m)
            VALUES (?, 'geometry', 'POINT', 4326, 0, 0)
          `).run(assetsTableName);
          
          // Verify registration
          const checkGeom = db.prepare(`SELECT * FROM gpkg_geometry_columns WHERE table_name = ?`).all(assetsTableName);
          console.log('Registered geometry columns for Assets:', JSON.stringify(checkGeom, null, 2));
        } else {
          console.log('WARNING: No coordinates found in assets, geometry column NOT created!');
        }

        // Insert all assets
        let assetsWithGeometry = 0;
        let assetsWithoutGeometry = 0;
        for (const asset of allAssets) {
          try {
            // Create primary geometry (prefer beginning coordinates, fallback to end coordinates)
            let geometryWKB = null;
            
            if (asset.beginning_latitude != null && asset.beginning_longitude != null) {
              try {
                const lng = parseFloat(asset.beginning_longitude);
                const lat = parseFloat(asset.beginning_latitude);
                // Log first few assets to verify coordinates
                if (allAssets.indexOf(asset) < 3) {
                  console.log(`Asset ${asset.id} coordinates: lng=${lng}, lat=${lat}`);
                }
                const point = {
                  type: 'Point',
                  coordinates: [lng, lat]
                };
                geometryWKB = geojsonToGeoPackageBinary(point);
              } catch (e) {
                console.warn('Error creating primary geometry:', e);
              }
            } else if (asset.end_latitude != null && asset.end_longitude != null) {
              try {
                const lng = parseFloat(asset.end_longitude);
                const lat = parseFloat(asset.end_latitude);
                // Log first few assets to verify coordinates
                if (allAssets.indexOf(asset) < 3) {
                  console.log(`Asset ${asset.id} coordinates (from end): lng=${lng}, lat=${lat}`);
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
            if (hasAnyCoords) {
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

export default {
  getGisLayers,
  createGisLayer,
  updateGisLayer,
  deleteGisLayer,
  getLayerFeatures,
  addFeature,
  deleteFeature,
  exportLayersToGeoPackage
};



