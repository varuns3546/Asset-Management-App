import express from 'express';
import geopackageController from '../controllers/geopackageController.js';
import supabaseClient from '../config/supabaseClient.js';

const { createGeoPackage, getExportStats } = geopackageController;
const { authenticateUser } = supabaseClient;

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Export data as GeoPackage (JSON format)
router.get('/export', createGeoPackage);

// Get export statistics
router.get('/stats', getExportStats);

export default router;
