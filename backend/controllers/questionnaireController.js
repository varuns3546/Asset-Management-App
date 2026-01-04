import asyncHandler from 'express-async-handler';
import multer from 'multer';
import * as XLSX from 'xlsx';
import supabaseClient from '../config/supabaseClient.js';

const { supabaseAdmin } = supabaseClient;

// Configure multer for spreadsheet upload
const storage = multer.memoryStorage();
const spreadsheetUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'application/vnd.ms-excel.sheet.macroEnabled.12', // xlsm
      'text/csv',
      'text/tab-separated-values',
      'application/csv',
    ];
    const allowedExts = ['.xlsx', '.xls', '.xlsm', '.csv', '.tsv'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: xlsx, xls, xlsm, csv, tsv'));
    }
  }
});

// @desc    Get asset with its type's attributes for questionnaire
// @route   GET /api/questionnaire/:projectId/asset/:assetId
// @access  Private
const getAssetQuestionnaire = asyncHandler(async (req, res) => {
  const { projectId, assetId } = req.params;

  try {
    // Get the asset
    const { data: asset, error: assetError } = await req.supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .eq('project_id', projectId)
      .single();

    if (assetError) {
      console.error('Error fetching asset:', assetError);
      return res.status(404).json({
        success: false,
        error: 'Asset not found',
        details: assetError.message
      });
    }

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    // Get the asset type
    let assetType = null;
    if (asset.asset_type_id) {
      const { data: typeData, error: typeError } = await req.supabase
        .from('asset_types')
        .select('*')
        .eq('id', asset.asset_type_id)
        .single();

      if (typeError) {
        console.error('Error fetching asset type:', typeError);
      } else {
        assetType = typeData;
      }
    }

    // Get attributes for this asset type (only if asset has a type)
    let attributes = [];
    if (asset.asset_type_id) {
      const { data: attributesData, error: attributesError } = await req.supabase
        .from('attributes')
        .select('*')
        .eq('asset_type_id', asset.asset_type_id)
        .order('created_at');

      if (attributesError) {
        console.error('Error fetching attributes:', attributesError);
        // Don't fail the request if attributes can't be fetched
        // The asset may not have any attributes defined yet
      } else {
        attributes = attributesData || [];
      }
    }

    // Get existing attribute values for this asset (table might not exist yet)
    let responsesMap = {};
    const { data: responses, error: responsesError } = await req.supabase
      .from('attribute_values')
      .select('*')
      .eq('asset_id', assetId);

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
            // Don't fail the request if responses table doesn't exist
    } else if (responses) {
      // Process each response and ensure photos have valid URLs
      // Photos are stored in response_metadata.photos in attribute_values table
      for (const r of responses) {
        // Get photos from response_metadata (stored in attribute_values table)
        const responseMetadata = r.response_metadata ? { ...r.response_metadata } : {};
        
        // Process photos if they exist in metadata
        if (responseMetadata.photos && Array.isArray(responseMetadata.photos) && responseMetadata.photos.length > 0) {
          // Map photos and ensure they have valid public URLs
          responseMetadata.photos = await Promise.all(responseMetadata.photos.map(async (photo) => {
            // photo.path contains the storage path, photo.url might be an old URL
            let photoUrl = photo.url;
            let filePath = photo.path;
            
            
            // Always generate a fresh signed URL since public URLs may not work if bucket is private
            // Signed URLs work for both public and private buckets
            if (filePath) {
              try {
                // Use signed URL (works for both public and private buckets)
                const { data: signedUrlData, error: signedError } = await supabaseAdmin.storage
                  .from('project-files')
                  .createSignedUrl(filePath, 3600); // 1 hour expiry
                
                if (!signedError && signedUrlData) {
                  photoUrl = signedUrlData.signedUrl;
                } else {
                  console.error('Error generating signed URL:', signedError);
                  // Fallback to public URL if signed URL fails
                  try {
                    const { data: urlData } = supabaseAdmin.storage
                      .from('project-files')
                      .getPublicUrl(filePath);
                    photoUrl = urlData.publicUrl;
                  } catch (urlError) {
                    console.error('Error generating public URL:', urlError);
                  }
                }
              } catch (urlError) {
                console.error('Error generating signed URL for photo path:', filePath, urlError);
              }
            } else if (photoUrl && photoUrl.startsWith('http')) {
              // If we have a URL but no path, try to extract path from it
              const urlMatch = photoUrl.match(/\/project-files\/(.+)$/);
              if (urlMatch) {
                filePath = decodeURIComponent(urlMatch[1]); // Decode in case it's encoded
                // Generate fresh signed URL
                try {
                  const { data: signedUrlData, error: signedError } = await supabaseAdmin.storage
                    .from('project-files')
                    .createSignedUrl(filePath, 3600);
                  if (!signedError && signedUrlData) {
                    photoUrl = signedUrlData.signedUrl;
                  }
                } catch (urlError) {
                  console.error('Error regenerating signed URL:', filePath, urlError);
                }
              }
            }
            
            // Final check: if still no valid URL, log warning
            if (!photoUrl || !photoUrl.startsWith('http')) {
              console.warn('Photo has no valid URL:', {
                name: photo.name || photo.file_name,
                originalUrl: photo.url,
                path: photo.path,
                finalUrl: photoUrl
              });
            }
            
            return {
              name: photo.name || photo.file_name || 'Unknown',
              size: photo.size || photo.file_size || 0,
              url: photoUrl || photo.url || '',
              path: filePath || photo.path || photo.url // Keep path for deletion
            };
          }));
        } else {
          // No photos in metadata
          responseMetadata.photos = [];
        }

        // Create response object with processed metadata
        responsesMap[r.attribute_id] = {
          ...r,
          response_metadata: responseMetadata
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        asset,
        assetType,
        attributes,
        responses: responsesMap
      }
    });

  } catch (error) {
    console.error('Error in getAssetQuestionnaire:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// @desc    Submit/Update attribute values
// @route   POST /api/questionnaire/:projectId/asset/:assetId/submit
// @access  Private
const submitAttributeValues = asyncHandler(async (req, res) => {
  const { projectId, assetId } = req.params;
  const { responses } = req.body; // Array of { attributeId, attributeTitle, value, metadata }

  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({
      success: false,
      error: 'Responses array is required'
    });
  }

  try {
    // Get the asset to validate and get asset_type_id
    const { data: asset, error: assetError } = await req.supabase
      .from('assets')
      .select('id, asset_type_id, project_id')
      .eq('id', assetId)
      .eq('project_id', projectId)
      .single();

    if (assetError || !asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    // Get existing responses to compare photos
    const { data: existingResponses, error: fetchError } = await req.supabase
      .from('attribute_values')
      .select('attribute_id, response_metadata')
      .eq('asset_id', assetId)
      .eq('project_id', projectId);

    if (fetchError) {
      console.error('Error fetching existing responses:', fetchError);
      // Continue anyway, we'll just skip photo deletion
    }

    // Create a map of existing photos by attribute_id
    const existingPhotosMap = {};
    if (existingResponses) {
      existingResponses.forEach(response => {
        if (response.response_metadata && response.response_metadata.photos) {
          const photos = response.response_metadata.photos;
          if (Array.isArray(photos)) {
            existingPhotosMap[response.attribute_id] = photos.map(photo => {
              // Get path from photo object
              if (photo.path) {
                return photo.path;
              } else if (photo.url && photo.url.includes('/project-files/')) {
                const urlMatch = photo.url.match(/\/project-files\/(.+)$/);
                if (urlMatch) {
                  return decodeURIComponent(urlMatch[1]);
                }
              }
              return null;
            }).filter(path => path !== null);
          }
        }
      });
    }

    // Prepare data for upsert and identify entries to delete
    const responsesToUpsert = [];
    const responsesToDelete = [];
    
    responses.forEach(r => {
      const responseValue = r.value || null;
      const responseMetadata = r.metadata || {};
      
      // Check if response is blank (empty value and empty metadata)
      const isEmptyValue = !responseValue || (typeof responseValue === 'string' && responseValue.trim() === '');
      const isEmptyMetadata = !responseMetadata || 
        (typeof responseMetadata === 'object' && Object.keys(responseMetadata).length === 0) ||
        (typeof responseMetadata === 'string' && (responseMetadata === '{}' || responseMetadata.trim() === ''));
      
      // If both value and metadata are empty, mark for deletion
      if (isEmptyValue && isEmptyMetadata) {
        responsesToDelete.push(r.attributeId);
      } else {
        // Otherwise, prepare for upsert
        responsesToUpsert.push({
          project_id: projectId,
          asset_id: assetId,
          asset_type_id: asset.asset_type_id,
          attribute_id: r.attributeId,
          attribute_title: r.attributeTitle,
          response_value: responseValue,
          response_metadata: responseMetadata,
          created_by: req.user.id
        });
      }
    });

    // Collect photos to delete (photos that were in old response but not in new)
    const photosToDelete = [];
    responses.forEach(newResponse => {
      const attributeId = newResponse.attributeId;
      const oldPhotos = existingPhotosMap[attributeId] || [];
      const newPhotos = (newResponse.metadata && newResponse.metadata.photos) || [];
      
      // Extract paths from new photos
      const newPhotoPaths = newPhotos.map(photo => {
        if (photo.path) {
          return photo.path;
        } else if (photo.url && photo.url.includes('/project-files/')) {
          const urlMatch = photo.url.match(/\/project-files\/(.+)$/);
          if (urlMatch) {
            return decodeURIComponent(urlMatch[1]);
          }
        }
        return null;
      }).filter(path => path !== null);

      // Find photos that were removed
      oldPhotos.forEach(oldPath => {
        if (!newPhotoPaths.includes(oldPath)) {
          photosToDelete.push(oldPath);
        }
      });
    });

    // Delete removed photos from storage
    if (photosToDelete.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('project-files')
        .remove(photosToDelete);

      if (storageError) {
        console.error('Error deleting removed photos from storage:', storageError);
        // Continue with response save even if photo deletion fails
      }
    }

    // Delete blank responses
    if (responsesToDelete.length > 0) {
      const { error: deleteError } = await req.supabase
        .from('attribute_values')
        .delete()
        .eq('asset_id', assetId)
        .eq('project_id', projectId)
        .in('attribute_id', responsesToDelete);

      if (deleteError) {
        console.error('Error deleting blank responses:', deleteError);
        // Continue with upsert even if deletion fails
      }
    }

    // Upsert non-blank responses (insert or update if exists)
    let savedResponses = [];
    if (responsesToUpsert.length > 0) {
      const { data: upsertedResponses, error: upsertError } = await req.supabase
        .from('attribute_values')
        .upsert(responsesToUpsert, {
          onConflict: 'asset_id,attribute_id'
        })
        .select();

      if (upsertError) {
        console.error('Error upserting responses:', upsertError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save responses'
        });
      }
      
      savedResponses = upsertedResponses || [];
    }

    res.status(200).json({
      success: true,
      message: 'Responses saved successfully',
      data: savedResponses,
      deletedPhotos: photosToDelete.length,
      deletedResponses: responsesToDelete.length
    });

  } catch (error) {
    console.error('Error in submitAttributeValues:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// @desc    Get all attribute values for a project (for reporting)
// @route   GET /api/questionnaire/:projectId/responses
// @access  Private
const getProjectAttributeValues = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  try {
    const { data: responses, error } = await req.supabase
      .from('attribute_values')
      .select(`
        *,
        assets(id, title, asset_type_id),
        asset_types(id, title)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch responses'
      });
    }

    res.status(200).json({
      success: true,
      data: responses || []
    });

  } catch (error) {
    console.error('Error in getProjectResponses:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// @desc    Delete attribute value and associated photos
// @route   DELETE /api/questionnaire/:projectId/asset/:assetId/response/:responseId
// @access  Private
const deleteAttributeValue = asyncHandler(async (req, res) => {
  const { projectId, assetId, responseId } = req.params;

  try {
    // First, get the response to extract photo paths
    const { data: response, error: fetchError } = await req.supabase
      .from('attribute_values')
      .select('*')
      .eq('id', responseId)
      .eq('asset_id', assetId)
      .eq('project_id', projectId)
      .single();

    if (fetchError || !response) {
      return res.status(404).json({
        success: false,
        error: 'Attribute value not found'
      });
    }

    // Extract photo paths from response_metadata
    const photosToDelete = [];
    if (response.response_metadata && response.response_metadata.photos) {
      const photos = response.response_metadata.photos;
      if (Array.isArray(photos)) {
        photos.forEach(photo => {
          // Photo path can be in photo.path or extracted from photo.url
          if (photo.path) {
            photosToDelete.push(photo.path);
          } else if (photo.url && photo.url.includes('/project-files/')) {
            // Extract path from URL if path is not available
            const urlMatch = photo.url.match(/\/project-files\/(.+)$/);
            if (urlMatch) {
              photosToDelete.push(decodeURIComponent(urlMatch[1]));
            }
          }
        });
      }
    }

    // Delete photos from storage bucket
    if (photosToDelete.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('project-files')
        .remove(photosToDelete);

      if (storageError) {
        console.error('Error deleting photos from storage:', storageError);
        // Continue with response deletion even if photo deletion fails
        // Log the error but don't fail the request
      }
    }

    // Delete the response from the database
    const { error: deleteError } = await req.supabase
      .from('attribute_values')
      .delete()
      .eq('id', responseId)
      .eq('asset_id', assetId)
      .eq('project_id', projectId);

    if (deleteError) {
      console.error('Error deleting attribute value:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete attribute value',
        details: deleteError.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attribute value and associated photos deleted successfully',
      deletedPhotos: photosToDelete.length
    });

  } catch (error) {
    console.error('Error in deleteAttributeValue:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// @desc    Parse spreadsheet and return preview for attribute value import
// @route   POST /api/questionnaire/:projectId/import/preview
// @access  Private
const previewImport = [
  spreadsheetUpload.single('file'),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    try {
      // Parse the file based on extension
      const ext = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf('.'));
      let workbook;
      
      if (ext === '.csv') {
        const csvContent = req.file.buffer.toString('utf-8');
        workbook = XLSX.read(csvContent, { type: 'string' });
      } else if (ext === '.tsv') {
        const tsvContent = req.file.buffer.toString('utf-8');
        workbook = XLSX.read(tsvContent, { type: 'string', FS: '\t' });
      } else {
        workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (data.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'File must contain at least a header row and one data row'
        });
      }

      const headers = data[0].map(h => String(h).trim());
      const rows = data.slice(1).filter(row => row.some(cell => cell !== ''));

      // Get assets for this project
      const { data: assets, error: assetsError } = await req.supabase
        .from('assets')
        .select('id, title, asset_type_id')
        .eq('project_id', projectId);

      if (assetsError) {
        console.error('Error fetching assets:', assetsError);
        return res.status(500).json({ success: false, error: 'Failed to fetch project assets' });
      }

      // Get asset types and their attributes
      const { data: assetTypes, error: typesError } = await req.supabase
        .from('asset_types')
        .select('id, title, project_id')
        .eq('project_id', projectId);

      if (typesError) {
        console.error('Error fetching asset types:', typesError);
      }

      // Get all attributes for this project's asset types
      const typeIds = (assetTypes || []).map(t => t.id);
      let attributes = [];
      if (typeIds.length > 0) {
        const { data: attrsData, error: attrsError } = await req.supabase
          .from('attributes')
          .select('id, title, asset_type_id, type')
          .in('asset_type_id', typeIds);

        if (!attrsError && attrsData) {
          attributes = attrsData;
        }
      }

      res.status(200).json({
        success: true,
        data: {
          fileName: req.file.originalname,
          headers,
          previewRows: rows.slice(0, 10), // First 10 rows for preview
          totalRows: rows.length,
          assets: assets || [],
          assetTypes: assetTypes || [],
          attributes
        }
      });

    } catch (error) {
      console.error('Error parsing file:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to parse file',
        details: error.message
      });
    }
  })
];

// @desc    Import attribute values from spreadsheet
// @route   POST /api/questionnaire/:projectId/import
// @access  Private
const importAttributeValues = [
  spreadsheetUpload.single('file'),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { assetColumn, attributeMappings } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    if (assetColumn === undefined || assetColumn === null) {
      return res.status(400).json({ success: false, error: 'Asset column mapping is required' });
    }

    // Parse attributeMappings from JSON string if needed
    let mappings;
    try {
      mappings = typeof attributeMappings === 'string' 
        ? JSON.parse(attributeMappings) 
        : attributeMappings;
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid attribute mappings format' });
    }

    if (!mappings || Object.keys(mappings).length === 0) {
      return res.status(400).json({ success: false, error: 'At least one attribute mapping is required' });
    }

    try {
      // Parse the file
      const ext = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf('.'));
      let workbook;
      
      if (ext === '.csv') {
        const csvContent = req.file.buffer.toString('utf-8');
        workbook = XLSX.read(csvContent, { type: 'string' });
      } else if (ext === '.tsv') {
        const tsvContent = req.file.buffer.toString('utf-8');
        workbook = XLSX.read(tsvContent, { type: 'string', FS: '\t' });
      } else {
        workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      const headers = data[0];
      const rows = data.slice(1).filter(row => row.some(cell => cell !== ''));

      // Get assets for matching
      const { data: assets, error: assetsError } = await req.supabase
        .from('assets')
        .select('id, title, asset_type_id')
        .eq('project_id', projectId);

      if (assetsError) {
        return res.status(500).json({ success: false, error: 'Failed to fetch project assets' });
      }

      // Create asset lookup map (by title, case-insensitive)
      const assetMap = new Map();
      (assets || []).forEach(asset => {
        assetMap.set(asset.title.toLowerCase().trim(), asset);
      });

      // Get attributes info
      const attrIds = Object.keys(mappings);
      const { data: attributesData } = await req.supabase
        .from('attributes')
        .select('id, title, type')
        .in('id', attrIds);

      const attributeInfo = new Map();
      (attributesData || []).forEach(attr => {
        attributeInfo.set(attr.id, attr);
      });

      // Process each row
      const results = {
        imported: 0,
        skipped: 0,
        errors: []
      };

      const responsesToUpsert = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Account for header and 0-indexing

        // Get asset identifier from the row
        const assetIdentifier = String(row[parseInt(assetColumn)] || '').trim().toLowerCase();
        
        if (!assetIdentifier) {
          results.skipped++;
          results.errors.push({ row: rowNum, error: 'Empty asset identifier' });
          continue;
        }

        // Find matching asset
        const asset = assetMap.get(assetIdentifier);
        
        if (!asset) {
          results.skipped++;
          results.errors.push({ row: rowNum, error: `Asset not found: "${row[parseInt(assetColumn)]}"` });
          continue;
        }

        // Process each attribute mapping
        for (const [attrId, colIndex] of Object.entries(mappings)) {
          const value = row[parseInt(colIndex)];
          const attrInfo = attributeInfo.get(attrId);
          
          if (value === undefined || value === null || value === '') {
            continue; // Skip empty values
          }

          // Validate number type
          let responseValue = String(value);
          if (attrInfo && attrInfo.type === 'number') {
            const numVal = parseFloat(value);
            if (isNaN(numVal)) {
              results.errors.push({ 
                row: rowNum, 
                error: `Invalid number for attribute "${attrInfo.title}": "${value}"` 
              });
              continue;
            }
            responseValue = String(numVal);
          }

          responsesToUpsert.push({
            project_id: projectId,
            asset_id: asset.id,
            asset_type_id: asset.asset_type_id,
            attribute_id: attrId,
            attribute_title: attrInfo ? attrInfo.title : 'Unknown',
            response_value: responseValue,
            response_metadata: {},
            created_by: req.user.id
          });
        }

        results.imported++;
      }

      // Batch upsert responses
      if (responsesToUpsert.length > 0) {
        const { error: upsertError } = await req.supabase
          .from('attribute_values')
          .upsert(responsesToUpsert, {
            onConflict: 'asset_id,attribute_id'
          });

        if (upsertError) {
          console.error('Error upserting responses:', upsertError);
          return res.status(500).json({
            success: false,
            error: 'Failed to save responses',
            details: upsertError.message
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Successfully imported responses for ${results.imported} assets`,
        data: {
          totalRows: rows.length,
          imported: results.imported,
          skipped: results.skipped,
          responsesCreated: responsesToUpsert.length,
          errors: results.errors.slice(0, 20) // Return first 20 errors
        }
      });

    } catch (error) {
      console.error('Error importing responses:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import responses',
        details: error.message
      });
    }
  })
];

// @desc    Download template for attribute value import
// @route   GET /api/questionnaire/:projectId/import/template
// @access  Private
const downloadTemplate = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { assetTypeId } = req.query;

  try {
    // Get assets for this project (optionally filtered by type)
    let assetsQuery = req.supabase
      .from('assets')
      .select('id, title, asset_type_id')
      .eq('project_id', projectId);

    if (assetTypeId) {
      assetsQuery = assetsQuery.eq('asset_type_id', assetTypeId);
    }

    const { data: assets, error: assetsError } = await assetsQuery;

    if (assetsError) {
      return res.status(500).json({ success: false, error: 'Failed to fetch assets' });
    }

    // Get attributes for the asset type
    let attributes = [];
    if (assetTypeId) {
      const { data: attrsData } = await req.supabase
        .from('attributes')
        .select('id, title, type')
        .eq('asset_type_id', assetTypeId)
        .order('created_at');

      attributes = attrsData || [];
    } else {
      // Get all unique attributes for all asset types in the project
      const { data: assetTypes } = await req.supabase
        .from('asset_types')
        .select('id')
        .eq('project_id', projectId);

      if (assetTypes && assetTypes.length > 0) {
        const typeIds = assetTypes.map(t => t.id);
        const { data: attrsData } = await req.supabase
          .from('attributes')
          .select('id, title, type, asset_type_id')
          .in('asset_type_id', typeIds)
          .order('created_at');

        attributes = attrsData || [];
      }
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create header row: Asset Name + all attributes
    const headers = ['Asset Name', ...attributes.map(a => a.title)];
    
    // Create data rows with asset names
    const dataRows = (assets || []).map(asset => {
      const row = [asset.title];
      // Add empty cells for each attribute
      attributes.forEach(() => row.push(''));
      return row;
    });

    // Create worksheet
    const wsData = [headers, ...dataRows];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = headers.map(h => ({ wch: Math.max(15, h.length + 2) }));
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attribute Values');

    // Generate buffer - use 'array' type and convert to Buffer for compatibility
    const xlsxData = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const buffer = Buffer.from(xlsxData);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="attribute_values_template.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate template',
      details: error.message
    });
  }
});

export {
  getAssetQuestionnaire,
  submitAttributeValues,
  getProjectAttributeValues,
  deleteAttributeValue,
  previewImport,
  importAttributeValues,
  downloadTemplate
};

