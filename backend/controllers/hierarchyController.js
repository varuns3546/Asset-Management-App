import asyncHandler from 'express-async-handler';

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
      .from('hierarchy_entries')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at');

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
    console.error('Error fetching hierarchy:', error);
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
    // Get existing hierarchy items for this project
    const { data: existingItems, error: existingError } = await req.supabase
      .from('hierarchy_entries')
      .select('*')
      .eq('project_id', project_id);

    if (existingError) {
      console.error('Error fetching existing hierarchy items:', existingError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch existing hierarchy items'
      });
    }

    // Create a map of existing items by title for quick lookup
    const existingItemsMap = new Map();
    existingItems.forEach(item => {
      existingItemsMap.set(item.title.toLowerCase(), item);
    });

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

      const { data: hierarchyItem, error: itemError } = await req.supabase
        .from('hierarchy_entries')
        .insert({
          title: item.title,
          item_type_id: item.item_type_id,
          project_id: project_id,
          parent_id: null // Will be updated in second pass
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
      if (item.parent_id && itemIdMap.has(item.parent_id)) {
        const backendItemId = itemIdMap.get(item.id);
        const parentBackendId = itemIdMap.get(item.parent_id);
        
        if (backendItemId && parentBackendId) {
          const { error: updateError } = await req.supabase
            .from('hierarchy_entries')
            .update({ parent_id: parentBackendId })
            .eq('id', backendItemId);
            
          if (updateError) {
            console.error('Error updating parent relationship:', updateError);
          }
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
      
      const { error: deleteError } = await req.supabase
        .from('hierarchy_entries')
        .delete()
        .in('id', deleteIds);
        
      if (deleteError) {
        console.error('Error deleting removed hierarchy items:', deleteError);
        // Continue execution - don't fail the entire operation
      }
    }

    // Fetch the complete updated hierarchy with items
    const { data: completeHierarchy, error: fetchError } = await req.supabase
      .from('hierarchy_entries')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at');

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
  const { id: project_id } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify the user has access to the project
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

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
    // Delete all hierarchy items for this project
    const { error } = await req.supabase
      .from('hierarchy_entries')
      .delete()
      .eq('project_id', project_id);

    if (error) {
      console.error('Error deleting hierarchy items:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete hierarchy items'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hierarchy deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting hierarchy:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting hierarchy'
    });
  }
});

const getItemTypes = asyncHandler(async (req, res) => {
  const { id: project_id } = req.params;

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
    // Get all item types for this project
    const { data: itemTypes, error } = await req.supabase
      .from('hierarchy_item_types')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at');

    if (error) {
      console.error('Error fetching item types:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch item types' 
      });
    }

    // Return the item types (empty array if none exist)
    res.status(200).json({
      success: true,
      data: itemTypes || []
    });

  } catch (error) {
    console.error('Error in getItemTypes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching item types'
    });
  }
});

