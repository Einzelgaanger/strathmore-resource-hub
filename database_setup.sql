
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

-- Fix RLS policies for resources table
DO $$
BEGIN
  -- First, drop the existing policy
  DROP POLICY IF EXISTS "Resources can be inserted by class members" ON resources;
  
  -- Create a more permissive policy for resource insertion
  CREATE POLICY "Resources can be inserted by anyone with a valid user ID" ON resources
    FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL OR
      user_id IN (SELECT id FROM users)
    );
  
  -- Also make the Resources table readable by everyone
  DROP POLICY IF EXISTS "Resources are viewable by class members" ON resources;
  CREATE POLICY "Resources are viewable by everyone" ON resources
    FOR SELECT
    USING (true);
    
  -- Re-create storage policies
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
END $$;
