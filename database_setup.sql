
-- myStrath Database Setup Script
-- This script creates all necessary tables, policies, and storage buckets for the myStrath application.

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
  description TEXT,
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
VALUES ('ADMIN001', 'admin@mystrathapp.com', 'System Administrator', 'stratizens#web', TRUE, TRUE);

------------------------------
-- CLASS INSTANCE 1: Bachelor's - Statistics and Data Science - Year 2 - Semester 1 - Group A
------------------------------
DO $$
DECLARE
  v_program_id INTEGER;
  v_course_id INTEGER;
  v_year_id INTEGER;
  v_semester_id INTEGER;
  v_group_id INTEGER;
  v_class_instance_id INTEGER;
  v_class_admin_id UUID;
  v_super_admin_id UUID;
BEGIN
  -- Get super admin ID
  SELECT id INTO v_super_admin_id FROM users WHERE admission_number = 'ADMIN001';

  -- Create program
  INSERT INTO programs (name) VALUES ('Bachelor''s') RETURNING id INTO v_program_id;
  
  -- Create course
  INSERT INTO courses (name, program_id) VALUES ('Statistics and Data Science', v_program_id) RETURNING id INTO v_course_id;
  
  -- Create year
  INSERT INTO years (name, course_id) VALUES ('Year 2', v_course_id) RETURNING id INTO v_year_id;
  
  -- Create semester
  INSERT INTO semesters (name, year_id) VALUES ('Semester 1', v_year_id) RETURNING id INTO v_semester_id;
  
  -- Create group
  INSERT INTO groups (name, semester_id) VALUES ('Group A', v_semester_id) RETURNING id INTO v_group_id;
  
  -- Create class instance
  INSERT INTO class_instances (
    program_id, 
    course_id, 
    year_id, 
    semester_id, 
    group_id,
    description
  )
  VALUES (
    v_program_id, 
    v_course_id, 
    v_year_id, 
    v_semester_id, 
    v_group_id,
    'Bachelor''s - Statistics and Data Science - Year 2 - Semester 1 - Group A'
  )
  RETURNING id INTO v_class_instance_id;
  
  -- Create class admin
  INSERT INTO users (admission_number, email, name, class_instance_id, is_admin)
  VALUES ('184087', '184087@strathmore.edu', 'Victoria Mutheu', v_class_instance_id, TRUE)
  RETURNING id INTO v_class_admin_id;
  
  -- Set admin for class instance
  UPDATE class_instances SET admin_id = v_class_admin_id WHERE id = v_class_instance_id;
  
  -- Add units for this class
  INSERT INTO units (name, code, class_instance_id, lecturer) VALUES
  ('Integral Calculus', 'MAT 2101', v_class_instance_id, 'Dr. Mary Johnson'),
  ('Real Analysis', 'MAT 2102', v_class_instance_id, 'Dr. James Smith'),
  ('Probability Theory', 'STA 2101', v_class_instance_id, 'Dr. Elizabeth Wilson'),
  ('Algorithms and Data Structures', 'DAT 2101', v_class_instance_id, 'Dr. Michael Brown'),
  ('Information Security, Governance and the Cloud', 'DAT 2102', v_class_instance_id, 'Dr. Sarah Taylor'),
  ('Principles of Ethics', 'HED 2101', v_class_instance_id, 'Dr. Robert Anderson');

  -- Insert students for this class
  INSERT INTO users (admission_number, email, name, class_instance_id) VALUES
  ('167020', '167020@strathmore.edu', 'Priscillah Gathoni', v_class_instance_id),
  ('170757', '170757@strathmore.edu', 'Ethan Joseph', v_class_instance_id),
  ('171423', '171423@strathmore.edu', 'Neeza Musemakweli', v_class_instance_id),
  ('171820', '171820@strathmore.edu', 'Ainembabazi Ruth', v_class_instance_id),
  ('172064', '172064@strathmore.edu', 'Natasha Nyanginda', v_class_instance_id),
  ('172089', '172089@strathmore.edu', 'Nelly Mwende', v_class_instance_id),
  ('173461', '173461@strathmore.edu', 'Joyrose Njahira', v_class_instance_id),
  ('176587', '176587@strathmore.edu', 'Caredge Osir', v_class_instance_id),
  ('179181', '179181@strathmore.edu', 'Shedrin Wambui', v_class_instance_id),
  ('181140', '181140@strathmore.edu', 'Whitney Waithera', v_class_instance_id),
  ('184288', '184288@strathmore.edu', 'Calvin Odete', v_class_instance_id),
  ('187692', '187692@strathmore.edu', 'Ruth Jerop', v_class_instance_id),
  ('189522', '189522@strathmore.edu', 'Collins', v_class_instance_id),
  ('189613', '189613@strathmore.edu', 'Chelsie Nyangau', v_class_instance_id),
  ('189825', '189825@strathmore.edu', 'Samuel Chuchu', v_class_instance_id),
  ('190038', '190038@strathmore.edu', 'Darryl Kariuki', v_class_instance_id),
  ('190039', '190039@strathmore.edu', 'Nathan Shisia Kipkoske', v_class_instance_id),
  ('190046', '190046@strathmore.edu', 'Tyrone Seremani', v_class_instance_id),
  ('190054', '190054@strathmore.edu', 'Gloria Mwihaki', v_class_instance_id),
  ('190055', '190055@strathmore.edu', 'Imani Wairimu', v_class_instance_id);

  -- Add some marketing content
  INSERT INTO marketing_content (title, content, type, created_by) VALUES
  ('Welcome to myStrath', 'Welcome to the new resource sharing platform for Strathmore University students. Connect, share, and excel together!', 'text', v_super_admin_id),
  ('Upcoming Career Fair', 'Don''t miss the annual career fair next week. Bring your CV and meet potential employers!', 'text', v_super_admin_id),
  ('Study Tips for Finals', 'Create a study schedule, take regular breaks, and form study groups for better preparation.', 'quote', v_super_admin_id),
  ('Learning Resources Workshop', 'Join us for a workshop on effective study techniques and resource sharing this Friday at 3PM in the Main Auditorium.', 'text', v_super_admin_id);
