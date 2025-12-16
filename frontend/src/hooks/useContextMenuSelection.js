import { useState, useEffect, useRef } from 'react';

/**
 * Reusable hook for context menu and multi-selection functionality
 * @param {Array} items - Array of items to manage selection for
 * @param {Function} onDelete - Callback function to handle deletion (receives Set of item IDs)
 * @param {Object} options - Configuration options
 * @returns {Object} Selection state and handlers
 */
export const useContextMenuSelection = (items = [], onDelete, options = {}) => {
  const {
    getItemId = (item) => item.id,
    getItemName = (item) => item.name || item.title || `Item ${item.id}`,
    itemType = 'item' // 'item', 'layer', 'feature', etc.
  } = options;

  const [selectedItems, setSelectedItems] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [lastClickedIndex, setLastClickedIndex] = useState(null);
  const contextMenuRef = useRef(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent text selection on mousedown
  const handleMouseDown = (e) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  };

  // Handle item click with Ctrl/Shift
  const handleItemClick = (e, item, index) => {
    e.stopPropagation();
    
    const itemId = getItemId(item);
    
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+click: toggle individual selection
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
      setLastClickedIndex(index);
    } else if (e.shiftKey && lastClickedIndex !== null) {
      // Shift+click: select range
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      const newSet = new Set(selectedItems);
      for (let i = start; i <= end; i++) {
        if (items[i]) {
          newSet.add(getItemId(items[i]));
        }
      }
      setSelectedItems(newSet);
    } else {
      // Regular click: select only this item
      setSelectedItems(new Set([itemId]));
      setLastClickedIndex(index);
    }
  };

  const isItemSelected = (itemId) => selectedItems.has(itemId);

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    
    const itemId = getItemId(item);
    const isItemSelected = selectedItems.has(itemId);
    
    // Store what to delete: either current selection (if clicking selected item) or just this item
    let itemsToDelete = new Set();
    
    if (isItemSelected) {
      // Use current selection
      itemsToDelete = new Set(selectedItems);
    } else {
      // Select just this item
      itemsToDelete = new Set([itemId]);
      setSelectedItems(itemsToDelete);
    }
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
      itemsToDelete
    });
  };

  const handleDeleteClick = () => {
    setDeleteConfirm(contextMenu);
    setContextMenu(null);
  };

  const confirmDelete = () => {
    const { itemsToDelete } = deleteConfirm;
    
    // Call the delete callback with the set of IDs to delete
    if (itemsToDelete && itemsToDelete.size > 0 && onDelete) {
      itemsToDelete.forEach(itemId => {
        onDelete(itemId);
      });
    }
    
    // Clear selections
    setSelectedItems(new Set());
    setDeleteConfirm(null);
  };

  const getSelectedCount = () => {
    return selectedItems.size;
  };

  return {
    selectedItems,
    isItemSelected,
    contextMenu,
    deleteConfirm,
    contextMenuRef,
    handleItemClick,
    handleMouseDown,
    handleContextMenu,
    handleDeleteClick,
    confirmDelete,
    clearSelection,
    getSelectedCount,
    setContextMenu,
    setDeleteConfirm
  };
};

