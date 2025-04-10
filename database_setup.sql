
-- Update storage.objects table to include owner_id and user_metadata columns
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
END $$;
