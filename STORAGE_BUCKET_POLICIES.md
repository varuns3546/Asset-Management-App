# Storage Bucket Policies Setup

## Issue
Without bucket policies, the storage listing API doesn't return complete file metadata (id, size, etc.), causing inaccurate file size calculations.

## Solution: Add Bucket Policies

### For `project-files` bucket:

Go to Supabase Dashboard → Storage → `project-files` bucket → Policies

Add the following policies:

#### 1. Allow Service Role to Read All Files
```sql
CREATE POLICY "Service role can read all files"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'project-files');
```

#### 2. Allow Service Role to Upload Files
```sql
CREATE POLICY "Service role can upload files"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'project-files');
```

#### 3. Allow Service Role to Delete Files
```sql
CREATE POLICY "Service role can delete files"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'project-files');
```

#### 4. Allow Authenticated Users to Read Their Project Files
```sql
CREATE POLICY "Users can read their project files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects 
    WHERE owner_id = auth.uid() 
    OR id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
    )
  )
);
```

#### 5. Allow Authenticated Users to Upload to Their Projects
```sql
CREATE POLICY "Users can upload to their projects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects 
    WHERE owner_id = auth.uid() 
    OR id IN (
      SELECT project_id FROM project_users WHERE user_id = auth.uid()
    )
  )
);
```

## Alternative: Public Bucket (Less Secure)

If you want to make the bucket public (not recommended for production):

1. Go to Storage → `project-files` → Settings
2. Toggle "Public bucket" to ON

This will allow listing with full metadata, but anyone with the URL can access files.

## After Adding Policies

Once policies are added, the storage listing will ret[dotenv@17.2.2] injecting env (12) from .env -- tip: 📡 auto-backup env with Radar: https://dotenvx.com/radar
[dotenv@17.2.2] injecting env (0) from .env -- tip: ⚙️  enable debug logging with { deebug: true }
Server running on http://localhost:3001
📊 getAllProjectsMetrics called - calculating account-wide metrics...
⚠️ Official metrics unavailable
⚠️ Official Supabase metrics not available
📁 Calling getAllStorageFilesCount() to count files in all storage buckets...
🔍 Starting getAllStorageFilesCount() - counting files in all storage buckets...      
  Using bucket enumeration method to count actual files in storage...
📦 Found 1 storage bucket(s): project-files

  📦 Counting files in bucket: project-files...
    🔍 Sample items from root (first 1):
      - name: "a1ecc77b-8bf7-47c9-865b-083e253754b3", id: missing, metadata: missing  
  ✅ project-files SUMMARY: 12 files, 2.51 MB

📊 BUCKET BREAKDOWN: {
  "project-files": {
    "count": 12,
    "size": 2626892,
    "sizeFormatted": "2.51 MB"
  }
}
✓ Total: 12 files across all buckets, total size: 2.51 MB
📁 getAllStorageFilesCount() returned: 12 files, 2.51 MB
✓ Using bucket enumeration storage size: 2.51 MB (12 files)
  (DB records: 0 Bytes)
✓ Accurate database breakdown (PostgreSQL):
  - Your tables: 7.15 MB
  - Your indexes: 1.87 MB
  - TOAST storage: 1.05 MB
  - System overhead: 14.27 MB
  - Total (Supabase counts): 38.54 MB
  - Overhead: 81.45%

urn complete metadata including:
- File IDs
- File sizes
- Content types
- Timestamps

This will fix the file size calculation discrepancy.

