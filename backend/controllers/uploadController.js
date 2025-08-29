import asyncHandler from 'express-async-handler';
import multer from 'multer';
import { decode } from 'base64-arraybuffer';

// File type configurations
const allowedDocumentExtensions = [
  '.doc', '.docx',
  '.xls', '.xlsx', '.xlsm',
  '.ppt', '.pptx', '.pptm',
  '.xltx', '.xltm',
  '.dotx', '.dotm',
  '.potx', '.potm',
  '.pdf', '.txt'
];

const allowedPhotoExtensions = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'
];

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  const fileExtension = '.' + file.originalname.split('.').pop().toLowerCase();
  
  console.log('File filter check:', {
    routePath: req.route?.path,
    originalName: file.originalname,
    fileExtension,
    isDocumentRoute: req.route?.path?.includes('document'),
    isPhotoRoute: req.route?.path?.includes('photo')
  });
  
  if (req.route.path.includes('document')) {
    if (allowedDocumentExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Document type not allowed. Allowed types: ${allowedDocumentExtensions.join(', ')}`), false);
    }
  } else if (req.route.path.includes('photo')) {
    if (allowedPhotoExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Photo type not allowed. Allowed types: ${allowedPhotoExtensions.join(', ')}`), false);
    }
  } else {
    // For generic uploads, allow both
    if ([...allowedDocumentExtensions, ...allowedPhotoExtensions].includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
};

// Create multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 KB';
  
  const k = 1024;
  const mb = k * k;
  
  if (bytes >= mb) {
    return (bytes / mb).toFixed(2) + ' MB';
  } else {
    return (bytes / k).toFixed(2) + ' KB';
  }
};

