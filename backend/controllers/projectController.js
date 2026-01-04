import asyncHandler from 'express-async-handler';
import multer from 'multer';
import supabaseClient from '../config/supabaseClient.js';
const { supabaseAdmin } = supabaseClient;

// Configure multer for snapshot upload
const storage = multer.memoryStorage();
const uploadSnapshot = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for snapshots
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const getProjects = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const projectMap = new Map(); // Use Map to deduplicate by project ID

  // Get projects from project_users (shared projects)
  const { data: sharedProjectsData, error: sharedError } = await req.supabase
    .from('project_users')
    .select(`
      role,
      project:projects(*)
    `)
    .eq('user_id', userId);

  if (!sharedError && sharedProjectsData) {
    // Extract project data and filter out nulls
    sharedProjectsData.forEach(item => {
      if (item.project && item.project.id) {
        projectMap.set(item.project.id, item.project);
      }
    });
  }

  // Also get projects where user is the owner
  const { data: ownedProjects, error: ownedError } = await req.supabase
    .from('projects')
    .select('*')
    .eq('owner_id', userId);

  if (!ownedError && ownedProjects) {
    ownedProjects.forEach(project => {
      if (project && project.id) {
        projectMap.set(project.id, project);
      }
    });
  }

  // Convert Map to array and sort by created_at
  const projects = Array.from(projectMap.values())
    .filter(project => project !== null && project !== undefined)
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA; // Most recent first
    });

  res.status(200).json(projects);
});

// Get only shared projects (where user is in project_users with role != 'owner')
const getSharedProjects = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get project_ids from project_users where role is NOT 'owner'
  const { data: projectUsersData, error: projectUsersError } = await req.supabase
    .from('project_users')
    .select('project_id, role')
    .eq('user_id', userId)
    .neq('role', 'owner');

  if (projectUsersError) {
    return res.status(400).json({
      success: false,
      error: projectUsersError.message
    });
  }

  // Extract unique project IDs
  const sharedProjectIds = [...new Set((projectUsersData || [])
    .filter(pu => pu.project_id)
    .map(pu => pu.project_id))];

  // If no shared projects, return empty array
  if (sharedProjectIds.length === 0) {
    return res.status(200).json([]);
  }

  // Query projects directly using supabaseAdmin to bypass RLS
  // This is necessary because RLS might block access to projects even through the join
  const { data: sharedProjects, error: projectsError } = await supabaseAdmin
    .from('projects')
    .select('*')
    .in('id', sharedProjectIds);

  if (projectsError) {
    console.error('[getSharedProjects] Error fetching projects:', projectsError);
    return res.status(400).json({
      success: false,
      error: projectsError.message
    });
  }

  // Also exclude projects where user is the owner (via projects.owner_id)
  // Get all projects the user owns
  const { data: ownedProjects, error: ownedError } = await req.supabase
    .from('projects')
    .select('id')
    .eq('owner_id', userId);

  if (ownedError) {
    console.error('[getSharedProjects] Error fetching owned projects:', ownedError);
  }

  const ownedProjectIds = new Set((ownedProjects || []).map(p => p.id));

  // Filter out owned projects from shared projects
  const finalProjects = (sharedProjects || []).filter(project => !ownedProjectIds.has(project.id));

  // Sort by created_at
  const sortedProjects = finalProjects.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    return dateB - dateA; // Most recent first
  });

  res.status(200).json(sortedProjects);
});

const getProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  const { data, error } = await req.supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(404).json({ 
      success: false,
      error: 'Project not found' 
    });
  }

  res.status(200).json(data);
});

