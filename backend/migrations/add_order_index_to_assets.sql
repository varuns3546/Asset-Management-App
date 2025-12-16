-- Migration: Add order_index column to assets table
-- This column stores the display order for assets, allowing proper restoration after undo/redo

-- Add the order_index column (nullable, will be populated based on current created_at order)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS order_index INTEGER;

-- Create index for better query performance (includes item_type_id for scoped ordering)
CREATE INDEX IF NOT EXISTS idx_assets_order_index ON assets(project_id, item_type_id, order_index);

-- Populate order_index for existing assets based on their created_at order
-- Order is scoped per item_type_id (items of the same type get sequential indices)
-- This ensures existing data has proper ordering within each type group
DO $$
DECLARE
    project_record RECORD;
    type_record RECORD;
    asset_record RECORD;
    idx INTEGER;
BEGIN
    -- Loop through each project
    FOR project_record IN SELECT DISTINCT project_id FROM assets LOOP
        -- Loop through each item_type_id (including NULL for uncategorized)
        FOR type_record IN 
            SELECT DISTINCT item_type_id 
            FROM assets 
            WHERE project_id = project_record.project_id
        LOOP
            idx := 0;
            -- Order assets by created_at and assign sequential order_index within this type
            FOR asset_record IN 
                SELECT id FROM assets 
                WHERE project_id = project_record.project_id 
                  AND (item_type_id = type_record.item_type_id OR (item_type_id IS NULL AND type_record.item_type_id IS NULL))
                ORDER BY created_at ASC
            LOOP
                UPDATE assets 
                SET order_index = idx 
                WHERE id = asset_record.id;
                idx := idx + 1;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Make order_index NOT NULL after populating (optional, can be left nullable)
-- ALTER TABLE assets ALTER COLUMN order_index SET NOT NULL;

