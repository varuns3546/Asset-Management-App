import React, { useState, useEffect, useRef, useMemo } from 'react'
import '../../styles/assetTypeTree.css'
import { useContextMenuSelection } from '../../hooks/useContextMenuSelection'
import ContextMenu from '../common/ContextMenu'

// Utility function to convert hex color to rgba with opacity
const hexToRgba = (hex, opacity) => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const TreeNode = ({ 
    node, 
    level = 0, 
    parentCount = 0, 
    onAssetClick, 
    isTopLevel = false, 
    assetTypes = [],
    treeData = [],
    isSelected = false,
    onItemSelect,
    onContextMenu,
    onMouseDown,
    itemIndex,
    checkNodeSelected,
    getNodeIndex
}) => {
    const [isChildrenExpanded, setIsChildrenExpanded] = React.useState(true)
    const hasChildren = node.children && node.children.length > 0
    const hasMultipleParents = node.parent_ids && node.parent_ids.length > 1
    
    // Determine node color: use own color, or inherit from category if it belongs to one
    const nodeColor = React.useMemo(() => {
        if (node.color) {
            return node.color;
        }
        // If this type belongs to a category, inherit color from category
        if (node.category_id && assetTypes) {
            const category = assetTypes.find(at => at.id === node.category_id);
            return category?.color || '#3b82f6'; // Default blue if no category color
        }
        return '#3b82f6'; // Default blue
    }, [node.color, node.category_id, assetTypes])

    const handleAssetClick = (e) => {
        e.stopPropagation()
        e.preventDefault()
        // Handle selection (for multi-select support)
        if (onItemSelect && itemIndex !== undefined) {
            onItemSelect(e, node, itemIndex)
        }
        // Always update the form when clicking (unless Ctrl/Shift is held for multi-select)
        if (onAssetClick && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            onAssetClick(node)
        }
    }

    const handleContextMenuClick = (e) => {
        e.stopPropagation()
        e.preventDefault()
        if (onContextMenu) {
            onContextMenu(e, node)
        }
    }

    const handleToggleChildren = (e) => {
        e.stopPropagation()
        setIsChildrenExpanded(!isChildrenExpanded)
    }

    // Check if this type belongs to a category
    const hasCategory = node.category_id ? true : false
    
    return (
        <div className="type-node">
            <div className="type-row">
                <div className="type-container">
                    <div 
                        className={`type-content ${isSelected ? 'selected' : ''}`}
                        onClick={handleAssetClick}
                        onMouseDown={onMouseDown}
                        onContextMenu={handleContextMenuClick}
                        style={{ 
                            userSelect: 'none',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            backgroundColor: hexToRgba(nodeColor, 0.25),
                            border: `3px solid ${isSelected ? '#007bff' : nodeColor}`
                        }}
                        title="Click to edit, right-click for menu"
                    >
                        <span className="type-title" title={node.title}>
                            {node.title}
                            {/* Show category name if this type belongs to a category */}
                            {node.category_id && assetTypes && (() => {
                                const category = assetTypes.find(at => at.id === node.category_id);
                                return category ? (
                                    <span style={{ color: '#6c757d', fontSize: '0.9em', fontWeight: 'normal' }}>
                                        {' '}({category.title})
                                    </span>
                                ) : null;
                            })()}
                        </span>
                        <div className="type-indicators">
                            {hasMultipleParents && <span className="multiple-parents-indicator" title="Has multiple parents">🔗</span>}
                            {/* Children expand button on the right */}
                            {hasChildren && (
                                <button 
                                    className="expand-button expand-button-right"
                                    onClick={handleToggleChildren}
                                    title={isChildrenExpanded ? 'Collapse Children' : 'Expand Children'}
                                >
                                    {isChildrenExpanded ? '−' : '+'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Children appear to the right, stacked vertically if multiple */}
                {hasChildren && isChildrenExpanded && (
                    <div 
                        className="children-container" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        {node.children.map(child => {
                            const childIsSelected = checkNodeSelected ? checkNodeSelected(child) : false
                            const childIndex = getNodeIndex ? getNodeIndex(child) : undefined
                            return (
                                <TreeNode 
                                    key={child.id} 
                                    node={child} 
                                    level={level + 1} 
                                    parentCount={parentCount + 1}
                                    onAssetClick={onAssetClick}
                                    isTopLevel={false}
                                    assetTypes={assetTypes}
                                    treeData={treeData}
                                    isSelected={childIsSelected}
                                    onItemSelect={onItemSelect}
                                    onContextMenu={onContextMenu}
                                    onMouseDown={onMouseDown}
                                    itemIndex={childIndex}
                                    checkNodeSelected={checkNodeSelected}
                                    getNodeIndex={getNodeIndex}
                                />
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

const AssetTypeTree = ({ assetTypes = [], onRemoveAssetType, onAssetClick }) => {
    const [isTreeExpanded, setIsTreeExpanded] = useState(true)
    const [zoomLevel, setZoomLevel] = useState(100)
    const treeContentRef = useRef(null)

    // Force re-render when assetTypes change by updating a state
    const [treeKey, setTreeKey] = useState(0);
    
    useEffect(() => {
        setTreeKey(prev => prev + 1);
    }, [assetTypes]);

    // Flatten tree structure to get a flat list of nodes for selection
    const flattenTree = (nodes, result = []) => {
        nodes.forEach(node => {
            result.push(node)
            if (node.children && node.children.length > 0) {
                flattenTree(node.children, result)
            }
        })
        return result
    }


    // Calculate dynamic spacing and sizing based on zoom level
    const getDynamicStyles = () => {
        const scale = zoomLevel / 100
        return {
            nodeMinWidth: Math.max(80, 120 * scale),
            nodeGap: Math.max(10, 18 * scale), // Increased from 15 to 18 for more spacing
            nodePadding: Math.max(4, 8 * scale),
            fontSize: Math.max(10, 14 * scale),
            verticalGap: Math.max(12, 20 * scale),
        }
    }

    const dynamicStyles = getDynamicStyles()
    
    // Build tree structure from flat items array
    // Supports both parent_ids (child declares parents) and children_ids (parent declares children)
    // Categories are hidden - types in a category inherit the category's children_ids
    const buildTree = (items) => {
        const itemMap = new Map()
        const rootItems = []
        const processedItems = new Set() // Track items that have been added to tree

        // Safety check: ensure items is an array
        if (!items || !Array.isArray(items)) {
            return rootItems
        }

        try {
            // First, identify which items are categories (have other items pointing to them via category_id)
            const categoryIds = new Set()
            items.forEach(item => {
                if (item.category_id) {
                    categoryIds.add(String(item.category_id))
                }
            })

            // Create a map of all items
            items.forEach(item => {
                itemMap.set(item.id, { 
                    ...item, 
                    children: []    // Will be populated from both parent_ids and children_ids
                })
            })

            // Track children of categories (via both children_ids and parent_ids)
            // These items should appear as children of ALL types in that category, not at root
            const categoryOnlyChildren = new Set()  // Items that are ONLY children of categories
            const categoryToChildren = new Map()    // Map of category ID -> array of child IDs
            
            // Method 1: Track via category's children_ids
            items.forEach(item => {
                if (categoryIds.has(String(item.id))) {
                    const childrenIds = item.children_ids || []
                    if (!categoryToChildren.has(String(item.id))) {
                        categoryToChildren.set(String(item.id), [])
                    }
                    childrenIds.forEach(childId => {
                        categoryOnlyChildren.add(String(childId))
                        categoryToChildren.get(String(item.id)).push(childId)
                    })
                }
            })
            
            // Method 2: Track via item's parent_ids pointing to categories
            items.forEach(item => {
                const parentIds = item.parent_ids || []
                let hasCategoryParent = false
                let hasNonCategoryParent = false
                
                parentIds.forEach(parentId => {
                    const parentIdStr = String(parentId)
                    if (categoryIds.has(parentIdStr)) {
                        hasCategoryParent = true
                        // Add this item to the category's children list
                        if (!categoryToChildren.has(parentIdStr)) {
                            categoryToChildren.set(parentIdStr, [])
                        }
                        if (!categoryToChildren.get(parentIdStr).includes(item.id)) {
                            categoryToChildren.get(parentIdStr).push(item.id)
                        }
                    } else if (itemMap.has(parentIdStr)) {
                        hasNonCategoryParent = true
                    }
                })
                
                // If item has category parent(s) but NO non-category parents, mark as category-only child
                if (hasCategoryParent && !hasNonCategoryParent) {
                    categoryOnlyChildren.add(String(item.id))
                }
            })

            // Build parent-child relationships using BOTH parent_ids and children_ids
            items.forEach(item => {
                const itemId = String(item.id)
                
                // Skip categories - they won't be shown in the tree
                if (categoryIds.has(itemId)) {
                    processedItems.add(itemId)
                    return
                }
                
                // Skip items that are only children of categories
                // (they will be added to types in those categories below)
                if (categoryOnlyChildren.has(itemId)) {
                    processedItems.add(itemId)
                    return
                }
                
                // Get this item's node
                const itemNode = itemMap.get(item.id)
                
                // Add direct children from children_ids (parent declares children)
                const childrenIds = item.children_ids || []
                childrenIds.forEach(childId => {
                    const childNode = itemMap.get(childId)
                    if (childNode && childId !== item.id && !itemNode.children.some(c => c.id === childId)) {
                        itemNode.children.push(childNode)
                    }
                })
                
                // If item belongs to a category, inherit the category's children
                if (item.category_id) {
                    const categoryIdStr = String(item.category_id)
                    const categoryChildrenList = categoryToChildren.get(categoryIdStr) || []
                    categoryChildrenList.forEach(childId => {
                        const childNode = itemMap.get(childId)
                        // Avoid adding duplicate children and self-references
                        if (childNode && childId !== item.id && !itemNode.children.some(c => c.id === childId)) {
                            itemNode.children.push(childNode)
                        }
                    })
                }
            })
            
            // Add children from parent_ids (child declares parents) - only for non-category parents
            items.forEach(item => {
                const itemId = String(item.id)
                
                // Skip categories
                if (categoryIds.has(itemId)) {
                    return
                }
                
                // Skip category-only children (already handled above)
                if (categoryOnlyChildren.has(itemId)) {
                    return
                }
                
                // Collect all effective parent IDs:
                // 1. Item's own parent_ids (non-category parents)
                // 2. If item belongs to a category, also inherit the category's parent_ids
                const effectiveParentIds = new Set()
                
                // Add item's own non-category parents
                const parentIds = item.parent_ids || []
                parentIds.forEach(parentId => {
                    const parentIdStr = String(parentId)
                    if (!categoryIds.has(parentIdStr)) {
                        effectiveParentIds.add(parentIdStr)
                    }
                })
                
                // If item belongs to a category, inherit the category's parents
                // This makes types in a category become children of the category's parents
                if (item.category_id) {
                    const category = itemMap.get(item.category_id)
                    if (category && category.parent_ids && category.parent_ids.length > 0) {
                        category.parent_ids.forEach(parentId => {
                            const parentIdStr = String(parentId)
                            // Only inherit non-category parents
                            if (!categoryIds.has(parentIdStr)) {
                                effectiveParentIds.add(parentIdStr)
                            }
                        })
                    }
                }
                
                // Add this item as a child to all effective parents
                effectiveParentIds.forEach(parentIdStr => {
                    if (itemMap.has(parentIdStr) && parentIdStr !== itemId) {
                        const parentNode = itemMap.get(parentIdStr)
                        const childNode = itemMap.get(item.id)
                        // Avoid duplicates
                        if (childNode && !parentNode.children.some(c => c.id === item.id)) {
                            parentNode.children.push(childNode)
                        }
                    }
                })
            })
            
            // Determine which items are root items (have no valid parent)
            items.forEach(item => {
                const itemId = String(item.id)
                
                // Skip categories
                if (categoryIds.has(itemId)) {
                    return
                }
                
                // Skip category-only children (they appear under types, not at root)
                if (categoryOnlyChildren.has(itemId)) {
                    return
                }
                
                // Skip already processed
                if (processedItems.has(itemId)) {
                    return
                }
                
                // Check if this item has any non-category parent via parent_ids
                const parentIds = item.parent_ids || []
                let hasParentViaParentIds = parentIds.some(parentId => {
                    const parentIdStr = String(parentId)
                    return itemMap.has(parentIdStr) && !categoryIds.has(parentIdStr)
                })
                
                // Also check if item's category has parents (inherited parent relationship)
                let hasParentViaCategory = false
                if (item.category_id) {
                    const category = itemMap.get(item.category_id)
                    if (category && category.parent_ids && category.parent_ids.length > 0) {
                        hasParentViaCategory = category.parent_ids.some(parentId => {
                            const parentIdStr = String(parentId)
                            return itemMap.has(parentIdStr) && !categoryIds.has(parentIdStr)
                        })
                    }
                }
                
                // Check if this item is a child of any non-category item via their children_ids
                let hasParentViaChildrenIds = false
                items.forEach(potentialParent => {
                    if (!categoryIds.has(String(potentialParent.id)) && 
                        potentialParent.children_ids && 
                        potentialParent.children_ids.includes(item.id)) {
                        hasParentViaChildrenIds = true
                    }
                })
                
                // If no non-category parent found via any method, add to root level
                if (!hasParentViaParentIds && !hasParentViaChildrenIds && !hasParentViaCategory) {
                    rootItems.push(itemMap.get(item.id))
                }
                
                processedItems.add(itemId)
            })

            return rootItems
        } catch (error) {
            console.error('Error building tree:', error)
            return rootItems // Return empty array on error to prevent crash
        }
    }

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 25, 200))
    }

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 25, 50))
    }

    // Ensure assetTypes is always an array
    const safeAssetTypes = Array.isArray(assetTypes) ? assetTypes : []
    
    // Build tree with error handling
    let treeData = []
    try {
        treeData = buildTree(safeAssetTypes)
    } catch (error) {
        console.error('Error building tree structure:', error)
        treeData = [] // Return empty tree on error
    }

    // Flatten tree to get list of items for selection
    const flatItems = useMemo(() => flattenTree(treeData), [treeData])

    // Create ID to index mapping for selection
    const itemIdToIndexMap = useMemo(() => {
        const map = new Map()
        flatItems.forEach((item, index) => {
            map.set(item.id, index)
        })
        return map
    }, [flatItems])

    // Calculate and set line positions for children connections
    // Flexbox with align-items: center handles vertical centering automatically
    useEffect(() => {
        if (!treeContentRef.current) return;

        const updateLinePositions = () => {
            // Find all children containers (children to the right of parent)
            const childrenContainers = treeContentRef.current.querySelectorAll('.children-container');
            
            childrenContainers.forEach(stack => {
                try {
                    const children = Array.from(stack.querySelectorAll(':scope > .type-node'));
                    
                    if (children.length >= 1) {
                        const firstChild = children[0];
                        const lastChild = children[children.length - 1];
                        const stackRect = stack.getBoundingClientRect();
                        
                        // Get the type-content elements to find their actual centers
                        const firstNodeContent = firstChild.querySelector(':scope > .type-row > .type-container > .type-content');
                        const lastNodeContent = lastChild.querySelector(':scope > .type-row > .type-container > .type-content');
                        
                        if (!firstNodeContent || !lastNodeContent) {
                            return;
                        }
                        
                        // Find the parent type to get its center for line positioning
                        const typeRow = stack.closest('.type-row');
                        if (!typeRow) return;
                        
                        const typeContainer = typeRow.querySelector(':scope > .type-container');
                        if (!typeContainer) return;
                        
                        const parentTypeContent = typeContainer.querySelector(':scope > .type-content');
                        if (!parentTypeContent) return;
                        
                        // Get positions (flexbox already centers parent with children)
                        const firstContentRect = firstNodeContent.getBoundingClientRect();
                        const lastContentRect = lastNodeContent.getBoundingClientRect();
                        const parentRect = parentTypeContent.getBoundingClientRect();
                        
                        // Calculate child centers relative to stack
                        const firstCenter = Math.round((firstContentRect.top - stackRect.top) + (firstContentRect.height / 2));
                        const lastCenter = Math.round((lastContentRect.top - stackRect.top) + (lastContentRect.height / 2));
                        
                        // Calculate the vertical line height (distance from first to last child center)
                        const verticalLineHeight = Math.round(lastCenter - firstCenter);
                        
                        // Vertical line starts at first child center
                        const verticalLineTop = firstCenter;
                        
                        // Set vertical line position
                        stack.style.setProperty('--vertical-line-top', `${verticalLineTop}px`);
                        stack.style.setProperty('--vertical-line-height', `${verticalLineHeight}px`);
                        
                        // Set the connection point for each child's horizontal line
                        children.forEach(child => {
                            const typeContent = child.querySelector(':scope > .type-row > .type-container > .type-content');
                            if (typeContent) {
                                const typeContentRect = typeContent.getBoundingClientRect();
                                const childRect = child.getBoundingClientRect();
                                const typeCenter = Math.round((typeContentRect.top - childRect.top) + (typeContentRect.height / 2));
                                child.style.setProperty('--node-center', `${typeCenter}px`);
                            }
                        });
                        
                        // Calculate horizontal line position and width
                        const stackLeft = stackRect.left;
                        const parentRight = parentRect.right;
                        
                        // Distance from parent's right edge to children container's left edge
                        const horizontalLineWidth = Math.round(Math.max(0, stackLeft - parentRight));
                        const horizontalLineLeft = -horizontalLineWidth;
                        
                        stack.style.setProperty('--horizontal-line-left', `${horizontalLineLeft}px`);
                        stack.style.setProperty('--horizontal-line-width', `${horizontalLineWidth}px`);
                        
                        // Horizontal line should be at parent's vertical center (relative to stack)
                        // Since flexbox centers parent with children group, find the center point
                        const parentCenterRelativeToStack = Math.round((parentRect.top - stackRect.top) + (parentRect.height / 2));
                        stack.style.setProperty('--horizontal-line-top', `${parentCenterRelativeToStack}px`);
                    }
                } catch (error) {
                    console.error('Error calculating line positions for container:', error);
                }
            });
        };

        // Flag to prevent recursive updates
        let isUpdating = false;
        
        // Run after render and when tree changes
        updateLinePositions();
        
        // Debounced update function to avoid too many recalculations
        let updateTimeout = null;
        const debouncedUpdate = () => {
            if (isUpdating) return; // Prevent recursive updates
            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        isUpdating = true;
                        updateLinePositions();
                        // Allow updates again after a short delay
                        setTimeout(() => {
                            isUpdating = false;
                        }, 50);
                    });
                });
            }, 10);
        };
        
        // Use MutationObserver to detect DOM changes (like expand/collapse)
        // Only watch for structural changes, not style changes (to avoid loops)
        const mutationObserver = new MutationObserver((mutations) => {
            // Only trigger update if it's not a style attribute change on our elements
            const shouldUpdate = mutations.some(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    // Skip if it's just our CSS variable updates
                    const target = mutation.target;
                    if (target.classList?.contains('children-container')) {
                        return false; // Skip style changes on our containers
                    }
                }
                return true;
            });
            if (shouldUpdate) {
                debouncedUpdate();
            }
        });
        
        mutationObserver.observe(treeContentRef.current, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class'] // Only watch class changes, not style
        });
        
        // Also use ResizeObserver for size changes, but debounce heavily
        let resizeTimeout = null;
        const debouncedResizeUpdate = () => {
            if (isUpdating) return;
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                requestAnimationFrame(() => {
                    isUpdating = true;
                    updateLinePositions();
                    setTimeout(() => {
                        isUpdating = false;
                    }, 50);
                });
            }, 100); // Longer debounce for resize
        };
        
        const resizeObserver = new ResizeObserver(debouncedResizeUpdate);
        
        // Observe the main container, but be careful about watching the stacks themselves
        resizeObserver.observe(treeContentRef.current);
        // Don't observe the stacks themselves as the transform causes resize loops

        return () => {
            if (updateTimeout) clearTimeout(updateTimeout);
            if (resizeTimeout) clearTimeout(resizeTimeout);
            mutationObserver.disconnect();
            resizeObserver.disconnect();
        };
    }, [treeData, zoomLevel, treeKey, isTreeExpanded])

    // Use the reusable hook for context menu and selection
    const {
        selectedItems,
        isItemSelected,
        contextMenu,
        contextMenuRef,
        handleItemClick: handleSelectionClick,
        handleMouseDown,
        handleContextMenu,
        clearSelection
    } = useContextMenuSelection(
        flatItems,
        // Deletion handler
        (itemId) => {
            if (onRemoveAssetType) {
                onRemoveAssetType(itemId)
            }
        },
        {
            getItemId: (item) => item.id,
            getItemName: (item) => item.title || `Item Type ${item.id}`,
            itemType: 'asset type'
        }
    )

    // Helper to check if a node is selected
    const checkNodeSelected = (node) => {
        return isItemSelected(node.id)
    }

    // Helper to get index for a node
    const getNodeIndex = (node) => {
        return itemIdToIndexMap.get(node.id)
    }

    // Handle click on tree container to deselect
    const handleTreeContainerClick = (e) => {
        // Only deselect if clicking on empty space (not on type-content or interactive elements)
        const clickedElement = e.target;
        const isTypeContent = clickedElement.closest('.type-content');
        const isButton = clickedElement.tagName === 'BUTTON' || clickedElement.closest('button');
        const isExpandButton = clickedElement.closest('.expand-button');
        
        // Deselect if clicking on empty space (not on type-content or buttons)
        // This includes clicking on type-row empty space, tree-content, or tree-scroll-wrapper
        if (!isTypeContent && !isButton && !isExpandButton) {
            clearSelection()
            if (onAssetClick) {
                onAssetClick(null);
            }
        }
    };

    return (
        <div className="asset-type-tree">
            <div className="tree-controls">
                <div className="zoom-controls">
                    <button 
                        className="zoom-button"
                        onClick={handleZoomOut}
                        title="Zoom Out"
                        disabled={zoomLevel <= 50}
                    >
                        −
                    </button>
                    <span className="zoom-level">{zoomLevel}%</span>
                    <button 
                        className="zoom-button"
                        onClick={handleZoomIn}
                        title="Zoom In"
                        disabled={zoomLevel >= 200}
                    >
                        +
                    </button>
                </div>
                <button 
                    className="tree-toggle-button"
                    onClick={() => setIsTreeExpanded(!isTreeExpanded)}
                    title={isTreeExpanded ? 'Collapse Tree' : 'Expand Tree'}
                >
                    {isTreeExpanded ? '−' : '+'}
                </button>
            </div>
            {isTreeExpanded && (
                <div className="tree-scroll-wrapper" onClick={handleTreeContainerClick}>
                    <div 
                        key={treeKey}
                        ref={treeContentRef}
                        className="tree-content"
                        onClick={handleTreeContainerClick}
                        style={{ 
                            '--node-min-width': `${dynamicStyles.nodeMinWidth}px`,
                            '--node-gap': `${dynamicStyles.nodeGap}px`,
                            '--node-padding': `${dynamicStyles.nodePadding}px`,
                            '--node-font-size': `${dynamicStyles.fontSize}px`,
                            '--vertical-gap': `${dynamicStyles.verticalGap}px`,
                            transform: `scale(${zoomLevel / 100})`,
                            width: `${100 / (zoomLevel / 100)}%`,
                            height: `${100 / (zoomLevel / 100)}%`,
                            minHeight: '100%',
                            cursor: 'default'
                        }}
                    >
                        {treeData.map(rootNode => {
                            const rootIsSelected = checkNodeSelected(rootNode)
                            const rootIndex = getNodeIndex(rootNode)
                            return (
                                <TreeNode 
                                    key={rootNode.id} 
                                    node={rootNode} 
                                    level={0}
                                    onAssetClick={onAssetClick}
                                    isTopLevel={true}
                                    assetTypes={safeAssetTypes}
                                    treeData={treeData}
                                    isSelected={rootIsSelected}
                                    onItemSelect={handleSelectionClick}
                                    onContextMenu={handleContextMenu}
                                    onMouseDown={handleMouseDown}
                                    itemIndex={rootIndex}
                                    checkNodeSelected={checkNodeSelected}
                                    getNodeIndex={getNodeIndex}
                                />
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Context Menu */}
            <ContextMenu
                contextMenu={contextMenu}
                contextMenuRef={contextMenuRef}
                onDeleteClick={() => {
                    const { itemsToDelete } = contextMenu;
                    if (itemsToDelete && itemsToDelete.size > 0) {
                        itemsToDelete.forEach(itemId => {
                            if (onRemoveAssetType) {
                                onRemoveAssetType(itemId);
                            }
                        });
                    }
                    // Clear selection and close menu
                    clearSelection();
                }}
                itemType="asset type"
            />
        </div>
    )
}

export default AssetTypeTree
