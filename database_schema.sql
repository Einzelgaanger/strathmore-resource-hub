
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

-- Create Class Instances Table with Description
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
BEGIN
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
  
  -- Create class instance with description
  INSERT INTO class_instances (program_id, course_id, year_id, semester_id, group_id, description)
  VALUES (v_program_id, v_course_id, v_year_id, v_semester_id, v_group_id, 'Bachelor''s - Statistics and Data Science - Year 2 - Semester 1 - Group A')
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
  
  -- Create super admin account for this class
  INSERT INTO users (admission_number, email, name, class_instance_id, is_admin, is_super_admin) 
  VALUES ('SADMIN1', 'sadmin1@strathmore.edu', 'Super Admin (SDS Y2 S1 GA)', v_class_instance_id, TRUE, TRUE);
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
  
  -- Create class instance with description
  INSERT INTO class_instances (program_id, course_id, year_id, semester_id, group_id, description)
  VALUES (v_program_id, v_course_id, v_year_id, v_semester_id, v_group_id, 'Bachelor''s - Statistics and Data Science - Year 2 - Semester 1 - Group B')
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
  
  -- Create super admin account for this class
  INSERT INTO users (admission_number, email, name, class_instance_id, is_admin, is_super_admin) 
  VALUES ('SADMIN2', 'sadmin2@strathmore.edu', 'Super Admin (SDS Y2 S1 GB)', v_class_instance_id, TRUE, TRUE);
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
  
  -- Create class instance with description
  INSERT INTO class_instances (program_id, course_id, year_id, semester_id, group_id, description)
  VALUES (v_program_id, v_course_id, v_year_id, v_semester_id, v_group_id, 'Bachelor''s - Computer Science - Year 3 - Semester 2 - Group A')
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
  
  -- Create super admin account for this class
  INSERT INTO users (admission_number, email, name, class_instance_id, is_admin, is_super_admin) 
  VALUES ('SADMIN3', 'sadmin3@strathmore.edu', 'Super Admin (CS Y3 S2 GA)', v_class_instance_id, TRUE, TRUE);
END $$;

------------------------------
-- CLASS INSTANCE 4: Master's - Data Science - Year 1 - Semester 1 - Group A
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
  -- Create new program
  INSERT INTO programs (name) VALUES ('Master''s') RETURNING id INTO v_program_id;
  
  -- Create new course
  INSERT INTO courses (name, program_id) VALUES ('Data Science', v_program_id) RETURNING id INTO v_course_id;
  
  -- Create new year
  INSERT INTO years (name, course_id) VALUES ('Year 1', v_course_id) RETURNING id INTO v_year_id;
  
  -- Create new semester
  INSERT INTO semesters (name, year_id) VALUES ('Semester 1', v_year_id) RETURNING id INTO v_semester_id;
  
  -- Create new group
  INSERT INTO groups (name, semester_id) VALUES ('Group A', v_semester_id) RETURNING id INTO v_group_id;
  
  -- Create class instance with description
  INSERT INTO class_instances (program_id, course_id, year_id, semester_id, group_id, description)
  VALUES (v_program_id, v_course_id, v_year_id, v_semester_id, v_group_id, 'Master''s - Data Science - Year 1 - Semester 1 - Group A')
  RETURNING id INTO v_class_instance_id;
  
  -- Create class admin
  INSERT INTO users (admission_number, email, name, class_instance_id, is_admin)
  VALUES ('195001', '195001@strathmore.edu', 'Sophia Kumar', v_class_instance_id, TRUE)
  RETURNING id INTO v_class_admin_id;
  
  -- Set admin for class instance
  UPDATE class_instances SET admin_id = v_class_admin_id WHERE id = v_class_instance_id;
  
  -- Add units for this class
  INSERT INTO units (name, code, class_instance_id, lecturer) VALUES
  ('Advanced Data Analysis', 'DAT 5101', v_class_instance_id, 'Prof. Lisa Johnson'),
  ('Big Data Technologies', 'DAT 5102', v_class_instance_id, 'Prof. Richard Smith'),
  ('Statistical Learning', 'STA 5101', v_class_instance_id, 'Prof. Mary Williams'),
  ('Data Mining and Knowledge Discovery', 'DAT 5103', v_class_instance_id, 'Prof. Joseph Brown'),
  ('Research Methods', 'RES 5101', v_class_instance_id, 'Prof. Catherine Lee');

  -- Insert students for this class
  INSERT INTO users (admission_number, email, name, class_instance_id) VALUES
  ('195002', '195002@strathmore.edu', 'Raj Patel', v_class_instance_id),
  ('195003', '195003@strathmore.edu', 'Aisha Mohamed', v_class_instance_id),
  ('195004', '195004@strathmore.edu', 'Kwame Osei', v_class_instance_id),
  ('195005', '195005@strathmore.edu', 'Liu Wei', v_class_instance_id),
  ('195006', '195006@strathmore.edu', 'Isabella Garcia', v_class_instance_id),
  ('195007', '195007@strathmore.edu', 'Hiroshi Tanaka', v_class_instance_id),
  ('195008', '195008@strathmore.edu', 'Elena Petrov', v_class_instance_id);
  
  -- Create super admin account for this class
  INSERT INTO users (admission_number, email, name, class_instance_id, is_admin, is_super_admin) 
  VALUES ('SADMIN4', 'sadmin4@strathmore.edu', 'Super Admin (DS MS Y1 S1 GA)', v_class_instance_id, TRUE, TRUE);
