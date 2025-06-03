
-- =============================================================================
-- STRATHMORE RESOURCES PLATFORM - ADMIN SQL QUERIES
-- =============================================================================
-- This file contains SQL queries for managing classes, students, units, and 
-- related administrative operations. Use these queries carefully in production.
-- =============================================================================

-- =============================================================================
-- 1. CLASS MANAGEMENT QUERIES
-- =============================================================================

-- Create a new class instance with all required hierarchical data
-- This creates a complete class structure: Program -> Course -> Year -> Semester -> Group -> Class Instance
INSERT INTO programs (name) VALUES ('Bachelor of Business Information Technology') 
RETURNING id; -- Note the returned program_id for next query

INSERT INTO courses (name, program_id) VALUES ('BBIT', 1) -- Use program_id from above
RETURNING id; -- Note the returned course_id for next query

INSERT INTO years (name, course_id) VALUES ('Year 2', 1) -- Use course_id from above
RETURNING id; -- Note the returned year_id for next query

INSERT INTO semesters (name, year_id) VALUES ('Semester 1', 1) -- Use year_id from above
RETURNING id; -- Note the returned semester_id for next query

INSERT INTO groups (name, semester_id) VALUES ('Group A', 1) -- Use semester_id from above
RETURNING id; -- Note the returned group_id for next query

-- Finally create the class instance
INSERT INTO class_instances (
    program_id, 
    course_id, 
    year_id, 
    semester_id, 
    group_id, 
    admin_id, 
    description
) VALUES (
    1, -- program_id
    1, -- course_id  
    1, -- year_id
    1, -- semester_id
    1, -- group_id
    '92bbbb67-9c9b-4901-a295-9e435cf23b67', -- admin_id (user UUID)
    'BBIT Year 2 Semester 1 Group A - Main class'
);

-- =============================================================================
-- View all class instances with their hierarchical information
-- =============================================================================
SELECT 
    ci.id as class_instance_id,
    ci.description,
    p.name as program_name,
    c.name as course_name,
    y.name as year_name,
    s.name as semester_name,
    g.name as group_name,
    u.name as admin_name,
    ci.created_at
FROM class_instances ci
LEFT JOIN programs p ON ci.program_id = p.id
LEFT JOIN courses c ON ci.course_id = c.id  
LEFT JOIN years y ON ci.year_id = y.id
LEFT JOIN semesters s ON ci.semester_id = s.id
LEFT JOIN groups g ON ci.group_id = g.id
LEFT JOIN users u ON ci.admin_id = u.id
ORDER BY ci.created_at DESC;

-- =============================================================================
-- Delete a specific class instance and all related data
-- =============================================================================
-- WARNING: This will cascade delete all units, resources, completions, and comments
-- related to this class. Make sure to backup data before running.

-- First, get all units for the class to see what will be deleted
SELECT u.id, u.name, u.code, u.lecturer 
FROM units u 
WHERE u.class_instance_id = 1; -- Replace 1 with actual class_instance_id

-- Delete the class instance (this will cascade to units and their resources)
DELETE FROM class_instances WHERE id = 1; -- Replace 1 with actual class_instance_id

-- =============================================================================
-- Update a class instance
-- =============================================================================
UPDATE class_instances 
SET 
    description = 'Updated description for BBIT Year 2 Semester 1 Group A',
    admin_id = '92bbbb67-9c9b-4901-a295-9e435cf23b67' -- New admin user ID
WHERE id = 1; -- Replace 1 with actual class_instance_id

-- =============================================================================
-- 2. STUDENT MANAGEMENT QUERIES  
-- =============================================================================

-- Add a new student to the system
INSERT INTO users (
    admission_number,
    email, 
    name,
    password,
    class_instance_id,
    is_admin,
    is_super_admin,
    points,
    rank
) VALUES (
    '181234', -- admission number
    '181234@strathmore.edu', -- email
    'John Doe', -- full name
    'stratizens#web', -- default password
    1, -- class_instance_id - assign to specific class
    false, -- not an admin
    false, -- not a super admin  
    0, -- starting points
    1 -- starting rank
);

-- =============================================================================
-- View all students in a specific class
-- =============================================================================
SELECT 
    u.id,
    u.admission_number,
    u.name,
    u.email,
    u.points,
    u.rank,
    u.is_admin,
    u.last_login,
    u.created_at
FROM users u
WHERE u.class_instance_id = 1 -- Replace 1 with actual class_instance_id
ORDER BY u.points DESC, u.name ASC;

-- =============================================================================
-- View all students across all classes with class information
-- =============================================================================
SELECT 
    u.id,
    u.admission_number,
    u.name,
    u.email,
    u.points,
    u.rank,
    ci.description as class_description,
    p.name as program_name,
    c.name as course_name,
    u.last_login,
    u.created_at
FROM users u
LEFT JOIN class_instances ci ON u.class_instance_id = ci.id
LEFT JOIN programs p ON ci.program_id = p.id
LEFT JOIN courses c ON ci.course_id = c.id
ORDER BY u.created_at DESC;

-- =============================================================================
-- Delete a specific student and all their data
-- =============================================================================
-- WARNING: This will delete all resources, completions, and comments by this student

-- First, see what data will be deleted
SELECT 'Resources' as data_type, COUNT(*) as count FROM resources WHERE user_id = '92bbbb67-9c9b-4901-a295-9e435cf23b67'
UNION ALL
SELECT 'Completions' as data_type, COUNT(*) as count FROM completions WHERE user_id = '92bbbb67-9c9b-4901-a295-9e435cf23b67'  
UNION ALL
SELECT 'Comments' as data_type, COUNT(*) as count FROM comments WHERE user_id = '92bbbb67-9c9b-4901-a295-9e435cf23b67';

