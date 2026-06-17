# Supabase setup

## 1. Create tables and RLS policies

Open Supabase SQL Editor and run `supabase/schema.sql`.

This creates the `transactions` table, adds `user_id`, enables RLS, and allows each logged-in user to read, insert, update, and delete only their own records.

## 2. Enable email login

In Supabase:

1. Go to Authentication > Providers.
2. Enable Email.
3. In Authentication > URL Configuration, set Site URL to your Vercel production URL.
4. Add Redirect URLs:
   - `http://localhost:3000`
   - your Vercel production URL, for example `https://smart-kakeibo-five.vercel.app`

## 3. Vercel environment variables

In Vercel project settings, add:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Redeploy after saving the environment variables.

## 4. Storage behavior

Supabase is the main database after login. The browser `localStorage` is only used as a temporary fallback when cloud sync fails, and for auth session persistence.