// Helper function to upload file to Supabase
const uploadToSupabase = async (file, title, projectId, folder = 'uploads', supabaseClient) => {
  try {
    // Convert buffer to base64 then to ArrayBuffer
    const fileBase64 = decode(file.buffer.toString('base64'));
    
    // Generate unique filename with readable timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace('T', '_').replace(/\.\d{3}Z$/, ''); // Format: 2024-01-15_10:30:45
    const fileExtension = '.' + file.originalname.split('.').pop().toLowerCase();
    
    // Use title if provided, otherwise use original filename
    let baseFileName;
    if (title && title.trim()) {
      // Clean the title for filename use
      baseFileName = title.trim().replace(/[^a-zA-Z0-9.-]/g, '_');
    } else {
      baseFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    }
    
    const fileName = `${timestamp}-${baseFileName}`;
    const filePath = `${projectId}/${folder}/${fileName}`;
    
    // Upload to Supabase Storage using authenticated client
    const { data, error } = await supabaseClient.storage
      .from('uploads')
      .upload(filePath, fileBase64, {
        contentType: file.mimetype,
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    
    
    return {
      path: data.path,
      fileName: fileName,
      originalName: file.originalname,
      title: title || null,
      fileSize: file.size, // Keep original bytes for reference
      fileSizeFormatted: formatFileSize(file.size), // Add formatted size
      mimeType: file.mimetype
    };
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Get all documents for the specified project
const getDocuments = asyncHandler(async (req, res) => {
  try {
    const { project_id } = req.query;
    
    if (!project_id) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    // Verify the project belongs to the authenticated user
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
    
    // List files in the documents folder
    const { data, error } = await req.supabase.storage
      .from('uploads')
      .list(`${project_id}/documents`, {
        limit: 100,
        offset: 0
      });
    
    if (error) {
      throw error;
    }
    
    // Convert file size to readable format (KB or MB)
   
    
    // Get file information
    const documentsWithInfo = data.map((file) => {
      const fileSize = file.metadata?.size || 0;
      
      return {
        id: file.id,
        name: file.name,
        size: fileSize,
        sizeFormatted: formatFileSize(fileSize),
        created_at: file.created_at,
        updated_at: file.updated_at
      };
    });
    
    res.status(200).json({
      success: true,
      data: documentsWithInfo,
      count: documentsWithInfo.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents',
      error: error.message
    });
  }
});

// Get all photos for the specified project
const getPhotos = asyncHandler(async (req, res) => {
  try {
    const { project_id } = req.query;
    
    if (!project_id) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    // Verify the project belongs to the authenticated user
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
    
    // List files in the photos folder
    const { data, error } = await req.supabase.storage
      .from('uploads')
      .list(`${project_id}/photos`, {
        limit: 100,
        offset: 0
      });
    
    if (error) {
      throw error;
    }
    
    // Convert file size to readable format (KB or MB)

    
    // Get file information
    const photosWithInfo = data.map((file) => {
      const fileSize = file.metadata?.size || 0;
      
      return {
        id: file.id,
        name: file.name,
        size: fileSize,
        sizeFormatted: formatFileSize(fileSize),
        created_at: file.created_at,
        updated_at: file.updated_at
      };
    });
    
    res.status(200).json({
      success: true,
      data: photosWithInfo,
      count: photosWithInfo.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve photos',
      error: error.message
    });
  }
});

// Get specific document by filename
const getDocument = asyncHandler(async (req, res) => {
  try {
    const { fileName } = req.params; // This will be just the filename
    const { project_id } = req.query;
    
    if (!project_id) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    // Verify the project belongs to the authenticated user
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
    
    // Get file from documents folder
    const { data, error } = await req.supabase.storage
      .from('uploads')
      .list(`${project_id}/documents`, {
        limit: 100,
        offset: 0
      });
    
    if (error) {
      throw error;
    }
    
    const file = data.find(f => f.name === fileName);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    const fileSize = file.metadata?.size || 0;
    const filePath = `${project_id}/documents/${file.name}`;
    
    res.status(200).json({
      success: true,
      data: {
        id: file.id,
        name: file.name,
        path: filePath,
        size: fileSize,
        sizeFormatted: formatFileSize(fileSize),
        type: 'documents',
        created_at: file.created_at,
        updated_at: file.updated_at,
        mimeType: file.metadata?.mimetype || 'unknown'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document',
      error: error.message
    });
  }
});

// Get specific photo by filename
const getPhoto = asyncHandler(async (req, res) => {
  try {
    const { fileName } = req.params; // This will be just the filename
    const { project_id } = req.query;
    
    if (!project_id) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    // Verify the project belongs to the authenticated user
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
    
    // Get file from photos folder
    const { data, error } = await req.supabase.storage
      .from('uploads')
      .list(`${project_id}/photos`, {
        limit: 100,
        offset: 0
      });
    
    if (error) {
      throw error;
    }
    
    const file = data.find(f => f.name === fileName);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }
    
    const fileSize = file.metadata?.size || 0;
    const filePath = `${project_id}/photos/${file.name}`;
    
    res.status(200).json({
      success: true,
      data: {
        id: file.id,
        name: file.name,
        path: filePath,
        size: fileSize,
        sizeFormatted: formatFileSize(fileSize),
        type: 'photos',
        created_at: file.created_at,
        updated_at: file.updated_at,
        mimeType: file.metadata?.mimetype || 'unknown'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve photo',
      error: error.message
    });
  }
});

// Upload documents with multer middleware (supports multiple files)
const uploadDocuments = [
  upload.array('documents', 100),
  asyncHandler(async (req, res) => {
    try {
      console.log('Upload documents request:', {
        body: req.body,
        files: req.files ? req.files.map(file => ({
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        })) : null,
        headers: req.headers,
        contentType: req.headers['content-type']
      });
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No document files provided'
        });
      }

      const { project_id } = req.body;
      
      if (!project_id) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required'
        });
      }

      // Verify the project belongs to the authenticated user
      const { data: project, error: projectError } = await req.supabase
        .from('projects')
        .select('id')
        .eq('id', project_id)
        .eq('user_id', req.user.id)
        .single();

      if (projectError || !project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found or access denied'
        });
      }
      
      const uploadPromises = req.files.map(async (file, index) => {
        // Use title from body if provided, otherwise use original filename
        const title = req.body.titles && req.body.titles[index] ? req.body.titles[index] : null;
        return await uploadToSupabase(file, title, project_id, 'documents', req.supabase);
      });
      
      const uploadResults = await Promise.all(uploadPromises);
      
      const uploadedFiles = uploadResults.map(uploadResult => ({
        id: uploadResult.fileName, // Use fileName as id for consistency
        name: uploadResult.fileName,
        size: uploadResult.fileSize,
        sizeFormatted: uploadResult.fileSizeFormatted,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        type: 'document'
      }));
      
      res.status(201).json({
        success: true,
        message: `${uploadedFiles.length} document(s) uploaded successfully`,
        data: uploadedFiles,
        count: uploadedFiles.length
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Document upload failed',
        error: error.message
      });
    }
  }),
  // Error handling middleware for multer
  (error, req, res, next) => {
    console.error('Multer error:', error);
    console.error('Multer error details:', {
      code: error.code,
      field: error.field,
      message: error.message,
      stack: error.stack
    });
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
];

