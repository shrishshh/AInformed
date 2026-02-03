# Fix Supabase Bookmarks Table for Clerk User IDs

## Problem

The `bookmarks` table in Supabase has `user_id` defined as **UUID**, but Clerk user IDs are **strings** (e.g., `user_39ALuHA3qh7ISHTYrYdiGNT7P5d`). This causes the error:

```
invalid input syntax for type uuid: 'user_39ALuHA3qh7ISHTYrYdiGNT7P5d'
```

## Solution

Change the `user_id` column type from `UUID` to `TEXT` (or `VARCHAR`) in Supabase.

---

## Steps to Fix

### Option 1: Using Supabase Dashboard (Easiest)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project (`gvlriritmsvlieetxvfz`)

2. **Navigate to Table Editor**
   - Click **"Table Editor"** in the left sidebar
   - Find and click on the **`bookmarks`** table

3. **Modify the `user_id` Column**
   - Click on the **`user_id`** column
   - Change the **Type** from `uuid` to `text` (or `varchar`)
   - Click **"Save"**

4. **Verify**
   - The column should now accept Clerk user IDs (strings like `user_...`)

---

### Option 2: Using SQL Editor (required if you have RLS policies)

If you get **"cannot alter type of a column used in a policy definition"**, the `user_id` column is referenced by a Row Level Security (RLS) policy. You must drop those policies first, alter the column, then recreate policies.

**Use the full migration script:** see **`docs/SUPABASE_ALTER_USER_ID_WITH_RLS.sql`** and run it in SQL Editor (it drops policies, alters `user_id` to TEXT, then recreates policies for anon).

**Or run this manually:**

```sql
-- 1) Drop the policy that depends on user_id
DROP POLICY IF EXISTS "Allow users to read their own bookmarks" ON bookmarks;
-- Drop any other policies on bookmarks that reference user_id (check Dashboard → Authentication → Policies)

-- 2) Alter the column
ALTER TABLE bookmarks
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- 3) Recreate policies (example: allow anon to read/insert/update/delete; app sends correct user_id from Clerk)
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read bookmarks" ON bookmarks FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert bookmarks" ON bookmarks FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update bookmarks" ON bookmarks FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete bookmarks" ON bookmarks FOR DELETE TO anon USING (true);
```

3. **Run the Query**
   - Click **"Run"** or press `Ctrl+Enter`

4. **Verify**
   - Check the `bookmarks` table in Table Editor — `user_id` should now be type `text`

---

## After Migration

1. **Test Bookmarking**
   - Try saving a bookmark again
   - The error should be gone

2. **Existing Data**
   - If you had bookmarks with UUID `user_id` values from the old Supabase auth system, they won't match Clerk user IDs
   - Users will need to sign in with Clerk and create new bookmarks
   - Old bookmarks can be cleaned up later if needed

---

## Alternative: Keep UUID and Map Clerk IDs

If you prefer to keep UUIDs, you could:

1. Create a mapping table:
   ```sql
   CREATE TABLE clerk_user_mapping (
     clerk_user_id TEXT PRIMARY KEY,
     supabase_user_id UUID UNIQUE NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. Create a function/trigger to auto-generate UUIDs for new Clerk users

However, **changing to TEXT is simpler** and works directly with Clerk IDs.

---

## RLS Policy Update (If Needed)

If you have Row Level Security (RLS) policies, make sure they work with TEXT `user_id`:

```sql
-- Example RLS policy (adjust as needed)
CREATE POLICY "Users can only see their own bookmarks"
ON bookmarks FOR SELECT
USING (user_id = current_setting('app.user_id', true));

-- Or if using a different approach:
CREATE POLICY "Users can only see their own bookmarks"
ON bookmarks FOR SELECT
USING (true); -- Adjust based on your RLS strategy
```

Since Clerk handles auth separately, RLS might be set to allow all for anon users (less secure) or you might need a custom approach.

---

## Verification Query

After migration, test with:

```sql
-- Check column type
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'bookmarks' AND column_name = 'user_id';

-- Should show: text or varchar
```
