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
    // Get all hierarchy items for this project
    const { data: hierarchyItems, error } = await req.supabase
      .from('hierarchy_entries')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at');

    if (error) {
      console.error('Error fetching hierarchy items:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch hierarchy items' 
      });
    }
    
    // Return the hierarchy items (empty array if none exist)
    res.status(200).json({
      success: true,
      data: hierarchyItems || []
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
    // Delete all hierarchy items for this project
    const { error } = await req.supabase
      .from('hierarchy_entries')
      .delete()
      .eq('project_id', project_id);

    if (error) {
      console.error('Error deleting hierarchy items:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete hierarchy items'
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

const getItemTypes = asyncHandler(async (req, res) => {
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
    // Get all item types for this project
    const { data: itemTypes, error } = await req.supabase
      .from('hierarchy_item_types')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at');

    if (error) {
      console.error('Error fetching item types:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch item types' 
      });
    }

    // Fetch attributes for each item type
    if (itemTypes && itemTypes.length > 0) {
      const itemTypeIds = itemTypes.map(item => item.id);
      const { data: attributes, error: attributesError } = await req.supabase
        .from('attributes')
        .select('*')
        .in('item_type_id', itemTypeIds);

      if (attributesError) {
        console.error('Error fetching attributes:', attributesError);
        // Continue without attributes if there's an error
      } else {
        // Group attributes by item_type_id
        const attributesByItemType = {};
        if (attributes) {
          attributes.forEach(attr => {
            if (!attributesByItemType[attr.item_type_id]) {
              attributesByItemType[attr.item_type_id] = [];
            }
            attributesByItemType[attr.item_type_id].push(attr.title);
          });
        }

        // Add attributes to each item type
        itemTypes.forEach(itemType => {
          itemType.attributes = attributesByItemType[itemType.id] || [];
        });
      }
    }

    // Return the item types (empty array if none exist)
    res.status(200).json({
      success: true,
      data: itemTypes || []
    });

  } catch (error) {
    console.error('Error in getItemTypes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching item types'
    });
  }
});

const createItemType = asyncHandler(async (req, res) => {
  const { name, description, parent_ids, attributes, has_coordinates } = req.body;
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
      error: 'Item type name is required'
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
    const { data: itemType, error } = await req.supabase
      .from('hierarchy_item_types')
      .insert({
        title: name.trim(),
        description: description || null,
        project_id: project_id,
        parent_ids: parent_ids || null,
        has_coordinates: has_coordinates || false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating item type:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create item type'
      });
    }

    // Create attributes if they exist
    console.log('Attributes received:', attributes);
    if (attributes && attributes.length > 0) {
      const attributesToInsert = attributes.map(attribute => ({
        item_type_id: itemType.id,
        title: attribute.trim()
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
        // Note: We don't return an error here since the item type was created successfully
        // The attributes can be added later if needed
      } else {
        console.log('Successfully created attributes:', insertedAttributes);
      }
    } else {
      console.log('No attributes provided or empty array');
    }

    res.status(201).json({
      success: true,
      data: itemType
    });

  } catch (error) {
    console.error('Error in createItemType:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating item type'
    });
  }
});



const deleteItemType = asyncHandler(async (req, res) => {
  const { id: project_id, itemTypeId } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!itemTypeId) {
    return res.status(400).json({
      success: false,
      error: 'Item type ID is required'
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
    // First, get all item types that might reference this item type as a parent
    const { data: allItemTypes, error: fetchError } = await req.supabase
      .from('hierarchy_item_types')
      .select('id, parent_ids')
      .eq('project_id', project_id);

    if (fetchError) {
      console.error('Error fetching item types for cleanup:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch item types for cleanup'
      });
    }

    // Update all item types that have this item type in their parent_ids
    const updatePromises = [];
    for (const itemType of allItemTypes) {
      if (itemType.parent_ids && Array.isArray(itemType.parent_ids) && itemType.parent_ids.includes(itemTypeId)) {
        // Remove the deleted item type ID from parent_ids
        const updatedParentIds = itemType.parent_ids.filter(id => id !== itemTypeId);
        
        const updatePromise = req.supabase
          .from('hierarchy_item_types')
          .update({ parent_ids: updatedParentIds.length > 0 ? updatedParentIds : null })
          .eq('id', itemType.id);
        
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

    // Now delete the item type
    const { error } = await req.supabase
      .from('hierarchy_item_types')
      .delete()
      .eq('id', itemTypeId)
      .eq('project_id', project_id);

    if (error) {
      console.error('Error deleting item type:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete item type'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item type deleted successfully and parent references cleaned up',
      id: itemTypeId
    });

  } catch (error) {
    console.error('Error in deleteItemType:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting item type'
    });
  }
});

// Create individual hierarchy item
const createHierarchyItem = asyncHandler(async (req, res) => {
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
    const { data: hierarchyItem, error } = await req.supabase
      .from('hierarchy_entries')
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
      console.error('Error creating hierarchy item:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create hierarchy item'
      });
    }

    res.status(201).json({
      success: true,
      data: hierarchyItem
    });

  } catch (error) {
    console.error('Error in createHierarchyItem:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating hierarchy item'
    });
  }
});

