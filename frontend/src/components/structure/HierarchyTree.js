import React, { useState, useEffect, useRef } from 'react'
import '../../styles/structreTree.css'
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

const HierarchyTree = ({ hierarchyItems }) => {
    const [isTreeExpanded, setIsTreeExpanded] = useState(true)
    const [zoomLevel, setZoomLevel] = useState(100)
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
    
    if (!hierarchyItems || hierarchyItems.length === 0) {
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

    const handleResetZoom = () => {
        setZoomLevel(100)
    }

    const treeData = buildTree(hierarchyItems)

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
                            <TreeNode key={rootNode.id} node={rootNode} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default HierarchyTree
