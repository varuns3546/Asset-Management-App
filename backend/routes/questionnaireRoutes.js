import express from 'express';
import {
  getAssetQuestionnaire,
  submitAttributeValues,
  getProjectAttributeValues,
  deleteAttributeValue,
  previewImport,
  importAttributeValues,
  downloadTemplate
} from '../controllers/questionnaireController.js';
import { uploadPhoto, deletePhoto } from '../controllers/photoController.js';
import supabaseClient from '../config/supabaseClient.js';

const router = express.Router();
const { authenticateUser } = supabaseClient;

// All routes require authentication
router.use(authenticateUser);

router.get('/:projectId/asset/:assetId', getAssetQuestionnaire);
router.post('/:projectId/asset/:assetId/submit', submitAttributeValues);
router.post('/:projectId/asset/:assetId/upload-photo', uploadPhoto); // uploadPhoto includes multer middleware
router.delete('/photo', deletePhoto); // File path sent as query parameter
router.delete('/:projectId/asset/:assetId/response/:responseId', deleteAttributeValue);
router.get('/:projectId/responses', getProjectAttributeValues);

// Import/Export routes
router.post('/:projectId/import/preview', previewImport);
router.post('/:projectId/import', importAttributeValues);
router.get('/:projectId/import/template', downloadTemplate);

export default router;

