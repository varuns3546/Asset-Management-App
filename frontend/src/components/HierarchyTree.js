import React, { useState, useEffect, useRef } from 'react'
import '../styles/hierarchyTree.css'

const TreeNode = ({ node, level = 0 }) => {
    const hasChildren = node.children && node.children.length > 0

    return (
        <div className="tree-node horizontal-node">
            <div className="node-content">
                <span className="node-title">{node.title}</span>
                {hasChildren && <span className="has-children-indicator">▼</span>}
            </div>
            
            {hasChildren && (
                <div className="children horizontal-children">
                    {node.children.map(child => (
                        <TreeNode key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    )
}

const HierarchyTree = ({ hierarchy }) => {
    const [isTreeExpanded, setIsTreeExpanded] = useState(true)
    const [zoomLevel, setZoomLevel] = useState(100)
    const treeContentRef = useRef(null)

    
    if (!hierarchy || !hierarchy.hierarchy_item_types || hierarchy.hierarchy_item_types.length === 0) {
        return <div className="no-hierarchy">No items in this hierarchy</div>
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
            if (item.parent_item_id && itemMap.has(item.parent_item_id)) {
                itemMap.get(item.parent_item_id).children.push(itemMap.get(item.id))
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

    const handleResetZoom = () => {
        setZoomLevel(100)
    }

    const treeData = buildTree(hierarchy.hierarchy_item_types)

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
                    <button 
                        className="reset-zoom-button"
                        onClick={handleResetZoom}
                        title="Reset Zoom"
                    >
                        Reset
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
                <div 
                    ref={treeContentRef}
                    className="tree-content"
                    style={{ 
                        transform: `scale(${zoomLevel / 100})`,
                        transformOrigin: 'top left'
                    }}
                >
                    {treeData.map(rootNode => (
                        <TreeNode key={rootNode.id} node={rootNode} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default HierarchyTree
