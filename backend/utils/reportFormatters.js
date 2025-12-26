import { createRequire } from 'module';
import ExcelJS from 'exceljs';

const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

/**
 * Format data for PDF report
 * @param {Object} data - Report data
 * @param {Array} sections - Selected sections to include
 * @returns {Buffer} PDF buffer
 */
export const formatPDFReport = async (data, sections) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Title
      doc.fontSize(20).text('Project Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      // Project Summary
      if (sections.includes('summary') && data.summary) {
        doc.fontSize(16).text('Project Summary', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Project: ${data.summary.projectName || 'N/A'}`);
        doc.text(`Description: ${data.summary.description || 'N/A'}`);
        doc.text(`Total Assets: ${data.summary.totalAssets || 0}`);
        doc.text(`Total Responses: ${data.summary.totalResponses || 0}`);
        doc.text(`Total Files: ${data.summary.totalFiles || 0}`);
        doc.text(`Asset Types: ${data.summary.totalAssetTypes || 0}`);
        if (data.summary.completionRate !== undefined) {
          doc.text(`Completion Rate: ${data.summary.completionRate}%`);
        }
        doc.moveDown(2);
      }

      // Asset Inventory
      if (sections.includes('assets') && data.assets && data.assets.length > 0) {
        doc.fontSize(16).text('Asset Inventory', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        
        // Group by asset type
        const assetsByType = {};
        data.assets.forEach(asset => {
          const typeName = asset.typeName || 'Untyped';
          if (!assetsByType[typeName]) {
            assetsByType[typeName] = [];
          }
          assetsByType[typeName].push(asset);
        });

        Object.entries(assetsByType).forEach(([typeName, assets]) => {
          doc.fontSize(14).text(typeName, { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(10);
          
          assets.forEach((asset, index) => {
            doc.text(`${index + 1}. ${asset.title || 'Untitled Asset'}`);
            if (asset.parentTitle) {
              doc.text(`   Parent: ${asset.parentTitle}`, { indent: 20 });
            }
            if (asset.beginning_latitude && asset.beginning_longitude) {
              doc.text(`   Coordinates: ${asset.beginning_latitude}, ${asset.beginning_longitude}`, { indent: 20 });
            }
            doc.moveDown(0.3);
          });
          doc.moveDown();
        });
        doc.moveDown();
      }

      // Questionnaire Responses
      if (sections.includes('questionnaire') && data.responses && data.responses.length > 0) {
        doc.fontSize(16).text('Questionnaire Responses', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        
        // Group by asset
        const responsesByAsset = {};
        data.responses.forEach(response => {
          const assetTitle = response.assetTitle || 'Unknown Asset';
          if (!responsesByAsset[assetTitle]) {
            responsesByAsset[assetTitle] = [];
          }
          responsesByAsset[assetTitle].push(response);
        });

        Object.entries(responsesByAsset).forEach(([assetTitle, responses]) => {
          doc.fontSize(14).text(assetTitle, { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(10);
          
          responses.forEach((response, index) => {
            doc.text(`${index + 1}. ${response.attributeTitle || 'Unknown Attribute'}`);
            if (response.response_value) {
              doc.text(`   Value: ${response.response_value}`, { indent: 20 });
            }
            if (response.created_at) {
              doc.text(`   Date: ${new Date(response.created_at).toLocaleDateString()}`, { indent: 20 });
            }
            doc.moveDown(0.3);
          });
          doc.moveDown();
        });
        doc.moveDown();
      }

      // Asset Types Breakdown
      if (sections.includes('assetTypes') && data.assetTypes && data.assetTypes.length > 0) {
        doc.fontSize(16).text('Asset Types Breakdown', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        
        data.assetTypes.forEach((type, index) => {
          doc.text(`${index + 1}. ${type.title || 'Untitled Type'}`);
          if (type.description) {
            doc.text(`   Description: ${type.description}`, { indent: 20 });
          }
          if (type.assetCount !== undefined) {
            doc.text(`   Assets: ${type.assetCount}`, { indent: 20 });
          }
          if (type.attributes && type.attributes.length > 0) {
            doc.text(`   Attributes: ${type.attributes.map(a => a.title).join(', ')}`, { indent: 20 });
          }
          doc.moveDown();
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Format data for Excel report
 * @param {Object} data - Report data
 * @param {Array} sections - Selected sections to include
 * @returns {Buffer} Excel buffer
 */
export const formatExcelReport = async (data, sections) => {
  const workbook = new ExcelJS.Workbook();
  
  // Project Summary Sheet
  if (sections.includes('summary') && data.summary) {
    const summarySheet = workbook.addWorksheet('Project Summary');
    summarySheet.columns = [
      { header: 'Property', key: 'property', width: 30 },
      { header: 'Value', key: 'value', width: 50 }
    ];
    
    summarySheet.addRow({ property: 'Project Name', value: data.summary.projectName || 'N/A' });
    summarySheet.addRow({ property: 'Description', value: data.summary.description || 'N/A' });
    summarySheet.addRow({ property: 'Total Assets', value: data.summary.totalAssets || 0 });
    summarySheet.addRow({ property: 'Total Responses', value: data.summary.totalResponses || 0 });
    summarySheet.addRow({ property: 'Total Files', value: data.summary.totalFiles || 0 });
    summarySheet.addRow({ property: 'Asset Types', value: data.summary.totalAssetTypes || 0 });
    if (data.summary.completionRate !== undefined) {
      summarySheet.addRow({ property: 'Completion Rate', value: `${data.summary.completionRate}%` });
    }
  }

  // Asset Inventory Sheet
  if (sections.includes('assets') && data.assets && data.assets.length > 0) {
    const assetsSheet = workbook.addWorksheet('Asset Inventory');
    assetsSheet.columns = [
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Parent', key: 'parent', width: 30 },
      { header: 'Latitude', key: 'latitude', width: 15 },
      { header: 'Longitude', key: 'longitude', width: 15 }
    ];
    
    data.assets.forEach(asset => {
      assetsSheet.addRow({
        title: asset.title || 'Untitled',
        type: asset.typeName || 'Untyped',
        parent: asset.parentTitle || '',
        latitude: asset.beginning_latitude || '',
        longitude: asset.beginning_longitude || ''
      });
    });
  }

  // Questionnaire Responses Sheet
  if (sections.includes('questionnaire') && data.responses && data.responses.length > 0) {
    const responsesSheet = workbook.addWorksheet('Questionnaire Responses');
    responsesSheet.columns = [
      { header: 'Asset', key: 'asset', width: 30 },
      { header: 'Attribute', key: 'attribute', width: 30 },
      { header: 'Value', key: 'value', width: 40 },
      { header: 'Date', key: 'date', width: 20 }
    ];
    
    data.responses.forEach(response => {
      responsesSheet.addRow({
        asset: response.assetTitle || 'Unknown',
        attribute: response.attributeTitle || 'Unknown',
        value: response.response_value || '',
        date: response.created_at ? new Date(response.created_at).toLocaleDateString() : ''
      });
    });
  }

  // Asset Types Sheet
  if (sections.includes('assetTypes') && data.assetTypes && data.assetTypes.length > 0) {
    const typesSheet = workbook.addWorksheet('Asset Types');
    typesSheet.columns = [
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Asset Count', key: 'count', width: 15 },
      { header: 'Attributes', key: 'attributes', width: 50 }
    ];
    
    data.assetTypes.forEach(type => {
      typesSheet.addRow({
        title: type.title || 'Untitled',
        description: type.description || '',
        count: type.assetCount || 0,
        attributes: type.attributes ? type.attributes.map(a => a.title).join(', ') : ''
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

/**
 * Format data for CSV report
 * @param {Object} data - Report data
 * @param {Array} sections - Selected sections to include
 * @returns {String} CSV string
 */
export const formatCSVReport = (data, sections) => {
  const csvLines = [];
  
  // Project Summary
  if (sections.includes('summary') && data.summary) {
    csvLines.push('=== PROJECT SUMMARY ===');
    csvLines.push('Property,Value');
    csvLines.push(`Project Name,${data.summary.projectName || 'N/A'}`);
    csvLines.push(`Description,"${(data.summary.description || 'N/A').replace(/"/g, '""')}"`);
    csvLines.push(`Total Assets,${data.summary.totalAssets || 0}`);
    csvLines.push(`Total Responses,${data.summary.totalResponses || 0}`);
    csvLines.push(`Total Files,${data.summary.totalFiles || 0}`);
    csvLines.push(`Asset Types,${data.summary.totalAssetTypes || 0}`);
    if (data.summary.completionRate !== undefined) {
      csvLines.push(`Completion Rate,${data.summary.completionRate}%`);
    }
    csvLines.push('');
  }

  // Asset Inventory
  if (sections.includes('assets') && data.assets && data.assets.length > 0) {
    csvLines.push('=== ASSET INVENTORY ===');
    csvLines.push('Title,Type,Parent,Latitude,Longitude');
    data.assets.forEach(asset => {
      const title = (asset.title || 'Untitled').replace(/"/g, '""');
      const type = (asset.typeName || 'Untyped').replace(/"/g, '""');
      const parent = (asset.parentTitle || '').replace(/"/g, '""');
      csvLines.push(`"${title}","${type}","${parent}",${asset.beginning_latitude || ''},${asset.beginning_longitude || ''}`);
    });
    csvLines.push('');
  }

  // Questionnaire Responses
  if (sections.includes('questionnaire') && data.responses && data.responses.length > 0) {
    csvLines.push('=== QUESTIONNAIRE RESPONSES ===');
    csvLines.push('Asset,Attribute,Value,Date');
    data.responses.forEach(response => {
      const asset = (response.assetTitle || 'Unknown').replace(/"/g, '""');
      const attribute = (response.attributeTitle || 'Unknown').replace(/"/g, '""');
      const value = (response.response_value || '').replace(/"/g, '""');
      const date = response.created_at ? new Date(response.created_at).toLocaleDateString() : '';
      csvLines.push(`"${asset}","${attribute}","${value}",${date}`);
    });
    csvLines.push('');
  }

  // Asset Types
  if (sections.includes('assetTypes') && data.assetTypes && data.assetTypes.length > 0) {
    csvLines.push('=== ASSET TYPES ===');
    csvLines.push('Title,Description,Asset Count,Attributes');
    data.assetTypes.forEach(type => {
      const title = (type.title || 'Untitled').replace(/"/g, '""');
      const description = (type.description || '').replace(/"/g, '""');
      const attributes = type.attributes ? type.attributes.map(a => a.title).join('; ').replace(/"/g, '""') : '';
      csvLines.push(`"${title}","${description}",${type.assetCount || 0},"${attributes}"`);
    });
  }

  return csvLines.join('\n');
};

