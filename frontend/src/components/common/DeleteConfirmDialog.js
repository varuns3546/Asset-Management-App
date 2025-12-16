import React from 'react';
import '../../styles/layersPanel.css'; // Reuse the same styles

/**
 * Reusable Delete Confirmation Dialog Component
 */
const DeleteConfirmDialog = ({ deleteConfirm, onConfirm, onCancel, getItemName, itemType = 'item' }) => {
  if (!deleteConfirm) return null;

  const count = deleteConfirm.itemsToDelete?.size || 0;
  const itemName = deleteConfirm.item ? getItemName(deleteConfirm.item) : '';

  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <h4>Confirm Delete</h4>
        <p>
          {count > 1 
            ? `Are you sure you want to delete ${count} ${itemType}s?`
            : <>Are you sure you want to delete {itemType} <strong>"{itemName}"</strong>?</>
          }
        </p>
        <div className="confirm-actions">
          <button className="confirm-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-btn delete" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog;

