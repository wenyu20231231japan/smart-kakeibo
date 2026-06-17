create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  currency text not null,
  category text not null,
  date date not null,
  merchant text,
  note text,
  original_text text not null,
  image_data_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

alter table public.transactions
add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;

create index if not exists transactions_date_idx on public.transactions (date desc);
create index if not exists transactions_created_at_idx on public.transactions (created_at desc);
create index if not exists transactions_user_id_idx on public.transactions (user_id);

alter table public.transactions enable row level security;

drop policy if exists "Allow public read transactions" on public.transactions;
drop policy if exists "Allow public insert transactions" on public.transactions;
drop policy if exists "Allow public delete transactions" on public.transactions;
drop policy if exists "Allow users to read own transactions" on public.transactions;
drop policy if exists "Allow users to insert own transactions" on public.transactions;
drop policy if exists "Allow users to update own transactions" on public.transactions;
drop policy if exists "Allow users to delete own transactions" on public.transactions;

create policy "Allow users to read own transactions"
on public.transactions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Allow users to insert own transactions"
on public.transactions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Allow users to update own transactions"
on public.transactions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Allow users to delete own transactions"
on public.transactions
for delete
to authenticated
using (auth.uid() = user_id);
