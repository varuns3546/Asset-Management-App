import asyncHandler from 'express-async-handler';
import XLSX from 'xlsx';
import multer from 'multer';

const getHierarchy = asyncHandler(async (req, res) => {
  const { id: project_id } = req.params; // Fix: use 'id' from route params and rename to project_id

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify the user has access to the project through project_users table
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

  // If not found in project_users, check if user is the owner directly
  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', project_id)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    // Get all assets for this project
    const { data: assets, error } = await req.supabase
      .from('assets')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at');

    if (error) {
      console.error('Error fetching assets:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch assets' 
      });
    }
    
    // Return the assets (empty array if none exist)
    res.status(200).json({
      success: true,
      data: assets || []
    });

  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching hierarchy'
    });
  }
});

const deleteHierarchy = asyncHandler(async (req, res) => {
  const { id: project_id } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify the user has access to the project
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', project_id)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    // Delete all assets for this project
    const { error } = await req.supabase
      .from('assets')
      .delete()
      .eq('project_id', project_id);

    if (error) {
      console.error('Error deleting assets:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete assets'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hierarchy deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting hierarchy:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting hierarchy'
    });
  }
});

const getAssetTypes = asyncHandler(async (req, res) => {
  const { id: project_id } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  // Verify the user has access to the project through project_users table
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

  // If not found in project_users, check if user is the owner directly
  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', project_id)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    // Get all asset types for this project
    const { data: assetTypes, error } = await req.supabase
      .from('asset_types')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at');

    if (error) {
      console.error('Error fetching asset types:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch asset types' 
      });
    }

    // Fetch attributes for each asset type
    if (assetTypes && assetTypes.length > 0) {
      const assetTypeIds = assetTypes.map(item => item.id);
      const { data: attributes, error: attributesError } = await req.supabase
        .from('attributes')
        .select('*')
        .in('item_type_id', assetTypeIds);

      if (attributesError) {
        console.error('Error fetching attributes:', attributesError);
        // Continue without attributes if there's an error
      } else {
        // Group attributes by item_type_id
        const attributesByAssetType = {};
        if (attributes) {
          attributes.forEach(attr => {
            if (!attributesByAssetType[attr.item_type_id]) {
              attributesByAssetType[attr.item_type_id] = [];
            }
            attributesByAssetType[attr.item_type_id].push(attr.title);
          });
        }

        // Add attributes to each asset type
        assetTypes.forEach(assetType => {
          assetType.attributes = attributesByAssetType[assetType.id] || [];
        });
      }
    }

    // Return the asset types (empty array if none exist)
    res.status(200).json({
      success: true,
      data: assetTypes || []
    });

  } catch (error) {
    console.error('Error in getAssetTypes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching asset types'
    });
  }
});

const createAssetType = asyncHandler(async (req, res) => {
  const { name, description, parent_ids, subtype_of_id, attributes, has_coordinates, icon, icon_color } = req.body;
  const { id: project_id } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Hierarchy feature type name is required'
    });
  }

  // Verify the user has access to the project through project_users table
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

  // If not found in project_users, check if user is the owner directly
  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', project_id)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    const { data: assetType, error } = await req.supabase
      .from('asset_types')
      .insert({
        title: name.trim(),
        description: description || null,
        project_id: project_id,
        parent_ids: parent_ids || null,
        subtype_of_id: subtype_of_id || null,
        has_coordinates: has_coordinates || false,
        icon: icon || null,
        icon_color: icon_color || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating asset type:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create asset type'
      });
    }

    // Create attributes if they exist
    console.log('Attributes received:', attributes);
    if (attributes && attributes.length > 0) {
      const attributesToInsert = attributes.map(attribute => ({
        item_type_id: assetType.id,
        title: typeof attribute === 'string' ? attribute.trim() : attribute.title.trim(),
        type: typeof attribute === 'string' ? 'text' : (attribute.type || 'text')
      }));

      console.log('Attributes to insert:', attributesToInsert);

      // Test if attributes table exists by trying to select from it first
      const { data: testData, error: testError } = await req.supabase
        .from('attributes')
        .select('*')
        .limit(1);

      if (testError) {
        console.error('Attributes table test error:', testError);
        console.error('Table might not exist or have wrong permissions');
      } else {
        console.log('Attributes table is accessible');
      }

      const { data: insertedAttributes, error: attributesError } = await req.supabase
        .from('attributes')
        .insert(attributesToInsert)
        .select();

      if (attributesError) {
        console.error('Error creating attributes:', attributesError);
        console.error('Full error details:', JSON.stringify(attributesError, null, 2));
        // Note: We don't return an error here since the asset type was created successfully
        // The attributes can be added later if needed
      } else {
        console.log('Successfully created attributes:', insertedAttributes);
      }
    } else {
      console.log('No attributes provided or empty array');
    }

    res.status(201).json({
      success: true,
      data: assetType
    });

  } catch (error) {
    console.error('Error in createAssetType:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating asset type'
    });
  }
});



