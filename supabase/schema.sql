create table if not exists public.transactions (
  id text primary key,
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

create index if not exists transactions_date_idx on public.transactions (date desc);
create index if not exists transactions_created_at_idx on public.transactions (created_at desc);

alter table public.transactions enable row level security;

drop policy if exists "Allow public read transactions" on public.transactions;
drop policy if exists "Allow public insert transactions" on public.transactions;
drop policy if exists "Allow public delete transactions" on public.transactions;

create policy "Allow public read transactions"
on public.transactions
for select
to anon
using (true);

create policy "Allow public insert transactions"
on public.transactions
for insert
to anon
with check (true);

create policy "Allow public delete transactions"
on public.transactions
for delete
to anon
using (true);
