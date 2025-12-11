import asyncHandler from 'express-async-handler';

// @desc    Export all project data as JSON
// @route   GET /api/projects/:id/export
// @access  Private
const exportProjectData = asyncHandler(async (req, res) => {
  const { id: projectId } = req.params;

  try {
    // Get project
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Get assets
    const { data: assets } = await req.supabase
      .from('assets')
      .select('*')
      .eq('project_id', projectId);

    // Get asset types
    const { data: assetTypes } = await req.supabase
      .from('asset_types')
      .select('*')
      .eq('project_id', projectId);

    // Get attributes
    const assetTypeIds = (assetTypes || []).map(t => t.id);
    let attributes = [];
    if (assetTypeIds.length > 0) {
      const { data: attributesData } = await req.supabase
        .from('attributes')
        .select('*')
        .in('item_type_id', assetTypeIds);
      attributes = attributesData || [];
    }

    // Get questionnaire responses
    const { data: responses } = await req.supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('project_id', projectId);

    // Get files metadata
    const { data: files } = await req.supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId);

    // Get project users
    const { data: projectUsers } = await req.supabase
      .from('project_users')
      .select('*')
      .eq('project_id', projectId);

    const exportData = {
      exportDate: new Date().toISOString(),
      projectId: projectId,
      project,
      assets: assets || [],
      assetTypes: assetTypes || [],
      attributes: attributes || [],
      responses: responses || [],
      files: files || [],
      projectUsers: projectUsers || [],
      metadata: {
        totalAssets: (assets || []).length,
        totalResponses: (responses || []).length,
        totalFiles: (files || []).length,
        totalAssetTypes: (assetTypes || []).length,
        totalUsers: (projectUsers || []).length
      }
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="project_${project.name}_export_${Date.now()}.json"`
    );

    res.status(200).json(exportData);

  } catch (error) {
    console.error('Error exporting project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export project data'
    });
  }
});

export { exportProjectData };

