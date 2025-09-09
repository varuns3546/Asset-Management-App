import express from 'express';
import supabaseClient from '../config/supabaseClient.js';
import hierarchyController from '../controllers/hierarchyController.js';

const {authenticateUser} =supabaseClient
const {getHierarchies, getHierarchy, createHierarchy, updateHierarchy, deleteHierarchy} = hierarchyController;

const router = express.Router();
router.use(authenticateUser)

router.get('/', getHierarchies);
router.get('/:id', getHierarchy);
router.post('/', createHierarchy);
router.put('/:id', updateHierarchy);
router.delete('/:id', deleteHierarchy);

export default router;