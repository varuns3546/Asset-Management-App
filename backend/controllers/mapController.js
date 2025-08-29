import asyncHandler from 'express-async-handler';
import supabaseClient from '../config/supabaseClient.js';
const {supabase, supabaseAdmin} = supabaseClient

const createMap = asyncHandler(async (req, res) => {
    const { title, description, project_id } = req.body;
    
    if (!title) {
        return res.status(400).json({
            success: false,
            error: 'Map title is required'
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
        .from('maps')
        .insert({
            title,
            description,
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

const createLocation = asyncHandler(async (req, res) => {
    const {title, description, latitude, longitude, map_id, project_id} = req.body
    
    if( !latitude || !longitude){
        return res.status(400).json({
            success: false,
            error: 'Coordinates are required'
          });
    }

    if (!map_id) {
        return res.status(400).json({
            success: false,
            error: 'Map ID is required'
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

    // Verify the map exists and belongs to the project
    const { data: mapData, error: mapError } = await req.supabase
        .from('maps')
        .select('id')
        .eq('id', map_id)
        .eq('project_id', project_id)
        .single();

    if (mapError || !mapData) {
        return res.status(404).json({
            success: false,
            error: 'Map not found or access denied'
        });
    }

    const {data, error} = await req.supabase
    .from('locations')
    .insert({
        title,
        description,
        latitude,
        longitude,
        map_id,
        project_id: project_id,
        user_id: req.user.id // Keep user_id for audit purposes
    })
    .select()
    .single()

    if (error) {
        return res.status(400).json({ 
          success: false,
          error: error.message 
        });
      }
    
    res.status(201).json(data);
})

const getMaps = asyncHandler(async (req, res) => {
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

    const {data, error} = await req.supabase
    .from('maps')
    .select('*')
    .eq('project_id', project_id)

    if (error) {
        return res.status(400).json({ 
          success: false,
          error: error.message 
        });
      }
    
    res.status(200).json(data);
})

const getLocations = asyncHandler(async (req, res) => {
    const { map_id } = req.params;
    const { project_id } = req.query;
    
    if (!map_id) {
        return res.status(400).json({
            success: false,
            error: 'Map ID is required'
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

    // Verify the map exists and belongs to the project
    const { data: mapData, error: mapError } = await req.supabase
        .from('maps')
        .select('id')
        .eq('id', map_id)
        .eq('project_id', project_id)
        .single();

    if (mapError || !mapData) {
        return res.status(404).json({
            success: false,
            error: 'Map not found or access denied'
        });
    }

    const {data, error} = await req.supabase
    .from('locations')
    .select('*')
    .eq('project_id', project_id)
    .eq('map_id', map_id)

    if (error) {
        return res.status(400).json({ 
          success: false,
          error: error.message 
        });
      }
    
    res.status(200).json(data);
})

export default {createMap, createLocation, getMaps, getLocations}