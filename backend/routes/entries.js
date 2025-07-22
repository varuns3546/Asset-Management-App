import express from 'express';
import Entry from '../models/Entry.js';
const router = express.Router();

// GET /api/auth/:userId/entries - Get all entries for a specific user
router.get('/:userId/entries', async (req, res) => {
    console.log('attemping get entries')

    try {

      const { userId } = req.params;
      
      // Check if the authenticated user is requesting their own entries or is authorized
     
     /*
      if (req.userId !== parseInt(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own entries'
        });
      }
  */
      const entries = await Entry.findByUserId(userId);
      
      res.json({
        success: true,
        entries: entries || []
      });
  
    } catch (error) {
      console.error('Get entries error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
  
  // POST /api/auth/:userId/entries - Create a new entry for a specific user
  router.post('/:userId/entries', async (req, res) => {
    console.log('attempting post entry')
    try {
      const { userId } = req.params;
      const { title, description, image_url } = req.body;
      console.log(req.body, 'req.body')
      console.log(req.params, 'req.params')

      /*
      // Check if the authenticated user is creating an entry for themselves
      if (req.userId !== parseInt(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only create entries for yourself'
        });
      }
  */
      // Validation
      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }
  
      // Create new entry
      const entry = await Entry.create({
        title: title.trim(),
        description: description ? description.trim() : null,
        image_url,
        user_id: userId
      });
  
      res.status(201).json({
        success: true,
        message: 'Entry created successfully',
        entry: entry
      });
  
    } catch (error) {
      console.error('Create entry error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
  
  // PUT /api/auth/:userId/entries/:entryId - Update a specific entry
  router.put('/:userId/entries/:entryId', async (req, res) => {
    try {
      const { userId, entryId } = req.params;
      const { title, description, image_url } = req.body;
      /*
      // Check if the authenticated user owns this entry
      if (req.userId !== parseInt(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update your own entries'
        });
      }
  */
      // Find the entry first to ensure it exists and belongs to the user
      const existingEntry = await Entry.findById(entryId);
      if (!existingEntry) {
        return res.status(404).json({
          success: false,
          message: 'Entry not found'
        });
      }
  /*
      if (existingEntry.user_id !== parseInt(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This entry does not belong to you'
        });
      }
  */
      // Validation
      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }
  
      // Update the entry
      const updatedEntry = await Entry.update(entryId, {
        title: title.trim(),
        description: description ? description.trim() : null,
        image_url
      });
  
      res.json({
        success: true,
        message: 'Entry updated successfully',
        entry: updatedEntry
      });
  
    } catch (error) {
      console.error('Update entry error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
  
  // DELETE /api/auth/:userId/entries/:entryId - Delete a specific entry
  router.delete('/:userId/entries/:entryId', async (req, res) => {
    try {
      const { userId, entryId } = req.params;
      /*
      // Check if the authenticated user owns this entry
      if (req.userId !== parseInt(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only delete your own entries'
        });
      }
  */
      // Find the entry first to ensure it exists and belongs to the user
      const existingEntry = await Entry.findById(entryId);
      if (!existingEntry) {
        return res.status(404).json({
          success: false,
          message: 'Entry not found'
        });
      }
  /*
      if (existingEntry.user_id !== parseInt(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This entry does not belong to you'
        });
      }
  */
      // Delete the entry
      await Entry.delete(entryId);
  
      res.json({
        success: true,
        message: 'Entry deleted successfully'
      });
  
    } catch (error) {
      console.error('Delete entry error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
  
  // GET /api/auth/:userId/entries/:entryId - Get a specific entry
  router.get('/:userId/entries/:entryId', async (req, res) => {
    try {
      const { userId, entryId } = req.params;
      /*
      // Check if the authenticated user is requesting their own entry
      if (req.userId !== parseInt(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own entries'
        });
      }
  */
      const entry = await Entry.findById(entryId);
      
      if (!entry) {
        return res.status(404).json({
          success: false,
          message: 'Entry not found'
        });
      }
  /*
      // Ensure the entry belongs to the user
      if (entry.user_id !== parseInt(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This entry does not belong to you'
        });
      }
  */
      res.json({
        success: true,
        entry: entry
      });
  
    } catch (error) {
      console.error('Get entry error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
  export default router;

