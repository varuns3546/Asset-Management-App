import express from 'express';
import fileController from '../controllers/fileController.js';
import supabaseClient from '../config/supabaseClient.js';

const {
  uploadFile,
  listFiles,
  getFileUrl,
  downloadFile,
  deleteFile
} = fileController;
const { authenticateUser } = supabaseClient;

const router = express.Router();

// Upload file to project storage
router.post('/:projectId/upload', authenticateUser, uploadFile);

// List all files for a project
router.get('/:projectId', authenticateUser, listFiles);

// Get signed URL for a specific file
router.get('/:projectId/:fileId/url', authenticateUser, getFileUrl);

// Download file content (for processing)
router.get('/:projectId/:fileId/download', authenticateUser, downloadFile);

// Delete a file
router.delete('/:projectId/:fileId', authenticateUser, deleteFile);

export default router;

