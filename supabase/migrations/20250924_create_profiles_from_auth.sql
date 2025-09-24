-- Migration: create_profiles_from_auth.sql
-- Purpose: When a new user is created in auth.users (via Supabase Auth), this
-- trigger will create or update a corresponding row in public.profiles using
-- the `raw_user_meta_data` supplied at signup. It also optionally creates a
-- `schools` record when the signup metadata contains `school_name` or `school_slug`.

-- NOTE: Test in a staging environment first. This function is defensive and
-- idempotent: it will not overwrite existing profiles except for certain
-- updatable fields (full_name, phone, role).

-- Note: This migration defines only the trigger/function to sync auth.users
-- into public.profiles. It assumes `profiles` and `schools` tables already
-- exist and are managed by your schema migrations. Apply in staging first.

-- Function to create or update profile when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  metadata jsonb;
  role_text text;
  phone_text text;
  full_name_text text;
  school_name text;
  school_slug text;
  found_school_id uuid;
BEGIN
  -- auth.users payload: NEW.data contains user fields in Supabase-managed setups
  -- For generic Postgres-triggered auth insertions, read NEW.raw_user_meta_data
  IF TG_OP = 'INSERT' THEN
    IF NEW.raw_user_meta_data IS NOT NULL THEN
      metadata := NEW.raw_user_meta_data::jsonb;
    ELSE
      -- Try to read user_metadata if Supabase <-> older setups
      metadata := COALESCE(NEW.user_metadata::jsonb, '{}'::jsonb);
    END IF;

    role_text := COALESCE(metadata->>'role', 'parent');
    phone_text := COALESCE(metadata->>'phone', NULL);
    full_name_text := COALESCE(metadata->>'full_name', metadata->>'fullName', NULL);
    school_name := COALESCE(metadata->>'school_name', NULL);
    school_slug := COALESCE(metadata->>'school_slug', metadata->>'schoolSlug', NULL);

    -- Prevent public creation of superadmin: if role is 'superadmin', downgrade to 'school_admin'
    IF lower(role_text) = 'superadmin' THEN
      role_text := 'school_admin';
    END IF;

    -- If school metadata provided, try to find or create the school
    IF school_name IS NOT NULL THEN
      SELECT id INTO found_school_id FROM public.schools WHERE lower(name) = lower(school_name) LIMIT 1;

      IF found_school_id IS NULL THEN
        INSERT INTO public.schools (name, slug, created_at, updated_at)
        VALUES (school_name, school_slug, now(), now())
        RETURNING id INTO found_school_id;
      END IF;
    END IF;

    -- Upsert profile row using the auth user's id as primary key
    INSERT INTO public.profiles (id, full_name, phone, role, school_id, created_at, updated_at)
    VALUES (NEW.id::uuid, full_name_text, phone_text, role_text, found_school_id, now(), now())
    ON CONFLICT (id) DO UPDATE
    SET
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
      role = COALESCE(EXCLUDED.role, public.profiles.role),
      school_id = COALESCE(EXCLUDED.school_id, public.profiles.school_id),
      updated_at = now();

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;

-- Trigger on auth.users table. Note: adjust schema name if your auth table is in a different schema.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

-- End of migration (function + trigger only)
