-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. STORES TABLE (Multi-Tenant Organization Profiles)
create table if not exists stores (
    id text primary key,                       -- e.g. 'i-point', 'e-store', 'tech-zone'
    name text not null,                        -- e.g. 'I-Point Mobile Care'
    tagline text default 'Digital Receipts & Warranty Portal',
    logo_url text,
    phone text,
    address text,
    whatsapp_number text,                      -- e.g. '94771234567'
    tax_id text,
    theme_color text default '#06b6d4',
    created_at timestamp with time zone default now()
);

-- Seed default store for backward compatibility
insert into stores (id, name, tagline, phone, address, whatsapp_number, tax_id)
values (
    'default',
    'I-STORE MOBILE',
    'Digital Receipts & Warranty Portal',
    '+94 11 234 5678',
    'Liberty Plaza, Colombo 03',
    '94771234567',
    '90218-VAT'
) on conflict (id) do nothing;

-- 2. CUSTOMERS TABLE
create table if not exists customers (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    phone text unique not null,
    email text,
    loyalty_points integer default 0,
    created_at timestamp with time zone default now()
);

-- 3. INVOICES TABLE
create table if not exists invoices (
    id text primary key, -- e.g. INV-2026-8942
    token text not null, -- Security link token e.g. sec_98a71b
    store_id text references stores(id) on delete set null default 'default',
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

-- 4. INVOICE ITEMS TABLE
create table if not exists invoice_items (
    id uuid primary key default uuid_generate_v4(),
    invoice_id text references invoices(id) on delete cascade,
    item_name text not null,
    quantity integer not null default 1,
    unit_price numeric(12, 2) not null,
    warranty_months integer default 0,
    imei_or_serial text
);

-- 5. REPAIR TICKETS TABLE
create table if not exists repair_tickets (
    id text primary key, -- e.g. REP-7701
    store_id text references stores(id) on delete set null default 'default',
    customer_phone text not null,
    device_name text not null,
    imei_or_serial text,
    issue_description text not null,
    status text check (status in ('Submitted', 'In Inspection', 'In Repair', 'Completed', 'Delivered')) default 'Submitted',
    status_note text,
    estimated_cost numeric(12, 2) default 0,
    advance_paid numeric(12, 2) default 0,
    balance_due numeric(12, 2) default 0,
    created_at timestamp with time zone default now()
);

-- 6. CUSTOMER FEEDBACK TABLE
create table if not exists customer_feedback (
    id uuid primary key default uuid_generate_v4(),
    invoice_id text references invoices(id) on delete set null,
    store_id text references stores(id) on delete set null default 'default',
    customer_phone text,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    created_at timestamp with time zone default now()
);

-- Row Level Security (RLS) Policies
alter table stores enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table customers enable row level security;
alter table repair_tickets enable row level security;
alter table customer_feedback enable row level security;

create policy "Public stores read access" on stores for select using (true);
create policy "Public invoices read access" on invoices for select using (true);
create policy "Public invoice items read access" on invoice_items for select using (true);
create policy "Public repairs read access" on repair_tickets for select using (true);
create policy "Public feedback insert access" on customer_feedback for insert with check (true);
create policy "Public feedback read access" on customer_feedback for select using (true);

-- 7. STAFF PINS TABLE (Synced from POS Software on manager login)
create table if not exists staff_pins (
    username text primary key,
    role text not null check (role in ('admin', 'owner', 'manager')),
    pin_hash text not null,
    updated_at timestamp with time zone default now()
);

alter table staff_pins enable row level security;
create policy "Service role only" on staff_pins for all using (auth.role() = 'service_role');