END $$;

------------------------------
-- CLASS INSTANCE 2: Bachelor's - Statistics and Data Science - Year 2 - Semester 1 - Group B
------------------------------
DO $$
DECLARE
  v_program_id INTEGER;
  v_course_id INTEGER;
  v_year_id INTEGER;
  v_semester_id INTEGER;
  v_group_id INTEGER;
  v_class_instance_id INTEGER;
  v_class_admin_id UUID;
BEGIN
  -- Get existing program
  SELECT id INTO v_program_id FROM programs WHERE name = 'Bachelor''s';
  
  -- Get existing course (explicitly qualify column references)
  SELECT id INTO v_course_id FROM courses WHERE name = 'Statistics and Data Science' AND courses.program_id = v_program_id;
  
  -- Get existing year
  SELECT id INTO v_year_id FROM years WHERE name = 'Year 2' AND years.course_id = v_course_id;
  
  -- Get existing semester
  SELECT id INTO v_semester_id FROM semesters WHERE name = 'Semester 1' AND semesters.year_id = v_year_id;
  
  -- Create new group
  INSERT INTO groups (name, semester_id) VALUES ('Group B', v_semester_id) RETURNING id INTO v_group_id;
  
  -- Create class instance
  INSERT INTO class_instances (
    program_id, 
    course_id, 
    year_id, 
    semester_id, 
    group_id,
    description
  )
  VALUES (
    v_program_id, 
    v_course_id, 
    v_year_id, 
    v_semester_id, 
    v_group_id,
    'Bachelor''s - Statistics and Data Science - Year 2 - Semester 1 - Group B'
  )
  RETURNING id INTO v_class_instance_id;
  
  -- Create class admin
  INSERT INTO users (admission_number, email, name, class_instance_id, is_admin)
  VALUES ('190037', '190037@strathmore.edu', 'Angela Nyawira', v_class_instance_id, TRUE)
  RETURNING id INTO v_class_admin_id;
  
  -- Set admin for class instance
  UPDATE class_instances SET admin_id = v_class_admin_id WHERE id = v_class_instance_id;
  
  -- Add units for this class
  INSERT INTO units (name, code, class_instance_id, lecturer) VALUES
  ('Integral Calculus', 'MAT 2101', v_class_instance_id, 'Dr. Mary Johnson'),
  ('Real Analysis', 'MAT 2102', v_class_instance_id, 'Dr. James Smith'),
  ('Probability Theory', 'STA 2101', v_class_instance_id, 'Dr. Elizabeth Wilson'),
  ('Algorithms and Data Structures', 'DAT 2101', v_class_instance_id, 'Dr. Michael Brown'),
  ('Information Security, Governance and the Cloud', 'DAT 2102', v_class_instance_id, 'Dr. Sarah Taylor'),
  ('Principles of Ethics', 'HED 2101', v_class_instance_id, 'Dr. Robert Anderson');

  -- Insert students for this class
  INSERT INTO users (admission_number, email, name, class_instance_id) VALUES
  ('163336', '163336@strathmore.edu', 'Samsam Abdul Nassir', v_class_instance_id),
  ('170743', '170743@strathmore.edu', 'Alvin Lemayian', v_class_instance_id),
  ('171723', '171723@strathmore.edu', 'Angel', v_class_instance_id),
  ('176584', '176584@strathmore.edu', 'Esther Rabera', v_class_instance_id),
  ('176834', '176834@strathmore.edu', 'Lina Moraa', v_class_instance_id),
  ('178916', '178916@strathmore.edu', 'Elvis Macharia', v_class_instance_id),
  ('179087', '179087@strathmore.edu', 'Andres Ngotho', v_class_instance_id),
  ('179514', '179514@strathmore.edu', 'Wendy Wanjiru', v_class_instance_id),
  ('180657', '180657@strathmore.edu', 'Kiptoo', v_class_instance_id),
  ('180963', '180963@strathmore.edu', 'Alfred Mulinge', v_class_instance_id),
  ('181038', '181038@strathmore.edu', 'Sylvia Waithira', v_class_instance_id),
  ('186768', '186768@strathmore.edu', 'Effie Nelima', v_class_instance_id),
  ('187500', '187500@strathmore.edu', 'Edwin Karanu', v_class_instance_id),
  ('188145', '188145@strathmore.edu', 'Kristina Nasieku', v_class_instance_id),
  ('189104', '189104@strathmore.edu', 'Francis Mburu', v_class_instance_id),
  ('189228', '189228@strathmore.edu', 'Griffin Che', v_class_instance_id),
  ('189229', '189229@strathmore.edu', 'Justin Gitari', v_class_instance_id),
  ('189612', '189612@strathmore.edu', 'Ian Muchai', v_class_instance_id),
  ('189778', '189778@strathmore.edu', 'Wenwah Hawala', v_class_instance_id),
  ('190069', '190069@strathmore.edu', 'Janice Muthoki', v_class_instance_id);