END $$;

------------------------------
-- CLASS INSTANCE 5: Bachelor's - Business Information Technology - Year 1 - Semester 2 - Group C
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
  INSERT INTO courses (name, program_id) VALUES ('Business Information Technology', v_program_id) RETURNING id INTO v_course_id;
  
  -- Create new year
  INSERT INTO years (name, course_id) VALUES ('Year 1', v_course_id) RETURNING id INTO v_year_id;
  
  -- Create new semester
  INSERT INTO semesters (name, year_id) VALUES ('Semester 2', v_year_id) RETURNING id INTO v_semester_id;
  
  -- Create new group
  INSERT INTO groups (name, semester_id) VALUES ('Group C', v_semester_id) RETURNING id INTO v_group_id;
  
  -- Create class instance with description
  INSERT INTO class_instances (program_id, course_id, year_id, semester_id, group_id, description)
  VALUES (v_program_id, v_course_id, v_year_id, v_semester_id, v_group_id, 'Bachelor''s - Business Information Technology - Year 1 - Semester 2 - Group C')
  RETURNING id INTO v_class_instance_id;
  
  -- Create class admin
  INSERT INTO users (admission_number, email, name, class_instance_id, is_admin)
  VALUES ('192501', '192501@strathmore.edu', 'Brian Mwangi', v_class_instance_id, TRUE)
  RETURNING id INTO v_class_admin_id;
  
  -- Set admin for class instance
  UPDATE class_instances SET admin_id = v_class_admin_id WHERE id = v_class_instance_id;
  
  -- Add units for this class
  INSERT INTO units (name, code, class_instance_id, lecturer) VALUES
  ('Introduction to Programming', 'BIT 1201', v_class_instance_id, 'Dr. Peter Karani'),
  ('Business Communication', 'BIT 1202', v_class_instance_id, 'Dr. Joyce Wanjiku'),
  ('Introduction to Accounting', 'BIT 1203', v_class_instance_id, 'Dr. Samson Kiprotich'),
  ('Discrete Mathematics', 'BIT 1204', v_class_instance_id, 'Dr. Mary Wambui'),
  ('Web Design', 'BIT 1205', v_class_instance_id, 'Dr. James Kamau');

  -- Insert students for this class
  INSERT INTO users (admission_number, email, name, class_instance_id) VALUES
  ('192502', '192502@strathmore.edu', 'Kevin Otieno', v_class_instance_id),
  ('192503', '192503@strathmore.edu', 'Faith Wanjiru', v_class_instance_id),
  ('192504', '192504@strathmore.edu', 'Dennis Kimani', v_class_instance_id),
  ('192505', '192505@strathmore.edu', 'Mercy Wambui', v_class_instance_id),
  ('192506', '192506@strathmore.edu', 'George Maina', v_class_instance_id),
  ('192507', '192507@strathmore.edu', 'Linda Atieno', v_class_instance_id),
  ('192508', '192508@strathmore.edu', 'Stephen Kamau', v_class_instance_id),
  ('192509', '192509@strathmore.edu', 'Esther Muthoni', v_class_instance_id),
  ('192510', '192510@strathmore.edu', 'Paul Njoroge', v_class_instance_id),
  ('192511', '192511@strathmore.edu', 'Catherine Njeri', v_class_instance_id),
  ('192512', '192512@strathmore.edu', 'Patrick Ochieng', v_class_instance_id),
  ('192513', '192513@strathmore.edu', 'Nancy Wanjiku', v_class_instance_id),
  ('192514', '192514@strathmore.edu', 'David Mwangi', v_class_instance_id),
  ('192515', '192515@strathmore.edu', 'Susan Achieng', v_class_instance_id);
  
  -- Create super admin account for this class
  INSERT INTO users (admission_number, email, name, class_instance_id, is_admin, is_super_admin) 
  VALUES ('SADMIN5', 'sadmin5@strathmore.edu', 'Super Admin (BIT Y1 S2 GC)', v_class_instance_id, TRUE, TRUE);
