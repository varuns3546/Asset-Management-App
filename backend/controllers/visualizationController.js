import asyncHandler from 'express-async-handler';
import supabaseClient from '../config/supabaseClient.js';

const { supabaseAdmin } = supabaseClient;

if (!supabaseAdmin) {
  console.error('ERROR: supabaseAdmin is not available. Check SUPABASE_SERVICE_ROLE_KEY in environment variables.');
} else {
  console.log('[visualizationController] supabaseAdmin initialized successfully');
}

// @desc    Get questionnaire response statistics
// @route   GET /api/visualization/:projectId/questionnaire-stats
// @access  Private
const getQuestionnaireStats = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  
  console.log('[getQuestionnaireStats] Starting for projectId:', projectId);

  try {
    if (!supabaseAdmin) {
      console.error('[getQuestionnaireStats] supabaseAdmin is not available');
      throw new Error('supabaseAdmin is not available');
    }

    console.log('[getQuestionnaireStats] Verifying project access');
    // Verify project access
    console.log('[getQuestionnaireStats] Checking project_users table');
    const { data: projectUser, error: projectUserError } = await req.supabase
      .from('project_users')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', req.user.id)
      .single();

    console.log('[getQuestionnaireStats] projectUser result:', { projectUser, error: projectUserError });

    if (!projectUser) {
      console.log('[getQuestionnaireStats] Not in project_users, checking projects table');
      const { data: project, error: projectError } = await req.supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('owner_id', req.user.id)
        .single();

      console.log('[getQuestionnaireStats] project result:', { project, error: projectError });

      if (!project) {
        console.log('[getQuestionnaireStats] Access denied - user not in project_users or owner');
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    console.log('[getQuestionnaireStats] Access verified, fetching assets');

    // Get all assets for the project
    console.log('[getQuestionnaireStats] Querying assets table');
    const { data: assets, error: assetsError } = await supabaseAdmin
      .from('assets')
      .select('id, item_type_id')
      .eq('project_id', projectId);

    console.log('[getQuestionnaireStats] Assets query result:', { 
      assetCount: assets?.length || 0, 
      error: assetsError?.message || null 
    });

    if (assetsError) {
      console.error('[getQuestionnaireStats] Error fetching assets:', assetsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch assets',
        details: assetsError.message
      });
    }

    const totalAssets = assets?.length || 0;
    console.log('[getQuestionnaireStats] Total assets:', totalAssets);

    // Get all questionnaire responses
    console.log('[getQuestionnaireStats] Querying questionnaire_responses table');
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('questionnaire_responses')
      .select('asset_id, attribute_id, response_value, response_metadata, created_at')
      .eq('project_id', projectId);

    console.log('[getQuestionnaireStats] Responses query result:', { 
      responseCount: responses?.length || 0, 
      error: responsesError?.message || responsesError?.code || null 
    });

    if (responsesError && responsesError.code !== '42P01') { // 42P01 = table doesn't exist
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch responses'
      });
    }

    const allResponses = responses || [];
    const uniqueAssetIds = new Set(allResponses.map(r => r.asset_id));
    const assetsWithResponses = uniqueAssetIds.size;
    const completionRate = totalAssets > 0 ? (assetsWithResponses / totalAssets) * 100 : 0;

    // Group responses by asset type
    const responsesByAssetType = {};
    const assetTypeMap = {};

    // Get asset types
    if (assets && assets.length > 0) {
      const assetTypeIds = [...new Set(assets.map(a => a.item_type_id).filter(Boolean))];
      if (assetTypeIds.length > 0) {
        const { data: assetTypes } = await supabaseAdmin
          .from('asset_types')
          .select('id, title')
          .in('id', assetTypeIds);

        if (assetTypes) {
          assetTypes.forEach(type => {
            assetTypeMap[type.id] = type.title;
          });
        }
      }
    }

    // Count responses by asset type
    if (assets && Array.isArray(assets)) {
      assets.forEach(asset => {
        const typeId = asset.item_type_id || 'untyped';
        const typeName = assetTypeMap[asset.item_type_id] || 'Untyped';
        
        if (!responsesByAssetType[typeId]) {
          responsesByAssetType[typeId] = {
            typeId,
            typeName,
            totalAssets: 0,
            assetsWithResponses: 0,
            totalResponses: 0
          };
        }
        
        responsesByAssetType[typeId].totalAssets++;
        if (uniqueAssetIds.has(asset.id)) {
          responsesByAssetType[typeId].assetsWithResponses++;
        }
      });

      // Count responses per asset
      allResponses.forEach(response => {
        const asset = assets.find(a => a.id === response.asset_id);
        if (asset) {
          const typeId = asset.item_type_id || 'untyped';
          if (responsesByAssetType[typeId]) {
            responsesByAssetType[typeId].totalResponses++;
          }
        }
      });
    }

    // Group responses by attribute
    const responsesByAttribute = {};
    const attributeIds = [...new Set(allResponses.map(r => r.attribute_id).filter(Boolean))];
    
    if (attributeIds.length > 0) {
      const { data: attributes } = await supabaseAdmin
        .from('attributes')
        .select('id, title, data_type')
        .in('id', attributeIds);

      if (attributes) {
        attributes.forEach(attr => {
          responsesByAttribute[attr.id] = {
            attributeId: attr.id,
            attributeTitle: attr.title,
            dataType: attr.data_type,
            responseCount: 0,
            values: []
          };
        });
      }
    }

    // Count responses and collect values
    allResponses.forEach(response => {
      if (response.attribute_id && responsesByAttribute[response.attribute_id]) {
        responsesByAttribute[response.attribute_id].responseCount++;
        if (response.response_value) {
          responsesByAttribute[response.attribute_id].values.push(response.response_value);
        }
      }
    });

    // Calculate value distributions for numeric attributes
    const attributeDistributions = {};
    Object.values(responsesByAttribute).forEach(attr => {
      if (attr.dataType === 'number' && attr.values.length > 0) {
        const numericValues = attr.values
          .map(v => parseFloat(v))
          .filter(v => !isNaN(v));
        
        if (numericValues.length > 0) {
          numericValues.sort((a, b) => a - b);
          const min = numericValues[0];
          const max = numericValues[numericValues.length - 1];
          const avg = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
          const median = numericValues[Math.floor(numericValues.length / 2)];

          attributeDistributions[attr.attributeId] = {
            attributeTitle: attr.attributeTitle,
            min,
            max,
            avg: parseFloat(avg.toFixed(2)),
            median: parseFloat(median.toFixed(2)),
            count: numericValues.length
          };
        }
      }
    });

    // Response completion timeline (by created_at)
    const timelineData = {};
    allResponses.forEach(response => {
      if (response.created_at) {
        const date = new Date(response.created_at).toISOString().split('T')[0];
        timelineData[date] = (timelineData[date] || 0) + 1;
      }
    });

    const timeline = Object.entries(timelineData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAssets,
          assetsWithResponses,
          completionRate: parseFloat(completionRate.toFixed(2)),
          totalResponses: allResponses.length
        },
        byAssetType: Object.values(responsesByAssetType),
        byAttribute: Object.values(responsesByAttribute).map(attr => ({
          attributeId: attr.attributeId,
          attributeTitle: attr.attributeTitle,
          dataType: attr.dataType,
          responseCount: attr.responseCount
        })),
        numericDistributions: attributeDistributions,
        timeline
      }
    });

  } catch (error) {
    console.error('[getQuestionnaireStats] Error caught:', error);
    console.error('[getQuestionnaireStats] Error stack:', error.stack);
    console.error('[getQuestionnaireStats] Error message:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get questionnaire statistics',
      details: error.message
    });
  }
});

