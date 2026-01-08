import React, { useState, useEffect, useRef, useMemo } from 'react'
import '../../styles/structureTree.css'
import { useContextMenuSelection } from '../../hooks/useContextMenuSelection'
import ContextMenu from '../common/ContextMenu'

const TreeNode = ({ 
    node, 
    level = 0, 
    parentCount = 0, 
    onAssetClick, 
    isTopLevel = false, 
    assetTypes = [],
    isSelected = false,
    onItemSelect,
    onContextMenu,
    onMouseDown,
    itemIndex,
    checkNodeSelected,
    getNodeIndex
}) => {
    // Start expanded by default for all nodes
    const [isExpanded, setIsExpanded] = React.useState(true)
    const hasSubTypes = node.subTypes && node.subTypes.length > 0
    const hasChildren = node.children && node.children.length > 0
    const hasMultipleParents = node.parent_ids && node.parent_ids.length > 1

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

    const handleToggle = (e) => {
        e.stopPropagation()
        setIsExpanded(!isExpanded)
    }

    return (
        <div className="tree-node vertical-node">
            <div className="node-row">
                {/* Left side: node content + subtypes stacked vertically */}
                <div className="node-with-subtypes">
                    <div 
                        className={`node-content ${isSelected ? 'selected' : ''}`}
                        onClick={handleAssetClick}
                        onMouseDown={onMouseDown}
                        onContextMenu={handleContextMenuClick}
                        style={{ 
                            userSelect: 'none',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            backgroundColor: isSelected ? '#e7f1ff' : undefined,
                            borderColor: isSelected ? '#007bff' : undefined
                        }}
                        title="Click to edit, right-click for menu"
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
                        </div>
                    </div>
                    
                    {/* Sub-types appear vertically below parent, touching the bottom */}
                    {hasSubTypes && isExpanded && (
                        <div 
                            className="children vertical-children" 
                            onClick={(e) => e.stopPropagation()}
                        >
                            {node.subTypes.map(subType => {
                                const subTypeIsSelected = checkNodeSelected ? checkNodeSelected(subType) : false
                                const subTypeIndex = getNodeIndex ? getNodeIndex(subType) : undefined
                                return (
                                    <TreeNode 
                                        key={subType.id} 
                                        node={subType} 
                                        level={level + 1} 
                                        parentCount={parentCount + 1}
                                        onAssetClick={onAssetClick}
                                        isTopLevel={false}
                                        assetTypes={assetTypes}
                                        isSelected={subTypeIsSelected}
                                        onItemSelect={onItemSelect}
                                        onContextMenu={onContextMenu}
                                        onMouseDown={onMouseDown}
                                        itemIndex={subTypeIndex}
                                        checkNodeSelected={checkNodeSelected}
                                        getNodeIndex={getNodeIndex}
                                    />
                                )
                            })}
                        </div>
                    )}
                </div>
                
                {/* Children types appear horizontally to the right of the node+subtypes, stack vertically if multiple */}
                {hasChildren && isExpanded && (
                    <div 
                        className="children horizontal-children vertical-stack" 
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
            if (node.subTypes && node.subTypes.length > 0) {
                flattenTree(node.subTypes, result)
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
                
                // Handle sub-types (subtype_of_id relationship) - takes precedence
                if (item.subtype_of_id) {
                    const parentIdStr = String(item.subtype_of_id)
                    const parent = itemMap.get(parentIdStr)
                    if (parent && parent.id !== item.id) { // Prevent self-reference
                        parent.subTypes.push(itemMap.get(itemId))
                        processedItems.add(itemId)
                    } else {
                        // Parent doesn't exist or is self, treat as root
                        if (!processedItems.has(itemId)) {
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
                            parent.children.push(itemMap.get(itemId))
                            hasValidParent = true
                        }
                    })
                    
                    // If no valid parent exists, promote to root level
                    if (!hasValidParent && !processedItems.has(itemId)) {
                        rootItems.push(itemMap.get(itemId))
                        processedItems.add(itemId)
                    } else if (hasValidParent) {
                        // Mark as processed so it doesn't get added to root
                        processedItems.add(itemId)
                    }
                } else if (!processedItems.has(itemId)) {
                    // No parents - this is a root item
                    rootItems.push(itemMap.get(itemId))
                    processedItems.add(itemId)
                }
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

    // Calculate and set vertical line heights after render (for horizontal children only)
    useEffect(() => {
        if (!treeContentRef.current) return;

        const updateVerticalLineHeights = () => {
            // Find all horizontal vertical stack containers (children types)
            const horizontalVerticalStacks = treeContentRef.current.querySelectorAll('.horizontal-children.vertical-stack');
            
            horizontalVerticalStacks.forEach(stack => {
                const children = Array.from(stack.querySelectorAll(':scope > .vertical-node'));
                
                // Only process if there are multiple children
                if (children.length > 1) {
                    const firstChild = children[0];
                    const lastChild = children[children.length - 1];
                    
                    // Get the positions of the connection points (at top: 16px of each child)
                    const firstChildRect = firstChild.getBoundingClientRect();
                    const lastChildRect = lastChild.getBoundingClientRect();
                    
                    // Calculate the vertical distance between connection points
                    const verticalDistance = lastChildRect.top - firstChildRect.top;
                    
                    // Set the CSS variable on the last child
                    lastChild.style.setProperty('--vertical-line-height', `${verticalDistance}px`);
                }
            });
        };

        // Run after render and when tree changes
        updateVerticalLineHeights();
        
        // Also update on zoom level changes or window resize
        const resizeObserver = new ResizeObserver(updateVerticalLineHeights);
        if (treeContentRef.current) {
            resizeObserver.observe(treeContentRef.current);
        }

        return () => {
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
        // Only deselect if clicking on empty space (not on node-content or interactive elements)
        const clickedElement = e.target;
        const isNodeContent = clickedElement.closest('.node-content');
        const isButton = clickedElement.tagName === 'BUTTON' || clickedElement.closest('button');
        const isExpandButton = clickedElement.closest('.expand-button');
        
        // Deselect if clicking on empty space (not on node-content or buttons)
        // This includes clicking on node-row empty space, tree-content, or tree-scroll-wrapper
        if (!isNodeContent && !isButton && !isExpandButton) {
            clearSelection()
            if (onAssetClick) {
                onAssetClick(null);
            }
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
