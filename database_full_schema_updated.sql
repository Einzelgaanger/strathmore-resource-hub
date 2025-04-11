
-- Full database schema including all tables, policies, and functions
-- This is the most up-to-date version with all fixes applied

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_number TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL DEFAULT 'stratizens#web',
  class_instance_id INTEGER NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  is_super_admin BOOLEAN DEFAULT false,
  points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 1,
  profile_picture_url TEXT,
  reset_code TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create the class_instances table
CREATE TABLE IF NOT EXISTS class_instances (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  semester INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create the units table
CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  lecturer TEXT NOT NULL,
  class_instance_id INTEGER REFERENCES class_instances(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create the resources table
CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  unit_id INTEGER REFERENCES units(id),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('assignment', 'note', 'past_paper')),
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create the completions table
CREATE TABLE IF NOT EXISTS completions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  resource_id INTEGER REFERENCES resources(id),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

-- Create the comments table
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  resource_id INTEGER REFERENCES resources(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create the marketing_content table
CREATE TABLE IF NOT EXISTS marketing_content (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_content ENABLE ROW LEVEL SECURITY;

-- Ensure storage.objects has all required columns
ALTER TABLE storage.objects ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE storage.objects ADD COLUMN IF NOT EXISTS user_metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE storage.objects ADD COLUMN IF NOT EXISTS version TEXT;

-- RLS policies for users
CREATE POLICY "Users can be viewed by anyone" ON users
  FOR SELECT
  USING (true);

-- RLS policies for class_instances
CREATE POLICY "Class instances can be viewed by anyone" ON class_instances
  FOR SELECT
  USING (true);

-- RLS policies for units
CREATE POLICY "Units can be viewed by anyone" ON units
  FOR SELECT
  USING (true);

-- RLS policies for resources
CREATE POLICY "Resources are viewable by everyone" ON resources
  FOR SELECT
  USING (true);

CREATE POLICY "Resources can be inserted by anyone authenticated" ON resources
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Resources can be updated by owners or admins" ON resources
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true OR is_super_admin = true)
  );

CREATE POLICY "Resources can be deleted by owners or admins" ON resources
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true OR is_super_admin = true)
  );

-- RLS policies for completions
CREATE POLICY "Completions are viewable by everyone" ON completions
  FOR SELECT
  USING (true);

CREATE POLICY "Completions can be inserted by anyone authenticated" ON completions
  FOR INSERT
  WITH CHECK (true);

-- RLS policies for comments
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT
  USING (true);

CREATE POLICY "Comments can be inserted by anyone authenticated" ON comments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Comments can be updated by owners" ON comments
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true OR is_super_admin = true)
  );

CREATE POLICY "Comments can be deleted by owners or admins" ON comments
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true OR is_super_admin = true)
  );

-- RLS policies for marketing_content
CREATE POLICY "Marketing content is viewable by everyone" ON marketing_content
  FOR SELECT
  USING (true);

CREATE POLICY "Marketing content can be inserted by admins" ON marketing_content
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true OR is_super_admin = true)
  );

-- Storage bucket policies
CREATE POLICY "Resources Public Read" ON storage.objects
  FOR SELECT
  USING (true);

CREATE POLICY "Resources Authenticated Insert" ON storage.objects
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Resources Owner Update" ON storage.objects
  FOR UPDATE
  USING (true);

CREATE POLICY "Resources Owner Delete" ON storage.objects
  FOR DELETE
  USING (true);

CREATE POLICY "Public Access" ON storage.buckets
  FOR SELECT
  USING (true);

-- Function to increment points
CREATE OR REPLACE FUNCTION increment_points(user_id UUID, amount INT)
RETURNS INT AS $$
DECLARE
  current_points INT;
  new_points INT;
BEGIN
  SELECT points INTO current_points FROM users WHERE id = user_id;
  IF current_points IS NULL THEN
    current_points := 0;
  END IF;
  new_points := current_points + amount;
  
  UPDATE users SET points = new_points WHERE id = user_id;
  
  RETURN new_points;
END;
$$ LANGUAGE plpgsql;

-- Sample data for classes and units (if needed)
INSERT INTO class_instances (name, academic_year, semester)
VALUES ('BBIT Class A', '2024-2025', 1),
       ('BBIT Class B', '2024-2025', 1)
ON CONFLICT DO NOTHING;

INSERT INTO units (name, code, lecturer, class_instance_id)
VALUES 
  ('Database Systems', 'DASE 2101', 'Dr. Smith', 1),
  ('Web Programming', 'WEBP 2201', 'Prof. Johnson', 1),
  ('Object-Oriented Programming', 'OOPS 2301', 'Dr. Williams', 1),
  ('Data Structures & Algorithms', 'DSAL 2102', 'Dr. Jones', 2),
  ('Software Engineering', 'SENG 2201', 'Prof. Brown', 2)
ON CONFLICT DO NOTHING;
