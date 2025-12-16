# CSS Classes Safe to Remove

## ⚠️ IMPORTANT NOTES:
1. **DO NOT REMOVE** classes that are used dynamically (`.selected`, `.active`, `.expanded`, `.collapsed`, `.hidden`)
2. **DO NOT REMOVE** Leaflet classes (`.leaflet-*`) - these are used by the map library
3. **DO NOT REMOVE** classes that might be added via JavaScript or third-party libraries
4. Always test after removing CSS to ensure nothing breaks

## Classes That Appear Truly Unused:

### map.css
- `.6px` - Likely a typo or unused
- `.color-preview` - Check if used in color pickers
- `.color-rgba-input` - Check if used in color pickers
- `.rgba-input` - Check if used in color pickers
- `.rgba-input-group` - Check if used in color pickers
- `.rgba-inputs-row` - Check if used in color pickers
- `.rgba-picker-container` - Check if used in color pickers
- `.map-legend` - Check if legend is implemented
- `.map-legend-wrapper` - Check if legend is implemented
- `.map-screen-header` - Check if this screen exists
- `.map-screen-left-panel` - Check if this screen exists
- `.map-view-wrapper` - Check if this wrapper exists
- `.panel-toggle-btn` - Actually USED in LeftMapPanel.js (DO NOT REMOVE)
- `.top-panel` - Check if top panel exists

### modal.css
- `.cloud-file-item` - Actually USED in FileUploadModal.js (DO NOT REMOVE)
- `.drop-zone` - Check if file upload uses this
- `.drop-zone-label` - Check if file upload uses this
- `.drop-zone-text` - Check if file upload uses this
- `.file-icon` - Check if file upload uses this
- `.file-info` - Check if file upload uses this
- `.file-name` - Check if file upload uses this
- `.file-size` - Check if file upload uses this
- `.file-tab` - Actually USED in FileUploadModal.js (DO NOT REMOVE)
- `.has-file` - Check if file upload uses this
- `.remove-file-btn` - Check if file upload uses this
- `.selected-file` - Check if file upload uses this
- `.sheet-type-label` - Check if Excel import uses this
- `.sheet-type-mappings` - Check if Excel import uses this
- `.sheet-type-row` - Check if Excel import uses this
- `.symbol-btn` - Actually USED in StyleLayerModal.js (DO NOT REMOVE)
- `.upload-icon` - Check if file upload uses this

### homeScreen.css
- `.buckets-badge` - Check if buckets feature exists
- `.buckets-note` - Check if buckets feature exists
- `.estimate-note` - Check if estimates are shown
- `.healthy` - Check if health status is shown
- `.status-badge` - Check if status badges are used
- `.official-metrics-banner` - Check if this banner is used
- `.welcome-message` - Check if welcome message is shown

### structureScreen.css
- `.coordinate-label` - Check if coordinates are displayed
- `.form-checkbox` - Check if this is an alternative class name
- `.form-section-title` - Check if section titles are used
- `.hierarchy-error` - Check if error messages use this
- `.hierarchy-loading` - Check if loading states use this
- `.icon-color-preview` - Check if icon color picker uses this
- `.icon-color-select` - Check if icon color picker uses this
- `.icon-color-select-wrapper` - Check if icon color picker uses this
- `.icon-label` - Check if icon labels are shown
- `.icon-option` - Check if icon options are shown
- `.icon-preview` - Check if icon previews are shown
- `.item-type-icon-grid` - Check if icon grid is used
- `.parent-dropdowns-container` - Check if parent dropdowns exist
- `.parent-dropdowns-label` - Check if parent dropdowns exist

### layersPanel.css
- `.detail-label` - Check if layer details show labels
- `.detail-value` - Check if layer details show values
- `.layer-detail-row` - Check if layer details are shown

### questionnaire.css
- `.photo-count` - Check if photo counts are displayed
- `.photo-item` - Check if photos are displayed

### structureTree.css
- `.type-filter-button` - Actually USED in HierarchyTree.js (DO NOT REMOVE)

### auth.css
- `.auth-label` - Check if auth forms use this (might be using `.form-label` instead)

### projectComponents.css
- `.btn-success` - Check if success buttons are used
- `.form-textarea` - Actually USED in FormField.js (DO NOT REMOVE)

### storageWarning.css
- `.critical` - Check if critical warnings are shown
- `.warning` - Check if warnings are shown
- `.storage-warning-banner` - Check if storage warnings are shown

## Recommendation:
Before removing any CSS, manually verify each class by:
1. Searching the codebase for the class name
2. Checking if it's used in template literals or conditional logic
3. Testing the application after removal
4. Using browser DevTools to check if classes are applied dynamically

## Better Approach:
Use PurgeCSS in production builds (already configured in package.json):
```bash
npm run build:purge
```

This will automatically remove unused CSS during the build process while keeping classes that are used dynamically.

