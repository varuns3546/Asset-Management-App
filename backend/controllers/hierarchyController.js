import asyncHandler from 'express-async-handler';

const getHierarchies = asyncHandler(async (req, res) => {
  const { project_id } = req.query;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify the project belongs to the authenticated user
  const { data: project, error: projectError } = await req.supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', req.user.id)
    .single();

  if (projectError || !project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found or access denied'
    });
  }

  const { data, error } = await req.supabase
    .from('hierarchies')
    .select('*')
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

  // Verify the project belongs to the authenticated user
  const { data: project, error: projectError } = await req.supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', req.user.id)
    .single();

  if (projectError || !project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found or access denied'
    });
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
  const { project_id, title, description} = req.body;

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

  // Verify the project belongs to the authenticated user
  const { data: project, error: projectError } = await req.supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', req.user.id)
    .single();

  if (projectError || !project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found or access denied'
    });
  }

  const { data, error } = await req.supabase
    .from('hierarchies')
    .insert({
        project_id: project_id,
        title,
        description,
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

  // Verify the project belongs to the authenticated user
  const { data: project, error: projectError } = await req.supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', req.user.id)
    .single();

  if (projectError || !project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found or access denied'
    });
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

  // Verify the project belongs to the authenticated user
  const { data: project, error: projectError } = await req.supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', req.user.id)
    .single();

  if (projectError || !project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found or access denied'
    });
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
    getHierarchies,
    getHierarchy,
    createHierarchy,
    deleteHierarchy,
    updateHierarchy
};