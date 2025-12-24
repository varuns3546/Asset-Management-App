// Service for merging pull requests and calculating diffs

/**
 * Calculate diff between source and target projects
 * Returns changes grouped by entity type
 */
export const calculateDiff = async (supabase, sourceProjectId, targetProjectId) => {
  const changes = {
    project: [],
    hierarchy: [],
    assetTypes: [],
    attributes: [],
    gisLayers: [],
    gisFeatures: [],
    leafletShapes: []
  };

  try {
    // Compare project metadata
    const { data: sourceProject } = await supabase
      .from('projects')
      .select('*')
      .eq('id', sourceProjectId)
      .single();

    const { data: targetProject } = await supabase
      .from('projects')
      .select('*')
      .eq('id', targetProjectId)
      .single();

    if (sourceProject && targetProject) {
      // Check for metadata changes
      const metadataChanges = {};
      if (sourceProject.title !== targetProject.title) {
        metadataChanges.title = { old: targetProject.title, new: sourceProject.title };
      }
      if (sourceProject.description !== targetProject.description) {
        metadataChanges.description = { old: targetProject.description, new: sourceProject.description };
      }
      if (sourceProject.latitude !== targetProject.latitude || sourceProject.longitude !== targetProject.longitude) {
        metadataChanges.coordinates = {
          old: { latitude: targetProject.latitude, longitude: targetProject.longitude },
          new: { latitude: sourceProject.latitude, longitude: sourceProject.longitude }
        };
      }

      if (Object.keys(metadataChanges).length > 0) {
        changes.project.push({
          changeType: 'modified',
          entityId: sourceProjectId,
          oldData: targetProject,
          newData: sourceProject
        });
      }
    }

    // Compare assets (hierarchy)
    const { data: sourceAssets } = await supabase
      .from('assets')
      .select('*')
      .eq('project_id', sourceProjectId)
      .order('created_at');

    const { data: targetAssets } = await supabase
      .from('assets')
      .select('*')
      .eq('project_id', targetProjectId)
      .order('created_at');

    const sourceAssetMap = new Map(sourceAssets?.map(a => [a.id, a]) || []);
    const targetAssetMap = new Map(targetAssets?.map(a => [a.id, a]) || []);

    // Find added assets (in source but not in target by matching title/parent)
    sourceAssets?.forEach(sourceAsset => {
      const matching = targetAssets?.find(ta => 
        ta.title === sourceAsset.title && 
        ta.parent_id === sourceAsset.parent_id
      );
      if (!matching) {
        changes.hierarchy.push({
          changeType: 'added',
          entityId: sourceAsset.id,
          oldData: null,
          newData: sourceAsset
        });
      }
    });

    // Find modified assets
    sourceAssets?.forEach(sourceAsset => {
      const matching = targetAssets?.find(ta => 
        ta.title === sourceAsset.title && 
        ta.parent_id === sourceAsset.parent_id
      );
      if (matching) {
        // Compare fields
        const hasChanges = 
          sourceAsset.description !== matching.description ||
          sourceAsset.beginning_latitude !== matching.beginning_latitude ||
          sourceAsset.beginning_longitude !== matching.beginning_longitude ||
          sourceAsset.end_latitude !== matching.end_latitude ||
          sourceAsset.end_longitude !== matching.end_longitude ||
          sourceAsset.item_type_id !== matching.item_type_id;

        if (hasChanges) {
          changes.hierarchy.push({
            changeType: 'modified',
            entityId: sourceAsset.id,
            oldData: matching,
            newData: sourceAsset
          });
        }
      }
    });

    // Find deleted assets (in target but not in source)
    targetAssets?.forEach(targetAsset => {
      const matching = sourceAssets?.find(sa => 
        sa.title === targetAsset.title && 
        sa.parent_id === targetAsset.parent_id
      );
      if (!matching) {
        changes.hierarchy.push({
          changeType: 'deleted',
          entityId: targetAsset.id,
          oldData: targetAsset,
          newData: null
        });
      }
    });

    // Compare asset types
    const { data: sourceAssetTypes } = await supabase
      .from('asset_types')
      .select('*')
      .eq('project_id', sourceProjectId);

    const { data: targetAssetTypes } = await supabase
      .from('asset_types')
      .select('*')
      .eq('project_id', targetProjectId);

    sourceAssetTypes?.forEach(sourceType => {
      const matching = targetAssetTypes?.find(tt => tt.title === sourceType.title);
      if (!matching) {
        changes.assetTypes.push({
          changeType: 'added',
          entityId: sourceType.id,
          oldData: null,
          newData: sourceType
        });
      } else if (
        sourceType.description !== matching.description ||
        sourceType.has_coordinates !== matching.has_coordinates
      ) {
        changes.assetTypes.push({
          changeType: 'modified',
          entityId: sourceType.id,
          oldData: matching,
          newData: sourceType
        });
      }
    });

    targetAssetTypes?.forEach(targetType => {
      const matching = sourceAssetTypes?.find(st => st.title === targetType.title);
      if (!matching) {
        changes.assetTypes.push({
          changeType: 'deleted',
          entityId: targetType.id,
          oldData: targetType,
          newData: null
        });
      }
    });

    // Compare GIS layers
    const { data: sourceLayers } = await supabase
      .from('gis_layers')
      .select('*')
      .eq('project_id', sourceProjectId);

    const { data: targetLayers } = await supabase
      .from('gis_layers')
      .select('*')
      .eq('project_id', targetProjectId);

    sourceLayers?.forEach(sourceLayer => {
      const matching = targetLayers?.find(tl => tl.name === sourceLayer.name);
      if (!matching) {
        changes.gisLayers.push({
          changeType: 'added',
          entityId: sourceLayer.id,
          oldData: null,
          newData: sourceLayer
        });
      } else if (
        JSON.stringify(sourceLayer.style) !== JSON.stringify(matching.style) ||
        sourceLayer.description !== matching.description
      ) {
        changes.gisLayers.push({
          changeType: 'modified',
          entityId: sourceLayer.id,
          oldData: matching,
          newData: sourceLayer
        });
      }
    });

    targetLayers?.forEach(targetLayer => {
      const matching = sourceLayers?.find(sl => sl.name === targetLayer.name);
      if (!matching) {
        changes.gisLayers.push({
          changeType: 'deleted',
          entityId: targetLayer.id,
          oldData: targetLayer,
          newData: null
        });
      }
    });

  } catch (error) {
    console.error('Error calculating diff:', error);
    throw error;
  }

  return changes;
};

