import asyncHandler from 'express-async-handler';

// @desc    Get asset with its type's attributes for questionnaire
// @route   GET /api/questionnaire/:projectId/asset/:assetId
// @access  Private
const getAssetQuestionnaire = asyncHandler(async (req, res) => {
  const { projectId, assetId } = req.params;

  try {
    // Get the asset
    const { data: asset, error: assetError } = await req.supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .eq('project_id', projectId)
      .single();

    if (assetError) {
      console.error('Error fetching asset:', assetError);
      return res.status(404).json({
        success: false,
        error: 'Asset not found',
        details: assetError.message
      });
    }

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    // Get the asset type
    let assetType = null;
    if (asset.item_type_id) {
      const { data: typeData, error: typeError } = await req.supabase
        .from('asset_types')
        .select('*')
        .eq('id', asset.item_type_id)
        .single();

      if (typeError) {
        console.error('Error fetching asset type:', typeError);
      } else {
        assetType = typeData;
      }
    }

    // Get attributes for this asset type (only if asset has a type)
    let attributes = [];
    if (asset.item_type_id) {
      const { data: attributesData, error: attributesError } = await req.supabase
        .from('attributes')
        .select('*')
        .eq('item_type_id', asset.item_type_id)
        .order('created_at');

      if (attributesError) {
        console.error('Error fetching attributes:', attributesError);
        // Don't fail the request if attributes can't be fetched
        // The asset may not have any attributes defined yet
      } else {
        attributes = attributesData || [];
      }
    }

    // Get existing responses for this asset (table might not exist yet)
    let responsesMap = {};
    const { data: responses, error: responsesError } = await req.supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('asset_id', assetId);

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      console.log('Note: If the table does not exist, you need to run the SQL from QUESTIONNAIRE_SETUP.md');
      // Don't fail the request if responses table doesn't exist
    } else if (responses) {
      responses.forEach(r => {
        responsesMap[r.attribute_id] = r;
      });
    }

    res.status(200).json({
      success: true,
      data: {
        asset,
        assetType,
        attributes,
        responses: responsesMap
      }
    });

  } catch (error) {
    console.error('Error in getAssetQuestionnaire:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// @desc    Submit/Update questionnaire responses
// @route   POST /api/questionnaire/:projectId/asset/:assetId/submit
// @access  Private
const submitQuestionnaireResponses = asyncHandler(async (req, res) => {
  const { projectId, assetId } = req.params;
  const { responses } = req.body; // Array of { attributeId, attributeTitle, value, metadata }

  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({
      success: false,
      error: 'Responses array is required'
    });
  }

  try {
    // Get the asset to validate and get asset_type_id
    const { data: asset, error: assetError } = await req.supabase
      .from('assets')
      .select('id, item_type_id, project_id')
      .eq('id', assetId)
      .eq('project_id', projectId)
      .single();

    if (assetError || !asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    // Prepare data for upsert
    const responsesToUpsert = responses.map(r => ({
      project_id: projectId,
      asset_id: assetId,
      asset_type_id: asset.item_type_id,
      attribute_id: r.attributeId,
      attribute_title: r.attributeTitle,
      response_value: r.value || null,
      response_metadata: r.metadata || {},
      created_by: req.user.id
    }));

    // Upsert responses (insert or update if exists)
    const { data: savedResponses, error: upsertError } = await req.supabase
      .from('questionnaire_responses')
      .upsert(responsesToUpsert, {
        onConflict: 'asset_id,attribute_id'
      })
      .select();

    if (upsertError) {
      console.error('Error upserting responses:', upsertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save responses'
      });
    }

    // Save photos to attribute_photos table
    for (const response of savedResponses) {
      if (response.response_metadata?.photos && Array.isArray(response.response_metadata.photos)) {
        // Delete existing photos for this response
        await req.supabase
          .from('attribute_photos')
          .delete()
          .eq('response_id', response.id);

        // Insert new photos
        const photosToInsert = response.response_metadata.photos.map(photo => ({
          response_id: response.id,
          photo_url: photo.url,
          file_name: photo.name,
          file_size: photo.size
        }));

        const { error: photosError } = await req.supabase
          .from('attribute_photos')
          .insert(photosToInsert);

        if (photosError) {
          console.error('Error saving photos to attribute_photos:', photosError);
          // Don't fail the request, just log the error
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Responses saved successfully',
      data: savedResponses
    });

  } catch (error) {
    console.error('Error in submitQuestionnaireResponses:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// @desc    Get all responses for a project (for reporting)
// @route   GET /api/questionnaire/:projectId/responses
// @access  Private
const getProjectResponses = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  try {
    const { data: responses, error } = await req.supabase
      .from('questionnaire_responses')
      .select(`
        *,
        assets(id, title, item_type_id),
        asset_types(id, title)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch responses'
      });
    }

    res.status(200).json({
      success: true,
      data: responses || []
    });

  } catch (error) {
    console.error('Error in getProjectResponses:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export {
  getAssetQuestionnaire,
  submitQuestionnaireResponses,
  getProjectResponses
};

