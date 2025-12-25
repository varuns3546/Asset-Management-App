import express from 'express';
import projectController from '../controllers/projectController.js';
import assetController from '../controllers/assetController.js';
import { getProjectMetrics, getAllProjectsMetrics } from '../controllers/metricsController.js';
import { exportProjectData } from '../controllers/exportController.js';
import supabaseClient from '../config/supabaseClient.js';

const {
  getProjects,
  getSharedProjects,
  getProject,
  createProject,
  deleteProject,
  updateProject,
  getProjectUsers,
  addUserToProject,
  removeUserFromProject,
  cloneProject,
  getMasterProjects,
  setProjectAsMaster
} = projectController;

const {
  getHierarchy,
  deleteHierarchy,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetTypes,
  createAssetType,
  updateAssetType,
  deleteAssetType,
  uploadHierarchyFile,
  importHierarchyData
} = assetController;
const { authenticateUser } = supabaseClient;
const router = express.Router();

router.use(authenticateUser);

router.get('/', getProjects);
router.get('/shared', getSharedProjects);
router.post('/', createProject);

// Version control routes - must come BEFORE /:id routes to avoid route conflicts
router.get('/masters', getMasterProjects);

// Metrics and export routes - must come BEFORE /:id routes to avoid route conflicts
router.get('/all-projects/metrics', getAllProjectsMetrics);

router.get('/:id', getProject);
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

// Individual asset routes
router.post('/:id/hierarchy/features', createAsset);
router.put('/:id/hierarchy/features/:featureId', updateAsset);
router.delete('/:id/hierarchy/features/:featureId', deleteAsset);

// Asset types routes
router.get('/:id/hierarchy/feature-types', getAssetTypes);
router.post('/:id/hierarchy/feature-types', createAssetType);
router.put('/:id/hierarchy/feature-types/:featureTypeId', updateAssetType);
router.delete('/:id/hierarchy/feature-types/:featureTypeId', deleteAssetType);

// Metrics and export routes
router.get('/:id/metrics', getProjectMetrics);
router.get('/:id/export', exportProjectData);

// Version control routes
router.post('/:id/clone', cloneProject);
router.patch('/:id/master', setProjectAsMaster);

export default router;