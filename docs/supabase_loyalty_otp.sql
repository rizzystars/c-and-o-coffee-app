create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  phone text,
  email text,
  full_name text,
  square_customer_id text,
  created_at timestamptz not null default now(),
  unique(phone, email)
);

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  delta integer not null,
  reason text,
  square_order_id text,
  square_payment_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  points_spent integer not null,
  discount_money_cents integer not null,
  square_order_id text,
  created_at timestamptz not null default now()
);

create or replace view public.v_customer_points as
select c.id as customer_id, coalesce(sum(l.delta),0) as points
from public.customers c
left join public.points_ledger l on l.customer_id = c.id
group by c.id;

alter table public.customers enable row level security;
alter table public.points_ledger enable row level security;
alter table public.redemptions enable row level security;

create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_otp_phone on public.otp_codes(phone);
alter table public.otp_codes enable row level security;
