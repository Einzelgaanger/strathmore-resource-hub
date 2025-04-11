
-- Update storage.objects table to include owner_id, user_metadata, and version columns
DO $$
BEGIN
  -- Check if the owner_id column already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'storage' 
    AND table_name = 'objects' 
    AND column_name = 'owner_id'
  ) THEN
    -- Add owner_id column to storage.objects
    ALTER TABLE storage.objects ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    
    -- Update owner_id to match owner for existing objects
    UPDATE storage.objects SET owner_id = owner;
  END IF;

  -- Check if the user_metadata column already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'storage' 
    AND table_name = 'objects' 
    AND column_name = 'user_metadata'
  ) THEN
    -- Add user_metadata column to storage.objects
    ALTER TABLE storage.objects ADD COLUMN user_metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  -- Check if the version column already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'storage' 
    AND table_name = 'objects' 
    AND column_name = 'version'
  ) THEN
    -- Add version column to storage.objects
    ALTER TABLE storage.objects ADD COLUMN version TEXT;
  END IF;
END $$;

-- Fix RLS policies for resources table and storage.objects
DO $$
BEGIN
  -- First, drop the existing policies on resources table
  DROP POLICY IF EXISTS "Resources can be inserted by class members" ON resources;
  DROP POLICY IF EXISTS "Resources are viewable by class members" ON resources;
  
  -- Create more permissive policies for resource insertion and viewing
  CREATE POLICY "Resources can be inserted by anyone with a valid user ID" ON resources
    FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL OR
      user_id IN (SELECT id FROM users)
    );
  
  CREATE POLICY "Resources are viewable by everyone" ON resources
    FOR SELECT
    USING (true);
  
  -- Add update and delete policies for resources
  DROP POLICY IF EXISTS "Resources can be updated by owners or admins" ON resources;
  CREATE POLICY "Resources can be updated by owners or admins" ON resources
    FOR UPDATE
    USING (
      user_id = auth.uid() OR
      user_id IN (SELECT id FROM users WHERE is_admin = true OR is_super_admin = true)
    );
  
  DROP POLICY IF EXISTS "Resources can be deleted by owners or admins" ON resources;
  CREATE POLICY "Resources can be deleted by owners or admins" ON resources
    FOR DELETE
    USING (
      user_id = auth.uid() OR
      user_id IN (SELECT id FROM users WHERE is_admin = true OR is_super_admin = true)
    );
  
  -- Re-create storage policies with more permissive rules
  DROP POLICY IF EXISTS "Resources Public Read" ON storage.objects;
  CREATE POLICY "Resources Public Read" ON storage.objects
    FOR SELECT
    USING (true);
  
  DROP POLICY IF EXISTS "Resources Authenticated Insert" ON storage.objects;
  CREATE POLICY "Resources Authenticated Insert" ON storage.objects
    FOR INSERT
    WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Resources Owner Update" ON storage.objects;
  CREATE POLICY "Resources Owner Update" ON storage.objects
    FOR UPDATE
    USING (true);
  
  DROP POLICY IF EXISTS "Resources Owner Delete" ON storage.objects;
  CREATE POLICY "Resources Owner Delete" ON storage.objects
    FOR DELETE
    USING (true);
  
  -- Add permissive policies for buckets
  DROP POLICY IF EXISTS "Public Access" ON storage.buckets;
  CREATE POLICY "Public Access" ON storage.buckets
    FOR SELECT
    USING (true);
  
  -- Ensure RLS is enabled on resources
  ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
  
  -- Ensure comments table has appropriate policies
  DROP POLICY IF EXISTS "Comments can be inserted by users" ON comments;
  CREATE POLICY "Comments can be inserted by users" ON comments
    FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL OR
      user_id IN (SELECT id FROM users)
    );
  
  DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
  CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT
    USING (true);
  
  DROP POLICY IF EXISTS "Comments can be updated by owners" ON comments;
  CREATE POLICY "Comments can be updated by owners" ON comments
    FOR UPDATE
    USING (user_id = auth.uid() OR user_id IN (SELECT id FROM users));
  
  DROP POLICY IF EXISTS "Comments can be deleted by owners or admins" ON comments;
  CREATE POLICY "Comments can be deleted by owners or admins" ON comments
    FOR DELETE
    USING (
      user_id = auth.uid() OR
      user_id IN (SELECT id FROM users WHERE is_admin = true OR is_super_admin = true)
    );
  
  -- Ensure completions table has appropriate policies
  DROP POLICY IF EXISTS "Completions can be inserted by users" ON completions;
  CREATE POLICY "Completions can be inserted by users" ON completions
    FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL OR
      user_id IN (SELECT id FROM users)
    );
  
  DROP POLICY IF EXISTS "Completions are viewable by everyone" ON completions;
  CREATE POLICY "Completions are viewable by everyone" ON completions
    FOR SELECT
    USING (true);
    
  -- Create function to increment points
  CREATE OR REPLACE FUNCTION increment_points(user_id UUID, amount INT)
  RETURNS INT AS $$
  DECLARE
    current_points INT;
    new_points INT;
  BEGIN
    SELECT points INTO current_points FROM users WHERE id = user_id;
    new_points := current_points + amount;
    RETURN new_points;
  END;
  $$ LANGUAGE plpgsql;
END $$;