const deleteAssetType = asyncHandler(async (req, res) => {
  const { id: project_id, featureTypeId } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!featureTypeId) {
    return res.status(400).json({
      success: false,
      error: 'Asset type ID is required'
    });
  }

  // Verify the user has access to the project through project_users table
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

  // If not found in project_users, check if user is the owner directly
  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', project_id)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    // First, get all asset types that might reference this asset type as a parent
    const { data: allAssetTypes, error: fetchError } = await req.supabase
      .from('asset_types')
      .select('id, parent_ids')
      .eq('project_id', project_id);

    if (fetchError) {
      console.error('Error fetching asset types for cleanup:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch asset types for cleanup'
      });
    }

    // Update all asset types that have this asset type in their parent_ids
    const updatePromises = [];
    for (const assetType of allAssetTypes) {
      if (assetType.parent_ids && Array.isArray(assetType.parent_ids) && assetType.parent_ids.includes(featureTypeId)) {
        // Remove the deleted asset type ID from parent_ids
        const updatedParentIds = assetType.parent_ids.filter(id => id !== featureTypeId);
        
        const updatePromise = req.supabase
          .from('asset_types')
          .update({ parent_ids: updatedParentIds.length > 0 ? updatedParentIds : null })
          .eq('id', assetType.id);
        
        updatePromises.push(updatePromise);
      }
    }

    // Execute all parent_ids updates
    if (updatePromises.length > 0) {
      const updateResults = await Promise.all(updatePromises);
      const updateErrors = updateResults.filter(result => result.error);
      
      if (updateErrors.length > 0) {
        console.error('Error updating parent_ids during cleanup:', updateErrors);
        // Continue with deletion even if cleanup fails
      }
    }

    // Now delete the asset type
    const { error } = await req.supabase
      .from('asset_types')
      .delete()
      .eq('id', featureTypeId)
      .eq('project_id', project_id);

    if (error) {
      console.error('Error deleting asset type:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete asset type'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Asset type deleted successfully and parent references cleaned up',
      id: featureTypeId
    });

  } catch (error) {
    console.error('Error in deleteAssetType:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting asset type'
    });
  }
});

// Create individual asset
const createAsset = asyncHandler(async (req, res) => {
  const { title, item_type_id, parent_id, beginning_latitude, end_latitude, beginning_longitude, end_longitude } = req.body;
  const { id: project_id } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Item title is required'
    });
  }

  // Verify the user has access to the project through project_users table
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', project_id)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    const { data: asset, error } = await req.supabase
      .from('assets')
      .insert({
        title: title.trim(),
        item_type_id: item_type_id || null,
        parent_id: parent_id || null,
        project_id: project_id,
        beginning_latitude: beginning_latitude || null,
        end_latitude: end_latitude || null,
        beginning_longitude: beginning_longitude || null,
        end_longitude: end_longitude || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating asset:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create asset'
      });
    }

    res.status(201).json({
      success: true,
      data: asset
    });

  } catch (error) {
    console.error('Error in createAsset:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating asset'
    });
  }
});

// Delete individual asset
const deleteAsset = asyncHandler(async (req, res) => {
  const { id: project_id, featureId } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!featureId) {
    return res.status(400).json({
      success: false,
      error: 'Hierarchy feature ID is required'
    });
  }

  // Verify the user has access to the project through project_users table
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', project_id)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    const { error } = await req.supabase
      .from('assets')
      .delete()
      .eq('id', featureId)
      .eq('project_id', project_id);

    if (error) {
      console.error('Error deleting asset:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete asset'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Asset deleted successfully',
      data: { id: featureId }
    });

  } catch (error) {
    console.error('Error in deleteAsset:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting asset'
    });
  }
});

