import express from 'express';
import userController from '../controllers/userController.js';
const {registerUser, loginUser, getUser} = userController
const router = express.Router();
router.post('/', registerUser) 
router.post('/login', loginUser) 
router.get('/me', getUser) 


export default router;