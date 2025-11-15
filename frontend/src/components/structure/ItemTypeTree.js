import React, { useState, useEffect, useRef } from 'react'
import '../../styles/structureTree.css'
const TreeNode = ({ node, level = 0, parentCount = 0, onRemove, onItemClick }) => {
    const hasChildren = node.children && node.children.length > 0
    const hasMultipleParents = node.parent_ids && node.parent_ids.length > 1

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
                title="Click to edit this item type"
            >
                <span className="node-title">{node.title}</span>
                <div className="node-indicators">
                    {hasMultipleParents && <span className="multiple-parents-indicator" title="Has multiple parents">🔗</span>}
                    <button 
                        className="node-remove-button"
                        onClick={handleRemove}
                        title="Remove this item type"
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
                            parentCount={parentCount + 1}
                            onRemove={onRemove}
                            onItemClick={onItemClick}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

const ItemTypeTree = ({ itemTypes, onRemoveItemType, onItemClick }) => {
    const [isTreeExpanded, setIsTreeExpanded] = useState(true)
    const [zoomLevel, setZoomLevel] = useState(100)
    const treeContentRef = useRef(null)

    // Force re-render when itemTypes change by updating a state
    const [treeKey, setTreeKey] = useState(0);
    
    useEffect(() => {
        setTreeKey(prev => prev + 1);
    }, [itemTypes]);


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
    
    // Build tree structure from flat items array with support for multiple parents
    const buildTree = (items) => {
        const itemMap = new Map()
        const rootItems = []

        // Create a map of all items
        items.forEach(item => {
            itemMap.set(item.id, { ...item, children: [] })
        })

        // Build parent-child relationships for multiple parents
        items.forEach(item => {
            const parentIds = item.parent_ids || []
            
            if (parentIds.length > 0) {
                let hasValidParent = false
                // Add this item as a child to all its parents
                parentIds.forEach(parentId => {
                    if (itemMap.has(parentId)) {
                        itemMap.get(parentId).children.push(itemMap.get(item.id))
                        hasValidParent = true
                    }
                })
                
                // If no valid parent exists (parent was deleted), promote to root level
                if (!hasValidParent) {
                    rootItems.push(itemMap.get(item.id))
                }
            } else {
                // No parents - this is a root item
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

    const treeData = buildTree(itemTypes)

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
            {isTreeExpanded && (
                <div className="tree-scroll-wrapper">
                    <div 
                        key={treeKey}
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
                                onRemove={onRemoveItemType}
                                onItemClick={onItemClick}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ItemTypeTree
