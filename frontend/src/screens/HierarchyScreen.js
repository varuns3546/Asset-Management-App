import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getHierarchy, deleteHierarchyItem, getHierarchyItemTypes, reset, uploadHierarchyFile, importHierarchyData, createHierarchyItemType } from '../features/projects/projectSlice';
import { loadUser } from '../features/auth/authSlice';
import HierarchyTree from '../components/structure/HierarchyTree';
import HierarchyForm from '../components/structure/HierarchyForm';
import FileUploadModal from '../components/FileUploadModal';
import HierarchyImportPreview from '../components/HierarchyImportPreview';
import '../styles/structureScreen.css';
const HierarchyScreen = () => {
    const { selectedProject, currentHierarchy, currentItemTypes} = useSelector((state) => state.projects);
    const { user } = useSelector((state) => state.auth);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [parsedData, setParsedData] = useState(null);

    const dispatch = useDispatch();
    
    useEffect(() => {dispatch(loadUser())}, [dispatch])

    useEffect(() => {
        if (selectedProject && user) {
            // Clear Redux state and fetch new hierarchy
            dispatch(reset());
            dispatch(getHierarchy(selectedProject.id));
            dispatch(getHierarchyItemTypes(selectedProject.id));
        }
        return () => {
            dispatch(reset())
        }
    }, [selectedProject, user, dispatch])

    const handleRemoveItem = async (itemId) => {
        try {
            await dispatch(deleteHierarchyItem({
                projectId: selectedProject.id,
                itemId
            })).unwrap();
            
            // Clear selected item if the deleted item was selected
            if (selectedItem && selectedItem.id === itemId) {
                setSelectedItem(null);
            }
        } catch (error) {
            console.error('Error deleting hierarchy item:', error);
            alert('Failed to delete hierarchy item. Please try again.');
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
            setParsedData(result.data);
            setIsPreviewModalOpen(true);
        } catch (error) {
            console.error('Error parsing file:', error);
            throw new Error(error || 'Failed to parse file');
        }
    };

    const handleImport = async (columnMappings, itemTypeMap, selectedSheets, itemTypeAttributes, sheetDefaultTypes) => {
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
                    
                    const result = await dispatch(createHierarchyItemType({
                        projectId: selectedProject.id,
                        itemTypeData: {
                            name: itemTypeTitle,
                            description: '',
                            parent_ids: [],
                            attributes: attributes,
                            has_coordinates: config.hasCoordinates || false
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
                    
                    const result = await dispatch(createHierarchyItemType({
                        projectId: selectedProject.id,
                        itemTypeData: {
                            name: typeName,
                            description: '',
                            parent_ids: [],
                            attributes: [], // No attributes for sheet defaults
                            has_coordinates: config.hasCoordinates || false
                        }
                    })).unwrap();
                    
                    sheetToTypeIdMap[sheetName] = result.data.id;
                } else if (config.action === 'use_existing' && config.itemTypeId) {
                    sheetToTypeIdMap[sheetName] = config.itemTypeId;
                }
            }
            
            
            // Refresh item types after creating new ones
            await dispatch(getHierarchyItemTypes(selectedProject.id));
            
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
                        transformedRow.item_type_id = sheetDefaultTypeId;
                        
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
                                    // Map type name to item_type_id
                                    const typeName = String(cellValue).trim();
                                    transformedRow.item_type_id = typeNameToIdMap[typeName];
                                } else {
                                    transformedRow[mapping.mappedTo] = cellValue;
                                }
                            }
                        }
                    })
                    
                    if (transformedRow.title && transformedRow.item_type_id) {
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
            if (errors && errors.length > 0) {
                alert(`Import completed with warnings:\n${imported}/${total} items imported successfully.\n\nErrors:\n${errors.slice(0, 5).map(e => `Row ${e.row}: ${e.error}`).join('\n')}`);
            } else {
                alert(`Successfully imported ${imported} items from ${selectedSheets.length} sheet(s)!`);
            }
        } catch (error) {
            console.error('Error importing data:', error);
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
                    </div>
                    
                    <div className="hierarchy-layout">
                        {/* Left side - Edit Form */}
                        <div className="hierarchy-left-panel">
                            <div className="hierarchy-edit-container">
                                <HierarchyForm 
                                    hierarchyItems={currentHierarchy || []}
                                    itemTypes={currentItemTypes}
                                    selectedItem={selectedItem}
                                    onItemSelect={handleItemSelect}
                                />
                            </div>
                        </div>
                        
                        {/* Right side - Tree (always visible) */}
                        <div className="hierarchy-right-panel">
                            {currentHierarchy && currentHierarchy.length > 0 && (
                                <div className="hierarchy-tree-container">
                                    <div className="hierarchy-tree-content">
                                        <HierarchyTree 
                                            hierarchyItems={currentHierarchy}
                                            onRemoveItem={handleRemoveItem}
                                            onItemClick={handleItemClick}
                                        />
                                    </div>
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
                        itemTypes={currentItemTypes || []}
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