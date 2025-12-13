-- Storage Bucket Policies for project-files bucket
-- Run this in Supabase SQL Editor

-- 1. Allow Service Role to Read All Files
CREATE POLICY "Service role can read all files"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'project-files');

-- 2. Allow Service Role to Upload Files
CREATE POLICY "Service role can upload files"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'project-files');

-- 3. Allow Service Role to Delete Files
CREATE POLICY "Service role can delete files"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'project-files');

-- 4. Allow Authenticated Users to Read Their Project Files
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

-- 5. Allow Authenticated Users to Upload to Their Projects
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

-- 6. Allow Authenticated Users to Delete Their Project Files
CREATE POLICY "Users can delete their project files"
ON storage.objects FOR DELETE
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

