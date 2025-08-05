import express from 'express';
import mapController from '../controllers/mapController.js';
import supabaseClient from '../config/supabaseClient.js';
const {createMap, createLocation, getMaps, getLocations} = mapController
const {authenticateUser} = supabaseClient
const router = express.Router();

router.use(authenticateUser)

router.post('/', createMap)
router.post('/locations', createLocation)
router.get('/', getMaps)
router.get('/locations/:map_id', getLocations)

export default router;