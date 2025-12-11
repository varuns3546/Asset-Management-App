import asyncHandler from 'express-async-handler';
import supabaseClient from '../config/supabaseClient.js';

const { supabaseAdmin } = supabaseClient;

// Supabase Management API configuration
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const SUPABASE_MANAGEMENT_TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN;

// @desc    Get project storage metrics
// @route   GET /api/projects/:id/metrics
// @access  Private
const getProjectMetrics = asyncHandler(async (req, res) => {
  const { id: projectId } = req.params;

  try {
    // Try to get official Supabase usage metrics first
    let officialMetrics = null;
    if (SUPABASE_PROJECT_REF && SUPABASE_MANAGEMENT_TOKEN) {
      try {
        // Try multiple endpoint variations for usage/stats data
        const endpoints = [
          `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/daily-stats`,
          `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/infra/stats`,
          `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/usage`,
          `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/statistics`
        ];
        
        let usageData = null;
        let successfulEndpoint = null;
        
        for (const endpoint of endpoints) {
          try {
            const usageResponse = await fetch(endpoint, {
              headers: {
                'Authorization': `Bearer ${SUPABASE_MANAGEMENT_TOKEN}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (usageResponse.ok) {
              const data = await usageResponse.json();
              // Check if this response actually contains usage metrics
              if (data.db_size || data.database_size || data.storage_size || 
                  data.disk_volume_size_gb || data.infra_compute_cpu_usage ||
                  (Array.isArray(data) && data.length > 0)) {
                usageData = data;
                successfulEndpoint = endpoint;
                console.log('✓ Found usage data at:', successfulEndpoint);
                console.log('Usage API Response:', JSON.stringify(data, null, 2));
                break;
              } else {
                console.log(`Endpoint ${endpoint} returned metadata, not usage data`);
              }
            } else {
              console.log(`Endpoint ${endpoint} returned ${usageResponse.status}`);
            }
          } catch (err) {
            console.log(`Endpoint ${endpoint} failed:`, err.message);
          }
        }
        
        if (usageData && successfulEndpoint) {
          // Parse the response based on structure
          // Daily stats might be an array, we'd want the latest
          if (Array.isArray(usageData) && usageData.length > 0) {
            const latestStats = usageData[usageData.length - 1];
            officialMetrics = {
              db_size: latestStats.disk_volume_size_gb ? latestStats.disk_volume_size_gb * 1024 * 1024 * 1024 : null,
              storage_size: latestStats.storage_size || latestStats.total_storage_size
            };
          } else {
            // Direct object response
            officialMetrics = {
              db_size: usageData.db_size || usageData.database_size || usageData.disk_volume_size_gb * 1024 * 1024 * 1024,
              storage_size: usageData.storage_size || usageData.total_storage_size
            };
          }
          console.log('Parsed metrics - DB:', officialMetrics.db_size, 'Storage:', officialMetrics.storage_size);
        } else {
          console.log('⚠️ No usage endpoint found. Available endpoints may require different authentication or API version.');
          console.log('Falling back to SQL-based calculations.');
          throw new Error('No valid usage endpoint available');
        }
      } catch (apiError) {
        console.log('Official metrics unavailable, using fallback calculation:', apiError.message);
      }
    }
    // 1. Get storage size from ALL buckets for this project
    let totalStorageSize = 0;

    // List all storage buckets
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (!bucketsError && buckets) {
      // Iterate through each bucket and calculate size
      for (const bucket of buckets) {
        try {
          // Try to list files in project folder
          const { data: files } = await supabaseAdmin.storage
            .from(bucket.name)
            .list(projectId, {
              limit: 1000,
              sortBy: { column: 'name', order: 'asc' }
            });

          if (files) {
            for (const file of files) {
              if (file.metadata?.size) {
                totalStorageSize += file.metadata.size;
              }
            }
          }
        } catch (bucketError) {
          // Bucket might not have project-based structure, try getting from database instead
          console.log(`Bucket ${bucket.name} not accessible or no project folder:`, bucketError.message);
        }
      }
    }

    // Also get file sizes from database records (for buckets tracked in DB)
    const { data: projectFiles } = await supabaseAdmin
      .from('project_files')
      .select('file_size')
      .eq('project_id', projectId);

    if (projectFiles) {
      const dbFileSize = projectFiles.reduce((sum, file) => sum + (file.file_size || 0), 0);
      // Only add if not already counted from storage buckets
      // This prevents double-counting
      console.log(`DB tracked files: ${formatBytes(dbFileSize)}`);
    }

    // 2. Get record counts
    const { count: assetsCount } = await supabaseAdmin
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    const { count: responsesCount } = await supabaseAdmin
      .from('questionnaire_responses')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    const { count: filesCount } = await supabaseAdmin
      .from('project_files')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    const { count: assetTypesCount } = await supabaseAdmin
      .from('asset_types')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    // 3. Calculate database size (try SQL function first - most accurate!)
    let dbSize = 0;
    let dbSizeWithOverhead = 0;
    let supabaseOverhead = 0;
    let usingEstimate = false;
    let dataSource = 'unknown';

    // Try the get_database_size_with_overhead function (shows both measured + estimated total)
    try {
      const { data: sizeData, error: sizeError } = await supabaseAdmin
        .rpc('get_database_size_with_overhead')
        .single();

      if (!sizeError && sizeData) {
        dbSize = sizeData.measured_size;
        dbSizeWithOverhead = sizeData.estimated_total;
        supabaseOverhead = sizeData.supabase_overhead;
        dataSource = 'sql_accurate';
        console.log('✓ Database size breakdown:');
        console.log('  - Your data:', formatBytes(dbSize));
        console.log('  - Supabase overhead:', formatBytes(supabaseOverhead));
        console.log('  - Total (shown in dashboard):', formatBytes(dbSizeWithOverhead));
      } else {
        throw new Error('get_database_size_with_overhead function not found');
      }
    } catch (sqlError) {
      console.log('⚠️ Overhead calculation function not available, trying base function...');
      
      // Fallback to base function
      try {
        const { data: actualDbSize, error: dbSizeError } = await supabaseAdmin
          .rpc('get_actual_database_size');

        if (!dbSizeError && actualDbSize) {
          dbSize = actualDbSize;
          // Estimate overhead as 75% of base size
          dbSizeWithOverhead = Math.floor(actualDbSize * 1.75);
          supabaseOverhead = dbSizeWithOverhead - dbSize;
          dataSource = 'sql_accurate';
          console.log('✓ Using measured database size:', formatBytes(dbSize));
          console.log('  (Estimated total with overhead:', formatBytes(dbSizeWithOverhead), ')');
        } else {
          throw new Error('get_actual_database_size function not found - run ACCURATE_DATABASE_SIZE_SETUP.sql');
        }
      } catch (fallbackError) {
        console.log('⚠️ Accurate SQL function not available:', fallbackError.message);
        console.log('💡 Run ACCURATE_DATABASE_SIZE_SETUP.sql in Supabase SQL Editor to get accurate metrics');
        
        // Fallback to official API metrics
        if (officialMetrics?.db_size) {
          dbSize = officialMetrics.db_size;
          dbSizeWithOverhead = officialMetrics.db_size;
          dataSource = 'official';
          console.log('Using official API database size:', formatBytes(dbSize));
        } else {
          // Fall back to estimate as last resort
          usingEstimate = true;
          dataSource = 'estimate';
          dbSize = (
            (assetsCount || 0) * 2048 +  // ~2KB per asset
            (responsesCount || 0) * 4096 + // ~4KB per response
            (filesCount || 0) * 1024 + // ~1KB per file record
            (assetTypesCount || 0) * 512 // ~512 bytes per type
          );
          dbSizeWithOverhead = Math.floor(dbSize * 1.75);
          console.log('⚠️ Using ESTIMATED database size (INACCURATE):', formatBytes(dbSize));
          console.log('📄 To fix: Run the SQL in ACCURATE_DATABASE_SIZE_SETUP.sql');
        }
      }
    }

    // 4. Calculate storage size (use official if available)
    if (officialMetrics?.storage_size) {
      // Override with official storage size if available
      totalStorageSize = officialMetrics.storage_size;
      console.log('Using official storage size:', formatBytes(totalStorageSize));
    }

    // 5. Calculate totals and percentages
    const FREE_TIER_DB_LIMIT = 500 * 1024 * 1024; // 500 MB
    const FREE_TIER_STORAGE_LIMIT = 1024 * 1024 * 1024; // 1 GB

    // Use the size with overhead for percentage calculation (what Supabase actually counts)
    const dbPercentage = (dbSizeWithOverhead / FREE_TIER_DB_LIMIT) * 100;
    const storagePercentage = (totalStorageSize / FREE_TIER_STORAGE_LIMIT) * 100;

    res.status(200).json({
      success: true,
      data: {
        database: {
          size: dbSize,
          sizeFormatted: formatBytes(dbSize),
          sizeWithOverhead: dbSizeWithOverhead,
          sizeWithOverheadFormatted: formatBytes(dbSizeWithOverhead),
          supabaseOverhead: supabaseOverhead,
          supabaseOverheadFormatted: formatBytes(supabaseOverhead),
          limit: FREE_TIER_DB_LIMIT,
          limitFormatted: formatBytes(FREE_TIER_DB_LIMIT),
          percentage: Math.round(dbPercentage * 100) / 100,
          warning: dbPercentage > 80,
          isEstimate: usingEstimate,
          dataSource: dataSource
        },
        storage: {
          size: totalStorageSize,
          sizeFormatted: formatBytes(totalStorageSize),
          limit: FREE_TIER_STORAGE_LIMIT,
          limitFormatted: formatBytes(FREE_TIER_STORAGE_LIMIT),
          percentage: Math.round(storagePercentage * 100) / 100,
          warning: storagePercentage > 80,
          bucketsScanned: buckets?.length || 0,
          dataSource: officialMetrics?.storage_size ? 'official' : 'calculated'
        },
        counts: {
          assets: assetsCount || 0,
          responses: responsesCount || 0,
          files: filesCount || 0,
          assetTypes: assetTypesCount || 0
        },
        overallWarning: dbPercentage > 80 || storagePercentage > 80,
        criticalWarning: dbPercentage > 90 || storagePercentage > 90,
        usingOfficialMetrics: officialMetrics !== null
      }
    });

  } catch (error) {
    console.error('Error in getProjectMetrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get project metrics'
    });
  }
});

// @desc    Get metrics for ALL projects combined
// @route   GET /api/metrics/all-projects
// @access  Private
const getAllProjectsMetrics = asyncHandler(async (req, res) => {
  try {
    // Get official Supabase account-wide metrics
    let officialMetrics = null;
    if (SUPABASE_PROJECT_REF && SUPABASE_MANAGEMENT_TOKEN) {
      try {
        // Try multiple endpoint variations for usage/stats data
        const endpoints = [
          `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/daily-stats`,
          `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/infra/stats`,
          `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/usage`,
          `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/statistics`
        ];
        
        let usageData = null;
        
        for (const endpoint of endpoints) {
          try {
            const usageResponse = await fetch(endpoint, {
              headers: {
                'Authorization': `Bearer ${SUPABASE_MANAGEMENT_TOKEN}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (usageResponse.ok) {
              const data = await usageResponse.json();
              // Check if this response actually contains usage metrics
              if (data.db_size || data.database_size || data.storage_size || 
                  data.disk_volume_size_gb || (Array.isArray(data) && data.length > 0)) {
                usageData = data;
                console.log('✓ Fetched official account metrics from:', endpoint);
                break;
              }
            }
          } catch (err) {
            // Continue to next endpoint
          }
        }
        
        if (usageData) {
          // Parse the response based on structure
          if (Array.isArray(usageData) && usageData.length > 0) {
            const latestStats = usageData[usageData.length - 1];
            officialMetrics = {
              db_size: latestStats.disk_volume_size_gb ? latestStats.disk_volume_size_gb * 1024 * 1024 * 1024 : null,
              storage_size: latestStats.storage_size || latestStats.total_storage_size
            };
          } else {
            officialMetrics = {
              db_size: usageData.db_size || usageData.database_size || usageData.disk_volume_size_gb * 1024 * 1024 * 1024,
              storage_size: usageData.storage_size || usageData.total_storage_size
            };
          }
        }
      } catch (apiError) {
        console.log('Official metrics unavailable:', apiError.message);
      }
    }

    // Get ALL projects from database
    const { data: allProjects } = await supabaseAdmin
      .from('projects')
      .select('id');

    // Aggregate counts across ALL projects
    const { count: totalAssets } = await supabaseAdmin
      .from('assets')
      .select('*', { count: 'exact', head: true });

    const { count: totalResponses } = await supabaseAdmin
      .from('questionnaire_responses')
      .select('*', { count: 'exact', head: true });

    const { count: totalFiles } = await supabaseAdmin
      .from('project_files')
      .select('*', { count: 'exact', head: true });

    const { count: totalAssetTypes } = await supabaseAdmin
      .from('asset_types')
      .select('*', { count: 'exact', head: true });

    // Get total file sizes from database
    const { data: allProjectFiles } = await supabaseAdmin
      .from('project_files')
      .select('file_size');

    const totalStorageSize = allProjectFiles?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;

    // Calculate estimated database size for all projects
    const estimatedDbSize = (
      (totalAssets || 0) * 2048 +
      (totalResponses || 0) * 4096 +
      (totalFiles || 0) * 1024 +
      (totalAssetTypes || 0) * 512
    );

    // Calculate percentages
    const FREE_TIER_DB_LIMIT = 500 * 1024 * 1024; // 500 MB
    const FREE_TIER_STORAGE_LIMIT = 1024 * 1024 * 1024; // 1 GB

    const dbPercentage = (estimatedDbSize / FREE_TIER_DB_LIMIT) * 100;
    const storagePercentage = (totalStorageSize / FREE_TIER_STORAGE_LIMIT) * 100;

    // Account-wide official metrics (if available)
    const accountMetrics = officialMetrics ? {
      database: {
        size: officialMetrics.db_size || 0,
        sizeFormatted: formatBytes(officialMetrics.db_size || 0),
        dataSource: 'official'
      },
      storage: {
        size: officialMetrics.storage_size || 0,
        sizeFormatted: formatBytes(officialMetrics.storage_size || 0),
        dataSource: 'official'
      }
    } : null;

    res.status(200).json({
      success: true,
      data: {
        // Aggregated metrics across all app projects
        allProjects: {
          projectCount: allProjects?.length || 0,
          database: {
            size: estimatedDbSize,
            sizeFormatted: formatBytes(estimatedDbSize),
            limit: FREE_TIER_DB_LIMIT,
            limitFormatted: formatBytes(FREE_TIER_DB_LIMIT),
            percentage: Math.round(dbPercentage * 100) / 100,
            warning: dbPercentage > 80,
            isEstimate: true,
            dataSource: 'estimated'
          },
          storage: {
            size: totalStorageSize,
            sizeFormatted: formatBytes(totalStorageSize),
            limit: FREE_TIER_STORAGE_LIMIT,
            limitFormatted: formatBytes(FREE_TIER_STORAGE_LIMIT),
            percentage: Math.round(storagePercentage * 100) / 100,
            warning: storagePercentage > 80,
            dataSource: 'calculated'
          },
          counts: {
            assets: totalAssets || 0,
            responses: totalResponses || 0,
            files: totalFiles || 0,
            assetTypes: totalAssetTypes || 0
          }
        },
        // Official Supabase account-wide metrics (includes everything in your Supabase project)
        accountTotal: accountMetrics,
        usingOfficialMetrics: officialMetrics !== null
      }
    });

  } catch (error) {
    console.error('Error in getAllProjectsMetrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get all projects metrics'
    });
  }
});

// Helper function
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export { getProjectMetrics, getAllProjectsMetrics };

