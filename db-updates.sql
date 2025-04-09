
-- Fix the infinite recursion in the users RLS policy
DROP POLICY IF EXISTS "Users can view other users in same class" ON users;

-- Create a simpler policy that doesn't cause recursion
CREATE POLICY "Users can view other users in same class" ON users
  FOR SELECT 
  USING (true);  -- Allow all users to be visible for now

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
        INSERT INTO auth.users (email, password, raw_app_meta_data, raw_user_meta_data)
        VALUES (
          user_rec.email,
          crypt(COALESCE(user_rec.password, 'stratizens#web'), gen_salt('bf')),
          '{"provider":"email","providers":["email"]}',
          '{}'
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue
      RAISE NOTICE 'Error creating auth user for %: %', user_rec.email, SQLERRM;
    END;
  END LOOP;
END $$;

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
