# Tree Debugging Guide

## Debugging the Asset Type Tree

### 1. **Open Browser DevTools**
- Press `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
- Go to the **Elements** (Inspector) tab

### 2. **Find the Tree Container**
1. Click the **Inspect tool** (cursor icon in top-left of DevTools)
2. Click on any node in the asset type tree
3. In the Elements panel, you'll see the HTML structure

### 3. **Check the Tree Structure**
The tree structure should look like this:
```
<div class="hierarchy-tree">
  <div class="tree-content">
    <div class="tree-node vertical-node">
      <div class="node-row">
        <div class="node-content">
          <button class="expand-button">+</button>
          <span class="node-title">Asset Type Name</span>
        </div>
        <div class="children horizontal-children vertical-stack">
          <!-- Child nodes here -->
        </div>
      </div>
    </div>
  </div>
</div>
```

### 4. **Check Event Handlers**
1. Select a `.node-content` element in DevTools
2. In the right panel, go to **Event Listeners** tab
3. Look for:
   - `contextmenu` - Should be present for right-click
   - `click` - For left-click
   - `mousedown` - For selection

### 5. **Test Right-Click in Console**
1. Select a `.node-content` element in DevTools
2. In the Console, type:
```javascript
// Get the first node content element
const node = document.querySelector('.node-content');
// Simulate right-click
node.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }));
```

### 6. **Check Component Props**
1. Install **React DevTools** browser extension
2. Select a `TreeNode` component
3. Check the `Props` panel for:
   - `onContextMenu` - Should be a function (not `undefined`)
   - `onAssetClick` - Should be a function
   - `node` - Should have an `id` and `title`

### 7. **Debug Context Menu Handler**
Add console logs in the component:
```javascript
// In TreeNode component
const handleContextMenuClick = (e) => {
    console.log('Right-click detected!', { 
        node: node.title, 
        hasHandler: !!onContextMenu,
        event: e 
    });
    e.stopPropagation();
    e.preventDefault();
    if (onContextMenu) {
        console.log('Calling onContextMenu handler');
        onContextMenu(e, node);
    } else {
        console.warn('onContextMenu handler is missing!');
    }
}
```

### 8. **Check Context Menu State**
1. Open React DevTools
2. Select `AssetTypeTree` component
3. Check the `State` panel for:
   - `contextMenu` - Should show position and selected items when menu is open
   - `selectedItems` - Array of selected item IDs

### 9. **Common Issues**

#### Issue: Right-click does nothing
**Check:**
- Is `onContextMenu` prop passed to TreeNode? ✓ Check in React DevTools
- Is the event being prevented? Check console for errors
- Is another element blocking the click? Check z-index and pointer-events

#### Issue: Context menu appears in wrong position
**Check:**
- `contextMenu` state has correct `x` and `y` values
- Context menu component receives correct position props

#### Issue: Selection doesn't work
**Check:**
- `onItemSelect` prop is passed
- `itemIndex` is defined
- `selectedItems` state updates in Redux DevTools

### 10. **Console Debugging Commands**

```javascript
// Check if context menu handler exists
const treeNode = document.querySelector('.tree-node');
console.log('Tree node:', treeNode);

// Check event listeners
getEventListeners(treeNode.querySelector('.node-content'));

// Simulate right-click programmatically
const nodeContent = document.querySelector('.node-content');
const event = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 2
});
nodeContent.dispatchEvent(event);
```

### 11. **Network Tab (if deletion/API calls fail)**
1. Open **Network** tab in DevTools
2. Right-click a node and try to delete
3. Look for API requests:
   - Should see DELETE request if deletion works
   - Check response status (200 = success, 404/500 = error)
   - Check request payload

### 12. **Redux DevTools (if using)**
1. Install Redux DevTools extension
2. Open it and filter for actions related to asset types
3. Check if actions are dispatched when right-clicking

## Quick Debug Checklist

- [ ] Open DevTools Console - any errors?
- [ ] Check React DevTools - are props being passed?
- [ ] Right-click node - does console.log fire?
- [ ] Check Event Listeners tab - is contextmenu handler attached?
- [ ] Check Network tab - are API calls being made?
- [ ] Check contextMenu state in React DevTools

## Adding Debug Logs

Add these temporary logs to debug:

**In TreeNode component (AssetTypeTree.js):**
```javascript
const handleContextMenuClick = (e) => {
    console.log('[TreeNode] Right-click handler called', {
        nodeTitle: node.title,
        nodeId: node.id,
        hasOnContextMenu: !!onContextMenu,
        eventType: e.type,
        target: e.target
    });
    e.stopPropagation();
    e.preventDefault();
    if (onContextMenu) {
        onContextMenu(e, node);
    } else {
        console.error('[TreeNode] onContextMenu handler is missing!');
    }
}
```

**In AssetTypeTree component:**
```javascript
// When passing props to TreeNode
<TreeNode
    // ... other props
    onContextMenu={(e, node) => {
        console.log('[AssetTypeTree] Context menu handler called', {
            nodeTitle: node.title,
            nodeId: node.id,
            handleContextMenu: !!handleContextMenu
        });
        handleContextMenu(e, node);
    }}
/>
```

