-- Step 1: Drop RLS policies that depend on user_id
-- (Supabase won't let you alter the column while a policy references it)

DROP POLICY IF EXISTS "Allow users to read their own bookmarks" ON bookmarks;

-- Drop any other policies on bookmarks that might reference user_id
DROP POLICY IF EXISTS "Allow users to insert their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Allow users to update their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Allow users to delete their own bookmarks" ON bookmarks;
-- Add more DROP POLICY lines if you have other policies on bookmarks

-- Step 2: Alter the column type from UUID to TEXT
ALTER TABLE bookmarks
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Step 3: Recreate RLS policies (Clerk uses string user IDs; Supabase anon key has no auth.uid())
-- Option A: Allow all operations for anon (app sends correct user_id from Clerk)
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read bookmarks"
ON bookmarks FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon insert bookmarks"
ON bookmarks FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update bookmarks"
ON bookmarks FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon delete bookmarks"
ON bookmarks FOR DELETE
TO anon
USING (true);

-- Optional: verify column type
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bookmarks' AND column_name = 'user_id';
