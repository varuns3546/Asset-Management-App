import React, { useState, useEffect, useRef } from 'react'
import '../../styles/structureTree.css'
const TreeNode = ({ node, level = 0, parentCount = 0, onRemove, onAssetClick, isTopLevel = false, assetTypes = [] }) => {
    // Start expanded by default for all nodes
    const [isExpanded, setIsExpanded] = React.useState(true)
    const hasSubTypes = node.subTypes && node.subTypes.length > 0
    const hasChildren = node.children && node.children.length > 0
    const hasMultipleParents = node.parent_ids && node.parent_ids.length > 1

    const handleRemove = (e) => {
        e.stopPropagation()
        if (onRemove) {
            onRemove(node.id)
        }
    }

    const handleAssetClick = (e) => {
        e.stopPropagation()
        e.preventDefault()
        if (onAssetClick) {
            onAssetClick(node)
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
                    onClick={handleAssetClick}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    style={{ 
                        userSelect: 'none',
                        cursor: 'pointer',
                        pointerEvents: 'auto'
                    }}
                    title="Click to edit this item type"
                >
                    {(hasSubTypes || hasChildren) && (
                        <button 
                            className="expand-button"
                            onClick={handleToggle}
                            title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                            {isExpanded ? '−' : '+'}
                        </button>
                    )}
                    <span className="node-title">
                        {node.title}
                        {node.subtype_of_id && assetTypes && (() => {
                            const parentType = assetTypes.find(at => at.id === node.subtype_of_id);
                            // Only show parent name if parent exists in the list
                            return parentType ? (
                                <span style={{ color: '#6c757d', fontSize: '0.9em', fontWeight: 'normal' }}>
                                    {' '}({parentType.title})
                                </span>
                            ) : null;
                        })()}
                    </span>
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
                
                {/* Children types appear horizontally to the right of the node content */}
                {hasChildren && isExpanded && (
                    <div 
                        className="children horizontal-children" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        {node.children.map(child => (
                            <TreeNode 
                                key={child.id} 
                                node={child} 
                                level={level + 1} 
                                parentCount={parentCount + 1}
                                onRemove={onRemove}
                                onAssetClick={onAssetClick}
                                isTopLevel={false}
                                assetTypes={assetTypes}
                            />
                        ))}
                    </div>
                )}
            </div>
            
            {/* Sub-types appear vertically below parent */}
            {hasSubTypes && isExpanded && (
                <div 
                    className="children vertical-children" 
                    onClick={(e) => e.stopPropagation()}
                >
                    {node.subTypes.map(subType => (
                        <TreeNode 
                            key={subType.id} 
                            node={subType} 
                            level={level + 1} 
                            parentCount={parentCount + 1}
                            onRemove={onRemove}
                            onAssetClick={onAssetClick}
                            isTopLevel={false}
                            assetTypes={assetTypes}
                        />
                    ))}
                </div>
            )}
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
    
    // Build tree structure from flat items array with support for multiple parents and sub-types
    const buildTree = (items) => {
        const itemMap = new Map()
        const rootItems = []
        const processedItems = new Set() // Track items that have been added to tree

        // Safety check: ensure items is an array
        if (!items || !Array.isArray(items)) {
            return rootItems
        }

        try {
            // Create a map of all items with separate arrays for sub-types and children types
            items.forEach(item => {
                itemMap.set(item.id, { 
                    ...item, 
                    subTypes: [],  // Sub-types (subtype_of_id relationship)
                    children: []    // Children types (parent_ids relationship)
                })
            })

            // Build relationships - process sub-types first, then children types
            items.forEach(item => {
                const itemId = String(item.id)
                console.log(`Processing item: ${item.title || itemId}`, {
                    id: itemId,
                    subtype_of_id: item.subtype_of_id,
                    parent_ids: item.parent_ids
                })
                
                // Handle sub-types (subtype_of_id relationship) - takes precedence
                if (item.subtype_of_id) {
                    const parentIdStr = String(item.subtype_of_id)
                    const parent = itemMap.get(parentIdStr)
                    if (parent && parent.id !== item.id) { // Prevent self-reference
                        console.log(`  -> Adding as sub-type to ${parent.title || parentIdStr}`)
                        parent.subTypes.push(itemMap.get(itemId))
                        processedItems.add(itemId)
                    } else {
                        // Parent doesn't exist or is self, treat as root
                        if (!processedItems.has(itemId)) {
                            console.log(`  -> Parent not found, adding to root`)
                            rootItems.push(itemMap.get(itemId))
                            processedItems.add(itemId)
                        }
                    }
                }
            })
            
            // Then handle children types (parent_ids relationship)
            items.forEach(item => {
                const itemId = String(item.id)
                // Skip if already processed as a sub-type
                if (processedItems.has(itemId)) {
                    console.log(`Skipping ${item.title || itemId} - already processed as sub-type`)
                    return
                }
                
                const parentIds = item.parent_ids || []
                if (parentIds.length > 0) {
                    let hasValidParent = false
                    // Add this item as a child to all its parents
                    parentIds.forEach(parentId => {
                        // Convert to string for comparison to handle UUID format issues
                        const parentIdStr = String(parentId)
                        
                        if (itemMap.has(parentIdStr) && parentIdStr !== itemId) { // Prevent self-reference
                            const parent = itemMap.get(parentIdStr)
                            console.log(`  -> Adding as child to ${parent.title || parentIdStr}`)
                            parent.children.push(itemMap.get(itemId))
                            hasValidParent = true
                        } else {
                            console.log(`  -> Invalid parent ${parentIdStr} (self-reference or not found, itemMap has: ${Array.from(itemMap.keys()).join(', ')})`)
                        }
                    })
                    
                    // If no valid parent exists, promote to root level
                    if (!hasValidParent && !processedItems.has(itemId)) {
                        console.log(`  -> No valid parent, adding to root`)
                        rootItems.push(itemMap.get(itemId))
                        processedItems.add(itemId)
                    } else if (hasValidParent) {
                        // Mark as processed so it doesn't get added to root
                        processedItems.add(itemId)
                    }
                } else if (!processedItems.has(itemId)) {
                    // No parents - this is a root item
                    console.log(`  -> No parents, adding to root`)
                    rootItems.push(itemMap.get(itemId))
                    processedItems.add(itemId)
                }
            })
            
            console.log(`Final rootItems count: ${rootItems.length}`, rootItems.map(r => r.title || r.id))

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
        console.log('Building tree with asset types:', safeAssetTypes)
        treeData = buildTree(safeAssetTypes)
        console.log('Tree data built:', treeData)
    } catch (error) {
        console.error('Error building tree structure:', error)
        console.error('Asset types data:', safeAssetTypes)
        treeData = [] // Return empty tree on error
    }

    // Handle click on tree container to deselect
    const handleTreeContainerClick = (e) => {
        // Only deselect if clicking on empty space (not on node-content or interactive elements)
        const clickedElement = e.target;
        const isNodeContent = clickedElement.closest('.node-content');
        const isButton = clickedElement.tagName === 'BUTTON' || clickedElement.closest('button');
        const isExpandButton = clickedElement.closest('.expand-button');
        const isRemoveButton = clickedElement.closest('.node-remove-button');
        
        // Deselect if clicking on empty space (not on node-content or buttons)
        // This includes clicking on node-row empty space, tree-content, or tree-scroll-wrapper
        if (!isNodeContent && !isButton && !isExpandButton && !isRemoveButton && onAssetClick) {
            onAssetClick(null);
        }
    };

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
                        {treeData.map(rootNode => (
                            <TreeNode 
                                key={rootNode.id} 
                                node={rootNode} 
                                level={0}
                                onRemove={onRemoveAssetType}
                                onAssetClick={onAssetClick}
                                isTopLevel={true}
                                assetTypes={safeAssetTypes}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default AssetTypeTree