END $$;

------------------------------
-- CLASS INSTANCE 6: Bachelor's - Law - Year 3 - Semester 1 - Group A
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
  INSERT INTO courses (name, program_id) VALUES ('Law', v_program_id) RETURNING id INTO v_course_id;
  
  -- Create new year
  INSERT INTO years (name, course_id) VALUES ('Year 3', v_course_id) RETURNING id INTO v_year_id;
  
  -- Create new semester
  INSERT INTO semesters (name, year_id) VALUES ('Semester 1', v_year_id) RETURNING id INTO v_semester_id;
  
  -- Create new group
  INSERT INTO groups (name, semester_id) VALUES ('Group A', v_semester_id) RETURNING id INTO v_group_id;
  
  -- Create class instance with description
  INSERT INTO class_instances (program_id, course_id, year_id, semester_id, group_id, description)
  VALUES (v_program_id, v_course_id, v_year_id, v_semester_id, v_group_id, 'Bachelor''s - Law - Year 3 - Semester 1 - Group A')
  RETURNING id INTO v_class_instance_id;
  
  -- Create class admin
  INSERT INTO users (admission_number, email, name, class_instance_id, is_admin)
  VALUES ('153001', '153001@strathmore.edu', 'Martha Kamau', v_class_instance_id, TRUE)
  RETURNING id INTO v_class_admin_id;
  
  -- Set admin for class instance
  UPDATE class_instances SET admin_id = v_class_admin_id WHERE id = v_class_instance_id;
  
  -- Add units for this class
  INSERT INTO units (name, code, class_instance_id, lecturer) VALUES
  ('Constitutional Law', 'LAW 3101', v_class_instance_id, 'Prof. James Orengo'),
  ('Criminal Law', 'LAW 3102', v_class_instance_id, 'Prof. Nancy Baraza'),
  ('International Human Rights Law', 'LAW 3103', v_class_instance_id, 'Prof. Otiende Amollo'),
  ('Property Law', 'LAW 3104', v_class_instance_id, 'Prof. Patricia Nyaundi'),
  ('Legal Research and Writing', 'LAW 3105', v_class_instance_id, 'Prof. Eric Mutua');

  -- Insert students for this class
  INSERT INTO users (admission_number, email, name, class_instance_id) VALUES
  ('153002', '153002@strathmore.edu', 'Irene Akinyi', v_class_instance_id),
  ('153003', '153003@strathmore.edu', 'Joel Karanja', v_class_instance_id),
  ('153004', '153004@strathmore.edu', 'Lucy Wanjiku', v_class_instance_id),
  ('153005', '153005@strathmore.edu', 'Brian Omondi', v_class_instance_id),
  ('153006', '153006@strathmore.edu', 'Diana Wambui', v_class_instance_id),
  ('153007', '153007@strathmore.edu', 'Kenneth Mwangi', v_class_instance_id),
  ('153008', '153008@strathmore.edu', 'Winnie Achieng', v_class_instance_id),
  ('153009', '153009@strathmore.edu', 'Robert Kamau', v_class_instance_id),
  ('153010', '153010@strathmore.edu', 'Janet Muthoni', v_class_instance_id);
  
  -- Create super admin account for this class
  INSERT INTO users (admission_number, email, name, class_instance_id, is_admin, is_super_admin) 
  VALUES ('SADMIN6', 'sadmin6@strathmore.edu', 'Super Admin (LAW Y3 S1 GA)', v_class_instance_id, TRUE, TRUE);
END $$;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tables

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
