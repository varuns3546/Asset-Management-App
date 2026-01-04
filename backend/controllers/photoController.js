import asyncHandler from 'express-async-handler';
import multer from 'multer';
import supabaseClient from '../config/supabaseClient.js';

const { supabaseAdmin } = supabaseClient;

// Configure multer for photo upload (consistent with fileController)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for photos
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @desc    Upload photo for attribute value
// @route   POST /api/questionnaire/:projectId/asset/:assetId/upload-photo
// @access  Private
const uploadPhoto = [
  upload.single('photo'),
  asyncHandler(async (req, res) => {
    const { projectId, assetId } = req.params;
    const { attributeId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No photo file provided'
      });
    }

    try {
      // List existing files in this attribute's folder to check for duplicates
      // Use project-files bucket with a photos subfolder to consolidate all files
      const folderPath = `${projectId}/photos/${assetId}`;
      const { data: existingFiles } = await supabaseAdmin.storage
        .from('project-files')
        .list(folderPath);

      // Get the original filename without extension
      const fileExt = req.file.originalname.split('.').pop();
      const fileNameWithoutExt = req.file.originalname.substring(0, req.file.originalname.lastIndexOf('.')) || req.file.originalname;
      const sanitizedBaseName = fileNameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '_');

      // Check for duplicates and find the next available number
      let finalFileName = `${sanitizedBaseName}.${fileExt}`;
      let counter = 0;
      
      if (existingFiles) {
        const existingNames = existingFiles.map(f => f.name);
        
        // First check if base name exists (without number)
        const baseExists = existingNames.some(name => name === `${attributeId}_${sanitizedBaseName}.${fileExt}`);
        
        if (baseExists) {
          // Base name exists, start counting from 1
          counter = 1;
          finalFileName = `${sanitizedBaseName}.${fileExt}(${counter})`;
          
          // Find the next available number
          while (existingNames.some(name => name === `${attributeId}_${finalFileName}`)) {
            counter++;
            finalFileName = `${sanitizedBaseName}.${fileExt}(${counter})`;
          }
        }
      }

      // Create the storage path
      const fileName = `${folderPath}/${attributeId}_${finalFileName}`;
      
      // Upload to Supabase Storage (using project-files bucket to consolidate)
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('project-files')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading to Supabase Storage:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload photo',
          details: uploadError.message
        });
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('project-files')
        .getPublicUrl(fileName);

      // Return the display name (with counter if applicable)
      const displayName = counter > 0 ? `${req.file.originalname}(${counter})` : req.file.originalname;

      res.status(200).json({
        success: true,
        data: {
          fileName: displayName,
          fileSize: req.file.size,
          filePath: fileName,
          publicUrl: urlData.publicUrl
        }
      });

    } catch (error) {
      console.error('Error in uploadPhoto:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while uploading photo'
      });
    }
  })
];

