# Hierarchy Import Guide

## Overview
The hierarchy import feature allows you to bulk import hierarchy items from spreadsheet files (.xlsx, .xls, .xlsm, .csv, .tsv).

## File Format

### Required Columns
- **title**: The name of the hierarchy item (required)
- **type**: The item type name (required)

### Optional Columns
- **parent**: The title of the parent item (creates hierarchical relationships)
- **beginning_latitude**: Starting latitude coordinate (-90 to 90)
- **end_latitude**: Ending latitude coordinate (-90 to 90)
- **beginning_longitude**: Starting longitude coordinate (-180 to 180)
- **end_longitude**: Ending longitude coordinate (-180 to 180)
- **[custom attributes]**: Any other columns will be treated as item type attributes

### Example CSV Format
```csv
title,type,parent,beginning_latitude,beginning_longitude,end_latitude,end_longitude
Building A,Building,,18.4655,-66.1057,18.4665,-66.1047
Floor 1,Floor,Building A,,,
Room 101,Room,Floor 1,18.4656,-66.1056,,
```

### Column Name Flexibility
The system uses flexible matching for column names:
- Spaces, underscores, and hyphens are ignored
- Case-insensitive matching
- Examples that match "beginning_latitude":
  - "Beginning Latitude"
  - "beginning-latitude"
  - "BEGINNINGLATITUDE"
  - "Beginning_Latitude"

## Import Workflow

### 1. Upload File
- Click "Import Data" button in the Hierarchy screen
- Select or drag-and-drop your file
- Click "Continue"

### 2. Select Sheets (Multi-sheet files only)
- For Excel files with multiple sheets, you'll see a sheet selector
- **Check the boxes** for all sheets you want to import
- Click "Preview" button on any sheet to view its data
- The preview shows the first 5 rows of the selected sheet
- Total row count updates based on selected sheets

### 3. Preview & Map Columns
- Review data preview (first 5 rows of current sheet)
- Map each column to appropriate fields:
  - **System fields**: title, type, parent, coordinates
  - **Attributes**: Map to item type attributes
  - **Ignore**: Skip unused columns
- System attempts auto-mapping based on column names
- **Note**: Column mappings apply to ALL selected sheets

### 4. Configure Item Types
- For each unique type found in the data:
  - **Use Existing Type**: Map to an existing item type
  - **Create New Type**: Create a new item type
    - Check "Has Coordinates" if items of this type should support coordinates

### 5. Import
- Click "Import X Items from Y Sheet(s)"
- System performs two-pass import:
  - Pass 1: Creates all items from all selected sheets
  - Pass 2: Sets parent relationships
- Shows success/error summary with per-sheet results

## Validation Rules

### Data Validation
- Title and type are required for each row
- Item types must exist or be created
- Parent title must exist in the imported data
- Coordinates are only saved if the item type has "has_coordinates" enabled
- Coordinate values must be within valid ranges

### Parent Relationships
- Parent relationships are created by matching titles
- Parents must be in the same import file
- Circular relationships are not prevented (but may cause issues)

## Error Handling
- Invalid file format: Shows error message
- Missing required columns: Highlighted in validation
- Row-level errors: Reported after import with row numbers
- Partial imports: Successfully imported items are kept even if some rows fail

## Tips
- Ensure all parent items appear in the file before their children
- Use consistent naming for types across rows
- Test with a small file first
- Review the preview carefully before importing
- Check that coordinate-enabled types have "Has Coordinates" set correctly
- For multi-sheet imports, ensure all sheets use the same column structure
- You can select multiple sheets to import them all at once

## Limitations
- Maximum file size: 10MB
- Large imports may take some time
- All items in the file must belong to the same project
- Existing items are not updated (creates new items only)
- When importing multiple sheets, the same column mappings apply to all sheets
- Parent relationships can reference items across different sheets

