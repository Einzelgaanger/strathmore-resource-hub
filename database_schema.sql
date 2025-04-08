
-- myStrath Database Setup Script
-- This script creates all necessary tables, policies, and storage buckets for the myStrath application.

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing tables (if any)
DROP TABLE IF EXISTS marketing_content CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS completions CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS class_instances CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS semesters CASCADE;
DROP TABLE IF EXISTS years CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS ranks CASCADE;

-- Create Programs Table
CREATE TABLE programs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Courses Table
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name, program_id)
);

-- Create Years Table
CREATE TABLE years (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name, course_id)
);

-- Create Semesters Table
CREATE TABLE semesters (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  year_id INTEGER NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name, year_id)
);

-- Create Groups Table
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name, semester_id)
);

-- Create Class Instances Table
CREATE TABLE class_instances (
  id SERIAL PRIMARY KEY,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  year_id INTEGER NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  admin_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (program_id, course_id, year_id, semester_id, group_id)
);

-- Create Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_number TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL DEFAULT 'stratizens#web',
  profile_picture_url TEXT,
  class_instance_id INTEGER REFERENCES class_instances(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 1,
  reset_code TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Update the admin_id foreign key in class_instances
ALTER TABLE class_instances 
ADD CONSTRAINT class_instances_admin_id_fkey 
FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create Units Table
CREATE TABLE units (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  class_instance_id INTEGER NOT NULL REFERENCES class_instances(id) ON DELETE CASCADE,
  lecturer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (code, class_instance_id)
);

-- Create Resources Table
CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  file_url TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('assignment', 'note', 'past_paper')),
  likes INTEGER NOT NULL DEFAULT 0,
  dislikes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Completions Table
CREATE TABLE completions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, resource_id)
);

-- Create Comments Table
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Marketing Content Table
CREATE TABLE marketing_content (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('file', 'video', 'quote', 'image', 'text')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Ranks Table (this can be populated from the application)
CREATE TABLE ranks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  max_points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Storage Buckets
DO $$
BEGIN
  -- Check if storage schema exists before creating it
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    CREATE SCHEMA storage;
  END IF;

  -- Drop existing storage buckets if they exist
  DROP TABLE IF EXISTS storage.objects CASCADE;
  DROP TABLE IF EXISTS storage.buckets CASCADE;
  
  -- Recreate storage buckets
  CREATE TABLE IF NOT EXISTS storage.buckets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    public BOOLEAN DEFAULT FALSE,
    avif_autodetection BOOLEAN DEFAULT FALSE,
    file_size_limit INTEGER,
    allowed_mime_types TEXT[]
  );

  -- Create objects table
  CREATE TABLE IF NOT EXISTS storage.objects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bucket_id TEXT NOT NULL REFERENCES storage.buckets(id),
    name TEXT NOT NULL,
    owner UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB,
    path_tokens TEXT[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    CONSTRAINT unique_name_per_bucket UNIQUE (bucket_id, name)
  );

  -- Create resources bucket
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('resources', 'Resources Bucket', TRUE);

  -- Create profiles bucket
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('profiles', 'Profile Pictures Bucket', TRUE);

  -- Create marketing bucket
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('marketing', 'Marketing Content Bucket', TRUE);
END $$;

-- Create Storage Policies
DO $$
BEGIN
  -- Create resources policies
  DROP POLICY IF EXISTS "Resources Public Read" ON storage.objects;
  CREATE POLICY "Resources Public Read" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'resources');
  
  DROP POLICY IF EXISTS "Resources Authenticated Insert" ON storage.objects;
  CREATE POLICY "Resources Authenticated Insert" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'resources');
  
  DROP POLICY IF EXISTS "Resources Owner Update" ON storage.objects;
  CREATE POLICY "Resources Owner Update" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'resources' AND auth.uid()::text = SPLIT_PART(name, '/', 1));
  
  DROP POLICY IF EXISTS "Resources Owner Delete" ON storage.objects;
  CREATE POLICY "Resources Owner Delete" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'resources' AND auth.uid()::text = SPLIT_PART(name, '/', 1));
  
  -- Create profiles policies
  DROP POLICY IF EXISTS "Profiles Public Read" ON storage.objects;
  CREATE POLICY "Profiles Public Read" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'profiles');
  
  DROP POLICY IF EXISTS "Profiles Authenticated Insert" ON storage.objects;
  CREATE POLICY "Profiles Authenticated Insert" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'profiles');
  
  DROP POLICY IF EXISTS "Profiles Owner Update" ON storage.objects;
  CREATE POLICY "Profiles Owner Update" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'profiles' AND auth.uid()::text = SPLIT_PART(name, '/', 1));
  
  DROP POLICY IF EXISTS "Profiles Owner Delete" ON storage.objects;
  CREATE POLICY "Profiles Owner Delete" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'profiles' AND auth.uid()::text = SPLIT_PART(name, '/', 1));
  
  -- Create marketing policies
  DROP POLICY IF EXISTS "Marketing Public Read" ON storage.objects;
  CREATE POLICY "Marketing Public Read" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'marketing');
  
  DROP POLICY IF EXISTS "Marketing Admin Insert" ON storage.objects;
  CREATE POLICY "Marketing Admin Insert" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'marketing' AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE
    ));
  
  DROP POLICY IF EXISTS "Marketing Admin Update" ON storage.objects;
  CREATE POLICY "Marketing Admin Update" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'marketing' AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE
    ));
  
  DROP POLICY IF EXISTS "Marketing Admin Delete" ON storage.objects;
  CREATE POLICY "Marketing Admin Delete" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'marketing' AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE
    ));