// @desc    Get asset statistics
// @route   GET /api/visualization/:projectId/asset-stats
// @access  Private
const getAssetStats = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  
  console.log('[getAssetStats] Starting for projectId:', projectId);

  try {
    if (!supabaseAdmin) {
      console.error('[getAssetStats] supabaseAdmin is not available');
      throw new Error('supabaseAdmin is not available');
    }

    console.log('[getAssetStats] Verifying project access');
    // Verify project access
    console.log('[getAssetStats] Checking project_users table');
    const { data: projectUser, error: projectUserError } = await req.supabase
      .from('project_users')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', req.user.id)
      .single();

    console.log('[getAssetStats] projectUser result:', { projectUser, error: projectUserError });

    if (!projectUser) {
      console.log('[getAssetStats] Not in project_users, checking projects table');
      const { data: project, error: projectError } = await req.supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('owner_id', req.user.id)
        .single();

      console.log('[getAssetStats] project result:', { project, error: projectError });

      if (!project) {
        console.log('[getAssetStats] Access denied - user not in project_users or owner');
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    console.log('[getAssetStats] Access verified, fetching assets');

    // Get all assets
    console.log('[getAssetStats] Querying assets table');
    const { data: assets, error: assetsError } = await supabaseAdmin
      .from('assets')
      .select('id, item_type_id, beginning_latitude, beginning_longitude, end_latitude, end_longitude, parent_id')
      .eq('project_id', projectId);

    console.log('[getAssetStats] Assets query result:', { 
      assetCount: assets?.length || 0, 
      error: assetsError?.message || null 
    });

    if (assetsError) {
      console.error('[getAssetStats] Error fetching assets:', assetsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch assets',
        details: assetsError.message
      });
    }

    const allAssets = assets || [];
    const totalAssets = allAssets.length;

    // Count by asset type
    const assetsByType = {};
    const assetTypeIds = [...new Set(allAssets.map(a => a.item_type_id).filter(Boolean))];
    
    if (assetTypeIds.length > 0) {
      const { data: assetTypes } = await supabaseAdmin
        .from('asset_types')
        .select('id, title')
        .in('id', assetTypeIds);

      if (assetTypes) {
        assetTypes.forEach(type => {
          assetsByType[type.id] = {
            typeId: type.id,
            typeName: type.title,
            count: 0
          };
        });
      }
    }

    // Count assets
    let assetsWithCoordinates = 0;
    let assetsWithoutCoordinates = 0;
    let assetsWithParent = 0;
    let assetsWithoutParent = 0;

    if (allAssets && Array.isArray(allAssets)) {
      allAssets.forEach(asset => {
        // Count by type
        const typeId = asset.item_type_id || 'untyped';
        if (assetsByType[typeId]) {
          assetsByType[typeId].count++;
        } else if (typeId === 'untyped') {
          if (!assetsByType['untyped']) {
            assetsByType['untyped'] = { typeId: 'untyped', typeName: 'Untyped', count: 0 };
          }
          assetsByType['untyped'].count++;
        }

      // Count by coordinates (check beginning coordinates)
      if ((asset.beginning_latitude != null && asset.beginning_longitude != null) || 
          (asset.end_latitude != null && asset.end_longitude != null)) {
        assetsWithCoordinates++;
      } else {
        assetsWithoutCoordinates++;
      }

        // Count by parent
        if (asset.parent_id) {
          assetsWithParent++;
        } else {
          assetsWithoutParent++;
        }
      });
    }

    // Calculate hierarchy depth distribution
    const depthDistribution = {};
    
    // Create asset map for quick lookup
    const assetMap = {};
    if (allAssets && Array.isArray(allAssets)) {
      allAssets.forEach(asset => {
        assetMap[asset.id] = asset;
      });

      // Calculate depth for each asset (how many levels from root)
      allAssets.forEach(asset => {
        try {
          let depth = 0;
          let currentAsset = asset;
          const visited = new Set();
          
          // Traverse up the parent chain
          while (currentAsset && currentAsset.parent_id && !visited.has(currentAsset.id)) {
            visited.add(currentAsset.id);
            const parent = assetMap[currentAsset.parent_id];
            if (parent) {
              depth++;
              currentAsset = parent;
            } else {
              break; // Parent not found, stop
            }
          }
          
          depthDistribution[depth] = (depthDistribution[depth] || 0) + 1;
        } catch (err) {
          console.error('Error calculating depth for asset:', asset.id, err);
          // Default to depth 0 if calculation fails
          depthDistribution[0] = (depthDistribution[0] || 0) + 1;
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAssets,
          assetsWithCoordinates,
          assetsWithoutCoordinates,
          assetsWithParent,
          assetsWithoutParent
        },
        byType: Object.values(assetsByType),
        depthDistribution: Object.entries(depthDistribution).map(([depth, count]) => ({
          depth: parseInt(depth),
          count
        }))
      }
    });

  } catch (error) {
    console.error('[getAssetStats] Error caught:', error);
    console.error('[getAssetStats] Error stack:', error.stack);
    console.error('[getAssetStats] Error message:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get asset statistics',
      details: error.message
    });
  }
});

