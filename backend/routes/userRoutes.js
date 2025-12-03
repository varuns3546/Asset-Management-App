import express from 'express';
import userController from '../controllers/userController.js';
import supabaseClient from '../config/supabaseClient.js';
const {registerUser, loginUser, getUser, getSelectedProject, setSelectedProject} = userController
const { authenticateUser } = supabaseClient;
const router = express.Router();

router.post('/', registerUser) 
router.post('/login', loginUser) 
router.get('/me', authenticateUser, getUser)
router.get('/selected-project', authenticateUser, getSelectedProject)
router.put('/selected-project', authenticateUser, setSelectedProject)


export default router;