/**
 * Detect conflicts between source and target
 * A conflict occurs when both have modified the same entity differently
 */
export const detectConflicts = async (supabase, sourceProjectId, targetProjectId) => {
  const conflicts = [];

  try {
    // Get assets from both projects
    const { data: sourceAssets } = await supabase
      .from('assets')
      .select('*')
      .eq('project_id', sourceProjectId);

    const { data: targetAssets } = await supabase
      .from('assets')
      .select('*')
      .eq('project_id', targetProjectId);

    // Check for conflicts in assets (same title/parent but different changes)
    sourceAssets?.forEach(sourceAsset => {
      const matching = targetAssets?.find(ta => 
        ta.title === sourceAsset.title && 
        ta.parent_id === sourceAsset.parent_id
      );
      
      if (matching) {
        // Both have this asset - check if both were modified
        const sourceModified = sourceAsset.updated_at && 
          new Date(sourceAsset.updated_at) > new Date(sourceAsset.created_at);
        const targetModified = matching.updated_at && 
          new Date(matching.updated_at) > new Date(matching.created_at);

        if (sourceModified && targetModified) {
          // Check if changes conflict
          const hasConflict = 
            sourceAsset.description !== matching.description ||
            sourceAsset.beginning_latitude !== matching.beginning_latitude ||
            sourceAsset.beginning_longitude !== matching.beginning_longitude;

          if (hasConflict) {
            conflicts.push({
              entityType: 'hierarchy',
              entityId: sourceAsset.id,
              sourceData: sourceAsset,
              targetData: matching,
              conflictType: 'both_modified'
            });
          }
        }
      }
    });

    // Similar conflict detection for asset types, layers, etc.
    // (Simplified for now - can be expanded)

  } catch (error) {
    console.error('Error detecting conflicts:', error);
    throw error;
  }

  return conflicts;
};

