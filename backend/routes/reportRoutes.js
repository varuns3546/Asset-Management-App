import express from 'express';
import supabaseClient from '../config/supabaseClient.js';
import { generateReport } from '../controllers/reportController.js';

const router = express.Router();
const { authenticateUser } = supabaseClient;

// All routes require authentication
router.use(authenticateUser);

router.post('/:projectId/generate', generateReport);

export default router;

