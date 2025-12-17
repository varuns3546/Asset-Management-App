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
    // === STEP 1: Try Official Supabase Management API ===
    let officialMetrics = await getOfficialSupabaseMetrics();

    // === STEP 2: Get Storage Size ===
    let totalStorageSize = await calculateStorageSize(projectId);

    // === STEP 3: Get Record Counts ===
    const counts = await getRecordCounts(projectId);

    // === STEP 4: Get Accurate Database Size ===
    const dbMetrics = await getAccurateDatabaseSize(officialMetrics, counts);

    // === STEP 5: Override with official storage size if available ===
    if (officialMetrics?.storage_size) {
      totalStorageSize = officialMetrics.storage_size;
    }

    // === STEP 6: Calculate Percentages ===
    const FREE_TIER_DB_LIMIT = 500 * 1024 * 1024; // 500 MB
    const FREE_TIER_STORAGE_LIMIT = 1024 * 1024 * 1024; // 1 GB

    // 🚨 TESTING: Override with warning values
    const TEST_MODE = false;
    let dbPercentage, storagePercentage;
    if (TEST_MODE) {
      // Set to 85% to trigger warning (80-90% = warning, >90% = critical)
      dbPercentage = 85.5;
      storagePercentage = 87.2;
      // Override ALL sizes to match percentages
      dbMetrics.totalSize = Math.floor(FREE_TIER_DB_LIMIT * 0.855); // 427.5 MB
      dbMetrics.userDataSize = Math.floor(FREE_TIER_DB_LIMIT * 0.855); // Same for display
      dbMetrics.overhead = 0; // No overhead in test display
      totalStorageSize = Math.floor(FREE_TIER_STORAGE_LIMIT * 0.872); // 892.9 MB
      console.log('⚠️ TEST MODE: Showing warning values');
    } else {
      dbPercentage = (dbMetrics.totalSize / FREE_TIER_DB_LIMIT) * 100;
      storagePercentage = (totalStorageSize / FREE_TIER_STORAGE_LIMIT) * 100;
    }

    res.status(200).json({
      success: true,
      data: {
        database: {
          size: dbMetrics.userDataSize,
          sizeFormatted: formatBytesAsMB(dbMetrics.userDataSize),
          sizeWithOverhead: dbMetrics.totalSize,
          sizeWithOverheadFormatted: formatBytesAsMB(dbMetrics.totalSize),
          supabaseOverhead: dbMetrics.overhead,
          supabaseOverheadFormatted: formatBytesAsMB(dbMetrics.overhead),
          overheadPercentage: dbMetrics.overheadPercentage,
          breakdown: dbMetrics.breakdown, // Detailed breakdown if available
          limit: FREE_TIER_DB_LIMIT,
          limitFormatted: formatBytesAsMB(FREE_TIER_DB_LIMIT),
          percentage: Math.round(dbPercentage * 100) / 100,
          warning: dbPercentage > 80,
          isEstimate: dbMetrics.isEstimate,
          dataSource: dbMetrics.dataSource
        },
        storage: {
          size: totalStorageSize,
          sizeFormatted: formatBytesAsMB(totalStorageSize),
          limit: FREE_TIER_STORAGE_LIMIT,
          limitFormatted: formatBytesAsMB(FREE_TIER_STORAGE_LIMIT),
          percentage: Math.round(storagePercentage * 100) / 100,
          warning: storagePercentage > 80,
          dataSource: officialMetrics?.storage_size ? 'official_api' : 'calculated'
        },
        counts,
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
    const officialMetrics = await getOfficialSupabaseMetrics();

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

    // Get actual file count and size from ALL storage buckets (not just database records)
    const { fileCount: actualFileCount, totalSize: actualStorageSize, photoSize: actualPhotoSize = 0, otherFilesSize: actualOtherFilesSize = 0, bucketBreakdown = {} } = await getAllStorageFilesCount();

    // Get total file sizes from database (for fallback comparison)
    const { data: allProjectFiles } = await supabaseAdmin
      .from('project_files')
      .select('file_size');

    const dbFileSize = allProjectFiles?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;
    
    // Priority order for storage size:
    // 1. Official Supabase storage_size (most accurate - what Supabase dashboard shows)
    // 2. Bucket enumeration (actual files in storage)
    // 3. Database records (fallback)
    let totalStorageSize = 0;
    
    if (officialMetrics?.storage_size) {
      // Use official Supabase storage size (authoritative source)
      totalStorageSize = officialMetrics.storage_size;
    } else if (actualStorageSize > 0) {
      // Fallback to bucket enumeration if official not available
      totalStorageSize = actualStorageSize;
    } else {
      // Last resort: database records
      totalStorageSize = dbFileSize;
    }

    // Get accurate database size for entire account
    const dbMetrics = await getAccurateDatabaseSize(officialMetrics, {
      assets: totalAssets,
      responses: totalResponses,
      files: totalFiles,
      assetTypes: totalAssetTypes
    });

    // Calculate percentages
    const FREE_TIER_DB_LIMIT = 500 * 1024 * 1024; // 500 MB
    const FREE_TIER_STORAGE_LIMIT = 1024 * 1024 * 1024; // 1 GB

    // 🚨 TESTING: Override with warning values
    const TEST_MODE = false;
    let dbPercentage, storagePercentage;
    if (TEST_MODE) {
      dbPercentage = 85.5;
      storagePercentage = 87.2;
      dbMetrics.totalSize = Math.floor(FREE_TIER_DB_LIMIT * 0.855);
      dbMetrics.userDataSize = Math.floor(FREE_TIER_DB_LIMIT * 0.855);
      dbMetrics.overhead = 0;
      totalStorageSize = Math.floor(FREE_TIER_STORAGE_LIMIT * 0.872);
      console.log('⚠️ TEST MODE: All Projects showing warning values');
    } else {
      dbPercentage = (dbMetrics.totalSize / FREE_TIER_DB_LIMIT) * 100;
      storagePercentage = (totalStorageSize / FREE_TIER_STORAGE_LIMIT) * 100;
    }

    // Account-wide official metrics (if available)
    const accountMetrics = officialMetrics ? {
      database: {
        size: officialMetrics.db_size || dbMetrics.totalSize,
        sizeFormatted: formatBytes(officialMetrics.db_size || dbMetrics.totalSize),
        dataSource: officialMetrics.db_size ? 'official_api' : dbMetrics.dataSource
      },
      storage: {
        size: officialMetrics.storage_size || totalStorageSize,
        sizeFormatted: formatBytes(officialMetrics.storage_size || totalStorageSize),
        dataSource: officialMetrics.storage_size ? 'official_api' : 'calculated'
      }
    } : null;

    res.status(200).json({
      success: true,
      data: {
        allProjects: {
          projectCount: allProjects?.length || 0,
          database: {
            size: dbMetrics.userDataSize,
            sizeFormatted: formatBytesAsMB(dbMetrics.userDataSize),
            sizeWithOverhead: dbMetrics.totalSize,
            sizeWithOverheadFormatted: formatBytesAsMB(dbMetrics.totalSize),
            overhead: dbMetrics.overhead,
            overheadFormatted: formatBytesAsMB(dbMetrics.overhead),
            overheadPercentage: dbMetrics.overheadPercentage,
            breakdown: dbMetrics.breakdown,
            limit: FREE_TIER_DB_LIMIT,
            limitFormatted: formatBytesAsMB(FREE_TIER_DB_LIMIT),
            percentage: Math.round(dbPercentage * 100) / 100,
            warning: dbPercentage > 80,
            isEstimate: dbMetrics.isEstimate,
            dataSource: dbMetrics.dataSource
          },
          storage: {
            size: totalStorageSize,
            sizeFormatted: formatBytesAsMB(totalStorageSize),
            photoSize: actualPhotoSize,
            photoSizeFormatted: formatBytesAsMB(actualPhotoSize),
            otherFilesSize: actualOtherFilesSize,
            otherFilesSizeFormatted: formatBytesAsMB(actualOtherFilesSize),
            limit: FREE_TIER_STORAGE_LIMIT,
            limitFormatted: formatBytesAsMB(FREE_TIER_STORAGE_LIMIT),
            percentage: Math.round(storagePercentage * 100) / 100,
            warning: storagePercentage > 80,
            dataSource: officialMetrics?.storage_size ? 'official_api' : 'calculated'
          },
          counts: {
            assets: totalAssets || 0,
            responses: totalResponses || 0,
            files: actualFileCount || 0, // Always use actual storage bucket count, not database table count
            assetTypes: totalAssetTypes || 0
          },
          storageBreakdown: bucketBreakdown || {} // Per-bucket file counts
        },
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch official metrics from Supabase Management API
 */
async function getOfficialSupabaseMetrics() {
  if (!SUPABASE_PROJECT_REF || !SUPABASE_MANAGEMENT_TOKEN) {
    return null;
  }

  const endpoints = [
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/daily-stats`,
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/infra/stats`,
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/usage`,
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/statistics`
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_MANAGEMENT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.db_size || data.database_size || data.storage_size || 
            data.disk_volume_size_gb || (Array.isArray(data) && data.length > 0)) {
          
          
          if (Array.isArray(data) && data.length > 0) {
            const latest = data[data.length - 1];
            return {
              db_size: latest.disk_volume_size_gb ? latest.disk_volume_size_gb * 1024 * 1024 * 1024 : null,
              storage_size: latest.storage_size || latest.total_storage_size
            };
          }
          
          return {
            db_size: data.db_size || data.database_size || (data.disk_volume_size_gb * 1024 * 1024 * 1024),
            storage_size: data.storage_size || data.total_storage_size
          };
        }
      }
    } catch (err) {
      continue;
    }
  }

  return null;
}

/**
 * Get total file count and size from ALL storage buckets (account-wide)
 * Separates photos from other files
 */
async function getAllStorageFilesCount() {
  let totalFileCount = 0;
  let totalSize = 0;
  let photoSize = 0;
  let otherFilesSize = 0;
  
  // List all buckets and count files
  try {
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError || !buckets) {
      return { fileCount: 0, totalSize: 0, photoSize: 0, otherFilesSize: 0 };
    }
    
    // Count files in each bucket and track per-bucket counts
    const bucketBreakdown = {};
    for (const bucket of buckets) {
      try {
        const fileCount = await countFilesInBucketWithBreakdown(bucket.name);
        totalFileCount += fileCount.count;
        totalSize += fileCount.size;
        photoSize += fileCount.photoSize || 0;
        otherFilesSize += fileCount.otherFilesSize || 0;
        bucketBreakdown[bucket.name] = {
          count: fileCount.count,
          size: fileCount.size,
          sizeFormatted: formatBytes(fileCount.size),
          photoSize: fileCount.photoSize || 0,
          otherFilesSize: fileCount.otherFilesSize || 0
        };
      } catch (bucketError) {
        bucketBreakdown[bucket.name] = {
          count: 0,
          size: 0,
          sizeFormatted: '0 Bytes',
          photoSize: 0,
          otherFilesSize: 0,
          error: bucketError.message
        };
      }
    }
    
    return { fileCount: totalFileCount, totalSize, photoSize, otherFilesSize, bucketBreakdown };
    
  } catch (error) {
    console.error('Error in getAllStorageFilesCount:', error);
    return { fileCount: 0, totalSize: 0, photoSize: 0, otherFilesSize: 0 };
  }
}

/**
 * Count all files in a bucket using BFS (breadth-first search) queue approach
 * This is more reliable than recursion for handling nested folders
 */
async function countFilesInBucket(bucketName, limit = 1000) {
  let totalCount = 0;
  let totalSize = 0;
  const foldersToProcess = ['']; // Start with root
  const processedPaths = new Set();
  
  try {
    while (foldersToProcess.length > 0) {
      const currentPath = foldersToProcess.shift();
      
      // Avoid processing the same path twice
      if (processedPaths.has(currentPath)) {
        continue;
      }
      processedPaths.add(currentPath);
      
      let offset = 0;
      let hasMore = true;
      
      // Paginate through all items in current path
      while (hasMore) {
        const { data: items, error } = await supabaseAdmin.storage
          .from(bucketName)
          .list(currentPath, {
            limit,
            offset,
            sortBy: { column: 'name', order: 'asc' }
          });
        
        if (error) {
          break;
        }
        
        if (!items || items.length === 0) {
          hasMore = false;
          break;
        }
        
        for (const item of items) {
          // Determine if it's a file or folder
          // Files have: id (UUID), metadata with size
          // Folders have: name, but no id
          const hasId = item.id !== null && item.id !== undefined && item.id !== '';
          const hasMetadata = item.metadata !== null && item.metadata !== undefined;
          
          if (hasId && hasMetadata) {
            // It's a file
            totalCount++;
            const fileSize = item.metadata?.size || 0;
            totalSize += fileSize;
          } else if (item.name && !hasId) {
            // It's a folder - add to queue for processing
            const folderPath = currentPath ? `${currentPath}/${item.name}` : item.name;
            if (!processedPaths.has(folderPath)) {
              foldersToProcess.push(folderPath);
            }
          } else if (item.metadata?.size !== undefined) {
            // Item has metadata with size, treat as file
            totalCount++;
            totalSize += item.metadata.size;
          }
        }
        
        // Check if more items to fetch
        if (items.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }
    }
    
    return { count: totalCount, size: totalSize };
  } catch (error) {
    return { count: 0, size: 0 };
  }
}

/**
 * Count all files in a bucket with breakdown by photos vs other files
 * Photos are in paths containing '/photos/', other files are in paths containing '/files/'
 */
async function countFilesInBucketWithBreakdown(bucketName, limit = 1000) {
  let totalCount = 0;
  let totalSize = 0;
  let photoSize = 0;
  let otherFilesSize = 0;
  const foldersToProcess = ['']; // Start with root
  const processedPaths = new Set();
  
  try {
    while (foldersToProcess.length > 0) {
      const currentPath = foldersToProcess.shift();
      
      // Avoid processing the same path twice
      if (processedPaths.has(currentPath)) {
        continue;
      }
      processedPaths.add(currentPath);
      
      let offset = 0;
      let hasMore = true;
      
      // Paginate through all items in current path
      while (hasMore) {
        const { data: items, error } = await supabaseAdmin.storage
          .from(bucketName)
          .list(currentPath, {
            limit,
            offset,
            sortBy: { column: 'name', order: 'asc' }
          });
        
        if (error) {
          break;
        }
        
        if (!items || items.length === 0) {
          hasMore = false;
          break;
        }
        
        for (const item of items) {
          // Determine if it's a file or folder
          const hasId = item.id !== null && item.id !== undefined && item.id !== '';
          const hasMetadata = item.metadata !== null && item.metadata !== undefined;
          
          if (hasId && hasMetadata) {
            // It's a file
            totalCount++;
            const fileSize = item.metadata?.size || 0;
            totalSize += fileSize;
            
            // Check if it's a photo or other file based on path
            const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
            if (fullPath.includes('/photos/')) {
              photoSize += fileSize;
            } else if (fullPath.includes('/files/')) {
              otherFilesSize += fileSize;
            } else {
              // Files not in photos or files folders - count as other files
              otherFilesSize += fileSize;
            }
          } else if (item.name && !hasId) {
            // It's a folder - add to queue for processing
            const folderPath = currentPath ? `${currentPath}/${item.name}` : item.name;
            if (!processedPaths.has(folderPath)) {
              foldersToProcess.push(folderPath);
            }
          } else if (item.metadata?.size !== undefined) {
            // Item has metadata with size, treat as file
            totalCount++;
            const fileSize = item.metadata.size;
            totalSize += fileSize;
            
            // Check if it's a photo or other file based on path
            const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
            if (fullPath.includes('/photos/')) {
              photoSize += fileSize;
            } else {
              otherFilesSize += fileSize;
            }
          }
        }
        
        // Check if more items to fetch
        if (items.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }
    }
    
    return { count: totalCount, size: totalSize, photoSize, otherFilesSize };
  } catch (error) {
    return { count: 0, size: 0, photoSize: 0, otherFilesSize: 0 };
  }
}

/**
 * Calculate total storage size from Supabase storage buckets
 */
async function calculateStorageSize(projectId) {
  // Try SQL function to get ACCURATE total storage (has elevated permissions)
  try {
    const { data: storageData, error } = await supabaseAdmin
      .rpc('get_total_storage_size')
      .single();
    
    if (!error && storageData) {
      return storageData.total_size;
    }
  } catch (storageError) {
    // Function not available, continue to fallback
  }
  
  // Fallback: Try listing from buckets (old method)
  let totalSize = 0;
  const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
  
  if (!bucketsError && buckets) {
    for (const bucket of buckets) {
      try {
        const { data: files } = await supabaseAdmin.storage
          .from(bucket.name)
          .list(projectId, {
            limit: 1000,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (files) {
          for (const file of files) {
            if (file.metadata?.size) {
              totalSize += file.metadata.size;
            }
          }
        }
      } catch (bucketError) {
        // Bucket not accessible, skip
      }
    }
  }

  // Also check database records for comparison
  const { data: projectFiles } = await supabaseAdmin
    .from('project_files')
    .select('file_size')
    .eq('project_id', projectId);


  return totalSize;
}

/**
 * Get record counts for a project
 */
async function getRecordCounts(projectId) {
  const { count: assets } = await supabaseAdmin
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  const { count: responses } = await supabaseAdmin
    .from('questionnaire_responses')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  const { count: files } = await supabaseAdmin
    .from('project_files')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  const { count: assetTypes } = await supabaseAdmin
    .from('asset_types')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  return {
    assets: assets || 0,
    responses: responses || 0,
    files: files || 0,
    assetTypes: assetTypes || 0
  };
}

/**
 * Get accurate database size using priority-based approach
 */
async function getAccurateDatabaseSize(officialMetrics, counts) {
  // Priority 1: Try PostgreSQL detailed breakdown function
  try {
    const { data: breakdown, error } = await supabaseAdmin
      .rpc('get_database_size_breakdown')
      .single();

    if (!error && breakdown) {
      const totalSize = breakdown.total_size;
      const userDataSize = breakdown.user_tables_size;
      const overhead = totalSize - userDataSize;
      const overheadPct = (overhead / totalSize * 100).toFixed(2);


      return {
        totalSize,
        userDataSize,
        overhead,
        overheadPercentage: parseFloat(overheadPct),
        breakdown: {
          tables: breakdown.user_tables_size,
          tablesFormatted: formatBytes(breakdown.user_tables_size),
          indexes: breakdown.user_indexes_size,
          indexesFormatted: formatBytes(breakdown.user_indexes_size),
          toast: breakdown.toast_size,
          toastFormatted: formatBytes(breakdown.toast_size),
          system: breakdown.system_overhead,
          systemFormatted: formatBytes(breakdown.system_overhead)
        },
        isEstimate: false,
        dataSource: 'postgresql_detailed'
      };
    }
  } catch (err) {
  }

  // Priority 2: Try simple total database size function
  try {
    const { data: totalSize, error: totalError } = await supabaseAdmin
      .rpc('get_total_db_size');

    const { data: userDataSize, error: userError } = await supabaseAdmin
      .rpc('get_user_data_size');

    if (!totalError && !userError && totalSize && userDataSize) {
      const overhead = totalSize - userDataSize;
      const overheadPct = (overhead / totalSize * 100).toFixed(2);


      return {
        totalSize,
        userDataSize,
        overhead,
        overheadPercentage: parseFloat(overheadPct),
        breakdown: null,
        isEstimate: false,
        dataSource: 'postgresql_total'
      };
    }
  } catch (err) {
  }

  // Priority 3: Use official Supabase API metrics
  if (officialMetrics?.db_size) {
    // Estimate user data as ~55% of total (typical ratio)
    const totalSize = officialMetrics.db_size;
    const userDataSize = Math.floor(totalSize * 0.55);
    const overhead = totalSize - userDataSize;
    const overheadPct = (overhead / totalSize * 100).toFixed(2);


    return {
      totalSize,
      userDataSize,
      overhead,
      overheadPercentage: parseFloat(overheadPct),
      breakdown: null,
      isEstimate: false,
      dataSource: 'official_api'
    };
  }

  // Priority 4: Improved estimation (last resort)

  return calculateImprovedEstimate(counts);
}

/**
 * Calculate improved database size estimate
 */
function calculateImprovedEstimate(counts) {
  const {
    assets = 0,
    responses = 0,
    files = 0,
    assetTypes = 0
  } = counts;

  // Better per-record estimates including typical indexes
  const estimatedDataSize = (
    assets * 3072 +        // ~3KB per asset (data + indexes)
    responses * 6144 +     // ~6KB per response (often has JSONB)
    files * 1536 +         // ~1.5KB per file record
    assetTypes * 768       // ~768 bytes per type
  );

  // PostgreSQL overhead components:
  const systemBaseline = 8 * 1024 * 1024;  // 8 MB (catalogs, etc.)
  const indexOverhead = estimatedDataSize * 0.5;  // 50% for indexes
  const toastOverhead = estimatedDataSize * 0.15; // 15% for TOAST
  const walAndBloat = estimatedDataSize * 0.2;    // 20% for WAL/bloat
  
  const totalOverhead = systemBaseline + indexOverhead + toastOverhead + walAndBloat;
  const totalSize = estimatedDataSize + totalOverhead;
  const overheadPct = (totalOverhead / totalSize * 100).toFixed(2);


  return {
    totalSize,
    userDataSize: estimatedDataSize,
    overhead: totalOverhead,
    overheadPercentage: parseFloat(overheadPct),
    breakdown: {
      estimatedData: estimatedDataSize,
      estimatedDataFormatted: formatBytes(estimatedDataSize),
      systemBaseline,
      systemBaselineFormatted: formatBytes(systemBaseline),
      indexOverhead,
      indexOverheadFormatted: formatBytes(indexOverhead),
      toastOverhead,
      toastOverheadFormatted: formatBytes(toastOverhead),
      walAndBloat,
      walAndBloatFormatted: formatBytes(walAndBloat)
    },
    isEstimate: true,
    dataSource: 'improved_estimation'
  };
}

/**
 * Format bytes to human-readable string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format always as MB for consistency
const formatBytesAsMB = (bytes) => {
  if (!bytes || bytes === 0) {
    return '0.00 MB';
  }
  const mb = bytes / (1024 * 1024);
  return Number(mb.toFixed(2)).toFixed(2) + ' MB';
};

export { getProjectMetrics, getAllProjectsMetrics };