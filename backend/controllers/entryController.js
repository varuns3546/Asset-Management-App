import asyncHandler from 'express-async-handler';

const getEntries = asyncHandler(async (req, res) => {
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
    .from('entries')
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

const getEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { project_id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Entry ID is required'
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
    .from('entries')
    .select('*')
    .eq('id', id)
    .eq('project_id', project_id)
    .single();

  if (error) {
    return res.status(404).json({ 
      success: false,
      error: 'Entry not found' 
    });
  }

  res.status(200).json(data);
});

const createEntry = asyncHandler(async (req, res) => {
  const { title, content, project_id } = req.body;

  // Validation
  if (!title || !content) {
    return res.status(400).json({
      success: false,
      error: 'Title and content are required'
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
    .from('entries')
    .insert({
      title,
      content,
      project_id: project_id,
      user_id: req.user.id // Keep user_id for audit purposes
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

const updateEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, project_id } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Entry ID is required'
    });
  }

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Validation - at least one field should be provided
  if (!title && !content) {
    return res.status(400).json({
      success: false,
      error: 'At least title or content must be provided'
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
  if (content !== undefined) updateData.content = content;

  const { data, error } = await req.supabase
    .from('entries')
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

const deleteEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { project_id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Entry ID is required'
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
    .from('entries')
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
  getEntries,
  getEntry,
  createEntry,
  deleteEntry,
  updateEntry
};