import express from 'express';
import leafletShapesController from '../controllers/leafletShapesController.js';
import supabaseConfig from '../config/supabaseClient.js';

const router = express.Router();
const { authenticateUser } = supabaseConfig;

// All routes require authentication
router.use(authenticateUser);

// Get all shapes for a project
router.get('/:projectId', leafletShapesController.getShapesByProject);

// Save shapes for a project
router.post('/:projectId', leafletShapesController.saveShapes);

// Update a specific shape
router.put('/:shapeId', leafletShapesController.updateShape);

// Delete a specific shape
router.delete('/:shapeId', leafletShapesController.deleteShape);

// Delete all shapes for a project
router.delete('/project/:projectId', leafletShapesController.deleteAllShapesByProject);

export default router;

