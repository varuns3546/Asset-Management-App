import asyncHandler from 'express-async-handler';

const getProjects = asyncHandler(async (req, res) => {
  const { data, error } = await req.supabase
    .from('projects')
    .select('*')
    .eq('user_id', req.user.id) // Still filter by user_id for getProjects
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }

  res.status(200).json(data);
});

const getProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify the project belongs to the authenticated user
  const { data, error } = await req.supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user.id) // Ensure user owns the project
    .single();

  if (error) {
    return res.status(404).json({ 
      success: false,
      error: 'Project not found' 
    });
  }

  res.status(200).json(data);
});

const createProject = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // Validation
  if (!title) {
    return res.status(400).json({
      success: false,
      error: 'Title is required'
    });
  }

  const { data, error } = await req.supabase
    .from('projects')
    .insert({
      title,
      description: description || "",
      user_id: req.user.id
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }

  res.status(201).json(data);
});

const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, entries, images, documents, maps, locations } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }
  
  // Build update object with only provided fields
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (entries !== undefined) updateData.entries = entries;
  if (images !== undefined) updateData.images = images;
  if (documents !== undefined) updateData.documents = documents;
  if (maps !== undefined) updateData.maps = maps;
  if (locations !== undefined) updateData.locations = locations;

  // Verify the project belongs to the authenticated user before updating
  const { data: existingProject, error: checkError } = await req.supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .single();

  if (checkError || !existingProject) {
    return res.status(404).json({ 
      success: false,
      error: 'Project not found or access denied' 
    });
  }

  const { data, error } = await req.supabase
    .from('projects')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', req.user.id) // Ensure user owns the project
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

const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify the project belongs to the authenticated user before deleting
  const { data: existingProject, error: checkError } = await req.supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .single();

  if (checkError || !existingProject) {
    return res.status(404).json({ 
      success: false,
      error: 'Project not found or access denied' 
    });
  }

  const { error } = await req.supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id); // Ensure user owns the project

  if (error) {
    return res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }

  res.status(200).json(id);
});

export default {
  getProjects,
  getProject,
  createProject,
  deleteProject,
  updateProject
};