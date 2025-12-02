import express from 'express';
import projectController from '../controllers/projectController.js';
import featureController from '../controllers/featureController.js';
import supabaseClient from '../config/supabaseClient.js';

const { getProjects, getProject, createProject, deleteProject, updateProject, getProjectUsers, addUserToProject, removeUserFromProject } = projectController;
const { getHierarchy, deleteHierarchy, createFeature, updateFeature, deleteFeature, getFeatureTypes, createFeatureType, updateFeatureType, deleteFeatureType, uploadHierarchyFile, importHierarchyData } = featureController;
const { authenticateUser } = supabaseClient;
const router = express.Router();

router.use(authenticateUser);

router.get('/', getProjects);
router.get('/:id', getProject);
router.post('/', createProject);
router.delete('/:id', deleteProject);
router.put('/:id', updateProject);

// User management routes
router.get('/:id/users', getProjectUsers);
router.post('/:id/users', addUserToProject);
router.delete('/:id/users/:userId', removeUserFromProject);

// Hierarchy routes
router.get('/:id/hierarchy', getHierarchy);
router.delete('/:id/hierarchy', deleteHierarchy);

// Hierarchy file upload routes
router.post('/:id/hierarchy/upload', uploadHierarchyFile);
router.post('/:id/hierarchy/import', importHierarchyData);

// Individual feature routes
router.post('/:id/hierarchy/items', createFeature);
router.put('/:id/hierarchy/items/:itemId', updateFeature);
router.delete('/:id/hierarchy/items/:itemId', deleteFeature);

// Feature types routes
router.get('/:id/hierarchy/item-types', getFeatureTypes);
router.post('/:id/hierarchy/item-types', createFeatureType);
router.put('/:id/hierarchy/item-types/:itemTypeId', updateFeatureType);
router.delete('/:id/hierarchy/item-types/:itemTypeId', deleteFeatureType);

export default router;