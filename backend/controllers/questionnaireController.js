import asyncHandler from 'express-async-handler';
import supabaseClient from '../config/supabaseClient.js';

const { supabaseAdmin } = supabaseClient;

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
    if (asset.item_type_id) {
      const { data: typeData, error: typeError } = await req.supabase
        .from('asset_types')
        .select('*')
        .eq('id', asset.item_type_id)
        .single();

      if (typeError) {
        console.error('Error fetching asset type:', typeError);
      } else {
        assetType = typeData;
      }
    }

    // Get attributes for this asset type (only if asset has a type)
    let attributes = [];
    if (asset.item_type_id) {
      const { data: attributesData, error: attributesError } = await req.supabase
        .from('attributes')
        .select('*')
        .eq('item_type_id', asset.item_type_id)
        .order('created_at');

      if (attributesError) {
        console.error('Error fetching attributes:', attributesError);
        // Don't fail the request if attributes can't be fetched
        // The asset may not have any attributes defined yet
      } else {
        attributes = attributesData || [];
      }
    }

    // Get existing responses for this asset (table might not exist yet)
    let responsesMap = {};
    const { data: responses, error: responsesError } = await req.supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('asset_id', assetId);

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
            // Don't fail the request if responses table doesn't exist
    } else if (responses) {
      // Process each response and ensure photos have valid URLs
      // Photos are stored in response_metadata.photos in questionnaire_responses table
      for (const r of responses) {
        // Get photos from response_metadata (stored in questionnaire_responses table)
        const responseMetadata = r.response_metadata ? { ...r.response_metadata } : {};
        
        // Process photos if they exist in metadata
        if (responseMetadata.photos && Array.isArray(responseMetadata.photos) && responseMetadata.photos.length > 0) {
          // Map photos and ensure they have valid public URLs
          responseMetadata.photos = await Promise.all(responseMetadata.photos.map(async (photo) => {
            // photo.path contains the storage path, photo.url might be an old URL
            let photoUrl = photo.url;
            let filePath = photo.path;
            
            console.log('Processing photo:', {
              name: photo.name || photo.file_name,
              url: photo.url,
              path: photo.path,
              fullPhoto: photo
            });
            
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
                  console.log('Generated signed URL:', {
                    filePath,
                    signedUrl: photoUrl
                  });
                } else {
                  console.error('Error generating signed URL:', signedError);
                  // Fallback to public URL if signed URL fails
                  try {
                    const { data: urlData } = supabaseAdmin.storage
                      .from('project-files')
                      .getPublicUrl(filePath);
                    photoUrl = urlData.publicUrl;
                    console.log('Fallback to public URL:', photoUrl);
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
                    console.log('Regenerated signed URL from existing URL:', photoUrl);
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

// @desc    Submit/Update questionnaire responses
// @route   POST /api/questionnaire/:projectId/asset/:assetId/submit
// @access  Private
const submitQuestionnaireResponses = asyncHandler(async (req, res) => {
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
      .select('id, item_type_id, project_id')
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
      .from('questionnaire_responses')
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

    // Prepare data for upsert
    const responsesToUpsert = responses.map(r => ({
      project_id: projectId,
      asset_id: assetId,
      asset_type_id: asset.item_type_id,
      attribute_id: r.attributeId,
      attribute_title: r.attributeTitle,
      response_value: r.value || null,
      response_metadata: r.metadata || {},
      created_by: req.user.id
    }));

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
      } else {
        console.log(`Successfully deleted ${photosToDelete.length} removed photo(s) from storage`);
      }
    }

    // Upsert responses (insert or update if exists)
    const { data: savedResponses, error: upsertError } = await req.supabase
      .from('questionnaire_responses')
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

    res.status(200).json({
      success: true,
      message: 'Responses saved successfully',
      data: savedResponses,
      deletedPhotos: photosToDelete.length
    });

  } catch (error) {
    console.error('Error in submitQuestionnaireResponses:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// @desc    Get all responses for a project (for reporting)
// @route   GET /api/questionnaire/:projectId/responses
// @access  Private
const getProjectResponses = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  try {
    const { data: responses, error } = await req.supabase
      .from('questionnaire_responses')
      .select(`
        *,
        assets(id, title, item_type_id),
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

// @desc    Delete questionnaire response and associated photos
// @route   DELETE /api/questionnaire/:projectId/asset/:assetId/response/:responseId
// @access  Private
const deleteQuestionnaireResponse = asyncHandler(async (req, res) => {
  const { projectId, assetId, responseId } = req.params;

  try {
    // First, get the response to extract photo paths
    const { data: response, error: fetchError } = await req.supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('id', responseId)
      .eq('asset_id', assetId)
      .eq('project_id', projectId)
      .single();

    if (fetchError || !response) {
      return res.status(404).json({
        success: false,
        error: 'Questionnaire response not found'
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
      } else {
        console.log(`Successfully deleted ${photosToDelete.length} photo(s) from storage`);
      }
    }

    // Delete the response from the database
    const { error: deleteError } = await req.supabase
      .from('questionnaire_responses')
      .delete()
      .eq('id', responseId)
      .eq('asset_id', assetId)
      .eq('project_id', projectId);

    if (deleteError) {
      console.error('Error deleting questionnaire response:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete questionnaire response',
        details: deleteError.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Questionnaire response and associated photos deleted successfully',
      deletedPhotos: photosToDelete.length
    });

  } catch (error) {
    console.error('Error in deleteQuestionnaireResponse:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export {
  getAssetQuestionnaire,
  submitQuestionnaireResponses,
  getProjectResponses,
  deleteQuestionnaireResponse
};

