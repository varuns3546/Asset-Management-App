# Questionnaire Feature Setup Guide

This document contains the SQL commands needed to set up the database for the dynamic questionnaire feature.

## Database Schema Setup

You need to execute the following SQL commands in your Supabase SQL Editor to create the required table for storing questionnaire responses.

### 1. Create the `questionnaire_responses` table

```sql
-- Create questionnaire_responses table
CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  asset_type_id UUID NOT NULL REFERENCES asset_types(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  attribute_title TEXT NOT NULL,
  response_value TEXT,
  response_metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_asset_attribute UNIQUE(asset_id, attribute_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_asset_id 
  ON questionnaire_responses(asset_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_project_id 
  ON questionnaire_responses(project_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_asset_type_id 
  ON questionnaire_responses(asset_type_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_questionnaire_responses_updated_at 
  BEFORE UPDATE ON questionnaire_responses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS) policies
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view responses for projects they have access to
CREATE POLICY "Users can view questionnaire responses for their projects"
  ON questionnaire_responses
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
      UNION
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can insert responses for projects they have access to
CREATE POLICY "Users can insert questionnaire responses for their projects"
  ON questionnaire_responses
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
      UNION
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can update responses for projects they have access to
CREATE POLICY "Users can update questionnaire responses for their projects"
  ON questionnaire_responses
  FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
      UNION
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can delete responses for projects they have access to
CREATE POLICY "Users can delete questionnaire responses for their projects"
  ON questionnaire_responses
  FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
      UNION
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );
```

## How to Apply These Changes

1. Log in to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to the SQL Editor (left sidebar)
4. Copy and paste the SQL code above
5. Click "Run" to execute the SQL

## Feature Overview

### What This Feature Does

The questionnaire feature creates dynamic forms based on the attributes of asset types:

1. **Dynamic Questions**: When you select an asset, the system automatically generates questions based on that asset's type attributes
2. **Data Storage**: Responses are saved to the `questionnaire_responses` table in Supabase
3. **Persistent Data**: When you revisit an asset, your previous responses are loaded automatically
4. **Flexible Structure**: Each asset type can have different attributes, resulting in different questionnaires

### How to Use

1. **Set Up Asset Types with Attributes**:
   - Go to Structure → Item Types
   - Create or edit an asset type
   - Add attributes (e.g., "Condition", "Last Inspection Date", "Risk Level")

2. **Create Assets**:
   - Go to Structure → Asset Hierarchy
   - Create assets with the asset types you defined

3. **Fill Out Questionnaires**:
   - Navigate to Enter Data → Questionnaire
   - Select an asset from the dropdown
   - Answer the questions (based on the asset type's attributes)
   - Click "Save Responses"

4. **View Responses**:
   - You can return to any asset's questionnaire to view or update responses
   - All responses are stored with timestamps and user information

## Database Structure

### Table: `questionnaire_responses`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | Reference to the project |
| asset_id | UUID | Reference to the asset being assessed |
| asset_type_id | UUID | Reference to the asset's type |
| attribute_id | UUID | Reference to the attribute being answered |
| attribute_title | TEXT | The question text (attribute name) |
| response_value | TEXT | The user's answer |
| response_metadata | JSONB | Additional data (for future use) |
| created_by | UUID | User who created the response |
| created_at | TIMESTAMPTZ | When the response was created |
| updated_at | TIMESTAMPTZ | When the response was last updated |

### Constraints

- **UNIQUE(asset_id, attribute_id)**: Ensures only one response per asset-attribute combination
- **Row Level Security**: Ensures users can only access responses for projects they have access to

## API Endpoints

The following API endpoints are now available:

1. **GET** `/api/questionnaire/:projectId/asset/:assetId`
   - Get questionnaire data for a specific asset
   - Returns asset info, attributes, and existing responses

2. **POST** `/api/questionnaire/:projectId/asset/:assetId/submit`
   - Submit or update questionnaire responses
   - Body: `{ responses: [{ attributeId, attributeTitle, value, metadata }] }`

3. **GET** `/api/questionnaire/:projectId/responses`
   - Get all questionnaire responses for a project
   - Useful for reporting and analytics

## Future Enhancements

This implementation can be extended with:

1. **Different Input Types**: 
   - Radio buttons for multiple choice
   - Checkboxes for multi-select
   - Date pickers for date fields
   - File uploads for attachments

2. **Validation Rules**:
   - Required fields
   - Min/max values for numbers
   - Pattern matching for text

3. **Conditional Logic**:
   - Show/hide questions based on previous answers
   - Dynamic follow-up questions

4. **Reporting**:
   - Export responses to CSV/Excel
   - Generate summary reports
   - Visualize response data with charts

5. **Version History**:
   - Track changes to responses over time
   - Show audit trail of who changed what

## Troubleshooting

### Issue: "Failed to fetch questionnaire"
- **Check**: Make sure the asset exists and belongs to the selected project
- **Check**: Verify the user has access to the project
- **Check**: Check browser console for detailed error messages

### Issue: "Failed to save responses"
- **Check**: Ensure the `questionnaire_responses` table exists in Supabase
- **Check**: Verify Row Level Security policies are correctly set up
- **Check**: Make sure the user is authenticated

### Issue: "This asset type has no attributes defined"
- **Solution**: Go to Structure → Item Types and add attributes to the asset type
- The questionnaire is dynamically generated from attributes, so attributes must exist

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Check the backend server logs
3. Verify all SQL commands were executed successfully in Supabase
4. Ensure your authentication token is valid

