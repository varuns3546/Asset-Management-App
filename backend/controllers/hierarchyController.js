import asyncHandler from 'express-async-handler';
import supabaseClient from '../config/supabaseClient.js';
const { supabaseAdmin } = supabaseClient;

const getHierarchies = asyncHandler(async (req, res) => {
  const { project_id } = req.query;

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

  // Query the hierarchies table with their items
  const { data, error } = await req.supabase
    .from('hierarchies')
    .select(`
      *,
      hierarchy_item_types (
        id,
        title,
        parent_item_id
      )
    `)
    .eq('project_id', project_id)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }

  res.status(200).json(data);
});

const getHierarchy = asyncHandler(async (req, res) => {
  console.log('Get hierarchy request body:', req.body);
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

  const { data, error } = await req.supabase
    .from('hierarchies')
    .select('*')
    .eq('id', id)
    .eq('project_id', project_id)
    .single();

  if (error) {
    return res.status(404).json({ 
      success: false,
      error: 'Hierarchy not found' 
    });
  }

  res.status(200).json(data);
});

const createHierarchy = asyncHandler(async (req, res) => {
  const { project_id, title, description, items } = req.body;
  console.log('Create hierarchy request body:', req.body);
  // Validation
  if (!title) {
    return res.status(400).json({
      success: false,
      error: 'Title is required'
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

  // Create the hierarchy first
  // Use supabaseAdmin for hierarchy creation to bypass RLS
  const { data: hierarchy, error: hierarchyError } = await supabaseAdmin
    .from('hierarchies')
    .insert({
        project_id: project_id,
        title,
        description,
    })
    .select()
    .single();


  if (hierarchyError) {
    return res.status(400).json({ 
      success: false,
      error: hierarchyError.message 
    });
  }

  // If items are provided, create them
  if (items && items.length > 0) {
    // Create a map of frontend IDs to backend UUIDs for parent relationships
    const itemIdMap = new Map();
    
    // First pass: create all items and map frontend IDs to backend UUIDs
    for (const item of items) {
      const { data: hierarchyItem, error: itemError } = await supabaseAdmin
        .from('hierarchy_item_types')
        .insert({
          hierarchy_id: hierarchy.id,
          title: item.title,
          parent_item_id: null // Will be updated in second pass
        })
        .select()
        .single();

      if (itemError) {
        console.error('Error creating hierarchy item:', itemError);
        // Continue with other items even if one fails
        continue;
      }

      // Map frontend ID to backend UUID
      itemIdMap.set(item.id, hierarchyItem.id);
    }

    // Second pass: update parent relationships
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
  }

  // Fetch the complete hierarchy with items
  const { data: completeHierarchy, error: fetchError } = await supabaseAdmin
    .from('hierarchies')
    .select(`
      *,
      hierarchy_item_types (
        id,
        title,
        parent_item_id
      )
    `)
    .eq('id', hierarchy.id)
    .single();

  if (fetchError) {
    console.error('Error fetching complete hierarchy:', fetchError);
    // Return the hierarchy without items if fetch fails
    res.status(201).json(hierarchy);
  } else {
    res.status(201).json(completeHierarchy);
  }
});

const updateHierarchy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, project_id } = req.body;

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

  // Validation - at least one field should be provided
  if (!title && !description) {
    return res.status(400).json({
      success: false,
      error: 'At least title or description must be provided'
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

  // Build update object with only provided fields
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;

  const { data, error } = await req.supabase
    .from('hierarchies')
    .update(updateData)
    .eq('id', id)
    .eq('project_id', project_id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }

  res.status(200).json(data);
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

// New project-based hierarchy functions
const getProjectHierarchy = asyncHandler(async (req, res) => {
  const { id } = req.params; // project_id from URL path
  
  console.log('Getting hierarchy for project:', id);
  console.log('User:', req.user?.id);
  
  // Query hierarchy_item_types for this project
  const { data, error } = await req.supabase
    .from('hierarchy_item_types')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    console.log('Supabase error:', error);
    return res.status(400).json({ 
      success: false,
      error: error.message,
      details: error
    });
  }

  // Return the item types as an array
  res.status(200).json(data || []);
});

const createProjectHierarchy = asyncHandler(async (req, res) => {
  const { id } = req.params; // project_id from URL path
  const { title, description, items } = req.body;
  
  console.log('Creating hierarchy for project:', id);
  console.log('Request body:', req.body);
  
  if (!title) {
    return res.status(400).json({
      success: false,
      error: 'Title is required'
    });
  }

  // Create hierarchy item types for this project
  if (items && items.length > 0) {
    const itemsToInsert = items.map(item => ({
      project_id: id,
      title: item.title,
      parent_item_id: item.parentId || null
    }));

    const { data: createdItems, error: itemsError } = await req.supabase
      .from('hierarchy_item_types')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      console.log('Error creating hierarchy items:', itemsError);
      return res.status(400).json({
        success: false,
        error: itemsError.message
      });
    }

    res.status(201).json(createdItems);
  } else {
    // If no items provided, return empty array
    res.status(201).json([]);
  }
});

const updateProjectHierarchy = asyncHandler(async (req, res) => {
  const { id } = req.params; // project_id from URL path
  const { title, description, items } = req.body;
  
  console.log('Updating hierarchy for project:', id);
  console.log('Request body:', req.body);

  // Delete existing items and create new ones
  if (items && items.length >= 0) {
    // Delete existing items
    const { error: deleteError } = await req.supabase
      .from('hierarchy_item_types')
      .delete()
      .eq('project_id', id);

    if (deleteError) {
      console.log('Error deleting existing items:', deleteError);
      return res.status(400).json({
        success: false,
        error: deleteError.message
      });
    }

    // Insert new items if any
    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        project_id: id,
        title: item.title,
        parent_item_id: item.parentId || null
      }));

      const { data: createdItems, error: itemsError } = await req.supabase
        .from('hierarchy_item_types')
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        console.log('Error creating new items:', itemsError);
        return res.status(400).json({
          success: false,
          error: itemsError.message
        });
      }

      res.status(200).json(createdItems);
    } else {
      res.status(200).json([]);
    }
  } else {
    res.status(200).json([]);
  }
});

const deleteProjectHierarchy = asyncHandler(async (req, res) => {
  const { id } = req.params; // project_id from URL path

  console.log('Deleting hierarchy for project:', id);

  // Delete hierarchy item types for this project
  const { error: itemsError } = await req.supabase
    .from('hierarchy_item_types')
    .delete()
    .eq('project_id', id);

  if (itemsError) {
    console.log('Error deleting hierarchy items:', itemsError);
    return res.status(400).json({
      success: false,
      error: itemsError.message
    });
  }

  res.status(200).json({ success: true, message: 'Hierarchy deleted successfully' });
});

export default {
    getHierarchies,
    getHierarchy,
    createHierarchy,
    deleteHierarchy,
    updateHierarchy,
    getProjectHierarchy,
    createProjectHierarchy,
    updateProjectHierarchy,
    deleteProjectHierarchy
};