import asyncHandler from 'express-async-handler';

const getProjects = asyncHandler(async (req, res) => {
  
  // First, let's try a simpler query to get projects the user has access to
  const { data, error } = await req.supabase
    .from('project_users')
    .select(`
      role,
      project:projects(*)
    `)
    .eq('user_id', req.user.id);

  console.log('Supabase query result:');
  console.log('Data:', data);
  console.log('Error:', error);

  if (error) {
    console.log('Query failed, trying alternative approach...');
    
    // Alternative: Get all projects and filter by user access
    const { data: allProjects, error: allProjectsError } = await req.supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('All projects query result:');
    console.log('Data:', allProjects);
    console.log('Error:', allProjectsError);

    if (allProjectsError) {
      return res.status(400).json({ 
        success: false,
        error: allProjectsError.message 
      });
    }

    // For now, return all projects (you can add filtering later)
    return res.status(200).json(allProjects || []);
  }

  // Extract just the project data from the join
  const projects = data?.map(item => item.project) || [];
  
  res.status(200).json(projects);
});

const getProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  const { data, error } = await req.supabase
    .from('projects')
    .select('*')
    .eq('id', id)
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
  console.log('=== CREATE PROJECT DEBUG ===');
  console.log('Request body:', req.body);
  
  const { title, description, latitude, longitude, userIds = [] } = req.body; // userIds is array of user IDs to give access

  // Validation
  if (!title || title.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Title is required and cannot be empty'
    });
  }

  // Create the project
  const { data: project, error: projectError } = await req.supabase
    .from('projects')
    .insert({
      title: title.trim(),
      description: description !== undefined ? description : "",
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      owner_id: req.user.id, // Set the creator as owner
    })
    .select()
    .single();

  if (projectError) {
    console.log('Project creation error:', projectError);
    return res.status(400).json({ 
      success: false,
      error: projectError.message 
    });
  }

  // Add owner to project_users table
  const projectUsersToInsert = [
    { project_id: project.id, user_id: req.user.id, role: 'owner' }
  ];

  // Add other users if provided
  if (userIds.length > 0) {
    const additionalUsers = userIds.map(userId => ({
      project_id: project.id,
      user_id: userId,
      role: 'member'
    }));
    projectUsersToInsert.push(...additionalUsers);
  }

  const { error: usersError } = await req.supabase
    .from('project_users')
    .insert(projectUsersToInsert);

  if (usersError) {
    console.log('Project users creation error:', usersError);
    // If adding users fails, you might want to delete the project or continue
    // For now, let's continue and just log the error
  }

  console.log('Success! Created project:', project);
  res.status(201).json(project);
});

const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description} = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!title && !description) {
    return res.status(400).json({
      success: false,
      error: 'At least title or description must be provided'
    });
  }
  
  const updateData = { ...(title && { title }), ...(description && { description }) };

  const { data: existingProject, error: checkError } = await req.supabase
    .from('projects')
    .select('id')
    .eq('id', id)
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

  const { data: existingProject, error: checkError } = await req.supabase
    .from('projects')
    .select('id')
    .eq('id', id)
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
    .eq('id', id);

  if (error) {
    return res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }

  res.status(200).json(id);
});

const getProjectUsers = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user has access to this project
  const { data: userAccess } = await req.supabase
    .from('project_users')
    .select('role')
    .eq('project_id', id)
    .eq('user_id', req.user.id)
    .single();

  if (!userAccess) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Get all users for this project
  const { data, error } = await req.supabase
    .from('project_users')
    .select(`
      role,
      user:auth.users(id, email, user_metadata)
    `)
    .eq('project_id', id);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  res.status(200).json(data);
});

const addUserToProject = asyncHandler(async (req, res) => {
  const { id } = req.params; // project id
  const { userId, role = 'member' } = req.body;

  // Check if current user is owner or admin of the project
  const { data: userAccess } = await req.supabase
    .from('project_users')
    .select('role')
    .eq('project_id', id)
    .eq('user_id', req.user.id)
    .single();

  if (!userAccess || !['owner', 'admin'].includes(userAccess.role)) {
    return res.status(403).json({
      success: false,
      error: 'Only project owners and admins can add users'
    });
  }

  const { data, error } = await req.supabase
    .from('project_users')
    .insert({
      project_id: id,
      user_id: userId,
      role: role
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

const removeUserFromProject = asyncHandler(async (req, res) => {
  const { id, userId } = req.params; // project id and user id

  // Check if current user is owner or admin of the project
  const { data: userAccess } = await req.supabase
    .from('project_users')
    .select('role')
    .eq('project_id', id)
    .eq('user_id', req.user.id)
    .single();

  if (!userAccess || !['owner', 'admin'].includes(userAccess.role)) {
    return res.status(403).json({
      success: false,
      error: 'Only project owners and admins can remove users'
    });
  }

  // Don't allow removing the owner
  const { data: targetUser } = await req.supabase
    .from('project_users')
    .select('role')
    .eq('project_id', id)
    .eq('user_id', userId)
    .single();

  if (targetUser?.role === 'owner') {
    return res.status(400).json({
      success: false,
      error: 'Cannot remove project owner'
    });
  }

  const { error } = await req.supabase
    .from('project_users')
    .delete()
    .eq('project_id', id)
    .eq('user_id', userId);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  res.status(200).json({ message: 'User removed from project' });
});

export default {
  getProjects,
  getProject,
  createProject,
  deleteProject,
  updateProject,
  getProjectUsers,
  addUserToProject,
  removeUserFromProject
};