const updateAssetType = asyncHandler(async (req, res) => {
  const { name, description, parent_ids, subtype_of_id, attributes, has_coordinates, icon, icon_color } = req.body;
  const { id: project_id, featureTypeId } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!featureTypeId) {
    return res.status(400).json({
      success: false,
      error: 'Asset Type ID is required'
    });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Hierarchy feature type name is required'
    });
  }

  // Verify the user has access to the project through project_users table
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

  // If not found in project_users, check if user is the owner directly
  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', project_id)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    // Update the asset type
    const { data: assetType, error: updateError } = await req.supabase
      .from('asset_types')
      .update({
        title: name.trim(),
        description: description || null,
        parent_ids: parent_ids || null,
        subtype_of_id: subtype_of_id || null,
        has_coordinates: has_coordinates || false,
        icon: icon || null,
        icon_color: icon_color || null
      })
      .eq('id', featureTypeId)
      .eq('project_id', project_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating asset type:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update asset type'
      });
    }

    // Handle attributes - always delete existing and insert new ones
    // First, delete existing attributes for this asset type
    const { error: deleteError } = await req.supabase
      .from('attributes')
      .delete()
      .eq('item_type_id', featureTypeId);

    if (deleteError) {
      console.error('Error deleting existing attributes:', deleteError);
    }

    // Then insert new attributes if they exist
    if (attributes && attributes.length > 0) {
      const attributesToInsert = attributes.map(attribute => ({
        item_type_id: featureTypeId,
        title: typeof attribute === 'string' ? attribute.trim() : attribute.title.trim(),
        type: typeof attribute === 'string' ? 'text' : (attribute.type || 'text')
      }));

      const { data: insertedAttributes, error: attributesError } = await req.supabase
        .from('attributes')
        .insert(attributesToInsert)
        .select();

      if (attributesError) {
        console.error('Error creating attributes:', attributesError);
        console.error('Full error details:', JSON.stringify(attributesError, null, 2));
      } else {
        console.log('Successfully created attributes:', insertedAttributes);
      }
    }

    res.status(200).json({
      success: true,
      data: assetType
    });

  } catch (error) {
    console.error('Error in updateAssetType:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating asset type'
    });
  }
});

const updateAsset = asyncHandler(async (req, res) => {
  const { title, item_type_id, parent_id, beginning_latitude, end_latitude, beginning_longitude, end_longitude } = req.body;
  const { id: project_id, featureId } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!featureId) {
    return res.status(400).json({
      success: false,
      error: 'Hierarchy feature ID is required'
    });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Asset title is required'
    });
  }

  // Verify the user has access to the project through project_users table
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

  // If not found in project_users, check if user is the owner directly
  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', project_id)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    // Update the hierarchy feature
    const { data: hierarchyFeature, error: updateError } = await req.supabase
      .from('assets')
      .update({
        title: title.trim(),
        item_type_id: item_type_id || null,
        parent_id: parent_id || null,
        beginning_latitude: beginning_latitude || null,
        end_latitude: end_latitude || null,
        beginning_longitude: beginning_longitude || null,
        end_longitude: end_longitude || null
      })
      .eq('id', featureId)
      .eq('project_id', project_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating asset:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update asset'
      });
    }

    res.status(200).json({
      success: true,
      data: asset
    });

  } catch (error) {
    console.error('Error in updateAsset:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating asset'
    });
  }
});

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'text/tab-separated-values' // .tsv
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|xlsm|csv|tsv)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .xlsx, .xls, .xlsm, .csv, and .tsv files are allowed.'));
    }
  }
});

// Upload and parse hierarchy file
const uploadHierarchyFile = [
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    try {
      let workbook;
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;

      // Parse based on file type
      if (fileName.endsWith('.csv') || fileName.endsWith('.tsv')) {
        const text = fileBuffer.toString('utf-8');
        const delimiter = fileName.endsWith('.tsv') ? '\t' : ',';
        workbook = XLSX.read(text, { type: 'string', raw: true, FS: delimiter });
      } else {
        workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      }

      // Parse all sheets
      const sheets = {};
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        
        if (jsonData.length > 0) {
          const headers = jsonData[0];
          
          // Filter out completely empty rows
          const allDataWithEmpty = jsonData.slice(1);
          const allData = allDataWithEmpty.filter(row => {
            // Check if row has any non-empty cells
            return row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
          });
          
          const preview = allData.slice(0, Math.min(5, allData.length));
          
          sheets[sheetName] = {
            headers,
            preview,
            allData,
            totalRows: allData.length
          };
        }
      });

      if (Object.keys(sheets).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'File has no valid sheets with data'
        });
      }

      // Use first sheet as default
      const defaultSheetName = workbook.SheetNames[0];
      const defaultSheet = sheets[defaultSheetName];

      res.status(200).json({
        success: true,
        data: {
          sheets,
          sheetNames: workbook.SheetNames,
          defaultSheet: defaultSheetName,
          headers: defaultSheet.headers,
          preview: defaultSheet.preview,
          allData: defaultSheet.allData,
          totalRows: defaultSheet.totalRows,
          fileName: req.file.originalname
        }
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to parse file. Please ensure it is a valid spreadsheet.'
      });
    }
  })
];

