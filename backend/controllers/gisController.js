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

export default {
  getGisLayers,
  createGisLayer,
  updateGisLayer,
  deleteGisLayer,
  getLayerFeatures,
  addFeature,
  deleteFeature
};

