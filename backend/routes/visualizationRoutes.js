import express from 'express';
import supabaseClient from '../config/supabaseClient.js';
import {
  getAttributeValueStats,
  getAssetStats,
  getProjectStats
} from '../controllers/visualizationController.js';

const router = express.Router();
const { authenticateUser } = supabaseClient;

// All routes require authentication
router.use(authenticateUser);

router.get('/:projectId/questionnaire-stats', getAttributeValueStats);
router.get('/:projectId/asset-stats', getAssetStats);
router.get('/:projectId/project-stats', getProjectStats);

export default router;

