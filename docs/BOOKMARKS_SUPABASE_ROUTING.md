# AInformed Bookmarks: Routing & Supabase Connection

## Overview

Bookmarks are **stored in Supabase** (table `bookmarks`). There is **no Next.js API route** for bookmarks—the app talks to Supabase **directly from the client** using the Supabase JS client and the **anon key**. Auth (who is logged in) is handled by **Clerk**; the Clerk user id is used as `user_id` in Supabase.

---

## 1. Routing (which pages use bookmarks)

| Route | File | How it uses bookmarks |
|-------|------|------------------------|
| **`/`** (home) | `src/app/page.tsx` | Renders `NewsCardWithBookmark` for each article; user can save/unsave. |
| **`/bookmarks`** | `src/app/bookmarks/page.tsx` | **Main bookmarks page.** Uses `useSupabaseBookmarks()` to load the list; shows “Login required” if not signed in (Clerk), else shows saved articles. |
| **`/categories/[category]`** | `src/app/categories/[category]/page.tsx` | Same as home: `NewsCardWithBookmark` so users can bookmark from category feeds. |
| **`/search`** | `src/app/search/page.tsx` | Uses `SearchResultsDisplay`, which uses `useSupabaseBookmarks()` for add/remove and `isBookmarked` on each result. |

Navigation to bookmarks:

- **Header** (desktop & mobile): “Bookmarks” link → `/bookmarks` (see `src/components/header.tsx`).
- **robots.txt**: `/bookmarks` is disallowed so it’s not indexed (private page).

---

## 2. Supabase connection (no API route in between)

```
Browser (Clerk signed-in)  →  useSupabaseBookmarks()  →  Supabase JS client  →  Supabase project
                                    ↓
                            Clerk user.id → user_id in DB
```

- **Supabase client**  
  - Created in `src/lib/supabaseClient.ts` using:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Same client is used for all bookmark operations.

- **Single source of truth: `useSupabaseBookmarks`**  
  - File: `src/hooks/useSupabaseBookmarks.ts`
  - Gets current user id from **Clerk**: `const { user } = useUser(); const userId = user?.id;`
  - All Supabase calls use the **`bookmarks`** table and scope by **`user_id`** (Clerk user id):
    - **Load:** `supabase.from('bookmarks').select('*').eq('user_id', userId).order('created_at', { ascending: false })`
    - **Add:** `supabase.from('bookmarks').insert({ user_id: userId, article_id, title, url, ... })`
    - **Remove:** `supabase.from('bookmarks').delete().eq('user_id', userId).eq(...)`
  - So “routing” to Supabase is: **same hook on every page** → same Supabase client and same `bookmarks` table, filtered by Clerk `userId`.

- **No bookmark API route**  
  - There is no `src/app/api/bookmarks/` or similar.  
  - Flow is: **Page → hook → Supabase**, not Page → API route → Supabase.

---

## 3. Supabase table shape (expected)

The hook assumes a table named **`bookmarks`** with at least:

| Column | Type | Usage |
|--------|------|--------|
| `id` | number (PK) | Used for delete. |
| `user_id` | string | Clerk user id; all queries filter by this. |
| `article_id` | string | Article identifier (often URL). |
| `title` | string | Article title. |
| `url` | string | Article URL. |
| `image_url` | string (optional) | Thumbnail. |
| `source` | string (optional) | Source name. |
| `description` / `summary` | string (optional) | Summary text. |
| `created_at` | string (timestamp) | Ordering (newest first). |

---

## 4. Where the hook is used (summary)

- **`/bookmarks`**  
  - `bookmarks` list + `loading` → show “My Bookmarks” or “No bookmarks yet” or login gate.
- **`NewsCardWithBookmark`** (home, category pages)  
  - `isBookmarked`, `addBookmark`, `removeBookmark` → toggle icon and state.
- **`SearchResultsDisplay`** (search page)  
  - Same: `isBookmarked`, `addBookmark`, `removeBookmark` for each search result.

So **routing to Supabase** is the same on every page: **useSupabaseBookmarks** → Supabase `bookmarks` table with **Clerk `user_id`**. The only “routing” difference is which **Next.js route** (/, /bookmarks, /categories/..., /search) renders the component that uses this hook.

---

## 5. Security note (RLS)

Because the client uses the **anon key** and sends `user_id` from Clerk, Supabase cannot verify that the request is really from that user. Security depends on **Supabase Row Level Security (RLS)**:

- If RLS is off on `bookmarks`, anyone could read/change any row.
- Recommended: enable RLS and restrict so that:
  - Users can only **SELECT / INSERT / UPDATE / DELETE** rows where `user_id` matches the “current” user.

With Clerk, the “current user” is not in Supabase’s `auth.uid()`. Common approaches:

1. **Keep client-only access**  
   - RLS might allow all for anon and rely on the app never sending another user’s id (weak).
2. **Use a backend (recommended)**  
   - Add API routes (e.g. `src/app/api/bookmarks/route.ts`) that:
     - Use Clerk’s `auth()` to get the real user id server-side.
     - Call Supabase with a **service role** or a JWT that encodes that user id, and enforce RLS so only that user’s rows are visible.

So: **routing** (which URL shows which bookmark UI) is entirely in the Next.js app; **connection** to Supabase is direct from the client via `useSupabaseBookmarks` and the Supabase client, with `user_id` coming from Clerk.
