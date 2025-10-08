import express from 'express';
import projectController from '../controllers/projectController.js';
import hierarchyController from '../controllers/hierarchyController.js';
import supabaseClient from '../config/supabaseClient.js';

const { getProjects, getProject, createProject, deleteProject, updateProject, getProjectUsers, addUserToProject, removeUserFromProject } = projectController;
const { getHierarchy, deleteHierarchy, createHierarchyItem, updateHierarchyItem, deleteHierarchyItem, getItemTypes, createItemType, updateItemType, deleteItemType, uploadHierarchyFile, importHierarchyData } = hierarchyController;
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

// Individual hierarchy item routes
router.post('/:id/hierarchy/items', createHierarchyItem);
router.put('/:id/hierarchy/items/:itemId', updateHierarchyItem);
router.delete('/:id/hierarchy/items/:itemId', deleteHierarchyItem);

// Item types routes
router.get('/:id/hierarchy/item-types', getItemTypes);
router.post('/:id/hierarchy/item-types', createItemType);
router.put('/:id/hierarchy/item-types/:itemTypeId', updateItemType);
router.delete('/:id/hierarchy/item-types/:itemTypeId', deleteItemType);

export default router;