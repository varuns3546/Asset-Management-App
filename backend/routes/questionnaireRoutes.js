import express from 'express';
import {
  getAssetQuestionnaire,
  submitQuestionnaireResponses,
  getProjectResponses
} from '../controllers/questionnaireController.js';
import supabaseClient from '../config/supabaseClient.js';

const router = express.Router();
const { authenticateUser } = supabaseClient;

// All routes require authentication
router.use(authenticateUser);

router.get('/:projectId/asset/:assetId', getAssetQuestionnaire);
router.post('/:projectId/asset/:assetId/submit', submitQuestionnaireResponses);
router.get('/:projectId/responses', getProjectResponses);

export default router;