-- Delete the student (this will cascade to their resources, completions, comments)
DELETE FROM users WHERE id = '92bbbb67-9c9b-4901-a295-9e435cf23b67'; -- Replace with actual user UUID

-- =============================================================================
-- Update student information
-- =============================================================================
-- Update student's basic information
UPDATE users 
SET 
    name = 'Updated Student Name',
    email = 'newemail@strathmore.edu',
    class_instance_id = 2, -- Move to different class
    points = 150, -- Update points
    rank = 2 -- Update rank
WHERE admission_number = '180963'; -- or use id = 'uuid'

-- Make a student an admin
UPDATE users 
SET is_admin = true 
WHERE admission_number = '180963';

-- Reset student password
UPDATE users 
SET password = 'stratizens#web' 
WHERE admission_number = '180963';

-- =============================================================================
-- 3. UNIT MANAGEMENT QUERIES
-- =============================================================================

-- Add units to a specific class
INSERT INTO units (name, code, lecturer, class_instance_id) VALUES 
('Database Systems', 'DASE 2101', 'Dr. Smith', 1),
('Web Programming', 'WEBP 2201', 'Prof. Johnson', 1),
('Object-Oriented Programming', 'OOPS 2301', 'Dr. Williams', 1),
('Data Structures & Algorithms', 'DSAL 2102', 'Dr. Jones', 1),
('Software Engineering', 'SENG 2201', 'Prof. Brown', 1);

-- =============================================================================
-- View all units for a specific class
-- =============================================================================
SELECT 
    u.id,
    u.name,
    u.code,
    u.lecturer,
    COUNT(r.id) as total_resources,
    u.created_at
FROM units u
LEFT JOIN resources r ON u.id = r.unit_id
WHERE u.class_instance_id = 1 -- Replace with actual class_instance_id
GROUP BY u.id, u.name, u.code, u.lecturer, u.created_at
ORDER BY u.name;

-- =============================================================================
-- Delete a specific unit and all its resources
-- =============================================================================
-- WARNING: This will delete all resources, completions, and comments for this unit

-- First, see what will be deleted
SELECT 
    'Resources' as data_type, 
    COUNT(*) as count 
FROM resources 
WHERE unit_id = 1; -- Replace with actual unit_id

-- Delete the unit (cascades to resources, completions, comments)
DELETE FROM units WHERE id = 1; -- Replace with actual unit_id

-- =============================================================================
-- Update unit information
-- =============================================================================
UPDATE units 
SET 
    name = 'Advanced Database Systems',
    code = 'ADBS 3101',
    lecturer = 'Prof. New Lecturer'
WHERE id = 1; -- Replace with actual unit_id

-- =============================================================================
-- 4. USEFUL ADMINISTRATIVE QUERIES
-- =============================================================================

-- Get class statistics
SELECT 
    ci.id as class_id,
    ci.description,
    COUNT(DISTINCT u.id) as total_students,
    COUNT(DISTINCT un.id) as total_units,
    COUNT(DISTINCT r.id) as total_resources,
    COUNT(DISTINCT c.id) as total_completions
FROM class_instances ci
LEFT JOIN users u ON ci.id = u.class_instance_id
LEFT JOIN units un ON ci.id = un.class_instance_id  
LEFT JOIN resources r ON un.id = r.unit_id
LEFT JOIN completions c ON r.id = c.resource_id
GROUP BY ci.id, ci.description
ORDER BY total_students DESC;

-- =============================================================================
-- Get top performing students across all classes
-- =============================================================================
SELECT 
    u.admission_number,
    u.name,
    u.points,
    u.rank,
    ci.description as class_name,
    COUNT(c.id) as completed_assignments
FROM users u
LEFT JOIN class_instances ci ON u.class_instance_id = ci.id
LEFT JOIN completions c ON u.id = c.user_id
WHERE u.is_admin = false AND u.is_super_admin = false
GROUP BY u.id, u.admission_number, u.name, u.points, u.rank, ci.description
ORDER BY u.points DESC
LIMIT 20;

-- =============================================================================
-- Find students who haven't logged in recently
-- =============================================================================
SELECT 
    u.admission_number,
    u.name,
    u.email,
    u.last_login,
    ci.description as class_name
FROM users u
LEFT JOIN class_instances ci ON u.class_instance_id = ci.id
WHERE u.last_login < (CURRENT_TIMESTAMP - INTERVAL '30 days') 
   OR u.last_login IS NULL
ORDER BY u.last_login ASC NULLS FIRST;

-- =============================================================================
-- Bulk operations for class management
-- =============================================================================

-- Move all students from one class to another
UPDATE users 
SET class_instance_id = 2 -- New class ID
WHERE class_instance_id = 1; -- Old class ID

-- Reset all student passwords in a class
UPDATE users 
SET password = 'stratizens#web' 
WHERE class_instance_id = 1 AND is_admin = false;

-- Award points to all students in a class
UPDATE users 
SET points = points + 50 
WHERE class_instance_id = 1 AND is_admin = false;

-- =============================================================================
-- SAFETY REMINDERS
-- =============================================================================
-- 1. Always backup your database before running DELETE operations
-- 2. Test queries on a copy of your database first
-- 3. Use transactions for multiple related operations:
--    BEGIN; 
--    -- your queries here
--    COMMIT; -- or ROLLBACK; if something goes wrong
-- 4. Replace placeholder IDs and UUIDs with actual values
-- 5. Verify foreign key relationships before inserting data
-- =============================================================================
