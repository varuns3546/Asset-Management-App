import express from 'express';
import supabaseClient from '../config/supabaseClient.js';
import {
  getQuestionnaireStats,
  getAssetStats,
  getProjectStats
} from '../controllers/visualizationController.js';

const router = express.Router();
const { authenticateUser } = supabaseClient;

// All routes require authentication
router.use(authenticateUser);

// Test route to verify routes are working
router.get('/test', (req, res) => {
  console.log('[visualizationRoutes] Test route hit');
  res.json({ success: true, message: 'Visualization routes are working' });
});

router.get('/:projectId/questionnaire-stats', (req, res, next) => {
  console.log('[visualizationRoutes] questionnaire-stats route hit for projectId:', req.params.projectId);
  getQuestionnaireStats(req, res, next);
});
router.get('/:projectId/asset-stats', (req, res, next) => {
  console.log('[visualizationRoutes] asset-stats route hit for projectId:', req.params.projectId);
  getAssetStats(req, res, next);
});
router.get('/:projectId/project-stats', (req, res, next) => {
  console.log('[visualizationRoutes] project-stats route hit for projectId:', req.params.projectId);
  getProjectStats(req, res, next);
});

export default router;

