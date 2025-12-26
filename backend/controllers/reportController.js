import asyncHandler from 'express-async-handler';
import supabaseClient from '../config/supabaseClient.js';
import { formatPDFReport, formatExcelReport, formatCSVReport } from '../utils/reportFormatters.js';

const { supabaseAdmin } = supabaseClient;

// @desc    Generate report
// @route   POST /api/reports/:projectId/generate
// @access  Private
const generateReport = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { format, sections = [] } = req.body;

  if (!format || !['pdf', 'excel', 'csv'].includes(format)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid format. Must be pdf, excel, or csv'
    });
  }

  if (!sections || sections.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one section must be selected'
    });
  }

  try {
    // Verify project access
    const { data: projectUser } = await req.supabase
      .from('project_users')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', req.user.id)
      .single();

    if (!projectUser) {
      const { data: project } = await req.supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('owner_id', req.user.id)
        .single();

      if (!project) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    // Get project info
    const { data: project } = await req.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Collect data based on selected sections
    const reportData = {};

    // Project Summary
    if (sections.includes('summary')) {
      const { count: totalAssets } = await supabaseAdmin
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      const { count: totalResponses } = await supabaseAdmin
        .from('attribute_values')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      const { count: totalFiles } = await supabaseAdmin
        .from('project_files')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      const { count: totalAssetTypes } = await supabaseAdmin
        .from('asset_types')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      const completionRate = totalAssets > 0 && totalResponses > 0
        ? parseFloat(((totalResponses / (totalAssets || 1)) * 100).toFixed(2))
        : 0;

      reportData.summary = {
        projectName: project.title || project.name || 'Untitled Project',
        description: project.description || '',
        totalAssets: totalAssets || 0,
        totalResponses: totalResponses || 0,
        totalFiles: totalFiles || 0,
        totalAssetTypes: totalAssetTypes || 0,
        completionRate: Math.min(completionRate, 100)
      };
    }

    // Asset Inventory
    if (sections.includes('assets')) {
      const { data: assets } = await supabaseAdmin
        .from('assets')
        .select('id, title, item_type_id, parent_id, beginning_latitude, beginning_longitude')
        .eq('project_id', projectId);

      // Get asset types for names
      const assetTypeIds = [...new Set((assets || []).map(a => a.item_type_id).filter(Boolean))];
      const assetTypeMap = {};
      if (assetTypeIds.length > 0) {
        const { data: assetTypes } = await supabaseAdmin
          .from('asset_types')
          .select('id, title')
          .in('id', assetTypeIds);
        
        if (assetTypes) {
          assetTypes.forEach(type => {
            assetTypeMap[type.id] = type.title;
          });
        }
      }

      // Get parent titles
      const assetIds = (assets || []).map(a => a.id);
      const parentMap = {};
      if (assets && assets.length > 0) {
        const parentIds = [...new Set((assets || []).map(a => a.parent_id).filter(Boolean))];
        if (parentIds.length > 0) {
          const { data: parentAssets } = await supabaseAdmin
            .from('assets')
            .select('id, title')
            .in('id', parentIds);
          
          if (parentAssets) {
            parentAssets.forEach(asset => {
              parentMap[asset.id] = asset.title;
            });
          }
        }
      }

      reportData.assets = (assets || []).map(asset => ({
        title: asset.title || 'Untitled',
        typeName: assetTypeMap[asset.item_type_id] || 'Untyped',
        parentTitle: asset.parent_id ? parentMap[asset.parent_id] : null,
        beginning_latitude: asset.beginning_latitude,
        beginning_longitude: asset.beginning_longitude
      }));
    }

    // Questionnaire Responses
    if (sections.includes('questionnaire')) {
      const { data: responses } = await supabaseAdmin
        .from('attribute_values')
        .select('asset_id, attribute_id, response_value, created_at')
        .eq('project_id', projectId);

      // Get asset titles
      const assetIds = [...new Set((responses || []).map(r => r.asset_id).filter(Boolean))];
      const assetMap = {};
      if (assetIds.length > 0) {
        const { data: assets } = await supabaseAdmin
          .from('assets')
          .select('id, title')
          .in('id', assetIds);
        
        if (assets) {
          assets.forEach(asset => {
            assetMap[asset.id] = asset.title;
          });
        }
      }

      // Get attribute titles
      const attributeIds = [...new Set((responses || []).map(r => r.attribute_id).filter(Boolean))];
      const attributeMap = {};
      if (attributeIds.length > 0) {
        const { data: attributes } = await supabaseAdmin
          .from('attributes')
          .select('id, title')
          .in('id', attributeIds);
        
        if (attributes) {
          attributes.forEach(attr => {
            attributeMap[attr.id] = attr.title;
          });
        }
      }

      reportData.responses = (responses || []).map(response => ({
        assetTitle: assetMap[response.asset_id] || 'Unknown Asset',
        attributeTitle: attributeMap[response.attribute_id] || 'Unknown Attribute',
        response_value: response.response_value || '',
        created_at: response.created_at
      }));
    }

    // Asset Types Breakdown
    if (sections.includes('assetTypes')) {
      const { data: assetTypes } = await supabaseAdmin
        .from('asset_types')
        .select('id, title, description')
        .eq('project_id', projectId);

      // Get attributes for each type
      const typeIds = (assetTypes || []).map(t => t.id);
      let attributesByType = {};
      if (typeIds.length > 0) {
        const { data: attributes } = await supabaseAdmin
          .from('attributes')
          .select('id, title, item_type_id')
          .in('item_type_id', typeIds);
        
        if (attributes) {
          attributes.forEach(attr => {
            if (!attributesByType[attr.item_type_id]) {
              attributesByType[attr.item_type_id] = [];
            }
            attributesByType[attr.item_type_id].push({ title: attr.title });
          });
        }
      }

      // Get asset counts per type
      const { data: allAssets } = await supabaseAdmin
        .from('assets')
        .select('item_type_id')
        .eq('project_id', projectId);

      const assetCounts = {};
      (allAssets || []).forEach(asset => {
        const typeId = asset.item_type_id || 'untyped';
        assetCounts[typeId] = (assetCounts[typeId] || 0) + 1;
      });

      reportData.assetTypes = (assetTypes || []).map(type => ({
        title: type.title || 'Untitled',
        description: type.description || '',
        assetCount: assetCounts[type.id] || 0,
        attributes: attributesByType[type.id] || []
      }));
    }

    // Generate report based on format
    let fileBuffer;
    let mimeType;
    let fileExtension;

    if (format === 'pdf') {
      fileBuffer = await formatPDFReport(reportData, sections);
      mimeType = 'application/pdf';
      fileExtension = 'pdf';
    } else if (format === 'excel') {
      fileBuffer = await formatExcelReport(reportData, sections);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    } else if (format === 'csv') {
      const csvContent = formatCSVReport(reportData, sections);
      fileBuffer = Buffer.from(csvContent, 'utf-8');
      mimeType = 'text/csv';
      fileExtension = 'csv';
    }

    const fileName = `report_${project.title || project.name || 'project'}_${Date.now()}.${fileExtension}`;

    // Set headers for file download
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fileBuffer.length);

    res.status(200).send(fileBuffer);

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      details: error.message
    });
  }
});

export { generateReport };