/**
 * Merge project metadata
 */
export const mergeProjectData = async (supabase, sourceProjectId, targetProjectId, resolution = {}) => {
  const { data: sourceProject } = await supabase
    .from('projects')
    .select('*')
    .eq('id', sourceProjectId)
    .single();

  if (!sourceProject) {
    throw new Error('Source project not found');
  }

  const updateData = {};

  // Apply resolutions or use source values
  if (resolution.title !== undefined) {
    updateData.title = resolution.title;
  } else if (sourceProject.title) {
    updateData.title = sourceProject.title;
  }

  if (resolution.description !== undefined) {
    updateData.description = resolution.description;
  } else if (sourceProject.description) {
    updateData.description = sourceProject.description;
  }

  if (resolution.coordinates !== undefined) {
    updateData.latitude = resolution.coordinates.latitude;
    updateData.longitude = resolution.coordinates.longitude;
  } else if (sourceProject.latitude !== null || sourceProject.longitude !== null) {
    updateData.latitude = sourceProject.latitude;
    updateData.longitude = sourceProject.longitude;
  }

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', targetProjectId);

    if (error) {
      throw error;
    }
  }

  return updateData;
};

/**
 * Merge hierarchy (assets)
 */
export const mergeHierarchy = async (supabase, sourceProjectId, targetProjectId, resolutions = []) => {
  const { data: sourceAssets } = await supabase
    .from('assets')
    .select('*')
    .eq('project_id', sourceProjectId);

  const { data: targetAssets } = await supabase
    .from('assets')
    .select('*')
    .eq('project_id', targetProjectId);

  const resolutionMap = new Map(resolutions.map(r => [r.entityId, r]));

  for (const sourceAsset of sourceAssets || []) {
    const resolution = resolutionMap.get(sourceAsset.id);
    
    // Skip if resolution says to keep target
    if (resolution?.action === 'keep_target') {
      continue;
    }

    // Find matching asset in target by title and parent
    const matching = targetAssets?.find(ta => 
      ta.title === sourceAsset.title && 
      ta.parent_id === sourceAsset.parent_id
    );

    if (!matching) {
      // Add new asset
      const { error } = await supabase
        .from('assets')
        .insert({
          title: sourceAsset.title,
          description: sourceAsset.description,
          item_type_id: sourceAsset.item_type_id,
          parent_id: sourceAsset.parent_id,
          beginning_latitude: sourceAsset.beginning_latitude,
          beginning_longitude: sourceAsset.beginning_longitude,
          end_latitude: sourceAsset.end_latitude,
          end_longitude: sourceAsset.end_longitude,
          project_id: targetProjectId
        });

      if (error) {
        console.error('Error adding asset:', error);
      }
    } else {
      // Update existing asset
      const updateData = {
        description: resolution?.data?.description ?? sourceAsset.description,
        beginning_latitude: resolution?.data?.beginning_latitude ?? sourceAsset.beginning_latitude,
        beginning_longitude: resolution?.data?.beginning_longitude ?? sourceAsset.beginning_longitude,
        end_latitude: resolution?.data?.end_latitude ?? sourceAsset.end_latitude,
        end_longitude: resolution?.data?.end_longitude ?? sourceAsset.end_longitude,
        item_type_id: resolution?.data?.item_type_id ?? sourceAsset.item_type_id
      };

      const { error } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', matching.id);

      if (error) {
        console.error('Error updating asset:', error);
      }
    }
  }
};

/**
 * Merge asset types
 */