const createProject = asyncHandler(async (req, res) => {
  const { title, description, latitude, longitude, userIds = [] } = req.body; // userIds is array of user IDs to give access

  // Validation
  if (!title || title.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Title is required and cannot be empty'
    });
  }

  // Create the project
  const { data: project, error: projectError } = await req.supabase
    .from('projects')
    .insert({
      title: title.trim(),
      description: description !== undefined ? description : "",
      latitude: latitude !== undefined ? parseFloat(latitude) : null,
      longitude: longitude !== undefined ? parseFloat(longitude) : null,
      owner_id: req.user.id, // Set the creator as owner
    })
    .select()
    .single();

  if (projectError) {
    return res.status(400).json({ 
      success: false,
      error: projectError.message 
    });
  }

  // Add owner to project_users table
  const projectUsersToInsert = [
    { project_id: project.id, user_id: req.user.id, role: 'owner' }
  ];

  // Add other users if provided
  if (userIds.length > 0) {
    const additionalUsers = userIds.map(userId => ({
      project_id: project.id,
      user_id: userId,
      role: 'member'
    }));
    projectUsersToInsert.push(...additionalUsers);
  }

  const { error: usersError } = await req.supabase
    .from('project_users')
    .insert(projectUsersToInsert);

  if (usersError) {
    // If adding users fails, you might want to delete the project or continue
    // For now, let's continue silently
  }

  res.status(201).json(project);
});

const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    title, 
    description, 
    latitude, 
    longitude, 
    map_snapshot_url,
    label_font_size,
    label_color,
    label_background_color
  } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!title && !description && latitude === undefined && longitude === undefined && !map_snapshot_url && 
      label_font_size === undefined && !label_color && !label_background_color) {
    return res.status(400).json({
      success: false,
      error: 'At least one field must be provided for update'
    });
  }
  
  const updateData = { 
    ...(title && { title }), 
    ...(description !== undefined && { description }),
    ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
    ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
    ...(map_snapshot_url !== undefined && { map_snapshot_url }),
    ...(label_font_size !== undefined && { label_font_size: parseInt(label_font_size) }),
    ...(label_color && { label_color }),
    ...(label_background_color && { label_background_color })
  };

  const { data: existingProject, error: checkError } = await req.supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .single();

  if (checkError || !existingProject) {
    return res.status(404).json({ 
      success: false,
      error: 'Project not found or access denied' 
    });
  }

  const { data, error } = await req.supabase
    .from('projects')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }

  res.status(200).json(data);
});

const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  const { data: existingProject, error: checkError } = await req.supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .single();

  if (checkError || !existingProject) {
    return res.status(404).json({ 
      success: false,
      error: 'Project not found or access denied' 
    });
  }

  const { error } = await req.supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }

  res.status(200).json(id);
});

const getProjectUsers = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user has access to this project (either through project_users or as owner)
  const { data: userAccess } = await req.supabase
    .from('project_users')
    .select('role')
    .eq('project_id', id)
    .eq('user_id', req.user.id)
    .single();

  // If not in project_users, check if user is the owner
  if (!userAccess) {
    const { data: project } = await req.supabase
      .from('projects')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!project || project.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
  }

  // Get all users for this project
  const { data: projectUsers, error } = await req.supabase
    .from('project_users')
    .select('role, user_id')
    .eq('project_id', id);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  // Fetch user details for each project user using admin client
  const usersWithDetails = await Promise.all(
    (projectUsers || []).map(async (pu) => {
      try {
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(pu.user_id);
        if (userError || !user) {
          return {
            role: pu.role,
            user_id: pu.user_id,
            user: {
              id: pu.user_id,
              email: null,
              user_metadata: {}
            }
          };
        }
        return {
          role: pu.role,
          user_id: pu.user_id,
          user: {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata || {}
          }
        };
      } catch (error) {
        return {
          role: pu.role,
          user_id: pu.user_id,
          user: {
            id: pu.user_id,
            email: null,
            user_metadata: {}
          }
        };
      }
    })
  );

  res.status(200).json(usersWithDetails);
});

