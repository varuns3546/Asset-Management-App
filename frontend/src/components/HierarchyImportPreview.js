import { useState, useEffect } from 'react';
import Modal from './Modal';
import ButtonGroup from './forms/ButtonGroup';
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

    const getMappedTypeColumnNames = () => {
        const mappedNames = new Set([normalizeColumnName('type')]);
        
        Object.values(columnMappings).forEach(mapping => {
            if (mapping?.mappedTo === 'type' && mapping.columnName) {
                mappedNames.add(normalizeColumnName(mapping.columnName));
            }
        });

        return mappedNames;
    };

    const collectSheetTypes = (sheetNames = []) => {
        const uniqueTypes = new Set();
        
        if (!parsedData?.sheets || !Array.isArray(sheetNames)) {
            return uniqueTypes;
        }
        
        const mappedTypeNames = getMappedTypeColumnNames();

        sheetNames.forEach(sheetName => {
            const sheetData = parsedData.sheets[sheetName];
            if (!sheetData) return;

            const typeColumnIndex = sheetData.headers?.findIndex(h =>
                mappedTypeNames.has(normalizeColumnName(h))
            );

            if (typeColumnIndex < 0) {
                return;
            }

            const rowsToScan = (sheetData.allData?.length ? sheetData.allData : sheetData.preview || []);

            rowsToScan.forEach(row => {
                if (row[typeColumnIndex]) {
                    uniqueTypes.add(String(row[typeColumnIndex]).trim());
                }
            });
        });

        return uniqueTypes;
    };

    const getSheetsToAnalyze = () => {
        if (!parsedData?.sheets) return [];

        const sheetsSet = new Set(selectedSheets);
        if (previewSheet) {
            sheetsSet.add(previewSheet);
        }

        return Array.from(sheetsSet);
    };

    const sheetHasMappedTypeColumn = (sheetName) => {
        if (!parsedData?.sheets || !sheetName) return false;
        const sheetData = parsedData.sheets[sheetName];
        if (!sheetData?.headers) return false;

        const mappedTypeNames = getMappedTypeColumnNames();
        return sheetData.headers.some(header => mappedTypeNames.has(normalizeColumnName(header)));
    };

    const getSheetsNeedingDefaultType = () => {
        if (!parsedData?.sheets) return [];
        const sheetsToCheck = selectedSheets.length > 0 ? selectedSheets : (previewSheet ? [previewSheet] : []);
        return sheetsToCheck.filter(sheetName => !sheetHasMappedTypeColumn(sheetName));
    };

    // Rebuild column mappings when sheet headers change (preserve existing matches by normalized name)
    useEffect(() => {
        if (!currentSheetData?.headers) return;

        setColumnMappings(prevMappings => {
            const autoMapped = autoMapColumns(currentSheetData.headers);
            const nextMappings = {};

            const findExistingMapping = (header) => {
                const normalizedHeader = normalizeColumnName(header);
                return Object.values(prevMappings || {}).find(mapping =>
                    mapping?.columnName &&
                    normalizeColumnName(mapping.columnName) === normalizedHeader
                );
            };

            currentSheetData.headers.forEach((header, index) => {
                const existingMapping = findExistingMapping(header);

                if (existingMapping) {
                    nextMappings[index] = {
                        ...existingMapping,
                        columnName: header
                    };
                } else if (autoMapped[index]) {
                    nextMappings[index] = autoMapped[index];
                } else {
                    nextMappings[index] = {
                        columnName: header,
                        mappedTo: null,
                        type: 'unmapped'
                    };
                }
            });

            return nextMappings;
        });
    }, [currentSheetData]);

    // Auto-detect item types when data first loads (run only once)
    useEffect(() => {
        if (currentSheetData?.headers && !initialized) {
            let uniqueTypes = new Set();
            
            // Check selected (or preview) sheets for unique types
            if (parsedData.sheets) {
                const sheetsToCheck = getSheetsToAnalyze();
                if (sheetsToCheck.length === 0 && parsedData.sheetNames?.length) {
                    uniqueTypes = collectSheetTypes([parsedData.sheetNames[0]]);
                } else {
                    uniqueTypes = collectSheetTypes(sheetsToCheck);
                }
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
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSheetData, initialized]);

    // Update item type map when selected sheets or preview sheet change
    useEffect(() => {
        if (initialized && parsedData?.sheets) {
            let sheetsToCheck = getSheetsToAnalyze();

            if (sheetsToCheck.length === 0 && parsedData.sheetNames?.length) {
                sheetsToCheck = [parsedData.sheetNames[0]];
            }

            const uniqueTypes = collectSheetTypes(sheetsToCheck);
            
            // Only update if types have changed
            const currentTypeNames = new Set(Object.keys(itemTypeMap));
            const typesChanged = 
                uniqueTypes.size !== currentTypeNames.size ||
                [...uniqueTypes].some(t => !currentTypeNames.has(t));
            
            if (typesChanged) {
                const typeMap = {};
                uniqueTypes.forEach(typeName => {
                    // Preserve existing mapping if it exists
                    if (itemTypeMap[typeName]) {
                        typeMap[typeName] = itemTypeMap[typeName];
                    } else {
                        // Create new mapping for new type
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
                    }
                });
                
                setItemTypeMap(typeMap);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSheets, previewSheet, initialized]);

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

    const handleSheetDefaultTypeActionChange = (sheetName, action) => {
        setSheetDefaultTypes(prev => {
            const existing = prev[sheetName] || {};
            return {
                ...prev,
                [sheetName]: {
                    action,
                    itemTypeId: action === 'use_existing' ? (existing.itemTypeId || '') : undefined,
                    customTitle: action === 'create_new' ? (existing.customTitle || '') : undefined,
                    hasCoordinates: action === 'create_new' ? (existing.hasCoordinates || false) : undefined
                }
            };
        });
    };

    const handleSheetDefaultExistingTypeChange = (sheetName, itemTypeId) => {
        setSheetDefaultTypes(prev => ({
            ...prev,
            [sheetName]: {
                ...(prev[sheetName] || {}),
                action: 'use_existing',
                itemTypeId
            }
        }));
    };

    const handleSheetDefaultTitleChange = (sheetName, newTitle) => {
        setSheetDefaultTypes(prev => ({
            ...prev,
            [sheetName]: {
                ...(prev[sheetName] || {}),
                customTitle: newTitle
            }
        }));
    };

    const handleSheetDefaultCoordinatesChange = (sheetName, value) => {
        setSheetDefaultTypes(prev => ({
            ...prev,
            [sheetName]: {
                ...(prev[sheetName] || {}),
                hasCoordinates: value
            }
        }));
    };

    const getSheetDefaultConfig = (sheetName) => {
        const config = sheetDefaultTypes[sheetName] || {};
        return {
            action: config.action || 'use_existing',
            itemTypeId: config.itemTypeId || '',
            customTitle: config.customTitle || '',
            hasCoordinates: config.hasCoordinates || false
        };
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
        
        return validationErrors;
    };

    const handleImport = async () => {
        const validationErrors = validateMappings();
        
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        setImporting(true);
        setErrors([]);
        
        try {
            // Pass selected sheets, item type attributes, and sheet default types to import handler 
            await onImport(columnMappings, itemTypeMap, selectedSheets, itemTypeAttributes, sheetDefaultTypes);            
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
    const sheetsNeedingDefaultType = getSheetsNeedingDefaultType();
    const shouldShowItemTypeConfig = Object.keys(itemTypeMap).length > 0 || sheetsNeedingDefaultType.length > 0;

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
                                        <option value="type">Type</option>
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
                
                {shouldShowItemTypeConfig && (
                    <div className="mapping-section">
                        <h3 className="section-title">Item Type Configuration</h3>
                        <p className="section-description">Configure how to handle each item type found in the data or define defaults for sheets without a Type column</p>
                        
                        {Object.keys(itemTypeMap).length > 0 && (
                            <div className="item-type-mappings">
                                {Object.entries(itemTypeMap).map(([typeName, config]) => (
                                    <div key={typeName} className="item-type-config-card">
                                        <div className="type-config-header">
                                            <span className="type-source-label">Type value in spreadsheet: <strong>"{typeName}"</strong></span>
                                        </div>
                                        
                                        <div className="type-config-row">
                                            <label className="config-field-label">Select Type:</label>
                                            <select
                                                className="mapping-select"
                                                value={config.action === 'create_new' ? 'create_new' : (config.itemTypeId || '')}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === 'create_new') {
                                                        handleItemTypeMapChange(typeName, 'create_new', null);
                                                    } else if (value) {
                                                        handleItemTypeMapChange(typeName, 'use_existing', value);
                                                    }
                                                }}
                                            >
                                                <option value="" disabled>Select Type</option>
                                                <option value="create_new">Create New Type</option>
                                                {itemTypes.map(it => (
                                                    <option key={it.id} value={it.id}>{it.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
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
                        )}

                        {sheetsNeedingDefaultType.length > 0 && (
                            <div className="sheet-default-type-section">
                                <h4>Sheets without a Type column</h4>
                                <p className="section-description">Select or create a default item type for these sheets. All rows will use this type when no Type column is mapped.</p>
                                {sheetsNeedingDefaultType.map(sheetName => {
                                    const config = getSheetDefaultConfig(sheetName);
                                    return (
                                        <div key={sheetName} className="item-type-config-card">
                                            <div className="type-config-header">
                                                <span className="type-source-label">Sheet: <strong>"{sheetName}"</strong></span>
                                            </div>
                                            
                                            <div className="type-config-row">
                                                <label className="config-field-label">Select Type:</label>
                                                <select
                                                    className="mapping-select"
                                                    value={config.action === 'create_new' ? 'create_new' : (config.itemTypeId || '')}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (value === 'create_new') {
                                                            handleSheetDefaultTypeActionChange(sheetName, 'create_new');
                                                        } else if (value) {
                                                            handleSheetDefaultExistingTypeChange(sheetName, value);
                                                        }
                                                    }}
                                                >
                                                    <option value="" disabled>Select Type</option>
                                                    <option value="create_new">Create New Type</option>
                                                    {itemTypes.map(it => (
                                                        <option key={it.id} value={it.id}>{it.title}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {config.action === 'create_new' && (
                                                <>
                                                    <div className="type-config-row">
                                                        <label className="config-field-label">Item Type Title:</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={config.customTitle}
                                                            onChange={(e) => handleSheetDefaultTitleChange(sheetName, e.target.value)}
                                                            placeholder={`Default for sheet "${sheetName}"`}
                                                        />
                                                    </div>

                                                    <div className="type-config-row">
                                                        <label className="checkbox-inline">
                                                            <input
                                                                type="checkbox"
                                                                checked={config.hasCoordinates}
                                                                onChange={(e) => handleSheetDefaultCoordinatesChange(sheetName, e.target.checked)}
                                                            />
                                                            Has Coordinates
                                                        </label>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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
                    <ButtonGroup
                        buttons={[
                            {
                                label: 'Cancel',
                                variant: 'secondary',
                                onClick: onClose,
                                disabled: importing
                            },
                            {
                                label: importing ? 'Importing...' : `Import ${totalRowsAllSheets} Items${hasMultipleSheets ? ` from ${selectedSheets.length} Sheet(s)` : ''}`,
                                variant: 'primary',
                                onClick: handleImport,
                                disabled: importing || selectedSheets.length === 0
                            }
                        ]}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default HierarchyImportPreview;

