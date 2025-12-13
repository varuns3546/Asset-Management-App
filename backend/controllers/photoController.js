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

// @desc    Upload photo for questionnaire response
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
// @route   DELETE /api/questionnaire/photo?path=xxx
// @access  Private
const deletePhoto = asyncHandler(async (req, res) => {
  // Extract file path from query parameter
  const filePath = req.query.path;
  
  if (!filePath) {
    return res.status(400).json({
      success: false,
      error: 'File path is required (use ?path=xxx query parameter)'
    });
  }

  try {
    const { error } = await supabaseAdmin.storage
      .from('project-files')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting photo:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete photo',
        details: error.message
      });
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