const addUserToProject = asyncHandler(async (req, res) => {
  const { id } = req.params; // project id
  const { userId, role = 'member' } = req.body;

  // Check if current user is owner or admin of the project
  const { data: userAccess } = await req.supabase
    .from('project_users')
    .select('role')
    .eq('project_id', id)
    .eq('user_id', req.user.id)
    .single();

  if (!userAccess || !['owner', 'admin'].includes(userAccess.role)) {
    return res.status(403).json({
      success: false,
      error: 'Only project owners and admins can add users'
    });
  }

  const { data, error } = await req.supabase
    .from('project_users')
    .insert({
      project_id: id,
      user_id: userId,
      role: role
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  res.status(201).json(data);
});

const removeUserFromProject = asyncHandler(async (req, res) => {
  const { id, userId } = req.params; // project id and user id

  // Check if current user is owner or admin of the project
  const { data: userAccess } = await req.supabase
    .from('project_users')
    .select('role')
    .eq('project_id', id)
    .eq('user_id', req.user.id)
    .single();

  if (!userAccess || !['owner', 'admin'].includes(userAccess.role)) {
    return res.status(403).json({
      success: false,
      error: 'Only project owners and admins can remove users'
    });
  }

  // Don't allow removing the owner
  const { data: targetUser } = await req.supabase
    .from('project_users')
    .select('role')
    .eq('project_id', id)
    .eq('user_id', userId)
    .single();

  if (targetUser?.role === 'owner') {
    return res.status(400).json({
      success: false,
      error: 'Cannot remove project owner'
    });
  }

  const { error } = await req.supabase
    .from('project_users')
    .delete()
    .eq('project_id', id)
    .eq('user_id', userId);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  res.status(200).json({ message: 'User removed from project' });
});

// Clone a master project
const cloneProject = asyncHandler(async (req, res) => {
  const { id } = req.params; // master project id
  const { title, description } = req.body; // optional new title/description for clone

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify the source project exists and is a master project
  const { data: masterProject, error: masterError } = await req.supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('master', true)
    .single();

  if (masterError || !masterProject) {
    return res.status(404).json({
      success: false,
      error: 'Master project not found'
    });
  }

  // Verify user has access to the master project
  const { data: userAccess } = await req.supabase
    .from('project_users')
    .select('role')
    .eq('project_id', id)
    .eq('user_id', req.user.id)
    .single();

  if (!userAccess) {
    // Check if user is the owner
    if (masterProject.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to master project'
      });
    }
  }

  // Create the cloned project
  const clonedTitle = title || `${masterProject.title} (Clone)`;
  const clonedDescription = description !== undefined ? description : masterProject.description;

  const { data: clonedProject, error: cloneError } = await req.supabase
    .from('projects')
    .insert({
      title: clonedTitle.trim(),
      description: clonedDescription || '',
      latitude: masterProject.latitude,
      longitude: masterProject.longitude,
      owner_id: req.user.id,
      master: false,
      parent_project_id: id // Track the parent master project
    })
    .select()
    .single();

  if (cloneError) {
    console.error('[CLONE] Error cloning project:', cloneError);
    return res.status(400).json({
      success: false,
      error: cloneError.message
    });
  }


  // Add owner to project_users
  const { error: userError } = await req.supabase
    .from('project_users')
    .insert({
      project_id: clonedProject.id,
      user_id: req.user.id,
      role: 'owner'
    });

  if (userError) {
    console.error('[CLONE] Error adding user to project:', userError);
  }

  // Clone all related data
  let assetTypeMap = {}; // Map old asset type IDs to new IDs
  let assetMap = {}; // Map old asset IDs to new asset IDs
  
    try {
    
    // First, clone asset types (needed for asset feature_type_id remapping)
    const { data: assetTypes, error: assetTypesError } = await req.supabase
      .from('asset_types')
      .select('*')
      .eq('project_id', id);

    if (assetTypesError) {
      console.error('[CLONE] Error fetching asset types:', assetTypesError);
    }

    if (assetTypes && assetTypes.length > 0) {
      for (const assetType of assetTypes) {
        const oldId = assetType.id;
        const { data: clonedType, error: cloneTypeError } = await req.supabase
          .from('asset_types')
          .insert({
            title: assetType.title,
            description: assetType.description,
            has_coordinates: assetType.has_coordinates,
            project_id: clonedProject.id
          })
          .select()
          .single();
        
        if (cloneTypeError) {
          console.error(`[CLONE] Error cloning asset type ${oldId}:`, cloneTypeError);
        } else if (clonedType) {
          assetTypeMap[oldId] = clonedType.id;
        } else {
          console.error(`[CLONE] Failed to clone asset type ${oldId} - no data returned`);
        }
      }

      // Clone attributes (query by project_id directly)
      const { data: attributes, error: attributesError } = await req.supabase
        .from('attributes')
        .select('*')
        .eq('project_id', id);

      if (attributesError) {
        console.error('[CLONE] Error fetching attributes:', attributesError);
      }

      if (attributes && attributes.length > 0) {
        const clonedAttributes = attributes.map(attr => ({
          title: attr.title,
          data_type: attr.data_type,
          asset_type_id: attr.asset_type_id ? assetTypeMap[attr.asset_type_id] || null : null, // Remap to cloned asset type ID
          project_id: clonedProject.id
        }));
        const { error: attrError } = await req.supabase.from('attributes').insert(clonedAttributes);
        if (attrError) {
          console.error('[CLONE] Error cloning attributes:', attrError);
        }
      }
    }

    // Clone assets (hierarchy) and create ID mapping
    const { data: assets, error: assetsError } = await req.supabase
      .from('assets')
      .select('*')
      .eq('project_id', id);

    if (assetsError) {
      console.error('[CLONE] Error fetching assets:', assetsError);
    }

    if (assets && assets.length > 0) {
      // Clone assets one by one to get the new IDs
      for (const asset of assets) {
        const { data: clonedAsset, error: cloneAssetError } = await req.supabase
          .from('assets')
          .insert({
            title: asset.title,
            asset_type_id: asset.asset_type_id ? assetTypeMap[asset.asset_type_id] || null : null, // Remap to cloned asset type ID
            parent_id: null, // Will be updated after all assets are cloned
            beginning_latitude: asset.beginning_latitude,
            end_latitude: asset.end_latitude,
            beginning_longitude: asset.beginning_longitude,
            end_longitude: asset.end_longitude,
            order_index: asset.order_index,
            project_id: clonedProject.id
          })
          .select()
          .single();
        
        if (cloneAssetError) {
          console.error(`[CLONE] Error cloning asset ${asset.id}:`, cloneAssetError);
        } else if (clonedAsset) {
          assetMap[asset.id] = clonedAsset.id;
        } else {
          console.error(`[CLONE] Failed to clone asset ${asset.id} - no data returned`);
        }
      }

      // Update parent_id references for cloned assets
      if (Object.keys(assetMap).length > 0) {
        for (const asset of assets) {
          if (asset.parent_id && assetMap[asset.id] && assetMap[asset.parent_id]) {
            await req.supabase
              .from('assets')
              .update({ parent_id: assetMap[asset.parent_id] })
              .eq('id', assetMap[asset.id]);
          }
        }
      }
    }

    // Clone GIS layers
    const { data: gisLayers, error: gisLayersError } = await req.supabase
      .from('gis_layers')
      .select('*')
      .eq('project_id', id);

    if (gisLayersError) {
      console.error('[CLONE] Error fetching GIS layers:', gisLayersError);
    }

    const layerMap = {}; // Map old layer IDs to new IDs
    if (gisLayers && gisLayers.length > 0) {
      for (const layer of gisLayers) {
        const oldLayerId = layer.id;
        const { data: clonedLayer, error: cloneLayerError } = await req.supabase
          .from('gis_layers')
          .insert({
            name: layer.name,
            description: layer.description,
            layer_type: layer.layer_type,
            geometry_type: layer.geometry_type,
            attributes: layer.attributes,
            style: layer.style,
            visible: layer.visible !== undefined ? layer.visible : true,
            created_by: req.user.id, // Set to current user
            project_id: clonedProject.id
          })
          .select()
          .single();
        
        if (cloneLayerError) {
          console.error(`[CLONE] Error cloning GIS layer ${oldLayerId}:`, cloneLayerError);
          console.error(`[CLONE] Layer error details:`, JSON.stringify(cloneLayerError, null, 2));
        } else if (clonedLayer) {
          layerMap[oldLayerId] = clonedLayer.id;
        } else {
          console.error(`[CLONE] Failed to clone GIS layer ${oldLayerId} - no data returned`);
        }
      }
    }

    // Clone GIS features - query by layer_id to ensure we get all features
    // Use RPC function to get features as GeoJSON since direct query doesn't return geometry_geojson
    const sourceLayerIds = Object.keys(layerMap);
    let gisFeatures = [];
    
    if (sourceLayerIds.length > 0) {
      // Fetch features for each layer using RPC function to get GeoJSON
      for (const layerId of sourceLayerIds) {
        try {
          const { data: layerFeatures, error: layerError } = await req.supabase
            .rpc('get_gis_features_geojson', { p_layer_id: layerId });
          
          if (layerError) {
            console.warn(`[CLONE] Error fetching features for layer ${layerId}:`, layerError);
          } else if (layerFeatures && layerFeatures.length > 0) {
            gisFeatures.push(...layerFeatures);
          }
        } catch (error) {
          console.error(`[CLONE] Exception fetching features for layer ${layerId}:`, error);
        }
      }
    }
    
    // Also try querying by project_id as a fallback
    if (gisFeatures.length === 0) {
      const { data: featuresByProject, error: gisFeaturesError2 } = await req.supabase
        .from('gis_features')
        .select('id, name, layer_id, asset_id, properties, project_id')
        .eq('project_id', id);

      if (gisFeaturesError2) {
        console.error('[CLONE] Error fetching GIS features by project_id:', gisFeaturesError2);
      } else {
        gisFeatures = (featuresByProject || []).map(f => ({ ...f, geometry_geojson: null }));
      }
    }

    if (gisFeatures && gisFeatures.length > 0) {
      const clonedFeatures = gisFeatures.map(feature => {
        const newLayerId = feature.layer_id ? layerMap[feature.layer_id] || null : null;
        const newAssetId = feature.asset_id ? assetMap[feature.asset_id] || null : null;
        
        if (!newLayerId) {
          console.warn(`[CLONE] Feature ${feature.id} has layer_id ${feature.layer_id} but no mapping found in layerMap`);
        }
        
        return {
          name: feature.name,
          geometry_geojson: feature.geometry_geojson,
          properties: feature.properties,
          layer_id: newLayerId,
          asset_id: newAssetId,
          project_id: clonedProject.id
        };
      }).filter(f => f.layer_id !== null); // Only clone features that have a valid cloned layer
      
      if (clonedFeatures.length > 0) {
        // Insert features one by one using RPC function since direct insert doesn't work with PostGIS geometry
        let successCount = 0;
        let errorCount = 0;
        
        for (const feature of clonedFeatures) {
          try {
            // Get geometry as WKT - check multiple possible sources
            let geometryWKT = feature.geometry_wkt || feature.geometry || null;
            
            // If we have WKT directly from SQL query, use it
            if (geometryWKT && typeof geometryWKT === 'string') {
              // Already WKT, use as-is
            } 
            // Otherwise try to get from GeoJSON (if RPC function was used)
            else {
              let geom = feature.geometry_geojson || feature.geom || 
                        (feature.geojson && feature.geojson.geometry) || 
                        (feature.feature && feature.feature.geometry);
              
              // If geometry is a string (GeoJSON string), parse it
              if (typeof geom === 'string') {
                try {
                  const parsed = JSON.parse(geom);
                  if (parsed && parsed.type) {
                    geom = parsed;
                  }
                } catch (e) {
                  // Not JSON, skip
                }
              }
              
              // Handle GeoJSON object
              if (geom && typeof geom === 'object') {
                // Check if it's a full GeoJSON Feature or FeatureCollection
                if (geom.type === 'Feature' && geom.geometry) {
                  geom = geom.geometry;
                } else if (geom.type === 'FeatureCollection' && geom.features && geom.features.length > 0) {
                  geom = geom.features[0].geometry;
                }
                
                // Convert GeoJSON to WKT
                if (geom.type === 'Point' && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
                  const [lng, lat] = geom.coordinates;
                  geometryWKT = `POINT(${lng} ${lat})`;
                } else if (geom.type === 'LineString' && Array.isArray(geom.coordinates) && geom.coordinates.length > 0) {
                  const points = geom.coordinates.map(coord => {
                    const [lng, lat] = Array.isArray(coord) ? coord : [coord.lng || coord.x, coord.lat || coord.y];
                    return `${lng} ${lat}`;
                  }).join(', ');
                  geometryWKT = `LINESTRING(${points})`;
                } else if (geom.type === 'Polygon' && Array.isArray(geom.coordinates) && geom.coordinates.length > 0) {
                  const rings = geom.coordinates.map(ring => 
                    ring.map(coord => {
                      const [lng, lat] = Array.isArray(coord) ? coord : [coord.lng || coord.x, coord.lat || coord.y];
                      return `${lng} ${lat}`;
                    }).join(', ')
                  ).join('), (');
                  geometryWKT = `POLYGON((${rings}))`;
                }
              }
            }
            
            if (!geometryWKT) {
              console.warn(`[CLONE] Skipping feature ${feature.name || 'unnamed'} - no valid geometry`);
              console.warn(`[CLONE] Feature keys:`, Object.keys(feature));
              console.warn(`[CLONE] Geometry fields:`, {
                geometry_wkt: feature.geometry_wkt,
                geometry: feature.geometry,
                geometry_geojson: feature.geometry_geojson,
                geom: feature.geom
              });
              errorCount++;
              continue;
            }
            
            // Use RPC function to insert feature (same as gisController)
            const { data: insertedFeature, error: featureError } = await req.supabase
              .rpc('insert_gis_feature', {
                p_layer_id: feature.layer_id,
                p_name: feature.name || null,
                p_geometry_wkt: geometryWKT,
                p_properties: feature.properties || {}
              });
            
            if (featureError) {
              console.error(`[CLONE] Error cloning feature ${feature.name || 'unnamed'}:`, featureError);
              errorCount++;
            } else if (insertedFeature) {
              // Get feature ID from RPC response
              const featureId = insertedFeature.id || (Array.isArray(insertedFeature) && insertedFeature[0]?.id);
              
              if (!featureId) {
                console.warn(`[CLONE] No ID found in insertedFeature for ${feature.name || 'unnamed'}:`, insertedFeature);
                errorCount++;
                continue;
              }
              
              // Build update data - always include project_id
              const updateData = {
                project_id: feature.project_id
              };
              
              if (feature.asset_id) {
                updateData.asset_id = feature.asset_id;
              }
              
              // Use supabaseAdmin for the update to ensure permissions
              const { error: updateError } = await supabaseAdmin
                .from('gis_features')
                .update(updateData)
                .eq('id', featureId);
              
              if (updateError) {
                console.error(`[CLONE] Error updating feature ${feature.name || 'unnamed'} (id: ${featureId}):`, updateError);
                errorCount++;
                continue;
              }
              successCount++;
            } else {
              console.warn(`[CLONE] No insertedFeature returned for ${feature.name || 'unnamed'}`);
              errorCount++;
            }
          } catch (error) {
            console.error(`[CLONE] Exception cloning feature:`, error);
            errorCount++;
          }
        }
        
        if (errorCount > 0) {
          console.warn(`[CLONE] Cloned ${successCount} GIS features with ${errorCount} errors`);
        }
      } else if (gisFeatures.length > 0) {
        console.warn(`[CLONE] No GIS features could be mapped to cloned layers (${gisFeatures.length} features found but none matched)`);
      }
    }

    // Clone leaflet shapes
    const { data: leafletShapes } = await req.supabase
      .from('leaflet_shapes')
      .select('*')
      .eq('project_id', id);

    if (leafletShapes && leafletShapes.length > 0) {
      const clonedShapes = leafletShapes.map(shape => ({
        shape_type: shape.shape_type,
        geometry: shape.geometry,
        properties: shape.properties,
        project_id: clonedProject.id
      }));
      const { error: shapesError } = await req.supabase.from('leaflet_shapes').insert(clonedShapes);
      if (shapesError) {
        console.error('[CLONE] Error cloning leaflet shapes:', shapesError);
      }
    }

    // Clone project files
    const { data: projectFiles, error: projectFilesError } = await req.supabase
      .from('project_files')
      .select('*')
      .eq('project_id', id);

    if (projectFilesError) {
      console.error('[CLONE] Error fetching project files:', projectFilesError);
    }

    if (projectFiles && projectFiles.length > 0) {
      
      const clonedFileRecords = [];
      
      for (const file of projectFiles) {
        if (!file.storage_path || !file.file_name) {
          console.warn(`[CLONE] Skipping file ${file.id} - missing storage_path or file_name`);
          continue;
        }
        
        try {
          // Download file from source project's storage
          const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from('project-files')
            .download(file.storage_path);
          
          if (downloadError) {
            console.error(`[CLONE] Error downloading file ${file.storage_path}:`, downloadError);
            continue;
          }
          
          // Create new storage path for cloned project
          const timestamp = Date.now();
          const sanitizedFileName = file.file_name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const newStoragePath = `${clonedProject.id}/files/${timestamp}_${sanitizedFileName}`;
          
          // Convert blob to buffer for upload
          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Upload file to cloned project's storage
          const { error: uploadError } = await supabaseAdmin.storage
            .from('project-files')
            .upload(newStoragePath, buffer, {
              contentType: file.mime_type || 'application/octet-stream',
              upsert: false
            });
          
          if (uploadError) {
            console.error(`[CLONE] Error uploading file to ${newStoragePath}:`, uploadError);
            continue;
          }
          
          // Create database record for cloned file
          clonedFileRecords.push({
            file_name: file.file_name,
            storage_path: newStoragePath,
            mime_type: file.mime_type || null,
            file_size: file.file_size || 0,
            uploaded_by: req.user.id,
            project_id: clonedProject.id
          });
          
        } catch (error) {
          console.error(`[CLONE] Error cloning file ${file.id}:`, error);
        }
      }
      
      if (clonedFileRecords.length > 0) {
        const { data: insertedFiles, error: filesError } = await req.supabase
          .from('project_files')
          .insert(clonedFileRecords)
          .select();
          
        if (filesError) {
          console.error('[CLONE] Error inserting project file records:', filesError);
        }
      }
    }

    // Clone attribute values
    const { data: attributeValues, error: attributeValuesError } = await req.supabase
      .from('attribute_values')
      .select('*')
      .eq('project_id', id);

    if (attributeValuesError) {
      console.error('[CLONE] Error fetching attribute values:', attributeValuesError);
    }

    if (attributeValues && attributeValues.length > 0) {
      const clonedAttributeValues = attributeValues.map(attrValue => ({
        asset_id: attrValue.asset_id ? assetMap[attrValue.asset_id] || null : null, // Map to cloned asset ID, or null if mapping not found
        response_data: attrValue.response_data,
        response_metadata: attrValue.response_metadata,
        submitted_by: req.user.id, // Set to current user
        project_id: clonedProject.id,
        created_at: undefined,
        updated_at: undefined
      }));
      const { error: attributeValuesInsertError } = await req.supabase.from('attribute_values').insert(clonedAttributeValues);
      if (attributeValuesInsertError) {
        console.error('[CLONE] Error cloning attribute values:', attributeValuesInsertError);
      }
    }

    // Note: maps and photos tables exist but are not used in the application
    // - Photos are stored in Supabase Storage with metadata in attribute_values.response_metadata
    // - Maps functionality appears to be unused/legacy
    // These tables are intentionally not cloned

  } catch (error) {
    console.error('[CLONE] ========================================');
    console.error('[CLONE] ERROR cloning project data:', error);
    console.error('[CLONE] Error message:', error.message);
    console.error('[CLONE] Error stack:', error.stack);
    console.error('[CLONE] ========================================');
    // Continue even if some data fails to clone, but log it
  }

  res.status(201).json(clonedProject);
});

