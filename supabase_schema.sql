-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. CUSTOMERS TABLE
create table if not exists customers (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    phone text unique not null,
    email text,
    loyalty_points integer default 0,
    created_at timestamp with time zone default now()
);

-- 2. INVOICES TABLE
create table if not exists invoices (
    id text primary key, -- e.g. INV-2026-8942
    token text not null, -- Security link token e.g. sec_98a71b
    customer_id uuid references customers(id) on delete set null,
    customer_name text not null,
    customer_phone text not null,
    customer_email text,
    subtotal numeric(12, 2) not null,
    discount numeric(12, 2) default 0,
    tax numeric(12, 2) default 0,
    total numeric(12, 2) not null,
    payment_method text not null,
    status text check (status in ('Paid', 'Pending', 'Refunded')) default 'Paid',
    created_at timestamp with time zone default now()
);

-- 3. INVOICE ITEMS TABLE
create table if not exists invoice_items (
    id uuid primary key default uuid_generate_v4(),
    invoice_id text references invoices(id) on delete cascade,
    item_name text not null,
    quantity integer not null default 1,
    unit_price numeric(12, 2) not null,
    warranty_months integer default 0,
    imei_or_serial text
);

-- 4. REPAIR TICKETS TABLE
create table if not exists repair_tickets (
    id text primary key, -- e.g. REP-7701
    customer_phone text not null,
    device_name text not null,
    imei_or_serial text,
    issue_description text not null,
    status text check (status in ('Submitted', 'In Inspection', 'In Repair', 'Completed', 'Delivered')) default 'Submitted',
    created_at timestamp with time zone default now()
);

-- Row Level Security (RLS) Policies (Allow public read access for invoices via link token)
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table customers enable row level security;
alter table repair_tickets enable row level security;

create policy "Public invoices read access" on invoices for select using (true);
create policy "Public invoice items read access" on invoice_items for select using (true);
create policy "Public repairs read access" on repair_tickets for select using (true);