END $$;

-- Populate Ranks table with predefined ranks
INSERT INTO ranks (name, icon, min_points, max_points) VALUES
('Freshman Scholar', '🔍', 0, 99),
('Knowledge Seeker', '📚', 100, 299),
('Dedicated Learner', '✏️', 300, 599),
('Resource Ranger', '🗂️', 600, 999),
('Academic Achiever', '🏆', 1000, 1499),
('Knowledge Champion', '🎓', 1500, 2199),
('Resource Virtuoso', '⭐', 2200, 2999),
('Campus Maven', '🌟', 3000, 3999),
('Educational Elite', '👑', 4000, 5499),
('Stratizen Legend', '🔱', 5500, 999999);

-- Create a super admin user (will be used across all class instances)
INSERT INTO users (admission_number, email, name, password, is_admin, is_super_admin) 
VALUES ('ADMIN001', 'admin@example.com', 'System Administrator', 'stratizens#web', TRUE, TRUE);

-- Store super admin ID for reference
DO $$
DECLARE
  super_admin_id UUID;
BEGIN
  SELECT id INTO super_admin_id FROM users WHERE admission_number = 'ADMIN001';

  -- Create marketing content from super admin
  INSERT INTO marketing_content (title, content, type, created_by) VALUES
  ('Welcome to myStrath', 'Welcome to the new resource sharing platform for Strathmore University students. Connect, share, and excel together!', 'text', super_admin_id),
  ('Upcoming Career Fair', 'Don''t miss the annual career fair next week. Bring your CV and meet potential employers!', 'text', super_admin_id),
  ('Study Tips for Finals', 'Create a study schedule, take regular breaks, and form study groups for better preparation.', 'quote', super_admin_id),
  ('Learning Resources Workshop', 'Join us for a workshop on effective study techniques and resource sharing this Friday at 3PM in the Main Auditorium.', 'text', super_admin_id);
END $$;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for access control
-- Users table policies
CREATE POLICY "Users can view other users in same class" ON users
  FOR SELECT 
  USING (auth.uid() IN (
    SELECT id FROM users WHERE class_instance_id = (
      SELECT class_instance_id FROM users WHERE id = auth.uid()
    )
  ) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE));

CREATE POLICY "Users can update their own record" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    (is_admin = (SELECT is_admin FROM users WHERE id = auth.uid())) AND
    (is_super_admin = (SELECT is_super_admin FROM users WHERE id = auth.uid()))
  );

-- Resources table policies
CREATE POLICY "Resources are viewable by class members" ON resources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM units 
      JOIN users ON users.class_instance_id = units.class_instance_id
      WHERE units.id = resources.unit_id AND users.id = auth.uid()
    ) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE)
  );

CREATE POLICY "Resources can be inserted by class members" ON resources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM units 
      JOIN users ON users.class_instance_id = units.class_instance_id
      WHERE units.id = unit_id AND users.id = auth.uid()
    ) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE)
  );

CREATE POLICY "Resources can be updated by owners or admins" ON resources
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM units 
      JOIN users ON users.class_instance_id = units.class_instance_id
      WHERE units.id = resources.unit_id AND users.id = auth.uid()
    ) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE)
  );

CREATE POLICY "Resources can be deleted by owners or admins" ON resources
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE)
  );

-- Comments table policies
CREATE POLICY "Comments are viewable by class members" ON comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resources 
      JOIN units ON units.id = resources.unit_id
      JOIN users ON users.class_instance_id = units.class_instance_id
      WHERE resources.id = comments.resource_id AND users.id = auth.uid()
    ) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE)
  );

CREATE POLICY "Comments can be inserted by class members" ON comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resources 
      JOIN units ON units.id = resources.unit_id
      JOIN users ON users.class_instance_id = units.class_instance_id
      WHERE resources.id = resource_id AND users.id = auth.uid()
    ) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE)
  );

CREATE POLICY "Comments can be updated by owners" ON comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Comments can be deleted by owners or admins" ON comments
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE)
  );

-- Completions table policies
CREATE POLICY "Completions are viewable by the owner" ON completions
  FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE));

CREATE POLICY "Completions can be inserted by the owner" ON completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Completions can be updated by the owner" ON completions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Completions can be deleted by the owner" ON completions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Marketing Content policies
CREATE POLICY "Marketing content is viewable by all" ON marketing_content
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Marketing content can be inserted by super admins" ON marketing_content
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE));

CREATE POLICY "Marketing content can be updated by super admins" ON marketing_content
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE));

CREATE POLICY "Marketing content can be deleted by super admins" ON marketing_content
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = TRUE));
