import asyncHandler from 'express-async-handler';
import supabaseClient from '../config/supabaseClient.js';
const {supabase, supabaseAdmin} = supabaseClient

const registerUser = asyncHandler(async (req, res) => {
    const {firstName, lastName, email, password, orgPassword} = req.body
    if(!firstName || !lastName || !email || !password || !orgPassword){
        res.status(400)
        throw new Error('Please add all fields')
    }

    const ORG_PASSWORDS = {
        [process.env.ORG_PASSWORD_CLIENT]: 'client',
        [process.env.ORG_PASSWORD_MAIN_CONSULTANT]: 'main_consultant',
        [process.env.ORG_PASSWORD_SUB_CONSULTANT]: 'sub_consultant',
    }
    
    const role = ORG_PASSWORDS[orgPassword] || null; // Fixed: use orgPassword instead of inputPassword

    if(role === null){
        res.status(400)
        throw new Error('Enter a valid org password')
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                firstName: firstName,
                lastName: lastName,
            }
        }
    })
    
    if (signUpError) {
        res.status(400)
        throw new Error(`Signup Error: ${signUpError.message}`)
    }

    const userId = signUpData.user.id

    // 2. Update the user's app_metadata with role
    const { data, error: setRoleError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { role }
    })

    if (setRoleError) {
        res.status(400)
        throw new Error(`Role assignment error: ${setRoleError.message}`)
    }

    // Send success response
    res.status(201).json({
        id: userId,
        email: signUpData.user.email,
        firstName: firstName,
        lastName: lastName,
        role: role,
        token: signUpData.session.access_token
    })
})

const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body

    if(!email || !password){
        res.status(400)
        throw new Error('Please add all fields')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    if(error){
        res.status(400)
        throw new Error('Invalid credentials')
    }
    
    const metaData = data.user.user_metadata
    res.json({
        id: data.user.id,
        email: metaData.email,
        firstName: metaData.firstName,
        lastName: metaData.lastName,
        role: data.user.app_metadata.role,
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
    })

})

const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        res.status(400);
        throw new Error('Refresh token is required');
    }

    const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
    });

    if (error) {
        res.status(401);
        throw new Error('Invalid or expired refresh token');
    }

    const metaData = data.user.user_metadata;
    res.json({
        id: data.user.id,
        email: metaData.email,
        firstName: metaData.firstName,
        lastName: metaData.lastName,
        role: data.user.app_metadata.role,
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
    });
})

const getUser = asyncHandler(async (req, res) => {
    // Extract access token from request header
    const accessToken = extractTokenFromHeader(req);
  
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required. Please provide Authorization header with Bearer token.'
      });
    }
  
    
      // Get user from Supabase using the access token
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error) {
    return res.status(401).json({
        success: false,
        error: error.message
    });
    }

    if (!user) {
    return res.status(404).json({
        success: false,
        error: 'User not found'
    });
    }

    // Return formatted user data
    const metaData = user.user_metadata
    res.json({
        id: user.id,
        email: metaData.email,
        firstName: metaData.firstName,
        lastName: metaData.lastName,
        role: user.app_metadata.role
    })

    
});

const getSelectedProject = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get user profile with selected_project_id
    const { data: profile, error } = await req.supabase
        .from('user_profiles')
        .select('selected_project_id')
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }

    // If no profile exists or no selected project, return null
    const selectedProjectId = profile?.selected_project_id || null;

    // If there's a selected project ID, fetch the full project
    if (selectedProjectId) {
        const { data: project, error: projectError } = await req.supabase
            .from('projects')
            .select('*')
            .eq('id', selectedProjectId)
            .single();

        if (projectError) {
            // Project might have been deleted, clear the selection
            await req.supabase
                .from('user_profiles')
                .update({ selected_project_id: null })
                .eq('id', userId);
            
            return res.status(200).json(null);
        }

        return res.status(200).json(project);
    }

    res.status(200).json(null);
});

const setSelectedProject = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { projectId } = req.body;

    // If projectId is provided, verify the project exists and user has access
    if (projectId) {
        const { data: projectAccess } = await req.supabase
            .from('project_users')
            .select('project_id')
            .eq('project_id', projectId)
            .eq('user_id', userId)
            .single();

        if (!projectAccess) {
            return res.status(403).json({
                success: false,
                error: 'Access denied to this project'
            });
        }
    }

    // Upsert user profile with selected_project_id
    const { data, error } = await req.supabase
        .from('user_profiles')
        .upsert({
            id: userId,
            selected_project_id: projectId || null,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'id'
        })
        .select()
        .single();

    if (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }

    // If projectId is set, return the full project
    if (projectId) {
        const { data: project, error: projectError } = await req.supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (projectError) {
            return res.status(400).json({
                success: false,
                error: projectError.message
            });
        }

        return res.status(200).json(project);
    }

    res.status(200).json(null);
});

const extractTokenFromHeader = (req) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader) {
      return null;
    }
  
    // Handle "Bearer <token>" format
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1]; // Remove "Bearer " prefix
    }

  
    // Handle direct token (less common)
    return authHeader;
};

export default {registerUser, loginUser, getUser, getSelectedProject, setSelectedProject, refreshToken}