// @desc    Delete photo from storage
// @route   DELETE /api/questionnaire/photo?path=xxx&projectId=xxx&assetId=xxx&attributeId=xxx
// @access  Private
const deletePhoto = asyncHandler(async (req, res) => {
  // Extract file path and identifiers from query parameters
  const filePath = req.query.path;
  const projectId = req.query.projectId;
  const assetId = req.query.assetId;
  const attributeId = req.query.attributeId;
  
  if (!filePath) {
    return res.status(400).json({
      success: false,
      error: 'File path is required (use ?path=xxx query parameter)'
    });
  }

  try {
    // Delete photo from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('project-files')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting photo from storage:', storageError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete photo from storage',
        details: storageError.message
      });
    }

    // If we have identifiers, check if we need to delete the attribute_value entry
    if (projectId && assetId && attributeId) {
      try {
        // Get the current attribute_value entry
        const { data: attributeValue, error: fetchError } = await req.supabase
          .from('attribute_values')
          .select('response_value, response_metadata')
          .eq('project_id', projectId)
          .eq('asset_id', assetId)
          .eq('attribute_id', attributeId)
          .single();

        if (!fetchError && attributeValue) {
          // Check if entry is now empty (no value and no metadata or empty metadata)
          const isEmptyValue = !attributeValue.response_value || 
            (typeof attributeValue.response_value === 'string' && attributeValue.response_value.trim() === '');
          
          // Check metadata - if it's empty or only had this photo, consider it empty
          let isEmptyMetadata = true;
          if (attributeValue.response_metadata) {
            if (typeof attributeValue.response_metadata === 'object') {
              // Remove photos array and check if metadata is empty
              const metadataWithoutPhotos = { ...attributeValue.response_metadata };
              delete metadataWithoutPhotos.photos;
              isEmptyMetadata = Object.keys(metadataWithoutPhotos).length === 0;
            } else if (typeof attributeValue.response_metadata === 'string') {
              try {
                const parsed = JSON.parse(attributeValue.response_metadata);
                const metadataWithoutPhotos = { ...parsed };
                delete metadataWithoutPhotos.photos;
                isEmptyMetadata = Object.keys(metadataWithoutPhotos).length === 0;
              } catch (e) {
                isEmptyMetadata = true;
              }
            }
          }

          // If both value and metadata are empty, delete the entry
          if (isEmptyValue && isEmptyMetadata) {
            const { error: deleteError } = await req.supabase
              .from('attribute_values')
              .delete()
              .eq('project_id', projectId)
              .eq('asset_id', assetId)
              .eq('attribute_id', attributeId);

            if (deleteError) {
              console.error('Error deleting attribute_value entry:', deleteError);
              // Continue anyway, photo is already deleted from storage
            } else {
              return res.status(200).json({
                success: true,
                message: 'Photo deleted successfully and attribute_value entry removed',
                filePath,
                entryDeleted: true
              });
            }
          } else {
            // Update metadata to remove the photo reference
            let updatedMetadata = attributeValue.response_metadata;
            if (updatedMetadata) {
              if (typeof updatedMetadata === 'object') {
                updatedMetadata = { ...updatedMetadata };
                if (updatedMetadata.photos && Array.isArray(updatedMetadata.photos)) {
                  updatedMetadata.photos = updatedMetadata.photos.filter(photo => {
                    const photoPath = photo.path || (photo.url && photo.url.includes('/project-files/') 
                      ? decodeURIComponent(photo.url.match(/\/project-files\/(.+)$/)?.[1] || '')
                      : null);
                    return photoPath !== filePath;
                  });
                  // If photos array is empty, remove it
                  if (updatedMetadata.photos.length === 0) {
                    delete updatedMetadata.photos;
                  }
                }
              } else if (typeof updatedMetadata === 'string') {
                try {
                  const parsed = JSON.parse(updatedMetadata);
                  if (parsed.photos && Array.isArray(parsed.photos)) {
                    parsed.photos = parsed.photos.filter(photo => {
                      const photoPath = photo.path || (photo.url && photo.url.includes('/project-files/') 
                        ? decodeURIComponent(photo.url.match(/\/project-files\/(.+)$/)?.[1] || '')
                        : null);
                      return photoPath !== filePath;
                    });
                    if (parsed.photos.length === 0) {
                      delete parsed.photos;
                    }
                  }
                  updatedMetadata = parsed;
                } catch (e) {
                  // Invalid JSON, keep as is
                }
              }

              // Update the entry with new metadata
              const { error: updateError } = await req.supabase
                .from('attribute_values')
                .update({ response_metadata: updatedMetadata })
                .eq('project_id', projectId)
                .eq('asset_id', assetId)
                .eq('attribute_id', attributeId);

              if (updateError) {
                console.error('Error updating attribute_value metadata:', updateError);
                // Continue anyway, photo is already deleted from storage
              }
            }
          }
        }
      } catch (dbError) {
        console.error('Error checking/updating attribute_value entry:', dbError);
        // Continue anyway, photo is already deleted from storage
      }
    }

    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
      filePath
    });

  } catch (error) {
    console.error('Error in deletePhoto:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting photo'
    });
  }
});

export { uploadPhoto, deletePhoto };

