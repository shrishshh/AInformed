# Codebase Feedback

## General Feedback

### Repo Structure / Setup
I recommend using https://github.com/t3-oss/create-t3-turbo for a better starting point.
This repo has a good setup for:
  - NextJS v15
  - TailwindCSS
  - Shadcn UI
  - TypeScript
  - PostgreSQL (can host via Vercel Postgres, Neon, Supabase, etc.)
  - BetterAuth (for self-hosting your auth instead of using firebase or a paid service)
  - Expo (if you want to build a mobile app)
  - Drizzle ORM (for type-safe database operations to your PostgreSQL database)
  - tRPC (for type-safe API calls)
  - React Query (for fetching data from your API from the client without using useEffect)
  - Zod (for validating the data is the shape you expect it to be from external sources)

## Common Problems / Concerns

### useEffect + fetch
Don't use useEffect + fetch. Read: https://tkdodo.eu/blog/why-you-want-react-query
Alternatives:
1. (Recommended) Use async server components (with caching)
   - Read up on what these are and how to use them: https://nextjs.org/docs/app/getting-started/server-and-client-components
2. Use React Query
   - If you need to fetch data from the client-side and don't want to do it from the server, you should use React Query.

### Data Validation
Make sure when you fetch data from an external source that you do NOT control, or if you're uncertain what the data will look like,
that you validate it at runtime before it reaches your users/app.

Use `zod` to validate your data at runtime with a schema and use `z.infer<MySchema>` to be able to add types to your app where needed
instead of using `any`.

### Caching
If your data is NOT user-specific and it's okay for it to be stale for a fixed length of time, you should almost always cache it.
There's no reason a User A and User B loading the home page should cost you 2 API calls of your daily limit to gnews.
Even worse, User A should not be able to refresh (or bot-attack) your home page and cost you 1 API call for every refresh.

### Firebase / MongoDB
I'm not sure what the use of firebase is specifically here, but if you're not using it I would remove it.
If you need a database, I recommend a PostgreSQL database (can host via Vercel Postgres, Neon, Supabase, etc.)

Using DrizzleORM will help you a lot with this and simplify a lot of initial setup required.

DrizzleORM also comes with a CLI that you can run called Drizzle Studio that will let you view your SQL tables and data locally:
https://orm.drizzle.team/drizzle-studio/overview

### Unused Code
I would recommend going through your codebase and removing any components/code that isn't used anymore.
I see some duplicate components like `src/components/layout/Header.tsx` and `src/components/header.tsx`, but only
`src/components/header.tsx` is used.
