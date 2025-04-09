
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
