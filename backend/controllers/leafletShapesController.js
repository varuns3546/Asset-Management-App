import asyncHandler from 'express-async-handler';

// @desc    Get all leaflet shapes for a project
// @route   GET /api/leaflet-shapes/:projectId
// @access  Private
const getShapesByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Use ST_AsGeoJSON to convert PostGIS geometry to GeoJSON
  const { data, error } = await req.supabase
    .rpc('get_leaflet_shapes_geojson', { p_project_id: projectId });

  if (error) {
    console.error('Error fetching shapes:', error);
    return res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }

  // data is JSONB array, parse it
  const shapes = Array.isArray(data) ? data : (data ? JSON.parse(data) : []);

  res.status(200).json({
    success: true,
    data: shapes
  });
});

// @desc    Save leaflet shapes for a project
// @route   POST /api/leaflet-shapes/:projectId
// @access  Private
const saveShapes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { shapes } = req.body;

  if (!shapes || !Array.isArray(shapes) || shapes.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No shapes provided'
    });
  }

  // Use RPC function to insert shapes with PostGIS geometry
  const { data, error } = await req.supabase
    .rpc('insert_leaflet_shapes', { 
      p_project_id: projectId,
      p_shapes: shapes  // Pass as JSONB, not string
    });

  if (error) {
    console.error('Error saving shapes:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  // data is JSONB, parse it if needed
  const savedShapes = Array.isArray(data) ? data : (data ? JSON.parse(data) : []);

  res.status(201).json({
    success: true,
    message: `Successfully saved ${shapes.length} shape(s)`,
    data: savedShapes
  });
});

// @desc    Delete a specific leaflet shape
// @route   DELETE /api/leaflet-shapes/:shapeId
// @access  Private
const deleteShape = asyncHandler(async (req, res) => {
  const { shapeId } = req.params;

  const { error } = await req.supabase
    .from('leaflet_shapes')
    .delete()
    .eq('id', shapeId);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  res.status(200).json({
    success: true,
    message: 'Shape deleted successfully'
  });
});

// @desc    Delete all leaflet shapes for a project
// @route   DELETE /api/leaflet-shapes/project/:projectId
// @access  Private
const deleteAllShapesByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const { error } = await req.supabase
    .from('leaflet_shapes')
    .delete()
    .eq('project_id', projectId);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  res.status(200).json({
    success: true,
    message: 'All shapes deleted successfully'
  });
});

export default {
  getShapesByProject,
  saveShapes,
  deleteShape,
  deleteAllShapesByProject
};

