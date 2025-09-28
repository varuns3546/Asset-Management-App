import asyncHandler from 'express-async-handler';

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

const createItemType = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
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
        name: name.trim(),
        description: description || null,
        project_id: project_id
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
      message: 'Item type deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteItemType:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting item type'
    });
  }
});

export default {
  getItemTypes,
  createItemType,
  deleteItemType
};
