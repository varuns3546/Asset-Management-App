import express from 'express';
import uploadController from '../controllers/uploadController.js';
const { getDocuments, getPhotos, getDocument, getPhoto, uploadDocuments, uploadPhotos, deleteDocument, deletePhoto } = uploadController;
import supabaseClient from '../config/supabaseClient.js';
const {authenticateUser} = supabaseClient;
const router = express.Router();

router.use(authenticateUser);

// Get all documents
router.get('/documents', getDocuments);
// Get all photos  
router.get('/photos', getPhotos);
// Get specific document by filename
router.get('/documents/:fileName', getDocument);
// Get specific photo by filename
router.get('/photos/:fileName', getPhoto);
// Upload document - spread the middleware array
router.post('/documents', ...uploadDocuments);
// Upload photo - spread the middleware array
router.post('/photos', (req, res, next) => {
  console.log('Photo upload route hit:', {
    method: req.method,
    path: req.path,
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length']
  });
  next();
}, ...uploadPhotos);
// Delete document
router.delete('/documents/:fileName', deleteDocument);
// Delete photo
router.delete('/photos/:fileName', deletePhoto);

export default router;