END $$;

------------------------------
-- CLASS INSTANCE 3: Bachelor's - Computer Science - Year 3 - Semester 2 - Group A
------------------------------
DO $$
DECLARE
  v_program_id INTEGER;
  v_course_id INTEGER;
  v_year_id INTEGER;
  v_semester_id INTEGER;
  v_group_id INTEGER;
  v_class_instance_id INTEGER;
  v_class_admin_id UUID;
BEGIN
  -- Get existing program
  SELECT id INTO v_program_id FROM programs WHERE name = 'Bachelor''s';
  
  -- Create new course
  INSERT INTO courses (name, program_id) VALUES ('Computer Science', v_program_id) RETURNING id INTO v_course_id;
  
  -- Create new year
  INSERT INTO years (name, course_id) VALUES ('Year 3', v_course_id) RETURNING id INTO v_year_id;
  
  -- Create new semester
  INSERT INTO semesters (name, year_id) VALUES ('Semester 2', v_year_id) RETURNING id INTO v_semester_id;
  
  -- Create new group
  INSERT INTO groups (name, semester_id) VALUES ('Group A', v_semester_id) RETURNING id INTO v_group_id;
  
  -- Create class instance
  INSERT INTO class_instances (
    program_id, 
    course_id, 
    year_id, 
    semester_id, 
    group_id,
    description
  )
  VALUES (
    v_program_id, 
    v_course_id, 
    v_year_id, 
    v_semester_id, 
    v_group_id,
    'Bachelor''s - Computer Science - Year 3 - Semester 2 - Group A'
  )
  RETURNING id INTO v_class_instance_id;
  
  -- Create class admin (with different admission number to avoid duplicate)
  INSERT INTO users (admission_number, email, name, class_instance_id, is_admin)
  VALUES ('165011', '165011@strathmore.edu', 'John Doe', v_class_instance_id, TRUE)
  RETURNING id INTO v_class_admin_id;
  
  -- Set admin for class instance
  UPDATE class_instances SET admin_id = v_class_admin_id WHERE id = v_class_instance_id;
  
  -- Add units for this class
  INSERT INTO units (name, code, class_instance_id, lecturer) VALUES
  ('Advanced Database Systems', 'CSC 3101', v_class_instance_id, 'Dr. Patricia Ngugi'),
  ('Machine Learning', 'CSC 3102', v_class_instance_id, 'Dr. Keith Wangwe'),
  ('Computer Networks', 'CSC 3103', v_class_instance_id, 'Dr. Anne Mwangi'),
  ('Software Engineering', 'CSC 3104', v_class_instance_id, 'Dr. Felix Kamau'),
  ('Mobile Application Development', 'CSC 3105', v_class_instance_id, 'Dr. Victor Omondi'),
  ('Project Management', 'BUS 3101', v_class_instance_id, 'Dr. Grace Wairimu');

  -- Insert students for this class (with updated admission numbers to avoid duplicates)
  INSERT INTO users (admission_number, email, name, class_instance_id) VALUES
  ('165001', '165001@strathmore.edu', 'John Smith', v_class_instance_id),
  ('165002', '165002@strathmore.edu', 'Jane Doe', v_class_instance_id),
  ('165003', '165003@strathmore.edu', 'Michael Brown', v_class_instance_id),
  ('165004', '165004@strathmore.edu', 'Emily Wilson', v_class_instance_id),
  ('165005', '165005@strathmore.edu', 'Daniel Johnson', v_class_instance_id),
  ('165006', '165006@strathmore.edu', 'Olivia Davis', v_class_instance_id),
  ('165007', '165007@strathmore.edu', 'David Taylor', v_class_instance_id),
  ('165008', '165008@strathmore.edu', 'Sophia Anderson', v_class_instance_id),
  ('165009', '165009@strathmore.edu', 'James Martinez', v_class_instance_id),
  ('165010', '165010@strathmore.edu', 'Emma Garcia', v_class_instance_id);
