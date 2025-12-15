import React, { useState, useRef, useEffect } from 'react'
import '../../styles/structureTree.css'
const TreeNode = ({ node, level = 0, onRemove, onItemClick, isItemType = false, isTopLevelItemType = false }) => {
    // Start expanded for top-level item types, collapsed for hierarchy items with children
    const [isExpanded, setIsExpanded] = React.useState(isTopLevelItemType)
    const hasChildren = node.children && node.children.length > 0
    
    // Show expand button for any node with children
    const showExpandButton = hasChildren

    const handleRemove = (e) => {
        e.stopPropagation()
        if (onRemove && !isItemType) {
            onRemove(node.id)
        }
    }

    const handleItemClick = (e) => {
        e.stopPropagation()
        e.preventDefault()
        if (onItemClick && !isItemType) {
            onItemClick(node)
        }
    }

    const handleToggle = (e) => {
        e.stopPropagation()
        setIsExpanded(!isExpanded)
    }

    return (
        <div className="tree-node vertical-node">
            <div className="node-row">
                <div 
                    className="node-content" 
                    onClick={isItemType ? undefined : handleItemClick}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    style={{ 
                        userSelect: 'none',
                        cursor: isItemType ? 'default' : 'pointer',
                        pointerEvents: 'auto',
                        backgroundColor: isItemType ? '#e7f3ff' : undefined,
                        borderColor: isItemType ? '#007bff' : undefined,
                        fontWeight: isItemType ? '600' : undefined
                    }}
                    title={isItemType ? `Item Type: ${node.title}` : "Click to edit this item"}
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
                    <div className="node-indicators">
                        {!isItemType && (
                            <button 
                                className="node-remove-button"
                                onClick={handleRemove}
                                title="Remove this hierarchy item"
                                style={{ 
                                    display: 'flex',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '4px'
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
                
                {hasChildren && isExpanded && (
                    <div className="children vertical-children">
                        {node.children.map(child => (
                            <TreeNode 
                                key={child.id} 
                                node={child} 
                                level={level + 1}
                                onRemove={onRemove}
                                onItemClick={onItemClick}
                                isItemType={child.isItemType}
                                isTopLevelItemType={false}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

const HierarchyTree = ({ hierarchyItems, onRemoveItem, onItemClick, itemTypes = [] }) => {
    const [isTreeExpanded, setIsTreeExpanded] = useState(true)
    const [zoomLevel, setZoomLevel] = useState(100)
    const [selectedTypeFilter, setSelectedTypeFilter] = useState(null)
    const treeContentRef = useRef(null)
    const scrollWrapperRef = useRef(null)
    const filteredContainerRef = useRef(null)

    // Prevent scroll from propagating to parent
    const handleScroll = (e) => {
        e.stopPropagation()
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

    const filteredItems = getFilteredItems(hierarchyItems)
    // Use buildTree to show regular hierarchy (not grouped by item types)
    const treeData = buildTree(filteredItems)
    const availableTypes = getItemTypesFromHierarchy()
    
    // Calculate and apply uniform width to all nodes
    useEffect(() => {
        // Wait for DOM to update
        const timeoutId = setTimeout(() => {
            const nodeContents = document.querySelectorAll('.node-content')
            if (nodeContents.length === 0) return
            
            let maxWidth = 0
            
            // First, temporarily remove width constraints to measure natural width
            nodeContents.forEach(node => {
                const originalWidth = node.style.width
                const originalMinWidth = node.style.minWidth
                const originalMaxWidth = node.style.maxWidth
                
                // Remove constraints to measure natural width
                node.style.width = 'auto'
                node.style.minWidth = '0'
                node.style.maxWidth = 'none'
                
                // Measure the scroll width (includes all content)
                const width = node.scrollWidth
                if (width > maxWidth) {
                    maxWidth = width
                }
                
                // Restore original styles
                node.style.width = originalWidth
                node.style.minWidth = originalMinWidth
                node.style.maxWidth = originalMaxWidth
            })
            
            // Apply the maximum width to all nodes (with some padding for safety)
            if (maxWidth > 0) {
                const uniformWidth = Math.max(maxWidth + 4, dynamicStyles.nodeMinWidth) // Add 4px padding, but respect min width
                nodeContents.forEach(node => {
                    node.style.width = `${uniformWidth}px`
                    node.style.minWidth = `${uniformWidth}px`
                    node.style.maxWidth = `${uniformWidth}px`
                })
            }
        }, 100) // Small delay to ensure DOM is updated
        
        return () => clearTimeout(timeoutId)
    }, [treeData, zoomLevel, selectedTypeFilter, isTreeExpanded, dynamicStyles.nodeMinWidth])
    
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
                            {treeData.map(rootNode => (
                                <TreeNode 
                                    key={rootNode.id} 
                                    node={rootNode}
                                    onRemove={onRemoveItem}
                                    onItemClick={onItemClick}
                                    isItemType={rootNode.isItemType}
                                    isTopLevelItemType={rootNode.isItemType}
                                />
                            ))}
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
                        {treeData.map(rootNode => (
                            <TreeNode 
                                key={rootNode.id} 
                                node={rootNode}
                                onRemove={onRemoveItem}
                                onItemClick={onItemClick}
                                isItemType={rootNode.isItemType}
                                isTopLevelItemType={rootNode.isItemType}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default HierarchyTree
