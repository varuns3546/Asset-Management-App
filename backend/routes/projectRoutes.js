import express from 'express';
import projectController from '../controllers/projectController.js';
import supabaseClient from '../config/supabaseClient.js';

const { getProjects, getProject, createProject, deleteProject, updateProject, getProjectUsers, addUserToProject, removeUserFromProject } = projectController;
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

export default router;