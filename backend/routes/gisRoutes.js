import express from 'express';
import gisController from '../controllers/gisController.js';
import supabaseClient from '../config/supabaseClient.js';

const router = express.Router();
const { authenticateUser } = supabaseClient;

// Layer routes
router.get('/:projectId/layers', authenticateUser, gisController.getGisLayers);
router.post('/:projectId/layers', authenticateUser, gisController.createGisLayer);
router.put('/:projectId/layers/:layerId', authenticateUser, gisController.updateGisLayer);
router.delete('/:projectId/layers/:layerId', authenticateUser, gisController.deleteGisLayer);

// Feature routes
router.get('/:projectId/layers/:layerId/features', authenticateUser, gisController.getLayerFeatures);
router.post('/:projectId/layers/:layerId/features', authenticateUser, gisController.addFeature);
router.delete('/:projectId/layers/:layerId/features/:featureId', authenticateUser, gisController.deleteFeature);

// Export route
router.post('/:projectId/export', authenticateUser, gisController.exportLayersToGeoPackage);

export default router;

