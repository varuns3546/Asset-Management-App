import express from 'express';
import gisLayerController from '../controllers/gisLayerController.js';
import supabaseClient from '../config/supabaseClient.js';

const router = express.Router();
const { authenticateUser } = supabaseClient;

// Layer routes
router.get('/:projectId/layers', authenticateUser, gisLayerController.getGisLayers);
router.post('/:projectId/layers', authenticateUser, gisLayerController.createGisLayer);
router.put('/:projectId/layers/:layerId', authenticateUser, gisLayerController.updateGisLayer);
router.delete('/:projectId/layers/:layerId', authenticateUser, gisLayerController.deleteGisLayer);

// Feature routes
router.get('/:projectId/layers/:layerId/features', authenticateUser, gisLayerController.getLayerFeatures);
router.post('/:projectId/layers/:layerId/features', authenticateUser, gisLayerController.addFeature);
router.delete('/:projectId/layers/:layerId/features/:featureId', authenticateUser, gisLayerController.deleteFeature);

export default router;