// Get all master projects user has access to
const getMasterProjects = asyncHandler(async (req, res) => {
  try {
    // Get master projects through project_users
    const { data, error } = await req.supabase
      .from('project_users')
      .select(`
        role,
        project:projects(*)
      `)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Filter to only master projects
    const masterProjects = data
      ?.map(item => item.project)
      .filter(project => project && project.master === true) || [];

    res.status(200).json(masterProjects);
  } catch (err) {
    console.error('Error in getMasterProjects:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Set project as master (owner only)
const setProjectAsMaster = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { master } = req.body; // boolean

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify user is the owner
  const { data: project, error: projectError } = await req.supabase
    .from('projects')
    .select('owner_id, master')
    .eq('id', id)
    .single();

  if (projectError || !project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found'
    });
  }

  if (project.owner_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'Only project owner can set master status'
    });
  }

  // Update master status
  const { data: updatedProject, error: updateError } = await req.supabase
    .from('projects')
    .update({ master: master === true })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return res.status(400).json({
      success: false,
      error: updateError.message
    });
  }

  res.status(200).json(updatedProject);
});

// Get survey statistics for a project
const getSurveyStatistics = asyncHandler(async (req, res) => {
  const { id } = req.params; // project id

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify project access
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id')
    .eq('project_id', id)
    .eq('user_id', req.user.id)
    .single();

  if (projectUserError || !projectUser) {
    // Check if owner
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this project'
      });
    }
  }

  try {
    // Get all asset types for this project
    const { data: assetTypes, error: assetTypesError } = await req.supabase
      .from('asset_types')
      .select('id')
      .eq('project_id', id);

    if (assetTypesError) {
      console.error('Error fetching asset types:', assetTypesError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch asset types'
      });
    }

    let surveyQuestionsTotal = 0;

    // If there are asset types, count attributes for each
    if (assetTypes && assetTypes.length > 0) {
      const assetTypeIds = assetTypes.map(at => at.id);
      
      // Count attributes for all asset types in this project
      const { count: attributesCount, error: attributesError } = await req.supabase
        .from('attributes')
        .select('*', { count: 'exact', head: true })
        .in('asset_type_id', assetTypeIds);

      if (attributesError) {
        console.error('Error counting attributes:', attributesError);
      } else {
        surveyQuestionsTotal = attributesCount || 0;
      }
    }

    // Count total attribute values (survey answers) for this project
    const { count: surveyAnswersTotal, error: answersError } = await req.supabase
      .from('attribute_values')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id);

    if (answersError) {
      console.error('Error counting attribute values:', answersError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch survey answers count'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        surveyQuestionsTotal: surveyQuestionsTotal || 0,
        surveyAnswersTotal: surveyAnswersTotal || 0
      }
    });

  } catch (error) {
    console.error('Error in getSurveyStatistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching survey statistics'
    });
  }
});

