import asyncHandler from 'express-async-handler';
import multer from 'multer';
import supabaseClient from '../config/supabaseClient.js';
const { supabaseAdmin } = supabaseClient;

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Upload file to Supabase Storage
const uploadFile = [
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required' });
    }

    // Verify project access
    const { data: projectUser, error: projectUserError } = await req.supabase
      .from('project_users')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', req.user.id)
      .single();

    if (projectUserError || !projectUser) {
      // Check if owner
      const { data: project, error: projectError } = await req.supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('owner_id', req.user.id)
        .single();

      if (projectError || !project) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    try {
      // Create unique storage path: projectId/files/timestamp_filename
      // Organized in 'files' folder to separate from photos
      const timestamp = Date.now();
      const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${projectId}/files/${timestamp}_${sanitizedFileName}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('project-files')
        .upload(storagePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return res.status(500).json({ success: false, error: 'Failed to upload file to storage' });
      }

      // Store file metadata in database
      const { data: fileRecord, error: dbError } = await req.supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          file_name: req.file.originalname,
          storage_path: storagePath,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
          uploaded_by: req.user.id
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Cleanup: delete from storage if DB insert fails
        await supabaseAdmin.storage.from('project-files').remove([storagePath]);
        return res.status(500).json({ success: false, error: 'Failed to save file record' });
      }

      res.status(201).json({ success: true, data: fileRecord });

    } catch (error) {
      console.error('Error in uploadFile:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  })
];

// List files for a project
const listFiles = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({ success: false, error: 'Project ID is required' });
  }

  // Verify project access
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
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
  }

  try {
    const { data: files, error } = await req.supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing files:', error);
      return res.status(500).json({ success: false, error: 'Failed to list files' });
    }

    res.status(200).json({ success: true, data: files || [] });

  } catch (error) {
    console.error('Error in listFiles:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get signed URL for file download/access
const getFileUrl = asyncHandler(async (req, res) => {
  const { projectId, fileId } = req.params;

  if (!projectId || !fileId) {
    return res.status(400).json({ success: false, error: 'Project ID and File ID are required' });
  }

  try {
    // Get file record (RLS will check access)
    const { data: file, error } = await req.supabase
      .from('project_files')
      .select('*')
      .eq('id', fileId)
      .eq('project_id', projectId)
      .single();

    if (error || !file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
      .from('project-files')
      .createSignedUrl(file.storage_path, 3600);

    if (urlError) {
      console.error('Error generating signed URL:', urlError);
      return res.status(500).json({ success: false, error: 'Failed to generate download URL' });
    }

    res.status(200).json({ 
      success: true, 
      data: { 
        ...file, 
        url: signedUrlData.signedUrl 
      } 
    });

  } catch (error) {
    console.error('Error in getFileUrl:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Download file content (for processing)
const downloadFile = asyncHandler(async (req, res) => {
  const { projectId, fileId } = req.params;

  if (!projectId || !fileId) {
    return res.status(400).json({ success: false, error: 'Project ID and File ID are required' });
  }

  try {
    // Get file record
    const { data: file, error } = await req.supabase
      .from('project_files')
      .select('*')
      .eq('id', fileId)
      .eq('project_id', projectId)
      .single();

    if (error || !file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('project-files')
      .download(file.storage_path);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      return res.status(500).json({ success: false, error: 'Failed to download file' });
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.status(200).json({ 
      success: true, 
      data: {
        file: file,
        buffer: buffer.toString('base64'),
        mimeType: file.mime_type
      }
    });

  } catch (error) {
    console.error('Error in downloadFile:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete file
const deleteFile = asyncHandler(async (req, res) => {
  const { projectId, fileId } = req.params;

  if (!projectId || !fileId) {
    return res.status(400).json({ success: false, error: 'Project ID and File ID are required' });
  }

  try {
    // Get file record
    const { data: file, error } = await req.supabase
      .from('project_files')
      .select('storage_path')
      .eq('id', fileId)
      .eq('project_id', projectId)
      .single();

    if (error || !file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('project-files')
      .remove([file.storage_path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue to delete DB record even if storage delete fails
    }

    // Delete from database
    const { error: dbError } = await req.supabase
      .from('project_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      console.error('Error deleting file record:', dbError);
      return res.status(500).json({ success: false, error: 'Failed to delete file record' });
    }

    res.status(200).json({ success: true, message: 'File deleted successfully' });

  } catch (error) {
    console.error('Error in deleteFile:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default { uploadFile, listFiles, getFileUrl, downloadFile, deleteFile };

