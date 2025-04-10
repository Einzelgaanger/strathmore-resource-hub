
-- Update storage.objects table to include owner_id column
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
END $$;
