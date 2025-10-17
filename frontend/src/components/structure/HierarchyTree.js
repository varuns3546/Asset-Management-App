import React, { useState, useRef } from 'react'
import '../../styles/structureTree.css'
const TreeNode = ({ node, level = 0, onRemove, onItemClick }) => {
    const hasChildren = node.children && node.children.length > 0

    const handleRemove = (e) => {
        e.stopPropagation()
        if (onRemove) {
            onRemove(node.id)
        }
    }

    const handleItemClick = (e) => {
        e.stopPropagation()
        e.preventDefault()
        if (onItemClick) {
            onItemClick(node)
        }
    }

    return (
        <div className="tree-node horizontal-node">
            <div 
                className="node-content" 
                onClick={handleItemClick}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                style={{ 
                    userSelect: 'none',
                    cursor: 'pointer',
                    pointerEvents: 'auto'
                }}
                title="Click to edit this item"
            >
                <span className="node-title">{node.title}</span>
                <div className="node-indicators">
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
                </div>
            </div>
            
            {hasChildren && (
                <div className="children horizontal-children">
                    {node.children.map(child => (
                        <TreeNode 
                            key={child.id} 
                            node={child} 
                            level={level + 1}
                            onRemove={onRemove}
                            onItemClick={onItemClick}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

const HierarchyTree = ({ hierarchyItems, onRemoveItem, onItemClick, itemTypes = [] }) => {
    const [isTreeExpanded, setIsTreeExpanded] = useState(true)
    const [zoomLevel, setZoomLevel] = useState(100)
    const [selectedTypeFilter, setSelectedTypeFilter] = useState(null)
    const treeContentRef = useRef(null)


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
        return items.filter(item => item.item_type_id === selectedTypeFilter)
    }

    // Get unique item types from hierarchy items
    const getItemTypesFromHierarchy = () => {
        const typeMap = new Map()
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
            }
        })
        return Array.from(typeMap.values())
    }

    // Build tree structure from flat items array
    const buildTree = (items) => {
        const itemMap = new Map()
        const rootItems = []

        // Create a map of all items
        items.forEach(item => {
            itemMap.set(item.id, { ...item, children: [] })
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
    const treeData = buildTree(filteredItems)
    const availableTypes = getItemTypesFromHierarchy()
    
    // Debug logging

    
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
            </div>
            {isTreeExpanded && (
                <div className="tree-scroll-wrapper">
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
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default HierarchyTree