END $$;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_content ENABLE ROW LEVEL SECURITY;

-- Create and setup RLS policies for tables

-- Fix the infinite recursion in the users RLS policy
DROP POLICY IF EXISTS "Users can view other users in same class" ON users;

-- Create a simpler policy that doesn't cause recursion
CREATE POLICY "Users can view other users in same class" ON users
  FOR SELECT 
  USING (true);  -- Allow all users to be visible for now

-- Users can update their own record
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

-- Create storage policies
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

-- Create function to ensure users can login with default password
CREATE OR REPLACE FUNCTION reset_auth_user_passwords()
RETURNS void AS $$
DECLARE
  user_rec RECORD;
BEGIN
  -- For testing, reset all auth users to use the default password
  FOR user_rec IN 
    SELECT au.id, au.email, u.password
    FROM auth.users au
    JOIN users u ON au.email = u.email
  LOOP
    BEGIN
      -- Reset the password to the default one in the users table
      UPDATE auth.users
      SET password = crypt(COALESCE(user_rec.password, 'stratizens#web'), gen_salt('bf')),
          updated_at = NOW()
      WHERE id = user_rec.id;
      
      RAISE NOTICE 'Reset password for auth user %', user_rec.email;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error resetting password for %: %', user_rec.email, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create auth users for the admission numbers in our system if they don't exist
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  -- For each user in our users table, create auth user if not exists
  FOR user_rec IN 
    SELECT admission_number, email, password 
    FROM users 
  LOOP
    BEGIN
      -- Only insert if the user doesn't exist in auth.users
      IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_rec.email) THEN
        -- Create the auth user with the same password
        INSERT INTO auth.users (email, password, raw_app_meta_data, raw_user_meta_data)
        VALUES (
          user_rec.email,
          crypt(COALESCE(user_rec.password, 'stratizens#web'), gen_salt('bf')),
          '{"provider":"email","providers":["email"]}',
          json_build_object('admission_number', user_rec.admission_number)::jsonb
        );
        RAISE NOTICE 'Created auth user for %', user_rec.email;
      ELSE
        -- Update the password for existing auth user to ensure it matches
        UPDATE auth.users
        SET password = crypt(COALESCE(user_rec.password, 'stratizens#web'), gen_salt('bf')),
            updated_at = NOW()
        WHERE email = user_rec.email;
        RAISE NOTICE 'Updated password for existing auth user %', user_rec.email;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue
      RAISE NOTICE 'Error creating/updating auth user for %: %', user_rec.email, SQLERRM;
    END;
  END LOOP;
END $$;

-- Execute the password reset function
SELECT reset_auth_user_passwords();

-- Update the last login timestamp when a user logs in successfully
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_login = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth.users table
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.handle_user_login();

-- Sync auth.users with public.users
CREATE OR REPLACE FUNCTION sync_user_ids()
RETURNS void AS $$
DECLARE
  auth_user RECORD;
  public_user RECORD;
BEGIN
  -- For each auth user, find matching public user by email and set the ID
  FOR auth_user IN 
    SELECT au.id, au.email
    FROM auth.users au
  LOOP
    BEGIN
      -- Find matching user by email
      SELECT id INTO public_user 
      FROM users
      WHERE email = auth_user.email
      LIMIT 1;
      
      IF FOUND THEN
        -- Update the public user to have the same ID as auth user
        UPDATE users
        SET id = auth_user.id
        WHERE email = auth_user.email AND id != auth_user.id;
        
        RAISE NOTICE 'Synchronized user ID for email: %', auth_user.email;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error syncing user for %: %', auth_user.email, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the ID synchronization
SELECT sync_user_ids();

-- Modified auth hook function to avoid duplicate key errors
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already exists in public.users before inserting
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.users (id, email, name, admission_number)
    VALUES (NEW.id, NEW.email, 'New User', 'TEMP' || NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