// Upload photos with multer middleware (supports multiple files)
const uploadPhotos = [
  (req, res, next) => {
    console.log('Before multer middleware:', {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length']
    });
    next();
  },
  upload.array('photos', 300), // Allow up to 300 photos at once
  (req, res, next) => {
    console.log('After multer middleware:', {
      filesCount: req.files ? req.files.length : 0,
      bodyKeys: Object.keys(req.body),
      files: req.files ? req.files.map(file => ({
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      })) : null
    });
    next();
  },
  asyncHandler(async (req, res) => {
    try {
      console.log('Upload photos request:', {
        body: req.body,
        files: req.files ? req.files.map(file => ({
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        })) : null,
        filesCount: req.files ? req.files.length : 0,
        contentType: req.headers['content-type']
      });
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No photo files provided'
        });
      }

      const { project_id } = req.body;
      
      if (!project_id) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required'
        });
      }

      // Verify the project belongs to the authenticated user
      const { data: project, error: projectError } = await req.supabase
        .from('projects')
        .select('id')
        .eq('id', project_id)
        .eq('user_id', req.user.id)
        .single();

      if (projectError || !project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found or access denied'
        });
      }
      
      const uploadPromises = req.files.map(async (file, index) => {
        // Use title from body if provided, otherwise use original filename
        const title = req.body.titles && req.body.titles[index] ? req.body.titles[index] : null;
        return await uploadToSupabase(file, title, project_id, 'photos', req.supabase);
      });
      
      const uploadResults = await Promise.all(uploadPromises);
      
      const uploadedFiles = uploadResults.map(uploadResult => ({
        id: uploadResult.fileName, // Use fileName as id for consistency
        name: uploadResult.fileName,
        size: uploadResult.fileSize,
        sizeFormatted: uploadResult.fileSizeFormatted,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        type: 'photo'
      }));
      
      res.status(201).json({
        success: true,
        message: `${uploadedFiles.length} photo(s) uploaded successfully`,
        data: uploadedFiles,
        count: uploadedFiles.length
      });
    } catch (error) {
      console.error('Photo upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Photo upload failed',
        error: error.message
      });
    }
  }),
  // Error handling middleware for multer
  (error, req, res, next) => {
    console.error('Multer error:', error);
    console.error('Multer error details:', {
      code: error.code,
      field: error.field,
      message: error.message,
      stack: error.stack
    });
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
];

// Delete document
const deleteDocument = asyncHandler(async (req, res) => {
  try {
    const { fileName } = req.params; // This will be just the filename
    const { project_id } = req.query;
    
    if (!project_id) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    // Verify the project belongs to the authenticated user
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
    
    // Get file from documents folder
    const { data, error } = await req.supabase.storage
      .from('uploads')
      .list(`${project_id}/documents`, {
        limit: 100,
        offset: 0
      });
    
    if (error) {
      throw error;
    }
    
    const file = data.find(f => f.name === fileName);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Delete the file using the full path
    const filePath = `${project_id}/documents/${file.name}`;
    const { error: deleteError } = await req.supabase.storage
      .from('uploads')
      .remove([filePath]);
    
    if (deleteError) {
      throw deleteError;
    }
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      data: {
        deletedFile: file.name,
        fileType: 'documents'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
});

// Delete photo
const deletePhoto = asyncHandler(async (req, res) => {
  try {
    const { fileName } = req.params; // This will be just the filename
    const { project_id } = req.query;
    
    if (!project_id) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    // Verify the project belongs to the authenticated user
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
    
    // Get file from photos folder
    const { data, error } = await req.supabase.storage
      .from('uploads')
      .list(`${project_id}/photos`, {
        limit: 100,
        offset: 0
      });
    
    if (error) {
      throw error;
    }
    
    const file = data.find(f => f.name === fileName);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }
    
    // Delete the file using the full path
    const filePath = `${project_id}/photos/${file.name}`;
    const { error: deleteError } = await req.supabase.storage
      .from('uploads')
      .remove([filePath]);
    
    if (deleteError) {
      throw deleteError;
    }
    
    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
      data: {
        deletedFile: file.name,
        fileType: 'photos'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete photo',
      error: error.message
    });
  }
});

export default {
  getDocuments,
  getPhotos,
  getDocument,
  getPhoto,
  uploadDocuments,
  uploadPhotos,
  deleteDocument,
  deletePhoto,
  // Export multer middleware for use in routes if needed
  upload
};