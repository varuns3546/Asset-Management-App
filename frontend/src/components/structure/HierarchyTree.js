import React, { useState, useRef, useEffect, useMemo } from 'react'
import '../../styles/structureTree.css'
import { useContextMenuSelection } from '../../hooks/useContextMenuSelection'
import ContextMenu from '../common/ContextMenu'
import DeleteConfirmDialog from '../common/DeleteConfirmDialog'
import { useDispatch } from 'react-redux'
import { setSelectedAssetIds } from '../../features/projects/projectSlice'

const TreeNode = ({ 
    node, 
    level = 0, 
    onItemClick, 
    isItemType = false, 
    isTopLevelItemType = false,
    isSelected = false,
    onItemSelect,
    onContextMenu,
    onMouseDown,
    itemIndex,
    checkNodeSelected,
    getNodeIndex
}) => {
    // Start expanded for top-level item types, collapsed for hierarchy items with children
    const [isExpanded, setIsExpanded] = React.useState(isTopLevelItemType)
    const hasChildren = node.children && node.children.length > 0
    
    // Show expand button for any node with children
    const showExpandButton = hasChildren

    const handleItemClick = (e) => {
        e.stopPropagation()
        e.preventDefault()
        if (onItemClick && !isItemType && itemIndex !== undefined) {
            onItemSelect(e, node, itemIndex)
        } else if (onItemClick && !isItemType) {
            onItemClick(node)
        }
    }

    const handleContextMenuClick = (e) => {
        e.stopPropagation()
        e.preventDefault()
        if (onContextMenu && !isItemType) {
            onContextMenu(e, node)
        }
    }

    const handleToggle = (e) => {
        e.stopPropagation()
        setIsExpanded(!isExpanded)
    }

    return (
        <div className={`tree-node vertical-node ${isItemType ? 'item-type-node' : ''}`}>
            <div className="node-row">
                <div 
                    className={`node-content ${isSelected && !isItemType ? 'selected' : ''}`}
                    data-is-item-type={isItemType ? 'true' : 'false'}
                    onClick={isItemType ? undefined : handleItemClick}
                    onMouseDown={onMouseDown}
                    onContextMenu={handleContextMenuClick}
                    style={{ 
                        userSelect: 'none',
                        cursor: isItemType ? 'default' : 'pointer',
                        pointerEvents: 'auto',
                        backgroundColor: isSelected && !isItemType ? '#e7f1ff' : (isItemType ? '#e7f3ff' : undefined),
                        borderColor: (isSelected && !isItemType) ? '#007bff' : (isItemType ? '#007bff' : undefined),
                        fontWeight: isItemType ? '600' : undefined
                    }}
                    title={isItemType ? `Item Type: ${node.title}` : "Click to edit, right-click for menu"}
                >
                    {showExpandButton && (
                        <button 
                            className="expand-button"
                            onClick={handleToggle}
                            title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                            {isExpanded ? '−' : '+'}
                        </button>
                    )}
                    <span className="node-title">{node.title}</span>
                </div>
                
                {hasChildren && isExpanded && (
                    <div className="children vertical-children">
                        {node.children.map((child) => {
                            const childIsSelected = checkNodeSelected ? checkNodeSelected(child) : false
                            const childIndex = getNodeIndex ? getNodeIndex(child) : undefined
                            return (
                                <TreeNode 
                                    key={child.id} 
                                    node={child} 
                                    level={level + 1}
                                    onItemClick={onItemClick}
                                    isItemType={child.isItemType}
                                    isTopLevelItemType={false}
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

const HierarchyTree = ({ hierarchyItems, onRemoveItem, onItemClick, itemTypes = [] }) => {
    const dispatch = useDispatch()
    const [isTreeExpanded, setIsTreeExpanded] = useState(true)
    const [zoomLevel, setZoomLevel] = useState(100)
    const [selectedTypeFilter, setSelectedTypeFilter] = useState(null)
    const treeContentRef = useRef(null)
    const scrollWrapperRef = useRef(null)
    const filteredContainerRef = useRef(null)

    // Flatten tree structure to get a flat list of non-itemType nodes for selection
    const flattenTree = (nodes, result = []) => {
        nodes.forEach(node => {
            if (!node.isItemType) {
                result.push(node)
            }
            if (node.children && node.children.length > 0) {
                flattenTree(node.children, result)
            }
        })
        return result
    }

    // Prevent scroll from propagating to parent
    const handleScroll = (e) => {
        e.stopPropagation()
    }


    // Calculate dynamic spacing and sizing based on zoom level (memoized)
    const dynamicStyles = useMemo(() => {
        const scale = zoomLevel / 100
        return {
            nodeMinWidth: Math.max(80, 120 * scale),
            nodeGap: Math.max(10, 18 * scale), // Increased from 15 to 18 for more spacing
            nodePadding: Math.max(4, 8 * scale),
            fontSize: Math.max(10, 14 * scale),
            verticalGap: 0, // No vertical spacing between assets
        }
    }, [zoomLevel])

    // Filter items by selected type
    const getFilteredItems = (items) => {
        if (!selectedTypeFilter) {
            return items
        }
        // Handle uncategorized filter
        if (selectedTypeFilter === 'uncategorized') {
            return items.filter(item => !item.item_type_id)
        }
        return items.filter(item => item.item_type_id === selectedTypeFilter)
    }

    // Get unique item types from hierarchy items
    const getItemTypesFromHierarchy = () => {
        const typeMap = new Map()
        let uncategorizedCount = 0
        
        hierarchyItems.forEach(item => {
            if (item.item_type_id) {
                const itemType = itemTypes.find(type => type.id === item.item_type_id)
                if (itemType) {
                    if (!typeMap.has(item.item_type_id)) {
                        typeMap.set(item.item_type_id, {
                            id: itemType.id,
                            title: itemType.title,
                            count: 0
                        })
                    }
                    typeMap.get(item.item_type_id).count++
                }
            } else {
                // Count items without types
                uncategorizedCount++
            }
        })
        
        const types = Array.from(typeMap.values())
        
        // Add uncategorized option if there are items without types
        if (uncategorizedCount > 0) {
            types.push({
                id: 'uncategorized',
                title: 'Uncategorized (No Type)',
                count: uncategorizedCount
            })
        }
        
        return types
    }

    // Build tree structure from flat items array
    const buildTree = (items) => {
        const itemMap = new Map()
        const rootItems = []

        // Create a map of all items
        items.forEach(item => {
            itemMap.set(item.id, { ...item, children: [], isItemType: false })
        })

        // Build parent-child relationships
        items.forEach(item => {
            if (item.parent_id && itemMap.has(item.parent_id)) {
                itemMap.get(item.parent_id).children.push(itemMap.get(item.id))
            } else {
                rootItems.push(itemMap.get(item.id))
            }
        })

        return rootItems
    }

    // Build tree with item types as parent nodes
    const buildTreeWithItemTypes = (items) => {
        // Create item type hierarchy
        const itemTypeMap = new Map()
        const itemTypeRoots = []
        
        // Initialize item type nodes
        itemTypes.forEach(type => {
            itemTypeMap.set(type.id, {
                id: `type_${type.id}`,
                title: type.title,
                item_type_id: type.id,
                children: [],
                isItemType: true,
                originalType: type
            })
        })
        
        // Create a special "Uncategorized" node for items without types
        const uncategorizedNodeId = 'uncategorized'
        const uncategorizedNode = {
            id: uncategorizedNodeId,
            title: 'Uncategorized (No Type)',
            item_type_id: null,
            children: [],
            isItemType: true,
            originalType: null
        }
        itemTypeMap.set(uncategorizedNodeId, uncategorizedNode)
        
        // Build item type parent-child relationships
        itemTypes.forEach(type => {
            const typeNode = itemTypeMap.get(type.id)
            const parentIds = type.parent_ids || []
            
            if (parentIds.length > 0) {
                let hasValidParent = false
                parentIds.forEach(parentId => {
                    if (itemTypeMap.has(parentId)) {
                        itemTypeMap.get(parentId).children.push(typeNode)
                        hasValidParent = true
                    }
                })
                if (!hasValidParent) {
                    itemTypeRoots.push(typeNode)
                }
            } else {
                itemTypeRoots.push(typeNode)
            }
        })
        
        // Build complete hierarchy for ALL items (across all types)
        const itemMap = new Map()
        
        // Create map of all hierarchy items
        items.forEach(item => {
            itemMap.set(item.id, { ...item, children: [], isItemType: false })
        })
        
        // Build parent-child relationships for ALL hierarchy items
        items.forEach(item => {
            const itemNode = itemMap.get(item.id)
            if (item.parent_id && itemMap.has(item.parent_id)) {
                // This item has a parent - add it as a child of the parent
                itemMap.get(item.parent_id).children.push(itemNode)
            } else {
                // This is a root item - attach to its item type node
                if (item.item_type_id && itemTypeMap.has(item.item_type_id)) {
                    itemTypeMap.get(item.item_type_id).children.push(itemNode)
                } else if (!item.item_type_id) {
                    // Item has no type - attach to uncategorized node
                    uncategorizedNode.children.push(itemNode)
                }
            }
        })
        
        // Add uncategorized node to roots if it has children
        if (uncategorizedNode.children.length > 0) {
            itemTypeRoots.push(uncategorizedNode)
        }
        
        // Remove item type nodes that have no children (except uncategorized)
        const pruneEmptyTypes = (nodes) => {
            return nodes.filter(node => {
                if (node.isItemType) {
                    node.children = pruneEmptyTypes(node.children)
                    // Keep uncategorized node even if empty, or keep if it has children
                    return node.id === uncategorizedNodeId || node.children.length > 0
                }
                return true
            })
        }
        
        return pruneEmptyTypes(itemTypeRoots)
    }

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 25, 200))
    }

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 25, 50))
    }

    const handleTypeFilter = (typeId) => {
        setSelectedTypeFilter(typeId === selectedTypeFilter ? null : typeId)
    }

    const clearFilter = () => {
        setSelectedTypeFilter(null)
    }

    // Memoize filtered items to avoid re-filtering on every render
    const filteredItems = useMemo(() => getFilteredItems(hierarchyItems), [hierarchyItems, selectedTypeFilter])
    
    // Memoize tree building - expensive operation
    const treeData = useMemo(() => buildTree(filteredItems), [filteredItems])
    
    // Build tree with item types for display
    const treeDataWithTypes = useMemo(() => buildTreeWithItemTypes(filteredItems), [filteredItems, itemTypes])
    
    // Flatten tree to get list of items (excluding item types) for selection
    const flatItems = useMemo(() => flattenTree(treeDataWithTypes), [treeDataWithTypes])
    
    // Create ID to index mapping for selection
    const itemIdToIndexMap = useMemo(() => {
        const map = new Map()
        flatItems.forEach((item, index) => {
            map.set(item.id, index)
        })
        return map
    }, [flatItems])

    // Use the reusable hook for context menu and selection
    const {
        selectedItems,
        isItemSelected,
        contextMenu,
        deleteConfirm,
        contextMenuRef,
        handleItemClick: handleSelectionClick,
        handleMouseDown,
        handleContextMenu,
        handleDeleteClick,
        confirmDelete,
        clearSelection,
        setDeleteConfirm
    } = useContextMenuSelection(
        flatItems,
        onRemoveItem,
        {
            getItemId: (item) => item.id,
            getItemName: (item) => item.title || `Item ${item.id}`,
            itemType: 'hierarchy item'
        }
    )

    // Update Redux with selected asset IDs whenever selection changes
    useEffect(() => {
        const selectedIds = Array.from(selectedItems)
        dispatch(setSelectedAssetIds(selectedIds))
    }, [selectedItems, dispatch])

    // Helper to check if a node is selected
    const checkNodeSelected = (node) => {
        if (node.isItemType) return false
        return isItemSelected(node.id)
    }

    // Helper to get index for a node
    const getNodeIndex = (node) => {
        if (node.isItemType) return undefined
        return itemIdToIndexMap.get(node.id)
    }

    // Render tree node recursively with selection support
    const renderTreeNode = (node, level = 0) => {
        const isSelected = checkNodeSelected(node)
        const nodeIndex = getNodeIndex(node)
        
        return (
            <TreeNode
                key={node.id}
                node={node}
                level={level}
                onItemClick={onItemClick}
                isItemType={node.isItemType}
                isTopLevelItemType={node.isItemType && level === 0}
                isSelected={isSelected}
                onItemSelect={handleSelectionClick}
                onContextMenu={handleContextMenu}
                onMouseDown={handleMouseDown}
                itemIndex={nodeIndex}
                checkNodeSelected={checkNodeSelected}
                getNodeIndex={getNodeIndex}
            />
        )
    }
    
    // Memoize available types calculation
    const availableTypes = useMemo(() => getItemTypesFromHierarchy(), [hierarchyItems, itemTypes])
    
    // Calculate and apply uniform width to all nodes (optimized with requestAnimationFrame)
    // Assets and types will have the same width, based on the maximum asset width
    useEffect(() => {
        if (!isTreeExpanded) return; // Skip if tree is collapsed
        
        let rafId = null;
        const timeoutId = setTimeout(() => {
            rafId = requestAnimationFrame(() => {
                const nodeContents = document.querySelectorAll('.node-content')
                if (nodeContents.length === 0) return
                
                let maxAssetWidth = 0
                let maxTypeWidth = 0
                
                // Batch DOM reads first (measure phase)
                const measurements = Array.from(nodeContents).map(node => {
                    // Check if this is an item type node using data attribute
                    const isItemTypeNode = node.getAttribute('data-is-item-type') === 'true'
                    
                    const originalWidth = node.style.width
                    const originalMinWidth = node.style.minWidth
                    const originalMaxWidth = node.style.maxWidth
                    
                    // Remove constraints to measure natural width
                    node.style.width = 'auto'
                    node.style.minWidth = '0'
                    node.style.maxWidth = 'none'
                    
                    // Measure the scroll width (includes all content)
                    const width = node.scrollWidth
                    
                    // Restore original styles immediately
                    node.style.width = originalWidth
                    node.style.minWidth = originalMinWidth
                    node.style.maxWidth = originalMaxWidth
                    
                    return { node, width, isItemTypeNode, originalWidth, originalMinWidth, originalMaxWidth };
                });
                
                // Find max width for assets and types separately
                measurements.forEach(({ width, isItemTypeNode }) => {
                    if (isItemTypeNode) {
                        if (width > maxTypeWidth) {
                            maxTypeWidth = width;
                        }
                    } else {
                        if (width > maxAssetWidth) {
                            maxAssetWidth = width;
                        }
                    }
                });
                
                // Use the maximum asset width for both assets and types
                // This increases asset width and decreases type width to match
                // Increase width by 40% (multiply by 1.4)
                const baseWidth = Math.max(maxAssetWidth + 4, dynamicStyles.nodeMinWidth) // Add 4px padding, but respect min width
                const uniformWidth = baseWidth * 1.4 // Increase by 40%
                
                // Batch DOM writes (apply phase) - apply same width to all nodes
                measurements.forEach(({ node }) => {
                    // Temporarily disable transitions when setting width to prevent animation
                    const transition = node.style.transition
                    node.style.transition = 'none'
                    node.style.width = `${uniformWidth}px`
                    node.style.minWidth = `${uniformWidth}px`
                    node.style.maxWidth = `${uniformWidth}px`
                    // Force a reflow to apply the width immediately
                    void node.offsetWidth
                    // Re-enable transitions after width is set
                    node.style.transition = transition || ''
                })
            });
        }, 50); // Reduced delay from 100ms to 50ms
        
        return () => {
            clearTimeout(timeoutId);
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
        };
    }, [treeDataWithTypes, zoomLevel, selectedTypeFilter, isTreeExpanded, dynamicStyles.nodeMinWidth])
    
    // If no item types are loaded, show a message about creating them
    if (itemTypes?.length === 0) {
        console.warn('No item types found. Make sure to create item types in the Item Type screen first.')
    }

    return (
        <div className="hierarchy-tree">
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
            
            {/* Type Filter Buttons - Always show for debugging */}
            <div className="type-filter-section">
                <div className="type-filter-header">
                    <span className="filter-label">Filter by Type:</span>
                    {selectedTypeFilter && (
                        <button 
                            className="clear-filter-button"
                            onClick={clearFilter}
                            title="Clear filter"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>
                <div className="type-filter-buttons">
                    {availableTypes.length > 0 ? (
                        availableTypes.map(type => (
                            <button
                                key={type.id}
                                className={`type-filter-button ${selectedTypeFilter === type.id ? 'active' : ''}`}
                                onClick={() => handleTypeFilter(type.id)}
                                title={`Show only ${type.title} items (${type.count} items)`}
                            >
                                {type.title} ({type.count})
                            </button>
                        ))
                    ) : (
                        <div className="no-types-message">
                            No item types found. Create item types first to use filtering.
                            <br />
                            <small>Debug: {hierarchyItems?.length || 0} hierarchy items, {itemTypes?.length || 0} item types, {hierarchyItems?.filter(item => item.item_type_id)?.length || 0} items with types</small>
                            <br />
                            <small>To fix: Go to the Item Type screen and create some item types, then assign them to your hierarchy items.</small>
                        </div>
                    )}
                </div>
                {/* Show filtered items in the gray section when filter is active */}
                {selectedTypeFilter && isTreeExpanded && (
                    <div 
                        className="filtered-items-container"
                        ref={filteredContainerRef}
                        onWheel={handleScroll}
                        onScroll={handleScroll}
                    >
                        <div 
                            ref={treeContentRef}
                            className="filtered-tree-content"
                            style={{ 
                                '--node-min-width': `${dynamicStyles.nodeMinWidth}px`,
                                '--node-gap': `${dynamicStyles.nodeGap}px`,
                                '--node-padding': `${dynamicStyles.nodePadding}px`,
                                '--node-font-size': `${dynamicStyles.fontSize}px`,
                                '--vertical-gap': `${dynamicStyles.verticalGap}px`,
                            }}
                        >
                            {treeDataWithTypes.map(rootNode => renderTreeNode(rootNode, 0))}
                        </div>
                    </div>
                )}
            </div>
            {/* Show full tree only when no filter is active */}
            {!selectedTypeFilter && isTreeExpanded && (
                <div 
                    className="tree-scroll-wrapper"
                    ref={scrollWrapperRef}
                    onWheel={handleScroll}
                    onScroll={handleScroll}
                    onClick={clearSelection}
                >
                    <div 
                        ref={treeContentRef}
                        className="tree-content"
                        style={{ 
                            '--node-min-width': `${dynamicStyles.nodeMinWidth}px`,
                            '--node-gap': `${dynamicStyles.nodeGap}px`,
                            '--node-padding': `${dynamicStyles.nodePadding}px`,
                            '--node-font-size': `${dynamicStyles.fontSize}px`,
                            '--vertical-gap': `${dynamicStyles.verticalGap}px`,
                            transform: `scale(${zoomLevel / 100})`,
                            width: `${100 / (zoomLevel / 100)}%`,
                            height: `${100 / (zoomLevel / 100)}%`,
                        }}
                    >
                        {treeDataWithTypes.map(rootNode => renderTreeNode(rootNode, 0))}
                    </div>
                </div>
            )}

            {/* Context Menu */}
            <ContextMenu
                contextMenu={contextMenu}
                contextMenuRef={contextMenuRef}
                onDeleteClick={handleDeleteClick}
                itemType="hierarchy item"
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                deleteConfirm={deleteConfirm}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm(null)}
                getItemName={(item) => item.title || `Item ${item.id}`}
                itemType="hierarchy item"
            />
        </div>
    )
}

export default HierarchyTree
