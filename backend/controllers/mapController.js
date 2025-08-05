import asyncHandler from 'express-async-handler';
import supabaseClient from '../config/supabaseClient.js';
const {supabase, supabaseAdmin} = supabaseClient
const createMap = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    
    if (!title) {
        return res.status(400).json({
            success: false,
            error: 'Map title is required'
        });
    }

    const { data, error } = await req.supabase
        .from('maps')
        .insert({
            title,
            description,
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

const createLocation = asyncHandler(async (req, res) => {
    const {title, description, latitude, longitude, map_id} = req.body
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

    // Verify the map exists and belongs to the user
    const { data: mapData, error: mapError } = await req.supabase
        .from('maps')
        .select('id')
        .eq('id', map_id)
        .eq('user_id', req.user.id)
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
        user_id: req.user.id
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
    const {data, error} = await req.supabase
    .from('maps')
    .select('*')
    .eq('user_id', req.user.id)

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
    
    if (!map_id) {
        return res.status(400).json({
            success: false,
            error: 'Map ID is required'
        });
    }

    // Verify the map exists and belongs to the user
    const { data: mapData, error: mapError } = await req.supabase
        .from('maps')
        .select('id')
        .eq('id', map_id)
        .eq('user_id', req.user.id)
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
    .eq('user_id', req.user.id)
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