// @desc    Get project-level statistics
// @route   GET /api/visualization/:projectId/project-stats
// @access  Private
const getProjectStats = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  
  console.log('[getProjectStats] Starting for projectId:', projectId);

  try {
    if (!supabaseAdmin) {
      console.error('[getProjectStats] supabaseAdmin is not available');
      throw new Error('supabaseAdmin is not available');
    }

    console.log('[getProjectStats] Verifying project access');
    // Verify project access
    console.log('[getProjectStats] Checking project_users table');
    const { data: projectUser, error: projectUserError } = await req.supabase
      .from('project_users')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', req.user.id)
      .single();

    console.log('[getProjectStats] projectUser result:', { projectUser, error: projectUserError });

    if (!projectUser) {
      console.log('[getProjectStats] Not in project_users, checking projects table');
      const { data: project, error: projectError } = await req.supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('owner_id', req.user.id)
        .single();

      console.log('[getProjectStats] project result:', { project, error: projectError });

      if (!project) {
        console.log('[getProjectStats] Access denied - user not in project_users or owner');
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    console.log('[getProjectStats] Access verified, fetching counts');

    // Get counts
    console.log('[getProjectStats] Counting assets');
    const { count: totalAssets, error: assetsCountError } = await supabaseAdmin
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);
    console.log('[getProjectStats] Assets count:', totalAssets, 'Error:', assetsCountError?.message || null);

    console.log('[getProjectStats] Counting responses');
    const { count: totalResponses, error: responsesCountError } = await supabaseAdmin
      .from('questionnaire_responses')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);
    console.log('[getProjectStats] Responses count:', totalResponses, 'Error:', responsesCountError?.message || responsesCountError?.code || null);

    console.log('[getProjectStats] Counting files');
    const { count: totalFiles, error: filesCountError } = await supabaseAdmin
      .from('project_files')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);
    console.log('[getProjectStats] Files count:', totalFiles, 'Error:', filesCountError?.message || null);

    console.log('[getProjectStats] Counting asset types');
    const { count: totalAssetTypes, error: assetTypesCountError } = await supabaseAdmin
      .from('asset_types')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);
    console.log('[getProjectStats] Asset types count:', totalAssetTypes, 'Error:', assetTypesCountError?.message || null);

    // Get asset types breakdown
    const { data: assetTypes } = await supabaseAdmin
      .from('asset_types')
      .select('id, title, description')
      .eq('project_id', projectId);

    // Calculate completion rate
    const completionRate = totalAssets > 0 && totalResponses > 0
      ? parseFloat(((totalResponses / (totalAssets || 1)) * 100).toFixed(2))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        counts: {
          assets: totalAssets || 0,
          responses: totalResponses || 0,
          files: totalFiles || 0,
          assetTypes: totalAssetTypes || 0
        },
        assetTypes: assetTypes || [],
        completionRate: Math.min(completionRate, 100) // Cap at 100%
      }
    });

  } catch (error) {
    console.error('[getProjectStats] Error caught:', error);
    console.error('[getProjectStats] Error stack:', error.stack);
    console.error('[getProjectStats] Error message:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get project statistics',
      details: error.message
    });
  }
});

export { getQuestionnaireStats, getAssetStats, getProjectStats };

