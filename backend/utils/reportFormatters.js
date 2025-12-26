import { createRequire } from 'module';
import ExcelJS from 'exceljs';
import { generateBarChart, generatePieChart, generateLineChart } from './chartGenerator.js';

const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

/**
 * Format data for PDF report
 * @param {Object} data - Report data
 * @param {Array} sections - Selected sections to include
 * @returns {Buffer} PDF buffer
 */
export const formatPDFReport = async (data, sections) => {
  // Generate all chart images first (before creating PDF)
  const charts = {};
  
  if (sections.includes('visualization') && data.visualization) {
    console.log('Starting chart generation...');
    console.log('Visualization data structure:', {
      hasQuestionnaire: !!data.visualization.questionnaire,
      hasAssets: !!data.visualization.assets
    });
    
    try {
      // Generate questionnaire charts
      if (data.visualization.questionnaire) {
        const qStats = data.visualization.questionnaire;
        console.log('Questionnaire stats:', {
          hasByAssetType: !!(qStats.byAssetType && qStats.byAssetType.length > 0),
          hasByAttribute: !!(qStats.byAttribute && qStats.byAttribute.length > 0),
          hasTimeline: !!(qStats.timeline && qStats.timeline.length > 0)
        });
        
        if (qStats.byAssetType && qStats.byAssetType.length > 0) {
          const chartData = qStats.byAssetType.map(type => ({
            label: type.typeName || 'Untyped',
            value: type.totalAssets > 0 
              ? parseFloat(((type.assetsWithResponses / type.totalAssets) * 100).toFixed(2))
              : 0
          }));
          console.log('Generating completionByType chart with data:', chartData);
          charts.completionByType = await generateBarChart(chartData, 'Completion Rate by Asset Type (%)', 'label', 'value');
          console.log('completionByType chart generated:', !!charts.completionByType);
        }
        
        if (qStats.byAttribute && qStats.byAttribute.length > 0) {
          const chartData = qStats.byAttribute.slice(0, 10).map(attr => ({
            label: (attr.attributeTitle || 'Unknown').length > 30 
              ? (attr.attributeTitle || 'Unknown').substring(0, 30) + '...'
              : (attr.attributeTitle || 'Unknown'),
            value: attr.responseCount || 0
          }));
          console.log('Generating topAttributes chart with data:', chartData);
          charts.topAttributes = await generateBarChart(chartData, 'Top 10 Attributes by Response Count', 'label', 'value');
          console.log('topAttributes chart generated:', !!charts.topAttributes);
        }
        
        if (qStats.timeline && qStats.timeline.length > 0) {
          console.log('Generating timeline chart with data:', qStats.timeline.slice(0, 5));
          charts.timeline = await generateLineChart(qStats.timeline, 'Response Completion Timeline', 'date', 'count');
          console.log('timeline chart generated:', !!charts.timeline);
        }
      }
      
      // Generate asset charts
      if (data.visualization.assets) {
        const aStats = data.visualization.assets;
        console.log('Asset stats:', {
          hasByType: !!(aStats.byType && aStats.byType.length > 0),
          hasSummary: !!aStats.summary
        });
        
        if (aStats.byType && aStats.byType.length > 0) {
          const chartData = aStats.byType.map(type => ({
            label: type.typeName || 'Untyped',
            value: type.count || 0
          }));
          console.log('Generating assetsByType chart with data:', chartData);
          charts.assetsByType = await generatePieChart(chartData, 'Assets by Type', 'label', 'value');
          console.log('assetsByType chart generated:', !!charts.assetsByType);
        }
        
        if (aStats.summary) {
          const chartData = [
            { label: 'With Coordinates', value: aStats.summary.assetsWithCoordinates || 0 },
            { label: 'Without Coordinates', value: aStats.summary.assetsWithoutCoordinates || 0 }
          ];
          console.log('Generating coordinates chart with data:', chartData);
          charts.coordinates = await generatePieChart(chartData, 'Assets with Geographic Data', 'label', 'value');
          console.log('coordinates chart generated:', !!charts.coordinates);
        }
      }
      
      console.log('All charts generated. Chart keys:', Object.keys(charts));
    } catch (error) {
      console.error('Error generating charts:', error);
      console.error('Error stack:', error.stack);
    }
  }

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

      // Attribute Values
      if (sections.includes('questionnaire') && data.responses && data.responses.length > 0) {
        doc.fontSize(16).text('Attribute Values', { underline: true });
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
        doc.moveDown();
      }

      // Data Visualization
      if (sections.includes('visualization')) {
        console.log('PDF Formatter - Visualization section requested');
        console.log('PDF Formatter - data.visualization exists:', !!data.visualization);
        console.log('PDF Formatter - Available charts:', Object.keys(charts));
        
        if (data.visualization) {
          // Add page break before visualization section if needed
          const currentY = doc.y;
          const pageHeight = doc.page.height;
          if (currentY > pageHeight - 600) {
            doc.addPage();
          }
          
          doc.fontSize(16).text('Data Visualization', { underline: true });
          doc.moveDown(1);

          // Questionnaire Statistics
          if (data.visualization.questionnaire) {
            const qStats = data.visualization.questionnaire;
            doc.fontSize(14).text('Questionnaire Statistics', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12);
            
            if (qStats.summary) {
              doc.text(`Total Assets: ${qStats.summary.totalAssets || 0}`);
              doc.text(`Assets with Responses: ${qStats.summary.assetsWithResponses || 0}`);
              doc.text(`Completion Rate: ${qStats.summary.completionRate || 0}%`);
              doc.text(`Total Responses: ${qStats.summary.totalResponses || 0}`);
              doc.moveDown(1);
            }

            // Completion by Asset Type Chart
            if (charts.completionByType) {
              console.log('Adding completionByType chart to PDF');
              try {
                doc.addPage();
                doc.moveDown(2);
                doc.image(charts.completionByType, {
                  fit: [500, 300],
                  align: 'center'
                });
                doc.moveDown(1);
              } catch (error) {
                console.error('Error adding completionByType chart to PDF:', error);
              }
            } else {
              console.log('completionByType chart not available');
            }

            // Top Attributes Chart
            if (charts.topAttributes) {
              console.log('Adding topAttributes chart to PDF');
              try {
                doc.addPage();
                doc.moveDown(2);
                doc.image(charts.topAttributes, {
                  fit: [500, 300],
                  align: 'center'
                });
                doc.moveDown(1);
              } catch (error) {
                console.error('Error adding topAttributes chart to PDF:', error);
              }
            } else {
              console.log('topAttributes chart not available');
            }

            // Timeline Chart
            if (charts.timeline) {
              console.log('Adding timeline chart to PDF');
              try {
                doc.addPage();
                doc.moveDown(2);
                doc.image(charts.timeline, {
                  fit: [500, 300],
                  align: 'center'
                });
                doc.moveDown(1);
              } catch (error) {
                console.error('Error adding timeline chart to PDF:', error);
              }
            } else {
              console.log('timeline chart not available');
            }
          }

          // Asset Statistics
          if (data.visualization.assets) {
            const aStats = data.visualization.assets;
            
            // Start Asset Statistics section on a new page
            doc.addPage();
            
            doc.fontSize(14).text('Asset Statistics', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12);
            
            if (aStats && aStats.summary) {
              doc.text(`Total Assets: ${aStats.summary.totalAssets || 0}`);
              doc.text(`Assets with Coordinates: ${aStats.summary.assetsWithCoordinates || 0}`);
              doc.text(`Assets without Coordinates: ${aStats.summary.assetsWithoutCoordinates || 0}`);
              doc.moveDown(2);
            }

            // Assets by Type Pie Chart
            if (charts.assetsByType) {
              console.log('Adding assetsByType chart to PDF');
              try {
                doc.addPage();
                doc.moveDown(2);
                doc.image(charts.assetsByType, {
                  fit: [500, 300],
                  align: 'center'
                });
                doc.moveDown(1);
              } catch (error) {
                console.error('Error adding assetsByType chart to PDF:', error);
              }
            } else {
              console.log('assetsByType chart not available');
            }

            // Assets with/without Coordinates Pie Chart
            if (charts.coordinates) {
              console.log('Adding coordinates chart to PDF');
              try {
                doc.addPage();
                doc.moveDown(2);
                doc.image(charts.coordinates, {
                  fit: [500, 300],
                  align: 'center'
                });
                doc.moveDown(1);
              } catch (error) {
                console.error('Error adding coordinates chart to PDF:', error);
              }
            } else {
              console.log('coordinates chart not available');
            }
          }
        } else {
          console.log('PDF Formatter - data.visualization is null or undefined');
          doc.fontSize(14).text('Data Visualization', { underline: true });
          doc.moveDown();
          doc.fontSize(12).text('Visualization data is not available.', { indent: 20 });
          doc.moveDown();
        }
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

  // Attribute Values Sheet
  if (sections.includes('questionnaire') && data.responses && data.responses.length > 0) {
    const responsesSheet = workbook.addWorksheet('Attribute Values');
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

  // Data Visualization Sheet
  if (sections.includes('visualization') && data.visualization) {
    // Questionnaire Statistics Sheet
    if (data.visualization.questionnaire) {
      const qStats = data.visualization.questionnaire;
      const vizSheet = workbook.addWorksheet('Visualization - Questionnaire');
      
      if (qStats.summary) {
        vizSheet.addRow(['Questionnaire Summary']);
        vizSheet.addRow(['Property', 'Value']);
        vizSheet.addRow(['Total Assets', qStats.summary.totalAssets || 0]);
        vizSheet.addRow(['Assets with Responses', qStats.summary.assetsWithResponses || 0]);
        vizSheet.addRow(['Completion Rate', `${qStats.summary.completionRate || 0}%`]);
        vizSheet.addRow(['Total Responses', qStats.summary.totalResponses || 0]);
        vizSheet.addRow([]);
      }

      if (qStats.byAssetType && qStats.byAssetType.length > 0) {
        vizSheet.addRow(['Completion by Asset Type']);
        vizSheet.addRow(['Asset Type', 'Assets with Responses', 'Total Assets', 'Completion Rate (%)']);
        qStats.byAssetType.forEach(type => {
          const rate = type.totalAssets > 0 
            ? parseFloat(((type.assetsWithResponses / type.totalAssets) * 100).toFixed(2))
            : 0;
          vizSheet.addRow([
            type.typeName || 'Untyped',
            type.assetsWithResponses || 0,
            type.totalAssets || 0,
            rate
          ]);
        });
        vizSheet.addRow([]);
      }

      if (qStats.byAttribute && qStats.byAttribute.length > 0) {
        vizSheet.addRow(['Top Attributes by Response Count']);
        vizSheet.addRow(['Rank', 'Attribute', 'Response Count']);
        qStats.byAttribute.slice(0, 20).forEach((attr, index) => {
          vizSheet.addRow([
            index + 1,
            attr.attributeTitle || 'Unknown',
            attr.responseCount || 0
          ]);
        });
      }
    }

    // Asset Statistics Sheet
    if (data.visualization.assets) {
      const aStats = data.visualization.assets;
      const assetVizSheet = workbook.addWorksheet('Visualization - Assets');
      
      if (aStats.summary) {
        assetVizSheet.addRow(['Asset Statistics Summary']);
        assetVizSheet.addRow(['Property', 'Value']);
        assetVizSheet.addRow(['Total Assets', aStats.summary.totalAssets || 0]);
        assetVizSheet.addRow(['Assets with Coordinates', aStats.summary.assetsWithCoordinates || 0]);
        assetVizSheet.addRow(['Assets without Coordinates', aStats.summary.assetsWithoutCoordinates || 0]);
        assetVizSheet.addRow([]);
      }

      if (aStats.byType && aStats.byType.length > 0) {
        assetVizSheet.addRow(['Assets by Type']);
        assetVizSheet.addRow(['Asset Type', 'Count']);
        aStats.byType.forEach(type => {
          assetVizSheet.addRow([
            type.typeName || 'Untyped',
            type.count || 0
          ]);
        });
      }
    }
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

  // Attribute Values
  if (sections.includes('questionnaire') && data.responses && data.responses.length > 0) {
    csvLines.push('=== ATTRIBUTE VALUES ===');
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
    csvLines.push('');
  }

  // Data Visualization
  if (sections.includes('visualization') && data.visualization) {
    csvLines.push('=== DATA VISUALIZATION ===');
    
    // Questionnaire Statistics
    if (data.visualization.questionnaire) {
      const qStats = data.visualization.questionnaire;
      csvLines.push('--- Questionnaire Statistics ---');
      
      if (qStats.summary) {
        csvLines.push('Property,Value');
        csvLines.push(`Total Assets,${qStats.summary.totalAssets || 0}`);
        csvLines.push(`Assets with Responses,${qStats.summary.assetsWithResponses || 0}`);
        csvLines.push(`Completion Rate,${qStats.summary.completionRate || 0}%`);
        csvLines.push(`Total Responses,${qStats.summary.totalResponses || 0}`);
        csvLines.push('');
      }

      if (qStats.byAssetType && qStats.byAssetType.length > 0) {
        csvLines.push('Asset Type,Assets with Responses,Total Assets,Completion Rate (%)');
        qStats.byAssetType.forEach(type => {
          const rate = type.totalAssets > 0 
            ? parseFloat(((type.assetsWithResponses / type.totalAssets) * 100).toFixed(2))
            : 0;
          const typeName = (type.typeName || 'Untyped').replace(/"/g, '""');
          csvLines.push(`"${typeName}",${type.assetsWithResponses || 0},${type.totalAssets || 0},${rate}`);
        });
        csvLines.push('');
      }

      if (qStats.byAttribute && qStats.byAttribute.length > 0) {
        csvLines.push('Rank,Attribute,Response Count');
        qStats.byAttribute.slice(0, 20).forEach((attr, index) => {
          const attrTitle = (attr.attributeTitle || 'Unknown').replace(/"/g, '""');
          csvLines.push(`${index + 1},"${attrTitle}",${attr.responseCount || 0}`);
        });
        csvLines.push('');
      }
    }

    // Asset Statistics
    if (data.visualization.assets) {
      const aStats = data.visualization.assets;
      csvLines.push('--- Asset Statistics ---');
      
      if (aStats.summary) {
        csvLines.push('Property,Value');
        csvLines.push(`Total Assets,${aStats.summary.totalAssets || 0}`);
        csvLines.push(`Assets with Coordinates,${aStats.summary.assetsWithCoordinates || 0}`);
        csvLines.push(`Assets without Coordinates,${aStats.summary.assetsWithoutCoordinates || 0}`);
        csvLines.push('');
      }

      if (aStats.byType && aStats.byType.length > 0) {
        csvLines.push('Asset Type,Count');
        aStats.byType.forEach(type => {
          const typeName = (type.typeName || 'Untyped').replace(/"/g, '""');
          csvLines.push(`"${typeName}",${type.count || 0}`);
        });
      }
    }
  }

  return csvLines.join('\n');
};

