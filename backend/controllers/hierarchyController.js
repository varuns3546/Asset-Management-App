import asyncHandler from 'express-async-handler';
import supabaseClient from '../config/supabaseClient.js';
const { supabaseAdmin } = supabaseClient;


const getHierarchy = asyncHandler(async (req, res) => {
  const { id: project_id } = req.params; // Fix: use 'id' from route params and rename to project_id

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify the user has access to the project through project_users table
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

  // If not found in project_users, check if user is the owner directly
  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', project_id)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    // Get all hierarchy items for this project
    const { data: hierarchyItems, error } = await req.supabase
      .from('hierarchy_item_types')
      .select('*')
      .eq('project_id', project_id)
      .order('title');

    if (error) {
      console.error('Error fetching hierarchy items:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch hierarchy items' 
      });
    }

    // Return the hierarchy items (empty array if none exist)
    res.status(200).json({
      success: true,
      data: hierarchyItems || []
    });

  } catch (error) {
    console.error('Error in getHierarchy:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching hierarchy'
    });
  }
});

const updateHierarchy = asyncHandler(async (req, res) => {
  const { items } = req.body;
  const { id: project_id } = req.params; // Fix: use 'id' from route params and rename to project_id

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Items array is required'
    });
  }

  // Verify the user has access to the project through project_users table
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

  // If not found in project_users, check if user is the owner directly
  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', project_id)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    // Get existing hierarchy items for this project to avoid duplicates
    const { data: existingItems, error: existingError } = await req.supabase
      .from('hierarchy_item_types')
      .select('id, title, parent_item_id, project_id')
      .eq('project_id', project_id);

    if (existingError) {
      console.error('Error fetching existing hierarchy items:', existingError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch existing hierarchy items'
      });
    }

    // Create a map of existing items by title to avoid duplicates
    const existingItemsMap = new Map();
    if (existingItems) {
      existingItems.forEach(item => {
        existingItemsMap.set(item.title.toLowerCase(), item);
      });
    }

    // Create a map of frontend IDs to backend UUIDs for parent relationships
    const itemIdMap = new Map();
    const createdItems = [];
    
    // First pass: create new items (skip existing ones) and map frontend IDs to backend UUIDs
    for (const item of items) {
      // Check if item already exists
      const existingItem = existingItemsMap.get(item.title.toLowerCase());
      if (existingItem) {
        // Map existing item ID
        itemIdMap.set(item.id, existingItem.id);
        continue;
      }

      const { data: hierarchyItem, error: itemError } = await supabaseAdmin
        .from('hierarchy_item_types')
        .insert({
          title: item.title,
          project_id: project_id,
          parent_item_id: null // Will be updated in second pass
        })
        .select()
        .single();

      if (itemError) {
        console.error('Error creating hierarchy item:', itemError);
        continue;
      }

      // Map frontend ID to backend UUID
      itemIdMap.set(item.id, hierarchyItem.id);
      createdItems.push(hierarchyItem);
    }

    // Second pass: update parent relationships for all items (existing and new)
    for (const item of items) {
      if (item.parentId && itemIdMap.has(item.parentId)) {
        const backendItemId = itemIdMap.get(item.id);
        const parentBackendId = itemIdMap.get(item.parentId);
        
        if (backendItemId && parentBackendId) {
          await supabaseAdmin
            .from('hierarchy_item_types')
            .update({ parent_item_id: parentBackendId })
            .eq('id', backendItemId);
        }
      }
    }

    // Third pass: Delete items that are no longer in the frontend data
    const frontendItemTitles = new Set(items.map(item => item.title.toLowerCase()));
    const itemsToDelete = existingItems.filter(existingItem => 
      !frontendItemTitles.has(existingItem.title.toLowerCase())
    );

    if (itemsToDelete.length > 0) {
      const deleteIds = itemsToDelete.map(item => item.id);
      
      const { error: deleteError } = await supabaseAdmin
        .from('hierarchy_item_types')
        .delete()
        .in('id', deleteIds);
        
      if (deleteError) {
        console.error('Error deleting removed hierarchy items:', deleteError);
        // Continue execution - don't fail the entire operation
      } else {
        console.log(`Deleted ${itemsToDelete.length} removed hierarchy items`);
      }
    }

    // Fetch the complete updated hierarchy with items
    const { data: completeHierarchy, error: fetchError } = await req.supabase
      .from('hierarchy_item_types')
      .select('*')
      .eq('project_id', project_id)
      .order('title');

    if (fetchError) {
      console.error('Error fetching complete hierarchy:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Hierarchy items were processed but failed to fetch updated results',
        data: createdItems
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hierarchy updated successfully',
      data: completeHierarchy
    });

  } catch (error) {
    console.error('Error updating hierarchy:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating hierarchy'
    });
  }
});

const deleteHierarchy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { project_id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Hierarchy ID is required'
    });
  }

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify the user has access to the project through project_users table
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

  // If not found in project_users, check if user is the owner directly
  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', project_id)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  const { error } = await req.supabase
    .from('hierarchies')
    .delete()
    .eq('id', id)
    .eq('project_id', project_id);

  if (error) {
    return res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }

  res.status(200).json(id);
});

export default {
    getHierarchy,
    deleteHierarchy,
    updateHierarchy,
};