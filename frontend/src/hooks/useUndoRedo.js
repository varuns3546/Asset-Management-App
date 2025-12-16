import { useState, useCallback } from 'react';

/**
 * Hook for managing undo/redo functionality for deletions
 * @param {Function} onDelete - Function to perform deletion (receives item data)
 * @param {Function} onRestore - Function to restore deleted item (receives item data)
 * @returns {Object} Undo/redo state and handlers
 */
export const useUndoRedo = (onDelete, onRestore) => {
  const [history, setHistory] = useState([]); // Array of { action: 'delete', items: [...], timestamp }
  const [historyIndex, setHistoryIndex] = useState(-1); // Current position in history (-1 = no history)

  // Perform deletion and add to history
  const performDelete = useCallback((items) => {
    if (!items || items.length === 0) return;

    // Store items before deletion for undo
    const deletedItems = items.map(item => ({
      ...item,
      _deletedAt: Date.now()
    }));

    // Perform the actual deletion
    deletedItems.forEach(item => {
      if (onDelete) {
        onDelete(item);
      }
    });

    // Add to history (remove any future history if we're not at the end)
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({
        action: 'delete',
        items: deletedItems,
        timestamp: Date.now()
      });
      // Keep only last 50 actions
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [onDelete, historyIndex]);

  // Undo last deletion
  const undo = useCallback(() => {
    if (historyIndex < 0 || historyIndex >= history.length) return;

    const lastAction = history[historyIndex];
    if (lastAction && lastAction.action === 'delete') {
      // Restore deleted items
      lastAction.items.forEach(item => {
        if (onRestore) {
          onRestore(item);
        }
      });
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex, onRestore]);

  // Redo last undone deletion
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    const nextAction = history[historyIndex + 1];
    if (nextAction && nextAction.action === 'delete') {
      // Delete items again
      nextAction.items.forEach(item => {
        if (onDelete) {
          onDelete(item);
        }
      });
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex, onDelete]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    performDelete,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
    historyCount: history.length
  };
};