// Helper function to normalize column names for matching
const normalizeColumnName = (name) => {
  return String(name).toLowerCase().replace(/[\s_-]+/g, '');
};

// Import hierarchy data
const importHierarchyData = asyncHandler(async (req, res) => {
  const { id: project_id } = req.params;
  const { mappings, data } = req.body;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!mappings || !data || !Array.isArray(data)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid import data'
    });
  }

  // Verify project access
  const { data: projectUser, error: projectUserError } = await req.supabase
    .from('project_users')
    .select('id, role')
    .eq('project_id', project_id)
    .eq('user_id', req.user.id)
    .single();

  if (projectUserError || !projectUser) {
    const { data: project, error: projectError } = await req.supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', project_id)
      .eq('owner_id', req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
  }

  try {
    const errors = [];
    const titleToIdMap = {};
    let importedCount = 0;

    // PASS 1: Create all items (without parent relationships)
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Extract title and item_type_id from mapped data
        const title = row.title?.trim();
        const itemTypeId = row.item_type_id;

        if (!title) {
          errors.push({ row: i + 1, error: 'Title is required' });
          continue;
        }

        if (!itemTypeId) {
          errors.push({ row: i + 1, error: 'Asset type is required' });
          continue;
        }

        // Get asset type to check has_coordinates
        const { data: assetType } = await req.supabase
          .from('asset_types')
          .select('has_coordinates')
          .eq('id', itemTypeId)
          .eq('project_id', project_id)
          .single();

        // Build asset data
        const assetData = {
          title,
          item_type_id: itemTypeId,
          project_id: project_id,
          parent_id: null // Set in pass 2
        };

        // Add coordinates only if asset type has_coordinates is true
        if (assetType?.has_coordinates) {
          if (row.beginning_latitude) assetData.beginning_latitude = parseFloat(row.beginning_latitude);
          if (row.end_latitude) assetData.end_latitude = parseFloat(row.end_latitude);
          if (row.beginning_longitude) assetData.beginning_longitude = parseFloat(row.beginning_longitude);
          if (row.end_longitude) assetData.end_longitude = parseFloat(row.end_longitude);

          // Validate coordinate ranges
          if (assetData.beginning_latitude && (assetData.beginning_latitude < -90 || assetData.beginning_latitude > 90)) {
            errors.push({ row: i + 1, error: 'Beginning latitude must be between -90 and 90' });
            continue;
          }
          if (assetData.end_latitude && (assetData.end_latitude < -90 || assetData.end_latitude > 90)) {
            errors.push({ row: i + 1, error: 'End latitude must be between -90 and 90' });
            continue;
          }
          if (assetData.beginning_longitude && (assetData.beginning_longitude < -180 || assetData.beginning_longitude > 180)) {
            errors.push({ row: i + 1, error: 'Beginning longitude must be between -180 and 180' });
            continue;
          }
          if (assetData.end_longitude && (assetData.end_longitude < -180 || assetData.end_longitude > 180)) {
            errors.push({ row: i + 1, error: 'End longitude must be between -180 and 180' });
            continue;
          }
        }

        // Insert asset
        const { data: createdAsset, error } = await req.supabase
          .from('assets')
          .insert(assetData)
          .select()
          .single();

        if (error) {
          errors.push({ row: i + 1, error: error.message });
          continue;
        }

        // Store title-to-id mapping
        titleToIdMap[title] = createdAsset.id;
        importedCount++;
      } catch (error) {
        errors.push({ row: i + 1, error: error.message });
      }
    }

    // PASS 2: Update parent relationships
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const title = row.title?.trim();
      const parentTitle = row.parent?.trim();

      if (title && parentTitle && titleToIdMap[title]) {
        const parentId = titleToIdMap[parentTitle];
        
        if (!parentId) {
          errors.push({ row: i + 1, error: `Parent '${parentTitle}' not found in imported data` });
          continue;
        }

        // Update parent_id
        const { error } = await req.supabase
          .from('assets')
          .update({ parent_id: parentId })
          .eq('id', titleToIdMap[title]);

        if (error) {
          errors.push({ row: i + 1, error: `Failed to set parent: ${error.message}` });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        imported: importedCount,
        total: data.length,
        errors
      }
    });
  } catch (error) {
    console.error('Error importing hierarchy data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while importing data'
    });
  }
});

export default {
  getHierarchy,
  deleteHierarchy,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetTypes,
  createAssetType,
  updateAssetType,
  deleteAssetType,
  uploadHierarchyFile,
  importHierarchyData
};