// Upload map snapshot for a project
const uploadMapSnapshot = [
  uploadSnapshot.single('snapshot'),
  asyncHandler(async (req, res) => {
    const { id } = req.params; // project id
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No snapshot file provided'
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    // Verify project access
    const { data: projectUser, error: projectUserError } = await req.supabase
      .from('project_users')
      .select('id')
      .eq('project_id', id)
      .eq('user_id', req.user.id)
      .single();

    if (projectUserError || !projectUser) {
      // Check if owner
      const { data: project, error: projectError } = await req.supabase
        .from('projects')
        .select('id')
        .eq('id', id)
        .eq('owner_id', req.user.id)
        .single();

      if (projectError || !project) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this project'
        });
      }
    }

    try {
      // Delete old snapshot if it exists
      const { data: existingProject } = await req.supabase
        .from('projects')
        .select('map_snapshot_url')
        .eq('id', id)
        .single();

      if (existingProject?.map_snapshot_url) {
        // Extract path from URL (format: /storage/v1/object/public/project-files/...)
        const urlPath = existingProject.map_snapshot_url.split('/project-files/')[1];
        if (urlPath) {
          const oldPath = `${id}/snapshots/${urlPath.split('/').slice(-1)[0]}`;
          try {
            await supabaseAdmin.storage.from('project-files').remove([oldPath]);
          } catch (err) {
            // Ignore errors when deleting old file
            console.warn('Error deleting old snapshot:', err);
          }
        }
      }

      // Create unique storage path: projectId/snapshots/timestamp_snapshot.png
      const timestamp = Date.now();
      const fileExt = req.file.originalname.split('.').pop() || 'png';
      const storagePath = `${id}/snapshots/${timestamp}_snapshot.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('project-files')
        .upload(storagePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload snapshot to storage'
        });
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('project-files')
        .getPublicUrl(storagePath);

      // Update project with snapshot URL
      const { data: updatedProject, error: updateError } = await req.supabase
        .from('projects')
        .update({ map_snapshot_url: urlData.publicUrl })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        // Cleanup: delete from storage if DB update fails
        await supabaseAdmin.storage.from('project-files').remove([storagePath]);
        return res.status(500).json({
          success: false,
          error: 'Failed to update project with snapshot URL'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          snapshotUrl: urlData.publicUrl,
          project: updatedProject
        }
      });

    } catch (error) {
      console.error('Error in uploadMapSnapshot:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while uploading snapshot'
      });
    }
  })
];

export default {
  getProjects,
  getSharedProjects,
  getProject,
  createProject,
  deleteProject,
  updateProject,
  getProjectUsers,
  addUserToProject,
  removeUserFromProject,
  cloneProject,
  getMasterProjects,
  setProjectAsMaster,
  uploadMapSnapshot,
  getSurveyStatistics
};