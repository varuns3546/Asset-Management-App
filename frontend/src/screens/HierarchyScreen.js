import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
    reset,
    getHierarchy, 
    deleteFeature, 
    createFeature, 
    updateFeature, 
    getFeatureTypes, 
    uploadHierarchyFile, 
    importHierarchyData, 
    createFeatureType, 
    setCurrentHierarchy 
} from '../features/projects/projectSlice';
import { useRouteMount } from '../contexts/RouteMountContext';
import useProjectData from '../hooks/useProjectData';
import useDebouncedAsync from '../hooks/useDebouncedAsync';
import HierarchyTree from '../components/structure/HierarchyTree';
import HierarchyForm from '../components/structure/HierarchyForm';
import FileUploadModal from '../components/FileUploadModal';
import HierarchyImportPreview from '../components/HierarchyImportPreview';
import ErrorMessage from '../components/forms/ErrorMessage';
import '../styles/structureScreen.css';

const HierarchyScreen = () => {
    const { currentHierarchy, currentFeatureTypes } = useSelector((state) => state.projects);
    const { selectedProject, user, dispatch } = useProjectData();
    const [selectedItem, setSelectedItem] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { isRouteMounted } = useRouteMount();

    // Load hierarchy and feature types (debounced to prevent excessive calls)
    useDebouncedAsync(
        async () => {
            if (!selectedProject || !user) return;
            
            // Clear Redux state and fetch new hierarchy
            dispatch(reset());
            dispatch(getHierarchy(selectedProject.id));
            dispatch(getFeatureTypes(selectedProject.id));
        },
        [selectedProject?.id, user?.id],
        {
            delay: 300,
            shouldRun: (deps) => {
                const [projectId, userId] = deps;
                return !!(projectId && userId);
            },
            skipInitialRun: false
        }
    )

    const handleRemoveItem = async (itemId) => {
        setError('');
        try {
            await dispatch(deleteFeature({
                projectId: selectedProject.id,
                featureId: itemId
            })).unwrap();
            
            // Clear selected item if the deleted item was selected
            if (isRouteMounted() && selectedItem && selectedItem.id === itemId) {
                setSelectedItem(null);
            }
        } catch (error) {
            if (isRouteMounted()) {
                setError('Failed to delete hierarchy item. Please try again.');
            }
        }
    };

    const handleRestoreItem = async (itemData) => {
        if (!selectedProject?.id) return;
        setError('');
        
        try {
            // Convert parent_ids array to parent_id (first element or null)
            const parentId = itemData.parent_ids && itemData.parent_ids.length > 0 
                ? itemData.parent_ids[0] 
                : (itemData.parent_id || null);
            
            // Step 1: Create the item with its original order_index to restore it at the correct position
            const result = await dispatch(createFeature({
                projectId: selectedProject.id,
                featureData: {
                    title: itemData.title,
                    description: itemData.description || '',
                    asset_type_id: itemData.asset_type_id || null,
                    parent_id: parentId,
                    beginning_latitude: itemData.beginning_latitude,
                    beginning_longitude: itemData.beginning_longitude,
                    attributes: itemData.attributes || {},
                    order_index: itemData._originalOrderIndex !== undefined ? itemData._originalOrderIndex : null
                }
            })).unwrap();
            
            if (!result?.data?.id) {
                throw new Error('Failed to create restored item');
            }
            
            // Step 2: Reload hierarchy to reflect the restored item at its correct position
            // The backend's createAsset function already handles shifting items to make room
            // for the restored item at its original order_index position
            if (isRouteMounted()) {
                await dispatch(getHierarchy(selectedProject.id));
            }
        } catch (error) {
            console.error('Error restoring item:', error);
            if (isRouteMounted()) {
                setError('Failed to restore hierarchy item. Please try again.');
            }
        }
    };

    const handleItemClick = (item) => {
        setSelectedItem(item);
    };

    const handleItemSelect = (item) => {
        setSelectedItem(item);
    };

    const handleFileSelect = async (file) => {
        try {
            // Upload and parse file
            const result = await dispatch(uploadHierarchyFile({
                projectId: selectedProject.id,
                file
            })).unwrap();
            
            // Store parsed data and show preview modal
            if (isRouteMounted()) {
                setParsedData(result.data);
                setIsPreviewModalOpen(true);
            }
        } catch (error) {
            if (isRouteMounted()) {
                setError(error || 'Failed to parse file');
                throw new Error(error || 'Failed to parse file');
            }
        }
    };

    const handleImport = async (columnMappings, itemTypeMap, selectedSheets, itemTypeAttributes, sheetDefaultTypes) => {
        setError('');
        setSuccessMessage('');
        try {
            
            // First, create any new item types (from both itemTypeMap and sheetDefaultTypes)
            const typeNameToIdMap = {};
            const sheetToTypeIdMap = {}; // Map sheet name to type ID for default types
            
            // Create types from itemTypeMap (from Type column values)
            for (const [typeName, config] of Object.entries(itemTypeMap)) {
                if (config.action === 'create_new') {
                    // Get attributes for this item type
                    const attributes = itemTypeAttributes[typeName] || [];
                    
                    // Use customTitle if provided and not empty, otherwise use typeName from spreadsheet
                    const itemTypeTitle = (config.customTitle && config.customTitle.trim()) ? config.customTitle.trim() : typeName;
                    
                    const result = await dispatch(createFeatureType({
                        projectId: selectedProject.id,
                        featureTypeData: {
                            name: itemTypeTitle,
                            description: '',
                            parent_ids: [],
                            attributes: attributes,
                            geometry_type: config.geometryType || (config.hasCoordinates ? 'point' : 'no_geometry')
                        }
                    })).unwrap();
                    
                    typeNameToIdMap[typeName] = result.data.id;
                } else if (config.action === 'use_existing') {
                    typeNameToIdMap[typeName] = config.itemTypeId;
                }
            }
            
            // Create types from sheetDefaultTypes (for sheets without Type column)
            for (const [sheetName, config] of Object.entries(sheetDefaultTypes || {})) {
                if (config.action === 'create_new') {
                    const typeName = (config.customTitle && config.customTitle.trim()) ? config.customTitle.trim() : sheetName;
                    
                    const result = await dispatch(createFeatureType({
                        projectId: selectedProject.id,
                        featureTypeData: {
                            name: typeName,
                            description: '',
                            parent_ids: [],
                            attributes: [], // No attributes for sheet defaults
                            geometry_type: config.geometryType || (config.hasCoordinates ? 'point' : 'no_geometry')
                        }
                    })).unwrap();
                    
                    sheetToTypeIdMap[sheetName] = result.data.id;
                } else if (config.action === 'use_existing' && config.itemTypeId) {
                    sheetToTypeIdMap[sheetName] = config.itemTypeId;
                }
            }
            
            
            // Refresh feature types after creating new ones
            await dispatch(getFeatureTypes(selectedProject.id));
            
            // Process all selected sheets
            const allTransformedData = [];
            
            // Check if Type column is mapped
            const hasTypeColumn = Object.values(columnMappings).some(m => m.mappedTo === 'type');
           
            
            for (const sheetName of selectedSheets) {                
                // Get the data for this sheet
                let sheetData;
                if (parsedData.sheets && parsedData.sheets[sheetName]) {
                    sheetData = parsedData.sheets[sheetName];
                } else {
                    sheetData = {
                        headers: parsedData.headers,
                        allData: parsedData.allData
                    };
                }

                const { headers, allData } = sheetData;
                
                // Get sheet default type if no Type column is mapped
                const sheetDefaultTypeId = !hasTypeColumn ? sheetToTypeIdMap[sheetName] : null;
        
                // Transform data according to mappings
                allData.forEach((row, rowIndex) => {
                    const transformedRow = {};
                    
                    // If no Type column mapped, use sheet default type
                    if (!hasTypeColumn && sheetDefaultTypeId) {
                        transformedRow.asset_type_id = sheetDefaultTypeId;
                        
                    }
                    
                    // Match by column NAME instead of index
                    headers.forEach((header, sheetColIndex) => {
                        // Find the mapping for this column name
                        const mappingEntry = Object.entries(columnMappings).find(([index, mapping]) => 
                            mapping.columnName === header
                        );
                        
                        if (mappingEntry) {
                            const [, mapping] = mappingEntry;
                            if (mapping.mappedTo && mapping.mappedTo !== 'ignore') {
                                const cellValue = row[sheetColIndex];
                                
                                if (mapping.mappedTo === 'type') {
                                    // Map type name to asset_type_id
                                    const typeName = String(cellValue).trim();
                                    transformedRow.asset_type_id = typeNameToIdMap[typeName];
                                } else {
                                    transformedRow[mapping.mappedTo] = cellValue;
                                }
                            }
                        }
                    })
                    
                    if (transformedRow.title && transformedRow.asset_type_id) {
                        allTransformedData.push(transformedRow);
                    }
                });
            }
            
            // Execute import with all data
            const result = await dispatch(importHierarchyData({
                projectId: selectedProject.id,
                mappings: columnMappings,
                data: allTransformedData
            })).unwrap();
            
            
            // Close preview modal
            setIsPreviewModalOpen(false);
            setParsedData(null);
            
            // Refresh hierarchy
            await dispatch(getHierarchy(selectedProject.id));
            
            
            // Show success message
            const { imported, total, errors } = result.data;
            if (isRouteMounted()) {
                if (errors && errors.length > 0) {
                    setError(`Import completed with warnings: ${imported}/${total} items imported successfully. Errors: ${errors.slice(0, 5).map(e => `Row ${e.row}: ${e.error}`).join(', ')}`);
                } else {
                    setSuccessMessage(`Successfully imported ${imported} items from ${selectedSheets.length} sheet(s)!`);
                }
            }
        } catch (error) {
            if (isRouteMounted()) {
                setError(error || 'Failed to import data');
            }
            throw new Error(error || 'Failed to import data');
        }
    };
    
    return (
        <div className="hierarchy-screen">
            {selectedProject ? (
                <div className="hierarchy-container">
                    <div className="hierarchy-header">
                        <h2 className="hierarchy-title">Asset Hierarchy - {selectedProject.title}</h2>
                        <button 
                            className="upload-button"
                            onClick={() => setIsUploadModalOpen(true)}
                        >
                            Import Data
                        </button>
                        <ErrorMessage message={error} />
                        {successMessage && (
                            <div className="success-message" style={{ color: '#10b981', marginTop: '10px' }}>
                                {successMessage}
                            </div>
                        )}
                    </div>
                    
                    <div className="hierarchy-layout">
                        {/* Left side - Edit Form */}
                        <div className="hierarchy-left-panel">
                            <div className="hierarchy-edit-container">
                                <HierarchyForm 
                                    hierarchyItems={currentHierarchy || []}
                                    itemTypes={currentFeatureTypes}
                                    selectedItem={selectedItem}
                                    onItemSelect={handleItemSelect}
                                />
                            </div>
                        </div>
                        
                        {/* Right side - Tree (always visible) */}
                        <div className="hierarchy-right-panel">
                            {currentHierarchy && currentHierarchy.length > 0 && (
                                <div className="hierarchy-tree-container">
                                    <HierarchyTree 
                                        hierarchyItems={currentHierarchy}
                                        onRemoveItem={handleRemoveItem}
                                        onItemClick={handleItemClick}
                                        onRestoreItem={handleRestoreItem}
                                        itemTypes={currentFeatureTypes}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* File Upload Modal */}
                    <FileUploadModal
                        isOpen={isUploadModalOpen}
                        onClose={() => setIsUploadModalOpen(false)}
                        onFileSelect={handleFileSelect}
                        projectId={selectedProject.id}
                    />

                    {/* Import Preview Modal */}
                    <HierarchyImportPreview
                        isOpen={isPreviewModalOpen}
                        onClose={() => {
                            setIsPreviewModalOpen(false);
                            setParsedData(null);
                        }}
                        parsedData={parsedData}
                        onImport={handleImport}
                        itemTypes={currentFeatureTypes || []}
                    />
                </div>
            ) : (
                <div className="no-project-selected">
                    <h2>No Project Selected</h2>
                    <p>Please select a project to view its hierarchy</p>
                </div>
            )}
        </div>
    );
};

export default HierarchyScreen;