export const mergeAssetTypes = async (supabase, sourceProjectId, targetProjectId) => {
  const { data: sourceTypes } = await supabase
    .from('asset_types')
    .select('*')
    .eq('project_id', sourceProjectId);

  const { data: targetTypes } = await supabase
    .from('asset_types')
    .select('*')
    .eq('project_id', targetProjectId);

  for (const sourceType of sourceTypes || []) {
    const matching = targetTypes?.find(tt => tt.title === sourceType.title);

    if (!matching) {
      // Add new asset type
      const { data: newType } = await supabase
        .from('asset_types')
        .insert({
          title: sourceType.title,
          description: sourceType.description,
          has_coordinates: sourceType.has_coordinates,
          project_id: targetProjectId
        })
        .select()
        .single();

      // Clone attributes for this asset type
      if (newType) {
        const { data: sourceAttributes } = await supabase
          .from('attributes')
          .select('*')
          .eq('item_type_id', sourceType.id);

        if (sourceAttributes && sourceAttributes.length > 0) {
          const clonedAttributes = sourceAttributes.map(attr => ({
            title: attr.title,
            data_type: attr.data_type,
            item_type_id: newType.id,
            project_id: targetProjectId
          }));
          await supabase.from('attributes').insert(clonedAttributes);
        }
      }
    } else {
      // Update existing asset type
      await supabase
        .from('asset_types')
        .update({
          description: sourceType.description,
          has_coordinates: sourceType.has_coordinates
        })
        .eq('id', matching.id);
    }
  }
};

/**
 * Merge GIS layers
 */
export const mergeGisLayers = async (supabase, sourceProjectId, targetProjectId) => {
  const { data: sourceLayers } = await supabase
    .from('gis_layers')
    .select('*')
    .eq('project_id', sourceProjectId);

  const { data: targetLayers } = await supabase
    .from('gis_layers')
    .select('*')
    .eq('project_id', targetProjectId);

  const layerMap = {}; // Map old layer IDs to new IDs

  for (const sourceLayer of sourceLayers || []) {
    const matching = targetLayers?.find(tl => tl.name === sourceLayer.name);

    if (!matching) {
      // Add new layer
      const { data: newLayer } = await supabase
        .from('gis_layers')
        .insert({
          name: sourceLayer.name,
          description: sourceLayer.description,
          layer_type: sourceLayer.layer_type,
          geometry_type: sourceLayer.geometry_type,
          style: sourceLayer.style,
          project_id: targetProjectId
        })
        .select()
        .single();

      if (newLayer) {
        layerMap[sourceLayer.id] = newLayer.id;
      }
    } else {
      layerMap[sourceLayer.id] = matching.id;
      
      // Update existing layer
      await supabase
        .from('gis_layers')
        .update({
          description: sourceLayer.description,
          style: sourceLayer.style
        })
        .eq('id', matching.id);
    }
  }

  // Merge GIS features
  if (Object.keys(layerMap).length > 0) {
    const { data: sourceFeatures } = await supabase
      .from('gis_features')
      .select('*')
      .in('layer_id', Object.keys(layerMap));

    for (const sourceFeature of sourceFeatures || []) {
      const newLayerId = layerMap[sourceFeature.layer_id];
      
      // Check if feature already exists (by name in same layer)
      const { data: existing } = await supabase
        .from('gis_features')
        .select('id')
        .eq('layer_id', newLayerId)
        .eq('name', sourceFeature.name)
        .single();

      if (!existing) {
        // Add new feature
        await supabase
          .from('gis_features')
          .insert({
            name: sourceFeature.name,
            geometry_geojson: sourceFeature.geometry_geojson,
            properties: sourceFeature.properties,
            layer_id: newLayerId,
            project_id: targetProjectId
          });
      }
    }
  }
};

/**
 * Resolve a single conflict
 */
export const resolveConflict = async (supabase, conflict, resolution) => {
  // This is a placeholder - actual implementation depends on conflict type
  // Resolution should contain: action ('keep_source', 'keep_target', 'merge'), and data if merging
  return { resolved: true };
};

