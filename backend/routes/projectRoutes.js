import express from 'express';
import projectController from '../controllers/projectController.js';
import assetController from '../controllers/assetController.js';
import supabaseClient from '../config/supabaseClient.js';

const {
  getProjects,
  getProject,
  createProject,
  deleteProject,
  updateProject,
  getProjectUsers,
  addUserToProject,
  removeUserFromProject
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

// Individual asset routes
router.post('/:id/hierarchy/features', createAsset);
router.put('/:id/hierarchy/features/:featureId', updateAsset);
router.delete('/:id/hierarchy/features/:featureId', deleteAsset);

// Asset types routes
router.get('/:id/hierarchy/feature-types', getAssetTypes);
router.post('/:id/hierarchy/feature-types', createAssetType);
router.put('/:id/hierarchy/feature-types/:featureTypeId', updateAssetType);
router.delete('/:id/hierarchy/feature-types/:featureTypeId', deleteAssetType);

export default router;