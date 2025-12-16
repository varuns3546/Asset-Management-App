import React from 'react';
import '../../styles/layersPanel.css'; // Reuse the same styles

/**
 * Reusable Context Menu Component
 */
const ContextMenu = ({ contextMenu, contextMenuRef, onDeleteClick, itemType = 'item' }) => {
  if (!contextMenu) return null;

  const count = contextMenu.itemsToDelete?.size || 0;
  const label = count > 1 ? `${count} items` : itemType;

  return (
    <div 
      ref={contextMenuRef}
      className="context-menu"
      style={{ top: contextMenu.y, left: contextMenu.x }}
    >
      <button className="context-menu-item delete" onClick={onDeleteClick}>
        🗑️ Delete {label}
      </button>
    </div>
  );
};

export default ContextMenu;