const updateItemTypes = asyncHandler(async (req, res) => {
  const { itemTypes } = req.body;
  const { id: project_id } = req.params; // Fix: use 'id' from route params and rename to project_id
  
  console.log('updateItemTypes - Received data:', { itemTypes, project_id });
  console.log('updateItemTypes - itemTypes type:', typeof itemTypes, 'isArray:', Array.isArray(itemTypes));

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!itemTypes || !Array.isArray(itemTypes)) {
    return res.status(400).json({
      success: false,
      error: 'Item types array is required'
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
    // Get existing hierarchy itemTypes for this project
    const { data: existingItemTypes, error: existingError } = await req.supabase
      .from('hierarchy_item_types')
      .select('*')
      .eq('project_id', project_id);

    if (existingError) {
      console.error('Error fetching existing hierarchy itemTypes:', existingError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch existing hierarchy itemTypes'
      });
    }

    // Create a map of existing items by title for quick lookup
    const existingItemTypesMap = new Map();
    existingItemTypes.forEach(itemType => {
      existingItemTypesMap.set(itemType.title.toLowerCase(), itemType);
    });

    // Create a map of frontend IDs to backend UUIDs for parent relationships
    const itemTypeIdMap = new Map();
    const createdItemTypes = [];
    
    // First pass: create new items (skip existing ones) and map frontend IDs to backend UUIDs
    for (const itemType of itemTypes) {
      // Check if itemType already exists
      const existingItemType = existingItemTypesMap.get(itemType.title.toLowerCase());
      if (existingItemType) {
        // Map existing item ID
        itemTypeIdMap.set(itemType.id, existingItemType.id);
        continue;
      }

      const { data: hierarchyItemType, error: itemTypeError } = await req.supabase
        .from('hierarchy_item_types')
        .insert({
          title: itemType.title,
          description: itemType.description,
          project_id: project_id,
          parent_ids: null // Will be updated in second pass
        })
        .select()
        .single();

      if (itemTypeError) {
        console.error('Error creating hierarchy itemType:', itemTypeError);
        continue;
      }

      // Map frontend ID to backend UUID
      itemTypeIdMap.set(itemType.id, hierarchyItemType.id);
      createdItemTypes.push(hierarchyItemType);
    }

    // Second pass: update parent relationships for all items (existing and new)
    for (const itemType of itemTypes) {
      if (itemType.parent_ids && Array.isArray(itemType.parent_ids) && itemType.parent_ids.length > 0) {
        const backendItemTypeId = itemTypeIdMap.get(itemType.id);
        
        if (backendItemTypeId) {
          // Convert frontend parent IDs to backend UUIDs
          const backendParentIds = itemType.parent_ids
            .map(parentId => itemTypeIdMap.get(parentId))
            .filter(id => id !== undefined); // Remove any undefined IDs
          
          if (backendParentIds.length > 0) {
            const { error: updateError } = await req.supabase
              .from('hierarchy_item_types')
              .update({ parent_ids: backendParentIds })
              .eq('id', backendItemTypeId);
              
            if (updateError) {
              console.error('Error updating parent relationships:', updateError);
            }
          }
        }
      } else {
        // If no parent_ids or empty array, set to null
        const backendItemTypeId = itemTypeIdMap.get(itemType.id);
        if (backendItemTypeId) {
          const { error: updateError } = await req.supabase
            .from('hierarchy_item_types')
            .update({ parent_ids: null })
            .eq('id', backendItemTypeId);
            
          if (updateError) {
            console.error('Error clearing parent relationships:', updateError);
          }
        }
      }
    }

    // Third pass: Delete items that are no longer in the frontend data
    const frontendItemTypeTitles = new Set(itemTypes.map(itemType => itemType.title.toLowerCase()));
    const itemTypesToDelete = existingItemTypes.filter(existingItemType => 
      !frontendItemTypeTitles.has(existingItemType.title.toLowerCase())
    );

    if (itemTypesToDelete.length > 0) {
      const deleteIds = itemTypesToDelete.map(itemType => itemType.id);
      
      const { error: deleteError } = await req.supabase
        .from('hierarchy_item_types')
        .delete()
        .in('id', deleteIds);
        
      if (deleteError) {
        console.error('Error deleting removed hierarchy itemTypes:', deleteError);
        // Continue execution - don't fail the entire operation
      }
    }

    // Fetch the complete updated hierarchy with items
    const { data: completeHierarchyItemTypes, error: fetchError } = await req.supabase
      .from('hierarchy_item_types')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at');

    if (fetchError) {
      console.error('Error fetching complete hierarchy itemTypes:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Hierarchy itemTypes were processed but failed to fetch updated results',
        data: createdItemTypes
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hierarchy itemTypes updated successfully',
      data: completeHierarchyItemTypes
    });

  } catch (error) {
    console.error('Error updating hierarchy itemTypes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating hierarchy itemTypes'
    });
  }
});

const createItemType = asyncHandler(async (req, res) => {
  const { name, description, parent_ids } = req.body;
  const { id: project_id } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Item type name is required'
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
    const { data: itemType, error } = await req.supabase
      .from('hierarchy_item_types')
      .insert({
        title: name.trim(),
        description: description || null,
        project_id: project_id,
        parent_ids: parent_ids || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating item type:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create item type'
      });
    }

    res.status(201).json({
      success: true,
      data: itemType
    });

  } catch (error) {
    console.error('Error in createItemType:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating item type'
    });
  }
});

const deleteItemType = asyncHandler(async (req, res) => {
  const { id: project_id, itemTypeId } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!itemTypeId) {
    return res.status(400).json({
      success: false,
      error: 'Item type ID is required'
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
    const { error } = await req.supabase
      .from('hierarchy_item_types')
      .delete()
      .eq('id', itemTypeId)
      .eq('project_id', project_id);

    if (error) {
      console.error('Error deleting item type:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete item type'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item type deleted successfully',
      id: itemTypeId
    });

  } catch (error) {
    console.error('Error in deleteItemType:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting item type'
    });
  }
});

// Create individual hierarchy item
const createHierarchyItem = asyncHandler(async (req, res) => {
  const { title, item_type_id, parent_id } = req.body;
  const { id: project_id } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Item title is required'
    });
  }

  // Verify the user has access to the project through project_users table
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

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
    const { data: hierarchyItem, error } = await req.supabase
      .from('hierarchy_entries')
      .insert({
        title: title.trim(),
        item_type_id: item_type_id || null,
        parent_id: parent_id || null,
        project_id: project_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating hierarchy item:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create hierarchy item'
      });
    }

    res.status(201).json({
      success: true,
      data: hierarchyItem
    });

  } catch (error) {
    console.error('Error in createHierarchyItem:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating hierarchy item'
    });
  }
});

// Delete individual hierarchy item
const deleteHierarchyItem = asyncHandler(async (req, res) => {
  const { id: project_id, itemId } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!itemId) {
    return res.status(400).json({
      success: false,
      error: 'Item ID is required'
    });
  }

  // Verify the user has access to the project through project_users table
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

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
    const { error } = await req.supabase
      .from('hierarchy_entries')
      .delete()
      .eq('id', itemId)
      .eq('project_id', project_id);

    if (error) {
      console.error('Error deleting hierarchy item:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete hierarchy item'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hierarchy item deleted successfully',
      data: { id: itemId }
    });

  } catch (error) {
    console.error('Error in deleteHierarchyItem:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting hierarchy item'
    });
  }
});

export default {
  getHierarchy,
  updateHierarchy,
  deleteHierarchy,
  createHierarchyItem,
  deleteHierarchyItem,
  getItemTypes,
  updateItemTypes,
  createItemType,
  deleteItemType
};