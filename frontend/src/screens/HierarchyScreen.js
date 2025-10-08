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
        console.log('Item selected in HierarchyScreen:', item);
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

    const handleImport = async (columnMappings, itemTypeMap, selectedSheets, itemTypeAttributes) => {
        try {
            console.log('=== IMPORT START ===');
            console.log('Selected sheets:', selectedSheets);
            console.log('Column mappings:', columnMappings);
            console.log('Item type map:', itemTypeMap);
            console.log('Item type attributes:', itemTypeAttributes);
            
            // First, create any new item types (across all sheets)
            const typeNameToIdMap = {};
            console.log('Creating new item types...');
            
            for (const [typeName, config] of Object.entries(itemTypeMap)) {
                console.log(`Processing type: ${typeName}, action: ${config.action}`);
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
            
            console.log('Type name to ID map:', typeNameToIdMap);
            
            // Refresh item types after creating new ones
            console.log('Refreshing item types...');
            await dispatch(getHierarchyItemTypes(selectedProject.id));
            
            // Process all selected sheets
            console.log('Processing selected sheets...');
            const allTransformedData = [];
            
            for (const sheetName of selectedSheets) {
                console.log(`Processing sheet: ${sheetName}`);
                
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
                console.log(`Sheet has ${allData.length} rows`);
                console.log(`Sheet headers:`, headers);
                console.log(`Column mappings:`, columnMappings);
                
                // Transform data according to mappings
                allData.forEach((row, rowIndex) => {
                    const transformedRow = {};
                    
                    // Match by column NAME instead of index
                    headers.forEach((header, sheetColIndex) => {
                        // Find the mapping for this column name
                        const mappingEntry = Object.entries(columnMappings).find(([index, mapping]) => {
                            console.log(`Looking for header "${header}", checking mapping columnName: "${mapping.columnName}"`);
                            return mapping.columnName === header;
                        });
                        
                        console.log(`Header "${header}" mapping found:`, mappingEntry);
                        
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
                    });
                    
                    if (transformedRow.title && transformedRow.item_type_id) {
                        allTransformedData.push(transformedRow);
                    }
                });
            }
            
            console.log('Transformed data count:', allTransformedData.length);
            console.log('Sample transformed data:', allTransformedData.slice(0, 2));
            
            // Execute import with all data
            console.log('Calling import API...');
            const result = await dispatch(importHierarchyData({
                projectId: selectedProject.id,
                mappings: columnMappings,
                data: allTransformedData
            })).unwrap();
            
            console.log('Import API completed:', result);
            
            // Close preview modal
            setIsPreviewModalOpen(false);
            setParsedData(null);
            
            // Refresh hierarchy
            console.log('Refreshing hierarchy...');
            await dispatch(getHierarchy(selectedProject.id));
            
            console.log('=== IMPORT COMPLETE ===');
            
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