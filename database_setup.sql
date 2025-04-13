
-- Update RLS policies for comments table
DO $$
BEGIN
  -- Drop existing comment policies
  DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
  DROP POLICY IF EXISTS "Comments can be inserted by users" ON comments;
  DROP POLICY IF EXISTS "Comments can be inserted by anyone authenticated" ON comments;
  DROP POLICY IF EXISTS "Comments can be updated by owners" ON comments;
  DROP POLICY IF EXISTS "Comments can be deleted by owners or admins" ON comments;
  
  -- Create new more permissive policies
  CREATE POLICY "Comments are viewable by everyone" 
    ON comments FOR SELECT 
    USING (true);
  
  CREATE POLICY "Comments can be inserted by anyone" 
    ON comments FOR INSERT 
    WITH CHECK (true);
  
  CREATE POLICY "Comments can be updated by owners" 
    ON comments FOR UPDATE 
    USING (user_id = auth.uid() OR 
          EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)));
  
  CREATE POLICY "Comments can be deleted by owners or admins" 
    ON comments FOR DELETE 
    USING (user_id = auth.uid() OR 
          EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)));
    
  -- Update resource policies to ensure proper deletion
  DROP POLICY IF EXISTS "Resources are viewable by everyone" ON resources;
  DROP POLICY IF EXISTS "Resources can be inserted by anyone authenticated" ON resources;
  DROP POLICY IF EXISTS "Resources can be inserted by anyone with a valid user ID" ON resources;
  DROP POLICY IF EXISTS "Resources can be updated by owners or admins" ON resources;
  DROP POLICY IF EXISTS "Resources can be deleted by owners or admins" ON resources;
  
  -- Create new policies for resources
  CREATE POLICY "Resources are viewable by everyone" 
    ON resources FOR SELECT 
    USING (true);
  
  CREATE POLICY "Resources can be inserted by anyone" 
    ON resources FOR INSERT 
    WITH CHECK (true);
  
  CREATE POLICY "Resources can be updated by owners or admins" 
    ON resources FOR UPDATE 
    USING (user_id = auth.uid() OR 
          EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)));
  
  CREATE POLICY "Resources can be deleted by owners or admins" 
    ON resources FOR DELETE 
    USING (user_id = auth.uid() OR 
          EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)));
    
  -- Update completions policies
  DROP POLICY IF EXISTS "Completions are viewable by everyone" ON completions;
  DROP POLICY IF EXISTS "Completions can be inserted by users" ON completions;
  DROP POLICY IF EXISTS "Completions can be inserted by anyone authenticated" ON completions;
  
  CREATE POLICY "Completions are viewable by everyone" 
    ON completions FOR SELECT 
    USING (true);
  
  CREATE POLICY "Completions can be inserted by anyone" 
    ON completions FOR INSERT 
    WITH CHECK (true);
    
  CREATE POLICY "Completions can be deleted by anyone" 
    ON completions FOR DELETE 
    USING (true);
END $$;
