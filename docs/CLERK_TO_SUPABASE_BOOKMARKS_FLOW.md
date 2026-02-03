# Clerk → Supabase bookmarks flow

## Data flow (current, correct)

```
Clerk (browser)                    App (client)                      Supabase
─────────────────────────────────────────────────────────────────────────────────
useUser() from @clerk/nextjs
  → user.id = "user_39ALuHA3qh7ISHTYrYdiGNT7P5d"
        │
        ▼
useSupabaseBookmarks()
  → userId = user?.id   (string)
  → insertData = { user_id: userId, article_id, title, url, ... }
        │
        ▼
supabase.from('bookmarks').insert(insertData)
  → POST to Supabase REST API with user_id: "user_39ALuHA3qh7ISHTYrYdiGNT7P5d"
        │
        ▼
Postgres bookmarks table
  → user_id column type = uuid   ❌ REJECTS string → "invalid input syntax for type uuid"
```

- There is no Next.js API route: the browser talks to Supabase with the anon key from `src/lib/supabaseClient.ts`.
- `user_id` is taken only from Clerk (`user.id`) and sent as-is to Supabase.
- The error happens in Postgres because `bookmarks.user_id` is still type **uuid**, not **text**.

## Fix (must be done in Supabase)

The app does not need changes. Run this in **Supabase → SQL Editor**:

```sql
ALTER TABLE bookmarks
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
```

Then confirm:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookmarks' AND column_name = 'user_id';
-- data_type should be 'text' or 'character varying'
```

After this, saving a bookmark will work.

## Files involved

| File | Role |
|------|------|
| `src/hooks/useSupabaseBookmarks.ts` | Gets `user?.id` from Clerk, passes as `user_id` to Supabase |
| `src/lib/supabaseClient.ts` | Creates Supabase client (anon key) |
| Supabase `bookmarks.user_id` | Must be **text** to store Clerk user IDs |

## Why the error appears

- Clerk user IDs are strings: `user_39ALuHA3qh7ISHTYrYdiGNT7P5d`.
- Postgres UUID type expects format like `550e8400-e29b-41d4-a716-446655440000`.
- So Postgres raises: `invalid input syntax for type uuid: "user_39ALuHA3qh7ISHTYrYdiGNT7P5d"`.
- Changing `user_id` to `TEXT` in Supabase fixes it; no code change is required.