// Delete individual hierarchy item
const deleteHierarchyItem = asyncHandler(async (req, res) => {
  const { id: project_id, itemId } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!itemId) {
    return res.status(400).json({
      success: false,
      error: 'Item ID is required'
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
      .from('hierarchy_entries')
      .delete()
      .eq('id', itemId)
      .eq('project_id', project_id);

    if (error) {
      console.error('Error deleting hierarchy item:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete hierarchy item'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hierarchy item deleted successfully',
      data: { id: itemId }
    });

  } catch (error) {
    console.error('Error in deleteHierarchyItem:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting hierarchy item'
    });
  }
});

const updateItemType = asyncHandler(async (req, res) => {
  const { name, description, parent_ids, attributes, has_coordinates } = req.body;
  const { id: project_id, itemTypeId } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!itemTypeId) {
    return res.status(400).json({
      success: false,
      error: 'Item Type ID is required'
    });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Item type name is required'
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
    // Update the item type
    const { data: itemType, error: updateError } = await req.supabase
      .from('hierarchy_item_types')
      .update({
        title: name.trim(),
        description: description || null,
        parent_ids: parent_ids || null,
        has_coordinates: has_coordinates || false
      })
      .eq('id', itemTypeId)
      .eq('project_id', project_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating item type:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update item type'
      });
    }

    // Handle attributes - always delete existing and insert new ones
    // First, delete existing attributes for this item type
    const { error: deleteError } = await req.supabase
      .from('attributes')
      .delete()
      .eq('item_type_id', itemTypeId);

    if (deleteError) {
      console.error('Error deleting existing attributes:', deleteError);
    }

    // Then insert new attributes if they exist
    if (attributes && attributes.length > 0) {
      const attributesToInsert = attributes.map(attribute => ({
        item_type_id: itemTypeId,
        title: attribute.trim()
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
      data: itemType
    });

  } catch (error) {
    console.error('Error in updateItemType:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating item type'
    });
  }
});

const updateHierarchyItem = asyncHandler(async (req, res) => {
  const { title, item_type_id, parent_id, beginning_latitude, end_latitude, beginning_longitude, end_longitude } = req.body;
  const { id: project_id, itemId } = req.params;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: 'Project ID is required'
    });
  }

  if (!itemId) {
    return res.status(400).json({
      success: false,
      error: 'Item ID is required'
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
    // Update the hierarchy item
    const { data: hierarchyItem, error: updateError } = await req.supabase
      .from('hierarchy_entries')
      .update({
        title: title.trim(),
        item_type_id: item_type_id || null,
        parent_id: parent_id || null,
        beginning_latitude: beginning_latitude || null,
        end_latitude: end_latitude || null,
        beginning_longitude: beginning_longitude || null,
        end_longitude: end_longitude || null
      })
      .eq('id', itemId)
      .eq('project_id', project_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating hierarchy item:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update hierarchy item'
      });
    }

    res.status(200).json({
      success: true,
      data: hierarchyItem
    });

  } catch (error) {
    console.error('Error in updateHierarchyItem:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating hierarchy item'
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
          errors.push({ row: i + 1, error: 'Item type is required' });
          continue;
        }

        // Get item type to check has_coordinates
        const { data: itemType } = await req.supabase
          .from('hierarchy_item_types')
          .select('has_coordinates')
          .eq('id', itemTypeId)
          .eq('project_id', project_id)
          .single();

        // Build item data
        const itemData = {
          title,
          item_type_id: itemTypeId,
          project_id: project_id,
          parent_id: null // Set in pass 2
        };

        // Add coordinates only if item type has_coordinates is true
        if (itemType?.has_coordinates) {
          if (row.beginning_latitude) itemData.beginning_latitude = parseFloat(row.beginning_latitude);
          if (row.end_latitude) itemData.end_latitude = parseFloat(row.end_latitude);
          if (row.beginning_longitude) itemData.beginning_longitude = parseFloat(row.beginning_longitude);
          if (row.end_longitude) itemData.end_longitude = parseFloat(row.end_longitude);

          // Validate coordinate ranges
          if (itemData.beginning_latitude && (itemData.beginning_latitude < -90 || itemData.beginning_latitude > 90)) {
            errors.push({ row: i + 1, error: 'Beginning latitude must be between -90 and 90' });
            continue;
          }
          if (itemData.end_latitude && (itemData.end_latitude < -90 || itemData.end_latitude > 90)) {
            errors.push({ row: i + 1, error: 'End latitude must be between -90 and 90' });
            continue;
          }
          if (itemData.beginning_longitude && (itemData.beginning_longitude < -180 || itemData.beginning_longitude > 180)) {
            errors.push({ row: i + 1, error: 'Beginning longitude must be between -180 and 180' });
            continue;
          }
          if (itemData.end_longitude && (itemData.end_longitude < -180 || itemData.end_longitude > 180)) {
            errors.push({ row: i + 1, error: 'End longitude must be between -180 and 180' });
            continue;
          }
        }

        // Insert item
        const { data: createdItem, error } = await req.supabase
          .from('hierarchy_entries')
          .insert(itemData)
          .select()
          .single();

        if (error) {
          errors.push({ row: i + 1, error: error.message });
          continue;
        }

        // Store title-to-id mapping
        titleToIdMap[title] = createdItem.id;
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
          .from('hierarchy_entries')
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
  createHierarchyItem,
  updateHierarchyItem,
  deleteHierarchyItem,
  getItemTypes,
  createItemType,
  updateItemType,
  deleteItemType,
  uploadHierarchyFile,
  importHierarchyData
};