import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Modal from './Modal';
import { autoMapColumns, normalizeColumnName } from '../utils/columnMatcher';
import '../styles/modal.css';

const HierarchyImportPreview = ({ 
    isOpen, 
    onClose, 
    parsedData, 
    onImport,
    itemTypes = []
}) => {
    const [selectedSheets, setSelectedSheets] = useState([]);
    const [previewSheet, setPreviewSheet] = useState('');
    const [currentSheetData, setCurrentSheetData] = useState(null);
    const [columnMappings, setColumnMappings] = useState({});
    const [itemTypeMap, setItemTypeMap] = useState({});
    const [itemTypeAttributes, setItemTypeAttributes] = useState({}); // Store which columns map to which item type's attributes
    const [sheetDefaultTypes, setSheetDefaultTypes] = useState({}); // Default type for each sheet (when no Type column)
    const [importing, setImporting] = useState(false);
    const [errors, setErrors] = useState([]);
    const [initialized, setInitialized] = useState(false); // Track if mappings have been initialized

    // Initialize selected sheets when data loads and reset all state
    useEffect(() => {
        if (parsedData) {
            const defaultSheet = parsedData.defaultSheet || (parsedData.sheetNames && parsedData.sheetNames[0]);
            if (defaultSheet) {
                // Select first sheet by default
                setSelectedSheets([defaultSheet]);
                setPreviewSheet(defaultSheet);
            }
            // Reset all state for new file
            setInitialized(false);
            setImporting(false);
            setErrors([]);
            setColumnMappings({});
            setItemTypeMap({});
            setItemTypeAttributes({});
            setSheetDefaultTypes({});
        }
    }, [parsedData]);

    // Update current sheet data when preview sheet changes
    useEffect(() => {
        if (parsedData && previewSheet) {
            let sheetData;
            
            if (parsedData.sheets && parsedData.sheets[previewSheet]) {
                // Multi-sheet data
                sheetData = parsedData.sheets[previewSheet];
            } else if (previewSheet === parsedData.defaultSheet || parsedData.sheetNames?.length === 1) {
                // Single sheet data (backward compatible)
                sheetData = {
                    headers: parsedData.headers,
                    preview: parsedData.preview,
                    allData: parsedData.allData,
                    totalRows: parsedData.totalRows
                };
            }
            
            setCurrentSheetData(sheetData);
        }
    }, [parsedData, previewSheet]);

    // Auto-map columns when data first loads (run only once)
    useEffect(() => {
        if (currentSheetData?.headers && !initialized) {
            console.log('Initializing column mappings...');
            const autoMapped = autoMapColumns(currentSheetData.headers);
            setColumnMappings(autoMapped);
            
            // Auto-detect item types from ALL sheets' data
            const uniqueTypes = new Set();
            
            // Check all sheets for unique types
            if (parsedData.sheets) {
                Object.values(parsedData.sheets).forEach(sheetData => {
                    const typeColumnIndex = sheetData.headers.findIndex(h => 
                        normalizeColumnName(h) === normalizeColumnName('type')
                    );
                    
                    if (typeColumnIndex >= 0 && sheetData.preview) {
                        sheetData.preview.forEach(row => {
                            if (row[typeColumnIndex]) {
                                uniqueTypes.add(String(row[typeColumnIndex]).trim());
                            }
                        });
                    }
                });
            } else {
                // Single sheet
                const typeColumnIndex = currentSheetData.headers.findIndex(h => 
                    normalizeColumnName(h) === normalizeColumnName('type')
                );
                
                if (typeColumnIndex >= 0 && currentSheetData.preview) {
                    currentSheetData.preview.forEach(row => {
                        if (row[typeColumnIndex]) {
                            uniqueTypes.add(String(row[typeColumnIndex]).trim());
                        }
                    });
                }
            }
            
            // Create initial item type mappings
            const typeMap = {};
            uniqueTypes.forEach(typeName => {
                const matchedType = itemTypes.find(it => 
                    normalizeColumnName(it.title) === normalizeColumnName(typeName)
                );
                
                if (matchedType) {
                    typeMap[typeName] = {
                        action: 'use_existing',
                        itemTypeId: matchedType.id
                    };
                } else {
                    typeMap[typeName] = {
                        action: 'create_new',
                        customTitle: '',
                        hasCoordinates: false
                    };
                }
            });
            
            setItemTypeMap(typeMap);
            setInitialized(true);
            console.log('Initialization complete');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSheetData, initialized]);

    const handleSheetSelectionChange = (sheetName, isChecked) => {
        setSelectedSheets(prev => {
            if (isChecked) {
                const newSelection = [...prev, sheetName];
                // If this is the first sheet being selected, set it as preview
                if (newSelection.length === 1) {
                    setPreviewSheet(sheetName);
                }
                return newSelection;
            } else {
                const newSelection = prev.filter(s => s !== sheetName);
                // If we removed the preview sheet, set preview to first remaining sheet
                if (sheetName === previewSheet && newSelection.length > 0) {
                    setPreviewSheet(newSelection[0]);
                }
                return newSelection;
            }
        });
    };

    const handleColumnMappingChange = (columnIndex, value) => {
        setColumnMappings(prev => ({
            ...prev,
            [columnIndex]: {
                ...prev[columnIndex],
                mappedTo: value,
                type: value === 'ignore' ? 'ignore' : 
                      ['title', 'type', 'parent', 'beginning_latitude', 'end_latitude', 'beginning_longitude', 'end_longitude'].includes(value) ? 'system' : 'attribute'
            }
        }));
    };

    const handleItemTypeMapChange = (typeName, action, itemTypeId = null) => {
        setItemTypeMap(prev => {
            const existing = prev[typeName] || {};
            
            return {
                ...prev,
                [typeName]: {
                    action,
                    itemTypeId: action === 'use_existing' ? itemTypeId : existing.itemTypeId,
                    customTitle: action === 'create_new' ? (existing.customTitle !== undefined ? existing.customTitle : '') : undefined,
                    hasCoordinates: action === 'create_new' ? (existing.hasCoordinates !== undefined ? existing.hasCoordinates : false) : undefined
                }
            };
        });
        
        // Initialize empty attributes array for new types
        if (action === 'create_new' && !itemTypeAttributes[typeName]) {
            setItemTypeAttributes(prev => ({
                ...prev,
                [typeName]: []
            }));
        }
    };

    const handleItemTypeTitleChange = (typeName, newTitle) => {
        setItemTypeMap(prev => ({
            ...prev,
            [typeName]: {
                ...prev[typeName],
                customTitle: newTitle
            }
        }));
    };

    const handleNewItemTypeCoordinatesChange = (typeName, value) => {
        setItemTypeMap(prev => ({
            ...prev,
            [typeName]: {
                ...prev[typeName],
                hasCoordinates: value
            }
        }));
    };

    const handleAttributeColumnToggle = (typeName, columnName) => {
        setItemTypeAttributes(prev => {
            const current = prev[typeName] || [];
            const isSelected = current.includes(columnName);
            
            return {
                ...prev,
                [typeName]: isSelected 
                    ? current.filter(col => col !== columnName)
                    : [...current, columnName]
            };
        });
    };

    // Get unmapped columns (columns not mapped to system fields)
    const getUnmappedColumns = () => {
        return Object.entries(columnMappings)
            .filter(([index, mapping]) => 
                mapping.type === 'unmapped' || mapping.mappedTo === 'attribute'
            )
            .map(([index, mapping]) => ({
                index: parseInt(index),
                name: mapping.columnName
            }));
    };

    const validateMappings = () => {
        const validationErrors = [];
        
        // Check if title is mapped
        const titleMapped = Object.values(columnMappings).some(m => m.mappedTo === 'title');
        if (!titleMapped) {
            validationErrors.push('Title column must be mapped');
        }
        
        // Check which sheets actually have a Type column in their headers
        const sheetsWithoutTypeColumn = selectedSheets.filter(sheetName => {
            const sheet = parsedData?.sheets?.[sheetName] || (parsedData && !parsedData.sheets ? { headers: parsedData.headers } : null);
            if (!sheet) return true; // Assume needs default if can't find sheet
            
            const hasTypeInSheet = sheet.headers.some(h => 
                normalizeColumnName(h) === normalizeColumnName('Type')
            );
            return !hasTypeInSheet;
        });
        
        // For sheets without Type column, check if they have default types assigned
        const sheetsWithoutDefault = sheetsWithoutTypeColumn.filter(sheet => {
            const defaultType = sheetDefaultTypes[sheet];
            return !defaultType || (defaultType.action === 'use_existing' && !defaultType.itemTypeId);
        });
        
        if (sheetsWithoutDefault.length > 0) {
            validationErrors.push(`Please assign a default type to sheets: ${sheetsWithoutDefault.join(', ')}`);
        }
        
        // Check if all item types are configured (from Type column values)
        Object.entries(itemTypeMap).forEach(([typeName, config]) => {
            if (config.action === 'use_existing' && !config.itemTypeId) {
                validationErrors.push(`Item type "${typeName}" must be mapped to an existing type`);
            }
        });
        
        return validationErrors;
    };

    const handleImport = async () => {
        console.log('Preview Modal: handleImport clicked');
        const validationErrors = validateMappings();
        
        console.log('Validation errors:', validationErrors);
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        if (selectedSheets.length === 0) {
            setErrors(['Please select at least one sheet to import']);
            return;
        }
        
        console.log('Validation passed, starting import...');
        setImporting(true);
        setErrors([]);
        
        try {
            // Pass selected sheets, item type attributes, and sheet default types to import handler
            console.log('Calling onImport handler...');
            console.log('Sheet default types:', sheetDefaultTypes);
            await onImport(columnMappings, itemTypeMap, selectedSheets, itemTypeAttributes, sheetDefaultTypes);
            console.log('Import handler completed successfully');
            
            // Reset importing state on success
            setImporting(false);
        } catch (error) {
            console.error('Import handler error:', error);
            setErrors([error.message || 'Import failed']);
            setImporting(false);
        }
    };

    if (!parsedData || !currentSheetData) return null;

    const { headers, preview, totalRows } = currentSheetData;
    const { fileName, sheetNames, sheets } = parsedData;
    const hasMultipleSheets = sheetNames && sheetNames.length > 1;

    // Calculate total rows across all selected sheets
    const totalRowsAllSheets = selectedSheets.reduce((sum, sheetName) => {
        if (sheets && sheets[sheetName]) {
            return sum + sheets[sheetName].totalRows;
        }
        return sum + totalRows;
    }, 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Import Preview: ${fileName}`}>
            <div className="import-preview-modal">
                {/* Sheet Selector */}
                {hasMultipleSheets && (
                    <div className="sheet-selector">
                        <div className="sheet-selector-header">
                            <label className="sheet-label">Select Sheets to Import:</label>
                            <span className="selected-count">
                                {selectedSheets.length} of {sheetNames.length} selected
                            </span>
                        </div>
                        <div className="sheet-checkboxes">
                            {sheetNames.map(name => (
                                <label key={name} className="sheet-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={selectedSheets.includes(name)}
                                        onChange={(e) => handleSheetSelectionChange(name, e.target.checked)}
                                    />
                                    <span className="sheet-name">{name}</span>
                                    <span className="sheet-row-count">
                                        ({sheets[name]?.totalRows || 0} rows)
                                    </span>
                                    {previewSheet === name && <span className="preview-badge">Previewing</span>}
                                    <button
                                        type="button"
                                        className="preview-sheet-btn"
                                        onClick={() => setPreviewSheet(name)}
                                        disabled={previewSheet === name}
                                    >
                                        Preview
                                    </button>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="preview-info">
                    <p><strong>{totalRowsAllSheets}</strong> total rows will be imported{hasMultipleSheets ? ` from ${selectedSheets.length} sheet(s)` : ''}</p>
                    <p className="preview-note">Previewing sheet: "{previewSheet}" ({totalRows} rows, showing first {Math.min(5, totalRows)})</p>
                </div>

                {/* Sheet Default Types - shown when Type column doesn't exist in selected sheets */}
                {(() => {
                    // Check if any selected sheet is missing the Type column
                    const sheetsWithoutType = selectedSheets.filter(sheetName => {
                        const sheet = sheets && sheets[sheetName];
                        if (!sheet) return false;
                        
                        // Check if this sheet has a Type column
                        const hasTypeInSheet = sheet.headers.some(h => 
                            normalizeColumnName(h) === normalizeColumnName('Type')
                        );
                        return !hasTypeInSheet;
                    });
                    
                    return sheetsWithoutType.length > 0 && (
                        <div className="mapping-section">
                            <h3 className="section-title">Sheet Default Types</h3>
                            <p className="section-description">
                                {sheetsWithoutType.length === selectedSheets.length 
                                    ? 'No Type column found - assign a default type to each sheet'
                                    : `Some sheets don't have a Type column - assign default types to: ${sheetsWithoutType.join(', ')}`
                                }
                            </p>
                        
                        <div className="sheet-type-mappings">
                            {sheetsWithoutType.map(sheetName => (
                                <div key={sheetName} className="sheet-type-row">
                                    <label className="sheet-type-label">Sheet: <strong>{sheetName}</strong></label>
                                    <select
                                        className="mapping-select"
                                        value={sheetDefaultTypes[sheetName]?.action || 'use_existing'}
                                        onChange={(e) => {
                                            setSheetDefaultTypes(prev => ({
                                                ...prev,
                                                [sheetName]: {
                                                    action: e.target.value,
                                                    itemTypeId: e.target.value === 'use_existing' ? null : undefined,
                                                    customTitle: e.target.value === 'create_new' ? '' : undefined,
                                                    hasCoordinates: e.target.value === 'create_new' ? false : undefined
                                                }
                                            }));
                                        }}
                                    >
                                        <option value="use_existing">Use Existing Type</option>
                                        <option value="create_new">Create New Type</option>
                                    </select>
                                    
                                    {sheetDefaultTypes[sheetName]?.action === 'use_existing' && (
                                        <select
                                            className="mapping-select"
                                            value={sheetDefaultTypes[sheetName]?.itemTypeId || ''}
                                            onChange={(e) => {
                                                setSheetDefaultTypes(prev => ({
                                                    ...prev,
                                                    [sheetName]: {
                                                        ...prev[sheetName],
                                                        itemTypeId: e.target.value
                                                    }
                                                }));
                                            }}
                                        >
                                            <option value="">Select existing type...</option>
                                            {itemTypes.map(it => (
                                                <option key={it.id} value={it.id}>{it.title}</option>
                                            ))}
                                        </select>
                                    )}
                                    
                                    {sheetDefaultTypes[sheetName]?.action === 'create_new' && (
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={sheetDefaultTypes[sheetName]?.customTitle || ''}
                                            onChange={(e) => {
                                                setSheetDefaultTypes(prev => ({
                                                    ...prev,
                                                    [sheetName]: {
                                                        ...prev[sheetName],
                                                        customTitle: e.target.value
                                                    }
                                                }));
                                            }}
                                            placeholder={`Type name for "${sheetName}" items`}
                                        />
                                    )}
                                    
                                    {sheetDefaultTypes[sheetName]?.action === 'create_new' && (
                                        <label className="checkbox-inline">
                                            <input
                                                type="checkbox"
                                                checked={sheetDefaultTypes[sheetName]?.hasCoordinates || false}
                                                onChange={(e) => {
                                                    setSheetDefaultTypes(prev => ({
                                                        ...prev,
                                                        [sheetName]: {
                                                            ...prev[sheetName],
                                                            hasCoordinates: e.target.checked
                                                        }
                                                    }));
                                                }}
                                            />
                                            Has Coordinates
                                        </label>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    );
                })()}

                {/* Column Mapping Section */}
                <div className="mapping-section">
                    <h3 className="section-title">Column Mapping</h3>
                    <p className="section-description">Map each column to a field or attribute</p>
                    
                    <div className="column-mappings">
                        {headers.map((header, index) => (
                            <div key={index} className="column-mapping-row">
                                <label className="column-label">{header}</label>
                                <select
                                    className="mapping-select"
                                    value={columnMappings[index]?.mappedTo || ''}
                                    onChange={(e) => handleColumnMappingChange(index, e.target.value)}
                                >
                                    <option value="">Select field...</option>
                                    <optgroup label="System Fields">
                                        <option value="title">Title (required)</option>
                                        <option value="type">Type (required)</option>
                                        <option value="parent">Parent</option>
                                        <option value="beginning_latitude">Beginning Latitude</option>
                                        <option value="end_latitude">End Latitude</option>
                                        <option value="beginning_longitude">Beginning Longitude</option>
                                        <option value="end_longitude">End Longitude</option>
                                    </optgroup>
                                    <optgroup label="Other">
                                        <option value="attribute">Item Type Attribute</option>
                                        <option value="ignore">Ignore Column</option>
                                    </optgroup>
                                </select>
                                {columnMappings[index]?.mappedTo && (
                                    <span className="mapping-status">
                                        {columnMappings[index].type === 'system' ? '✓' : 
                                         columnMappings[index].type === 'ignore' ? '⊘' : '⚠'}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Item Type Configuration Section */}
                {Object.keys(itemTypeMap).length > 0 && (
                    <div className="mapping-section">
                        <h3 className="section-title">Item Type Configuration</h3>
                        <p className="section-description">Configure how to handle each item type found in the data</p>
                        
                        <div className="item-type-mappings">
                            {Object.entries(itemTypeMap).map(([typeName, config]) => (
                                <div key={typeName} className="item-type-config-card">
                                    <div className="type-config-header">
                                        <span className="type-source-label">Type value in spreadsheet: <strong>"{typeName}"</strong></span>
                                    </div>
                                    
                                    <div className="type-config-row">
                                        <label className="config-field-label">Action:</label>
                                        <select
                                            className="mapping-select"
                                            value={config.action}
                                            onChange={(e) => handleItemTypeMapChange(typeName, e.target.value, null)}
                                        >
                                            <option value="use_existing">Use Existing Type</option>
                                            <option value="create_new">Create New Type</option>
                                        </select>
                                    </div>
                                    
                                    {config.action === 'use_existing' && (
                                        <div className="type-config-row">
                                            <label className="config-field-label">Select Type:</label>
                                            <select
                                                className="mapping-select"
                                                value={config.itemTypeId || ''}
                                                onChange={(e) => handleItemTypeMapChange(typeName, 'use_existing', e.target.value)}
                                            >
                                                <option value="">Select existing type...</option>
                                                {itemTypes.map(it => (
                                                    <option key={it.id} value={it.id}>{it.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    
                                    {config.action === 'create_new' && (
                                        <>
                                            <div className="type-config-row">
                                                <label className="config-field-label">Item Type Title:</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={config.customTitle !== undefined ? config.customTitle : ''}
                                                    onChange={(e) => handleItemTypeTitleChange(typeName, e.target.value)}
                                                    placeholder={`Spreadsheet value: "${typeName}"`}
                                                />
                                            </div>
                                            
                                            <div className="type-config-row">
                                                <label className="checkbox-inline">
                                                    <input
                                                        type="checkbox"
                                                        checked={config.hasCoordinates || false}
                                                        onChange={(e) => handleNewItemTypeCoordinatesChange(typeName, e.target.checked)}
                                                    />
                                                    Has Coordinates
                                                </label>
                                            </div>
                                            
                                            {getUnmappedColumns().length > 0 && (
                                                <div className="type-attributes-section">
                                                    <label className="config-field-label">Select columns to use as attributes:</label>
                                                    <div className="attribute-columns">
                                                        {getUnmappedColumns().map(col => (
                                                            <label key={col.index} className="attribute-column-label">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={(itemTypeAttributes[typeName] || []).includes(col.name)}
                                                                    onChange={() => handleAttributeColumnToggle(typeName, col.name)}
                                                                />
                                                                <span>{col.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Data Preview Table */}
                <div className="preview-section">
                    <h3 className="section-title">Data Preview</h3>
                    <div className="preview-table-container">
                        <table className="preview-table">
                            <thead>
                                <tr>
                                    {headers.map((header, index) => (
                                        <th key={index}>
                                            <div className="header-cell">
                                                <span>{header}</span>
                                                <span className="mapped-field">
                                                    → {columnMappings[index]?.mappedTo || 'unmapped'}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {preview.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex}>{cell || '-'}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Errors Display */}
                {errors.length > 0 && (
                    <div className="validation-errors">
                        <h4>Validation Errors:</h4>
                        <ul>
                            {errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="upload-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={importing}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleImport}
                        disabled={importing || selectedSheets.length === 0}
                    >
                        {importing ? 'Importing...' : `Import ${totalRowsAllSheets} Items${hasMultipleSheets ? ` from ${selectedSheets.length} Sheet(s)` : ''}`}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default HierarchyImportPreview;

