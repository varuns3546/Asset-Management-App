import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createFeatureType, updateFeatureType, getFeatureTypes } from '../../features/projects/projectSlice';
import FormField from '../forms/FormField';
import '../../styles/structureScreen.css'

// Utility function to convert hex to RGB
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

// Calculate color difference using Euclidean distance in RGB space
const colorDistance = (color1, color2) => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    if (!rgb1 || !rgb2) return 0;
    
    return Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );
};

// Generate a random color that's sufficiently different from existing colors
const generateUniqueColor = (existingColors, minDistance = 150) => {
    const maxAttempts = 50;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Generate vibrant color by ensuring at least one channel is high
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        
        // Ensure the color is not too dark or too light
        const brightness = (r + g + b) / 3;
        if (brightness < 50 || brightness > 220) continue;
        
        const newColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        
        // Check if this color is sufficiently different from all existing colors
        const isSuffcientlyDifferent = existingColors.every(existingColor => 
            colorDistance(newColor, existingColor) >= minDistance
        );
        
        if (isSuffcientlyDifferent) {
            return newColor;
        }
    }
    
    // Fallback: if we couldn't find a unique color, generate a random one anyway
    const r = Math.floor(Math.random() * 200 + 55); // 55-255
    const g = Math.floor(Math.random() * 200 + 55);
    const b = Math.floor(Math.random() * 200 + 55);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const AssetTypeForm = ({ 
    assetTypes,
    selectedAsset = null,
    onAssetSelect = null
}) => {
    const dispatch = useDispatch();
    const { selectedProject, currentFeatureTypes } = useSelector((state) => state.projects);
    const [newAssetType, setNewAssetType] = useState({
        title: '',
        description: '',
        parent_ids: [],
        attributes: []
    });

    const [parentDropdowns, setParentDropdowns] = useState([{ id: 1, value: '' }]);
    const [existingParents, setExistingParents] = useState([]); // Parents already saved in database
    const [childrenDropdowns, setChildrenDropdowns] = useState([{ id: 1, value: '' }]); // For selecting children (will update their parent_ids)
    const [existingChildren, setExistingChildren] = useState([]); // Children already saved in database
    const [originalChildren, setOriginalChildren] = useState([]); // Track original children for removal detection
    const [originalParents, setOriginalParents] = useState([]); // Track original parents for removal detection
    const [attributes, setAttributes] = useState([{ id: 1, value: '', type: 'text' }]);
    const [newTypesInCategory, setNewTypesInCategory] = useState([{ id: 1, value: '', existingId: null }]);
    const [selectedTypesInCategory, setSelectedTypesInCategory] = useState([]);
    const [originalTypesInCategory, setOriginalTypesInCategory] = useState([]); // Track original types for removal detection
    const [typeSelectorDropdown, setTypeSelectorDropdown] = useState({ id: 1, value: '' });
    const [geometryType, setGeometryType] = useState('point'); // Options: point, line, polygon, no_geometry
    const [color, setColor] = useState('#3b82f6'); // Default blue color
    const [isCategorySectionExpanded, setIsCategorySectionExpanded] = useState(false); // Collapsed by default
    const [isEditing, setIsEditing] = useState(false);

    // Update form when selectedItem changes
    useEffect(() => {
        if (selectedAsset) {
            setNewAssetType({
                title: selectedAsset.title || '',
                description: selectedAsset.description || '',
                parent_ids: selectedAsset.parent_ids || [],
                attributes: []
            });
            
            // Set up existing parents (display as static items)
            if (selectedAsset.parent_ids && selectedAsset.parent_ids.length > 0) {
                setExistingParents(selectedAsset.parent_ids);
                setOriginalParents(selectedAsset.parent_ids);
            } else {
                setExistingParents([]);
                setOriginalParents([]);
            }
            // Reset dropdown for adding new parents
            setParentDropdowns([{ id: 1, value: '' }]);
            
            // Set up existing children (find types that have this asset in their parent_ids)
            const childrenOfAsset = assetTypes.filter(at => 
                at.parent_ids && at.parent_ids.includes(selectedAsset.id)
            );
            if (childrenOfAsset.length > 0) {
                setExistingChildren(childrenOfAsset.map(c => c.id));
                setOriginalChildren(childrenOfAsset.map(c => c.id)); // Track for removal detection
            } else {
                setExistingChildren([]);
                setOriginalChildren([]);
            }
            // Reset dropdown for adding new children
            setChildrenDropdowns([{ id: 1, value: '' }])
            
            
            // Load existing attributes for this item type
            if (selectedAsset.attributes && selectedAsset.attributes.length > 0) {
                const attributesData = selectedAsset.attributes.map((attr, index) => ({
                    id: index + 1,
                    value: typeof attr === 'string' ? attr : attr.title,
                    type: typeof attr === 'string' ? 'text' : (attr.type || 'text')
                }));
                setAttributes(attributesData);
            } else {
                setAttributes([{ id: 1, value: '', type: 'text' }]);
            }
            
            // Load existing sub-types for this asset type (using category_id)
            const existingSubTypes = assetTypes.filter(at => 
                at.category_id === selectedAsset.id
            );
            
            // Set selected existing sub-types (for the dropdown display)
            const existingSubTypeIds = existingSubTypes.map(st => st.id);
            setSelectedTypesInCategory(existingSubTypeIds);
            setOriginalTypesInCategory(existingSubTypeIds); // Store original for comparison
            setTypeSelectorDropdown({ id: 1, value: '' }); // Reset dropdown
            
            // Don't populate newTypesInCategory array with existing ones - they're shown via selectedTypesInCategory
            // Only reset to empty input for creating NEW sub-types
            setNewTypesInCategory([{ id: 1, value: '', existingId: null }]);
            
            setGeometryType(selectedAsset.geometry_type || 'no_geometry');
            setColor(selectedAsset.color || '#3b82f6');
            setIsEditing(true);
        } else {
            setNewAssetType({
                title: '',
                description: '',
                parent_ids: [],
                attributes: []
            });
            setParentDropdowns([{ id: 1, value: '' }]);
            setExistingParents([]);
            setOriginalParents([]);
            setChildrenDropdowns([{ id: 1, value: '' }]);
            setExistingChildren([]);
            setOriginalChildren([]);
            setAttributes([{ id: 1, value: '', type: 'text' }]);
            setNewTypesInCategory([{ id: 1, value: '', existingId: null }]);
            setSelectedTypesInCategory([]);
            setOriginalTypesInCategory([]);
            setTypeSelectorDropdown({ id: 1, value: '' });
            setGeometryType('point');
            
            // Generate a random color for new types (excluding subtype colors)
            const existingColors = (assetTypes || [])
                .filter(at => !at.category_id) // Only check main types, not subtypes
                .map(at => at.color)
                .filter(Boolean);
            const randomColor = generateUniqueColor(existingColors);
            setColor(randomColor);
            
            setIsEditing(false);
        }
    }, [selectedAsset, assetTypes]);

    const handleNewAssetTypeChange = (e) => {
        setNewAssetType(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    // Check if selecting a parent would create a circular reference
    const wouldCreateCircularReference = (parentId, currentItemId) => {
        if (!parentId || !currentItemId || parentId === currentItemId) {
            return true; // Self-reference
        }
        
        // Check if the parent has the current item as its ancestor
        const checkAncestors = (itemId, visited = new Set()) => {
            if (visited.has(itemId)) {
                return false; // Already checked this branch
            }
            visited.add(itemId);
            
            const item = assetTypes?.find(at => at.id === itemId);
            if (!item) {
                return false;
            }
            
            // If this item is the current item, we have a circular reference
            if (item.id === currentItemId) {
                return true;
            }
            
            // Check all parents of this item
            const parentIds = item.parent_ids || [];
            for (const pid of parentIds) {
                if (checkAncestors(pid, visited)) {
                    return true;
                }
            }
            
            return false;
        };
        
        return checkAncestors(parentId);
    }

    const handleParentDropdownChange = (dropdownId, selectedValue) => {
        // Validate that this selection won't create a circular reference
        if (selectedValue && selectedAsset) {
            if (wouldCreateCircularReference(selectedValue, selectedAsset.id)) {
                alert('Cannot select this parent as it would create a circular reference. An item cannot be its own ancestor.');
                return;
            }
        }
        
        setParentDropdowns(prev => 
            prev.map(dropdown => 
                dropdown.id === dropdownId 
                    ? { ...dropdown, value: selectedValue }
                    : dropdown
            )
        );
    }

    const addAnotherParent = () => {
        const newId = Math.max(...parentDropdowns.map(d => d.id)) + 1;
        setParentDropdowns(prev => [...prev, { id: newId, value: '' }]);
    }

    const removeParentDropdown = (dropdownId) => {
        if (parentDropdowns.length > 1) {
            setParentDropdowns(prev => prev.filter(dropdown => dropdown.id !== dropdownId));
        }
    }

    const removeExistingParent = (parentId) => {
        setExistingParents(prev => prev.filter(id => id !== parentId));
    }

    // Children dropdown handlers
    const handleChildrenDropdownChange = (dropdownId, selectedValue) => {
        // Validate that this selection won't create a circular reference
        if (selectedValue && selectedAsset) {
            if (wouldCreateCircularReference(selectedAsset.id, selectedValue)) {
                alert('Cannot select this child as it would create a circular reference.');
                return;
            }
        }
        
        setChildrenDropdowns(prev => 
            prev.map(dropdown => 
                dropdown.id === dropdownId 
                    ? { ...dropdown, value: selectedValue }
                    : dropdown
            )
        );
    }

    const addAnotherChild = () => {
        const newId = Math.max(...childrenDropdowns.map(d => d.id)) + 1;
        setChildrenDropdowns(prev => [...prev, { id: newId, value: '' }]);
    }

    const removeChildrenDropdown = (dropdownId) => {
        if (childrenDropdowns.length > 1) {
            setChildrenDropdowns(prev => prev.filter(dropdown => dropdown.id !== dropdownId));
        }
    }

    const removeExistingChild = (childId) => {
        setExistingChildren(prev => prev.filter(id => id !== childId));
    }

    const handleAttributeChange = (attributeId, field, value) => {
        setAttributes(prev => 
            prev.map(attr => 
                attr.id === attributeId 
                    ? { ...attr, [field]: value }
                    : attr
            )
        );
    }

    const addAnotherAttribute = () => {
        const newId = Math.max(...attributes.map(a => a.id)) + 1;
        setAttributes(prev => [...prev, { id: newId, value: '', type: 'text' }]);
    }

    const removeAttribute = (attributeId) => {
        if (attributes.length > 1) {
            setAttributes(prev => prev.filter(attr => attr.id !== attributeId));
        }
    }

    const handleNewTypeInCategoryChange = (subTypeId, value) => {
        setNewTypesInCategory(prev => 
            prev.map(st => 
                st.id === subTypeId 
                    ? { ...st, value: value }
                    : st
            )
        );
    }

    const addAnotherTypeInCategory = () => {
        const newId = Math.max(...newTypesInCategory.map(st => st.id), 0) + 1;
        setNewTypesInCategory(prev => [...prev, { id: newId, value: '', existingId: null }]);
    }

    const removeNewTypeInCategory = (subTypeId) => {
        const subType = newTypesInCategory.find(st => st.id === subTypeId);
        // If it's an existing sub-type, we might want to delete it, but for now just remove from list
        // The user can manually delete it from the tree if needed
        if (newTypesInCategory.length > 1) {
            setNewTypesInCategory(prev => prev.filter(st => st.id !== subTypeId));
        }
    }

    // Check if a type can be selected as a sub-type (not invalid)
    const canBeAddedToCategory = (typeId) => {
        if (!typeId || !assetTypes) return false;
        
        // Can't select self
        if (selectedAsset && typeId === selectedAsset.id) {
            return false;
        }
        
        // Can't select if it would create a circular reference
        if (selectedAsset && wouldCreateCircularReference(typeId, selectedAsset.id)) {
            return false;
        }
        
        // Can't select if it's already a sub-type of another type (unless editing that type)
        const type = assetTypes.find(at => at.id === typeId);
        if (type && type.category_id && (!selectedAsset || type.category_id !== selectedAsset.id)) {
            return false;
        }
        
        // Can't select if it already has subtypes
        const hasSubtypes = assetTypes.some(at => at.category_id === typeId);
        if (hasSubtypes) {
            return false;
        }
        
        return true;
    }

    const handleTypeSelectorChange = (dropdownId, selectedValue) => {
        setTypeSelectorDropdown(prev => ({ ...prev, value: selectedValue }));
    }

    const addTypeToCategory = () => {
        if (typeSelectorDropdown.value && !selectedTypesInCategory.includes(typeSelectorDropdown.value)) {
            setSelectedTypesInCategory(prev => [...prev, typeSelectorDropdown.value]);
            setTypeSelectorDropdown(prev => ({ ...prev, value: '' })); // Reset dropdown
        }
    }

    const removeTypeFromCategory = (typeId) => {
        setSelectedTypesInCategory(prev => prev.filter(id => id !== typeId));
    }

    const handleAddAssetType = async () => {
        if (!newAssetType.title.trim()) {
            alert('Please enter an asset type title');
            return;
        }
        
        // Collect selected parent IDs: existing parents + new from dropdowns
        const newParentIds = parentDropdowns
            .map(dropdown => dropdown.value)
            .filter(value => value !== '');
        const selectedParentIds = [...new Set([...existingParents, ...newParentIds])];

        // Collect selected children IDs: existing children + new from dropdowns
        const newChildrenIds = childrenDropdowns
            .map(dropdown => dropdown.value)
            .filter(value => value !== '');
        const selectedChildrenIds = [...new Set([...existingChildren, ...newChildrenIds])];

        // Detect removed children (compare with original)
        const removedChildrenIds = originalChildren.filter(id => !selectedChildrenIds.includes(id));
        // Detect added children
        const addedChildrenIds = selectedChildrenIds.filter(id => !originalChildren.includes(id));
        
        // Detect removed parents (compare with original)
        const removedParentIds = originalParents.filter(id => !selectedParentIds.includes(id));

        // Collect attribute values with types
        const attributeValues = attributes
            .filter(attr => attr.value.trim() !== '')
            .map(attr => ({
                title: attr.value.trim(),
                type: attr.type || 'text'
            }));

        // Collect sub-type values (new ones to create)
        const newSubTypes = newTypesInCategory
            .filter(st => st.value.trim() !== '' && !st.existingId)
            .map(st => st.value.trim());

        // Store the current form data before clearing
        const assetTypeData = {
            name: newAssetType.title,
            description: newAssetType.description,
            parent_ids: selectedParentIds,
            category_id: isEditing && selectedAsset ? (selectedAsset.category_id || null) : null, // Preserve existing subtype relationship
            attributes: attributeValues,
            geometry_type: geometryType,
            color: color
        };
        
        console.log('[handleAddAssetType] Saving main type with color:', color);
        console.log('[handleAddAssetType] Full assetTypeData:', assetTypeData);

        // Clear form fields IMMEDIATELY for better UX
        setNewAssetType({
            title: '',
            description: '',
            parent_ids: [],
            attributes: []
        });

        // Reset parent dropdowns and existing parents
        setParentDropdowns([{ id: 1, value: '' }]);
        setExistingParents([]);
        setOriginalParents([]);
        
        // Reset children dropdowns and existing children
        setChildrenDropdowns([{ id: 1, value: '' }]);
        setExistingChildren([]);
        setOriginalChildren([]);
        
        // Reset attributes to single empty attribute
        setAttributes([{ id: 1, value: '', type: 'text' }]);
        setGeometryType('point');
        setColor('#3b82f6');
        
        // Store the current asset type ID for creating sub-types
        let currentAssetTypeId = null;

        try {
            let result;
            if (isEditing && selectedAsset) {
                // Update existing feature type
                result = await dispatch(updateFeatureType({
                    projectId: selectedProject.id,
                    featureTypeId: selectedAsset.id,
                    featureTypeData: assetTypeData
                })).unwrap();
                
                console.log('[handleAddAssetType] Update result:', result);
                console.log('[handleAddAssetType] Updated main type color:', result?.data?.color);
                
                currentAssetTypeId = selectedAsset.id;
                
                // Refresh the feature types list to get updated data
                const refreshResult = await dispatch(getFeatureTypes(selectedProject.id)).unwrap();
                console.log('[handleAddAssetType] After refresh, main type color:', 
                    refreshResult?.data?.find(t => t.id === currentAssetTypeId)?.color);
                
                // Wait a moment for state to update before clearing selection
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                // Create new feature type
                result = await dispatch(createFeatureType({
                    projectId: selectedProject.id,
                    featureTypeData: assetTypeData
                })).unwrap();
                
                currentAssetTypeId = result.data.id;
                
                // Refresh the feature types list to get the new feature type with attributes
                await dispatch(getFeatureTypes(selectedProject.id));
            }
            
            // Detect removed subtypes (only when editing)
            let removedSubTypes = [];
            if (isEditing && currentAssetTypeId) {
                removedSubTypes = originalTypesInCategory.filter(id => !selectedTypesInCategory.includes(id));
                
                if (removedSubTypes.length > 0) {
                    // Refetch current feature types to ensure we have fresh data
                    const refreshedTypesResult = await dispatch(getFeatureTypes(selectedProject.id)).unwrap();
                    const freshTypes = refreshedTypesResult?.data || currentFeatureTypes || [];
                    
                    // Get existing colors for new color generation
                    const existingColors = freshTypes
                        .filter(at => !at.category_id) // Only check main types
                        .map(at => at.color)
                        .filter(Boolean);
                    
                    for (const removedTypeId of removedSubTypes) {
                        try {
                            const removedType = freshTypes.find(at => at.id === removedTypeId);
                            if (removedType) {
                                // Generate a new unique color for the removed subtype
                                const newColor = generateUniqueColor(existingColors);
                                existingColors.push(newColor); // Add to list to avoid duplicates in this batch
                                
                                const updatePayload = {
                                    name: removedType.title,
                                    description: removedType.description || '',
                                    parent_ids: removedType.parent_ids || [],
                                    category_id: null, // Remove subtype relationship
                                    attributes: removedType.attributes || [],
                                    geometry_type: removedType.geometry_type || 'no_geometry',
                                    color: newColor // Assign new random color
                                };
                                
                                const removeResult = await dispatch(updateFeatureType({
                                    projectId: selectedProject.id,
                                    featureTypeId: removedTypeId,
                                    featureTypeData: updatePayload
                                })).unwrap();
                                
                                console.log('[handleAddAssetType] Removed subtype, new color:', newColor);
                                console.log('[handleAddAssetType] Remove result:', removeResult);
                            }
                        } catch (error) {
                            console.error(`Error removing subtype relationship:`, error);
                        }
                    }
                    
                    // Check main type color after removing subtypes
                    const afterRemovalCheck = await dispatch(getFeatureTypes(selectedProject.id)).unwrap();
                    console.log('[handleAddAssetType] After removing subtypes, main type color:', 
                        afterRemovalCheck?.data?.find(t => t.id === currentAssetTypeId)?.color);
                }
            }
            
            // Update selected existing types to be sub-types
            // Include both the selected ones AND the current dropdown value
            const allSelectedSubTypes = [...selectedTypesInCategory];
            if (typeSelectorDropdown.value && !allSelectedSubTypes.includes(typeSelectorDropdown.value)) {
                allSelectedSubTypes.push(typeSelectorDropdown.value);
            }
            
            if (allSelectedSubTypes.length > 0 && currentAssetTypeId) {
                // Refetch current feature types to ensure we have fresh data
                const refreshedTypesResult = await dispatch(getFeatureTypes(selectedProject.id)).unwrap();
                const freshTypes = refreshedTypesResult?.data || currentFeatureTypes || [];
                
                // Get the parent type's color (the current type being edited/created)
                const parentType = freshTypes.find(at => at.id === currentAssetTypeId);
                const parentColor = parentType?.color || color; // Use parent's color or the form's color
                
                for (const existingTypeId of allSelectedSubTypes) {
                    try {
                        const existingType = freshTypes.find(at => at.id === existingTypeId);
                        if (existingType) {
                            const updatePayload = {
                                name: existingType.title,
                                description: existingType.description || '',
                                parent_ids: existingType.parent_ids || [],
                                category_id: currentAssetTypeId, // Set as sub-type
                                attributes: existingType.attributes || [], // Keep existing attributes, backend will merge with parent
                                geometry_type: existingType.geometry_type || 'no_geometry', // Keep existing setting
                                color: parentColor // Inherit parent's color
                            };
                            
                            console.log(`[CATEGORY UPDATE] Updating type "${existingType.title}" (ID: ${existingTypeId})`);
                            console.log(`[CATEGORY UPDATE] Setting category_id to: ${currentAssetTypeId}`);
                            console.log(`[CATEGORY UPDATE] Full payload:`, JSON.stringify(updatePayload, null, 2));
                            
                            const result = await dispatch(updateFeatureType({
                                projectId: selectedProject.id,
                                featureTypeId: existingTypeId,
                                featureTypeData: updatePayload
                            })).unwrap();
                            
                            console.log(`[CATEGORY UPDATE] Success! Response:`, result);
                        } else {
                            console.error(`[CATEGORY UPDATE] Could not find type with ID ${existingTypeId} in fresh types list`);
                            alert(`Could not find the selected type (ID: ${existingTypeId}). Please refresh and try again.`);
                        }
                    } catch (error) {
                        const typeName = freshTypes.find(at => at.id === existingTypeId)?.title || existingTypeId;
                        console.error(`[CATEGORY UPDATE] Error updating "${typeName}":`, error);
                        console.error(`[CATEGORY UPDATE] Error details:`, error.response?.data || error.message);
                        alert(`Failed to update "${typeName}" as a subtype. Error: ${error.response?.data?.error || error.message || 'Unknown error'}`);
                    }
                }
            }
            
            // Create new sub-types if any were specified
            if (newSubTypes.length > 0 && currentAssetTypeId) {
                for (const subTypeName of newSubTypes) {
                    try {
                        await dispatch(createFeatureType({
                            projectId: selectedProject.id,
                            featureTypeData: {
                                name: subTypeName,
                                description: '',
                                parent_ids: [],
                                category_id: currentAssetTypeId, // Backend will inherit attributes and geometry_type from parent
                                color: color // Inherit parent's color
                                // Note: Don't send attributes or geometry_type - let backend inherit them
                            }
                        })).unwrap();
                    } catch (error) {
                        console.error(`Error creating sub-type "${subTypeName}":`, error);
                    }
                }
            }
            
            // Update children's parent_ids (add this type as parent for added children, remove for removed children)
            if ((addedChildrenIds.length > 0 || removedChildrenIds.length > 0) && currentAssetTypeId) {
                // Refetch current feature types to ensure we have fresh data
                const refreshedTypesResult = await dispatch(getFeatureTypes(selectedProject.id)).unwrap();
                const freshTypes = refreshedTypesResult?.data || currentFeatureTypes || [];
                
                // Add current type as parent for newly added children
                for (const childId of addedChildrenIds) {
                    try {
                        const childType = freshTypes.find(at => at.id === childId);
                        if (childType) {
                            const existingParentIds = childType.parent_ids || [];
                            // Only add if not already a parent
                            if (!existingParentIds.includes(currentAssetTypeId)) {
                                const updatePayload = {
                                    name: childType.title,
                                    description: childType.description || '',
                                    parent_ids: [...existingParentIds, currentAssetTypeId],
                                    category_id: childType.category_id || null,
                                    attributes: childType.attributes || [],
                                    geometry_type: childType.geometry_type || 'point',
                                    color: childType.color
                                };
                                
                                console.log(`[CHILDREN UPDATE] Adding ${currentAssetTypeId} as parent of "${childType.title}"`);
                                
                                await dispatch(updateFeatureType({
                                    projectId: selectedProject.id,
                                    featureTypeId: childId,
                                    featureTypeData: updatePayload
                                })).unwrap();
                            }
                        }
                    } catch (error) {
                        console.error(`Error adding parent to child:`, error);
                    }
                }
                
                // Remove current type from parent_ids of removed children
                for (const childId of removedChildrenIds) {
                    try {
                        const childType = freshTypes.find(at => at.id === childId);
                        if (childType) {
                            const existingParentIds = childType.parent_ids || [];
                            const updatedParentIds = existingParentIds.filter(id => id !== currentAssetTypeId);
                            
                            const updatePayload = {
                                name: childType.title,
                                description: childType.description || '',
                                parent_ids: updatedParentIds,
                                category_id: childType.category_id || null,
                                attributes: childType.attributes || [],
                                geometry_type: childType.geometry_type || 'point',
                                color: childType.color
                            };
                            
                            console.log(`[CHILDREN UPDATE] Removing ${currentAssetTypeId} from parents of "${childType.title}"`);
                            
                            await dispatch(updateFeatureType({
                                projectId: selectedProject.id,
                                featureTypeId: childId,
                                featureTypeData: updatePayload
                            })).unwrap();
                        }
                    } catch (error) {
                        console.error(`Error removing parent from child:`, error);
                    }
                }
            }
            
            // Refresh again to show the updated sub-types and children
            if ((allSelectedSubTypes.length > 0 || newSubTypes.length > 0 || removedSubTypes.length > 0 || addedChildrenIds.length > 0 || removedChildrenIds.length > 0) && currentAssetTypeId) {
                const finalRefresh = await dispatch(getFeatureTypes(selectedProject.id)).unwrap();
                console.log('[handleAddAssetType] Final refresh, main type color:', 
                    finalRefresh?.data?.find(t => t.id === currentAssetTypeId)?.color);
            }
            
            setIsEditing(false);
            
            // Reset sub-types after successful save
            setNewTypesInCategory([{ id: 1, value: '', existingId: null }]);
            setSelectedTypesInCategory([]);
            setOriginalTypesInCategory([]);
            setTypeSelectorDropdown({ id: 1, value: '' });
            
            // Reset children after successful save
            setChildrenDropdowns([{ id: 1, value: '' }]);
            setOriginalChildren([]);
            
            // Clear selection if updating
            if (isEditing && selectedAsset && onAssetSelect) {
                onAssetSelect(null);
            }
        } catch (error) {
            console.error('Error creating/updating asset type:', error);
            alert('Failed to create/update asset type. Please try again.');
            
            // Restore form data if there was an error (optional - you might want to keep the form clear)
            // setNewItemType({
            //     title: assetTypeData.name,
            //     description: assetTypeData.description,
            //     parent_ids: assetTypeData.parent_ids,
            //     attributes: assetTypeData.attributes
            // });
            // setGeometryType(assetTypeData.geometry_type);
        }
    }

    const handleCancelEdit = () => {
        setNewAssetType({
            title: '',
            description: '',
            parent_ids: [],
            attributes: []
        });
        setParentDropdowns([{ id: 1, value: '' }]);
        setExistingParents([]);
        setOriginalParents([]);
        setChildrenDropdowns([{ id: 1, value: '' }]);
        setExistingChildren([]);
        setOriginalChildren([]);
        setAttributes([{ id: 1, value: '', type: 'text' }]);
        setNewTypesInCategory([{ id: 1, value: '', existingId: null }]);
        setSelectedTypesInCategory([]);
        setOriginalTypesInCategory([]);
        setTypeSelectorDropdown({ id: 1, value: '' });
        setGeometryType('point');
        
        // Generate a random color for new types
        const existingColors = (assetTypes || [])
            .filter(at => !at.category_id) // Only check main types
            .map(at => at.color)
            .filter(Boolean);
        const randomColor = generateUniqueColor(existingColors);
        setColor(randomColor);
        
        setIsEditing(false);
        if (onAssetSelect) {
            onAssetSelect(null);
        }
    }

    const handleAddSubType = () => {
        if (!selectedAsset) {
            return;
        }
        
        // Add a new sub-type input to the list
        const newId = Math.max(...newTypesInCategory.map(st => st.id), 0) + 1;
        setNewTypesInCategory(prev => [...prev, { id: newId, value: '', existingId: null }]);
    }

    
    return (
        <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                <label htmlFor="newAssetTypeTitle" style={{ margin: 0 }}>
                    {isEditing ? `Edit Asset Type: ${selectedAsset?.title}` : 'Create New Asset Type'}
                </label>
            </div>
            <div className="add-item-form">
                <FormField
                    label=""
                    id="assetTypeTitle"
                    type="text"
                    value={newAssetType.title}
                    onChange={handleNewAssetTypeChange}
                    placeholder={"Enter name"}
                    inputProps={{ name: 'title' }}
                />
                
                <div className="form-group">
                    <label className="form-label">
                        Parents: 
                        {(existingParents.length > 0 || parentDropdowns.some(d => d.value)) && (
                            <span style={{ color: '#28a745', fontSize: '12px', marginLeft: '8px' }}>
                                ({existingParents.length + parentDropdowns.filter(d => d.value).length} parent(s))
                            </span>
                        )}
                    </label>
                    
                    {/* Display existing parents as static items */}
                    {existingParents.map(parentId => {
                        const parent = assetTypes?.find(at => at.id === parentId);
                        if (!parent) return null;
                        return (
                            <div key={parentId} className="existing-item-row">
                                <span className="existing-item-name">{parent.title}</span>
                                <button
                                    type="button"
                                    onClick={() => removeExistingParent(parentId)}
                                    className="remove-parent-button"
                                    title="Remove this parent"
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                    
                    {/* Dropdown for adding new parents */}
                    {parentDropdowns.map((dropdown, index) => {
                        const selectedParent = assetTypes?.find(at => at.id === dropdown.value);
                        return (
                            <div key={dropdown.id} className="parent-dropdown-row">
                                <select
                                    value={dropdown.value}
                                    onChange={(e) => handleParentDropdownChange(dropdown.id, e.target.value)}
                                    className="form-select parent-dropdown"
                                >
                                    <option value="">Select a parent to add...</option>
                                    {(assetTypes || []).filter(assetType => {
                                        // Don't allow self-reference
                                        if (assetType.id === selectedAsset?.id) {
                                            return false;
                                        }
                                        // Don't allow circular references when editing
                                        if (selectedAsset && wouldCreateCircularReference(assetType.id, selectedAsset.id)) {
                                            return false;
                                        }
                                        // Don't allow selecting own category as parent
                                        if (selectedAsset && selectedAsset.category_id === assetType.id) {
                                            return false;
                                        }
                                        // Don't show already existing parents
                                        if (existingParents.includes(assetType.id)) {
                                            return false;
                                        }
                                        // Don't show already selected in other dropdowns
                                        if (parentDropdowns.some(d => d.value === assetType.id && d.id !== dropdown.id)) {
                                            return false;
                                        }
                                        return true;
                                    }).map(assetType => {
                                        // Check if this is a category (has types in it)
                                        const isCategory = (assetTypes || []).some(at => at.category_id === assetType.id);
                                        // Show category label if type belongs to one
                                        const category = assetType.category_id ? assetTypes?.find(at => at.id === assetType.category_id) : null;
                                        const categoryLabel = category ? ` [${category.title}]` : '';
                                        const categoryMarker = isCategory ? ' (Category)' : '';
                                        return (
                                            <option key={assetType.id} value={assetType.id}>
                                                {assetType.title}{categoryLabel}{categoryMarker}
                                            </option>
                                        );
                                    })}
                                </select>
                                {selectedParent && (
                                    <button
                                        type="button"
                                        onClick={() => removeParentDropdown(dropdown.id)}
                                        className="remove-parent-button"
                                        title="Remove this parent"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    <button
                        type="button"
                        onClick={addAnotherParent}
                        className="add-parent-button"
                    >
                        + Add Parent
                    </button>
                </div>
                
                {/* Children Selection */}
                <div className="form-group">
                    <label className="form-label">
                        Children: 
                        {(existingChildren.length > 0 || childrenDropdowns.some(d => d.value)) && (
                            <span style={{ color: '#17a2b8', fontSize: '12px', marginLeft: '8px' }}>
                                ({existingChildren.length + childrenDropdowns.filter(d => d.value).length} child(ren))
                            </span>
                        )}
                    </label>
                    
                    {/* Display existing children as static items */}
                    {existingChildren.map(childId => {
                        const child = assetTypes?.find(at => at.id === childId);
                        if (!child) return null;
                        return (
                            <div key={childId} className="existing-item-row">
                                <span className="existing-item-name">{child.title}</span>
                                <button
                                    type="button"
                                    onClick={() => removeExistingChild(childId)}
                                    className="remove-parent-button"
                                    title="Remove this child"
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                    
                    {/* Dropdown for adding new children */}
                    {childrenDropdowns.map((dropdown, index) => {
                        const selectedChild = assetTypes?.find(at => at.id === dropdown.value);
                        return (
                            <div key={dropdown.id} className="parent-dropdown-row">
                                <select
                                    value={dropdown.value}
                                    onChange={(e) => handleChildrenDropdownChange(dropdown.id, e.target.value)}
                                    className="form-select parent-dropdown"
                                >
                                    <option value="">Select a child to add...</option>
                                    {(assetTypes || []).filter(assetType => {
                                        // Don't allow self-reference
                                        if (assetType.id === selectedAsset?.id) {
                                            return false;
                                        }
                                        // Don't allow circular references
                                        if (selectedAsset && wouldCreateCircularReference(selectedAsset.id, assetType.id)) {
                                            return false;
                                        }
                                        // Don't show already selected children in dropdowns
                                        if (childrenDropdowns.some(d => d.value === assetType.id && d.id !== dropdown.id)) {
                                            return false;
                                        }
                                        // Don't show already existing children
                                        if (existingChildren.includes(assetType.id)) {
                                            return false;
                                        }
                                        // Don't allow selecting own category as child
                                        if (selectedAsset && selectedAsset.category_id === assetType.id) {
                                            return false;
                                        }
                                        // Don't allow selecting types that have current type as their category
                                        if (selectedAsset && assetType.category_id === selectedAsset.id) {
                                            return false;
                                        }
                                        // Don't allow selecting categories (types that have types in them) as children
                                        const isCategory = (assetTypes || []).some(at => at.category_id === assetType.id);
                                        if (isCategory) {
                                            return false;
                                        }
                                        return true;
                                    }).map(assetType => {
                                        const hasCategory = assetType.category_id;
                                        const category = hasCategory ? assetTypes?.find(at => at.id === assetType.category_id) : null;
                                        const categoryLabel = category ? ` [${category.title}]` : '';
                                        return (
                                            <option key={assetType.id} value={assetType.id}>
                                                {assetType.title}{categoryLabel}
                                            </option>
                                        );
                                    })}
                                </select>
                                {selectedChild && (
                                    <button
                                        type="button"
                                        onClick={() => removeChildrenDropdown(dropdown.id)}
                                        className="remove-parent-button"
                                        title="Remove this child"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    <button
                        type="button"
                        onClick={addAnotherChild}
                        className="add-parent-button"
                    >
                        + Add Child
                    </button>
                </div>
                
                {/* Geometry Type Dropdown */}
                <div className="form-group">
                    <label className="form-label">Geometry Type:</label>
                    <select
                        value={geometryType}
                        onChange={(e) => setGeometryType(e.target.value)}
                        className="form-input"
                    >
                        <option value="point">Point</option>
                        <option value="line">Line</option>
                        <option value="polygon">Polygon</option>
                        <option value="no_geometry">No Geometry</option>
                    </select>
                </div>
                
                {/* Color Picker Section */}
                <div className="form-group">
                    <label className="form-label">Color:</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="form-input"
                            style={{ 
                                width: '60px', 
                                height: '40px', 
                                cursor: isEditing && selectedAsset?.category_id ? 'not-allowed' : 'pointer',
                                opacity: isEditing && selectedAsset?.category_id ? 0.6 : 1
                            }}
                            disabled={isEditing && selectedAsset?.category_id}
                            title={isEditing && selectedAsset?.category_id ? 'Subtypes inherit their parent type\'s color' : 'Select a color for this type'}
                        />
                        <span style={{ fontSize: '14px', color: '#6c757d' }}>
                            {color}
                        </span>
                        <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                            {isEditing && selectedAsset?.category_id && '(Inherited from parent - cannot be changed)'}
                        </span>
                    </div>
                </div>
                
                {/* Attributes Section */}
                <div className="form-group">
                    <label className="form-label">Attributes:</label>
                    {attributes.map((attribute, index) => (
                        <div key={attribute.id} className="attribute-row">
                            <input
                                type="text"
                                value={attribute.value}
                                onChange={(e) => handleAttributeChange(attribute.id, 'value', e.target.value)}
                                placeholder={`Attribute ${index + 1}`}
                                className="form-input attribute-name-input"
                            />
                            <select
                                value={attribute.type || 'text'}
                                onChange={(e) => handleAttributeChange(attribute.id, 'type', e.target.value)}
                                className="form-select attribute-type-select"
                            >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="photos">Photos</option>
                            </select>
                            {attributes.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeAttribute(attribute.id)}
                                    className="remove-parent-button"
                                    title="Remove this attribute"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addAnotherAttribute}
                        className="add-parent-button"
                    >
                        + Add Attribute
                    </button>
                </div>
                
                {/* Types in Category Section - Collapsible */}
                <div className="form-group">
                    <div 
                        onClick={() => setIsCategorySectionExpanded(!isCategorySectionExpanded)}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            cursor: 'pointer',
                            userSelect: 'none',
                            padding: '8px 0',
                            borderBottom: isCategorySectionExpanded ? '1px solid #e0e0e0' : 'none',
                            marginBottom: isCategorySectionExpanded ? '15px' : '0'
                        }}
                    >
                        <span style={{ 
                            marginRight: '8px', 
                            fontSize: '12px',
                            transition: 'transform 0.2s',
                            transform: isCategorySectionExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                        }}>
                            ▶
                        </span>
                        <label className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                            Convert to category
                        </label>
                    </div>
                    
                    {isCategorySectionExpanded && (
                        <>
                            {/* Create New Types in Category */}
                            <div style={{ marginBottom: '15px' }}>
                                <label className="form-label" style={{ fontSize: '13px', marginBottom: '5px', display: 'block' }}>
                                    Create New Types in this Category:
                                </label>
                                {newTypesInCategory.map((typeEntry, index) => (
                                    <div key={typeEntry.id} className="parent-dropdown-row">
                                        <input
                                            type="text"
                                            value={typeEntry.value}
                                            onChange={(e) => handleNewTypeInCategoryChange(typeEntry.id, e.target.value)}
                                            placeholder={typeEntry.existingId ? `Type ${index + 1} (existing)` : `Type ${index + 1}`}
                                            className="form-input parent-dropdown"
                                            disabled={!!typeEntry.existingId}
                                            style={typeEntry.existingId ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                                        />
                                        {newTypesInCategory.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeNewTypeInCategory(typeEntry.id)}
                                                className="remove-parent-button"
                                                title={typeEntry.existingId ? "Existing types cannot be removed here. Delete from tree if needed." : "Remove this type"}
                                                disabled={!!typeEntry.existingId}
                                                style={typeEntry.existingId ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addAnotherTypeInCategory}
                                    className="add-parent-button"
                                >
                                    + Add Type
                                </button>
                                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                    {newTypesInCategory.some(st => st.existingId) 
                                        ? 'Existing types are shown in gray. Add new types below.' 
                                        : isEditing && selectedAsset
                                        ? 'Enter type names. They will be created when you save.'
                                        : 'Enter type names for this new category. They will be created when you save.'}
                                </p>
                            </div>
                            
                            {/* Select Existing Types to Add to Category */}
                            <div style={{ marginTop: '15px' }}>
                                <label className="form-label" style={{ fontSize: '13px', marginBottom: '5px', display: 'block' }}>
                                    Or Add Existing Type to this Category:
                                </label>
                                
                                {/* Show selected types above the dropdown */}
                                {selectedTypesInCategory.length > 0 && (
                                    <div style={{ marginBottom: '10px' }}>
                                        {selectedTypesInCategory.map(typeId => {
                                            const type = assetTypes?.find(at => at.id === typeId);
                                            return type ? (
                                                <div key={typeId} className="parent-dropdown-row" style={{ marginBottom: '5px' }}>
                                                    <span className="form-input parent-dropdown" style={{ backgroundColor: '#f0f0f0', cursor: 'default' }}>
                                                        {type.title}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTypeFromCategory(typeId)}
                                                        className="remove-parent-button"
                                                        title="Remove this type from category"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                                
                                {/* Dropdown */}
                                <select
                                    value={typeSelectorDropdown.value}
                                    onChange={(e) => handleTypeSelectorChange(typeSelectorDropdown.id, e.target.value)}
                                    className="form-select parent-dropdown"
                                >
                                    <option value="">-- Select an existing type --</option>
                                    {(assetTypes || []).filter(assetType => {
                                        // Filter out invalid types and already selected types
                                        return canBeAddedToCategory(assetType.id) && !selectedTypesInCategory.includes(assetType.id);
                                    }).map(assetType => (
                                        <option key={assetType.id} value={assetType.id}>
                                            {assetType.title}
                                            {assetType.category_id && (
                                                ` (currently in category: ${assetTypes.find(at => at.id === assetType.category_id)?.title || 'Unknown'})`
                                            )}
                                        </option>
                                    ))}
                                </select>
                                
                                {/* Button underneath the dropdown */}
                                <button
                                    type="button"
                                    onClick={addTypeToCategory}
                                    className="add-parent-button"
                                    disabled={!typeSelectorDropdown.value}
                                    title="Add this type to the category"
                                    style={{ 
                                        marginTop: '8px'
                                    }}
                                >
                                    + Add to Category
                                </button>
                                <p style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                                    {typeSelectorDropdown.value ? (
                                        <span style={{ color: '#28a745', fontWeight: '500' }}>
                                            Selected type will be added to this category when you save.
                                        </span>
                                    ) : (
                                        'Invalid types (self, circular references, types already in a category, types that are categories) are filtered out.'
                                    )}
                                </p>
                            </div>
                        </>
                    )}
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleAddAssetType} className="add-button">
                        {isEditing ? 'Update Asset Type' : 'Add Asset Type'}
                    </button>
                    <button 
                        onClick={handleCancelEdit} 
                        style={{
                            backgroundColor: '#6c757d',
                            color: '#ffffff',
                            border: '1px solid #6c757d',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#5a6268';
                            e.target.style.borderColor = '#5a6268';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#6c757d';
                            e.target.style.borderColor = '#6c757d';
                        }}
                    >
                        {isEditing ? 'Cancel' : 'Clear'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AssetTypeForm;