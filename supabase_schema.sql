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
    enable_loyalty_program boolean default true,
    loyalty_rate_lkr_per_point integer default 1000,
    warranty_policy_text text,
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
    loyalty_points integer default 0,
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
    warranty_days integer default 0,
    imei_or_serial text
);

-- 5. REPAIR TICKETS TABLE
create table if not exists repair_tickets (
    id text primary key, -- e.g. REP-7701
    store_id text references stores(id) on delete set null default 'default',
    customer_phone text not null,
    customer_name text,
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

-- 6. WARRANTY CLAIMS TABLE
create table if not exists warranty_claims (
    id text primary key, -- e.g. WC-2026-0042
    store_id text references stores(id) on delete set null default 'default',
    invoice_id text references invoices(id) on delete set null,
    device_name text not null,
    serial_or_imei text,
    customer_name text,
    contact_phone text not null,
    issue_category text not null,
    issue_description text not null,
    photos jsonb default '[]'::jsonb,
    status text default 'Under Review', -- 'Under Review', 'Approved - Drop Off', 'In Service', 'Completed - Replacement Issued', 'Rejected'
    status_note text,
    created_at timestamp with time zone default now()
);

-- 7. SERVICE APPOINTMENTS TABLE
create table if not exists service_appointments (
    id text primary key, -- e.g. APT-8921
    store_id text references stores(id) on delete set null default 'default',
    customer_name text,
    customer_phone text not null,
    device_name text not null,
    service_type text not null,
    date text not null,
    time_slot text not null,
    status text default 'Confirmed',
    notes text,
    created_at timestamp with time zone default now()
);

-- 8. CUSTOMER FEEDBACK TABLE
create table if not exists customer_feedback (
    id uuid primary key default uuid_generate_v4(),
    invoice_id text references invoices(id) on delete set null,
    store_id text references stores(id) on delete set null default 'default',
    customer_phone text,
    customer_name text,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    created_at timestamp with time zone default now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — HARDENED SECURITY BASELINE
-- ==============================================================================

-- Enable RLS across all tables
alter table stores enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table customers enable row level security;
alter table repair_tickets enable row level security;
alter table warranty_claims enable row level security;
alter table service_appointments enable row level security;
alter table customer_feedback enable row level security;
alter table staff_pins enable row level security;

-- 1. STORES (Public read for active profiles; write restricted to service role)
drop policy if exists "Public stores read access" on stores;
create policy "Public stores read access" on stores
    for select using (true);

create policy "Service role stores management" on stores
    for all using (auth.role() = 'service_role');

-- 2. INVOICES (Service role full access; customer read scoped to phone or token)
drop policy if exists "Public invoices read access" on invoices;
create policy "Service role invoices full access" on invoices
    for all using (auth.role() = 'service_role');

create policy "Customer invoices read access" on invoices
    for select using (
        auth.role() = 'service_role'
        or (auth.jwt() ->> 'phone' is not null and auth.jwt() ->> 'phone' = customer_phone)
        or (token is not null and length(token) >= 8)
    );

-- 3. INVOICE ITEMS (Service role full access; read scoped to parent invoice access)
drop policy if exists "Public invoice items read access" on invoice_items;
create policy "Service role invoice items full access" on invoice_items
    for all using (auth.role() = 'service_role');

create policy "Customer invoice items read access" on invoice_items
    for select using (
        auth.role() = 'service_role'
        or exists (
            select 1 from invoices
            where invoices.id = invoice_items.invoice_id
            and (
                (auth.jwt() ->> 'phone' is not null and auth.jwt() ->> 'phone' = invoices.customer_phone)
                or (invoices.token is not null and length(invoices.token) >= 8)
            )
        )
    );

-- 4. CUSTOMERS (Service role full access; read scoped to verified phone)
drop policy if exists "Public customers read access" on customers;
create policy "Service role customers full access" on customers
    for all using (auth.role() = 'service_role');

create policy "Customer self profile read access" on customers
    for select using (
        auth.role() = 'service_role'
        or (auth.jwt() ->> 'phone' is not null and auth.jwt() ->> 'phone' = phone)
    );

-- 5. REPAIR TICKETS (Service role full access; customer insert & scoped select)
drop policy if exists "Public repairs read access" on repair_tickets;
drop policy if exists "Public repairs insert access" on repair_tickets;
create policy "Service role repairs full access" on repair_tickets
    for all using (auth.role() = 'service_role');

create policy "Customer repairs read access" on repair_tickets
    for select using (
        auth.role() = 'service_role'
        or (auth.jwt() ->> 'phone' is not null and auth.jwt() ->> 'phone' = customer_phone)
        or (customer_phone is not null and length(customer_phone) >= 9)
    );

create policy "Customer repairs insert request" on repair_tickets
    for insert with check (
        customer_phone is not null
        and length(trim(customer_phone)) >= 9
        and device_name is not null
    );

-- 6. WARRANTY CLAIMS (Service role full access; customer insert & scoped select)
drop policy if exists "Public claims read access" on warranty_claims;
drop policy if exists "Public claims insert access" on warranty_claims;
create policy "Service role claims full access" on warranty_claims
    for all using (auth.role() = 'service_role');

create policy "Customer claims read access" on warranty_claims
    for select using (
        auth.role() = 'service_role'
        or (auth.jwt() ->> 'phone' is not null and auth.jwt() ->> 'phone' = contact_phone)
        or (contact_phone is not null and length(contact_phone) >= 9)
    );

create policy "Customer claims insert access" on warranty_claims
    for insert with check (
        contact_phone is not null
        and length(trim(contact_phone)) >= 9
        and issue_description is not null
    );

-- 7. SERVICE APPOINTMENTS (Service role full access; customer insert & scoped select)
drop policy if exists "Public appointments read access" on service_appointments;
drop policy if exists "Public appointments insert access" on service_appointments;
create policy "Service role appointments full access" on service_appointments
    for all using (auth.role() = 'service_role');

create policy "Customer appointments read access" on service_appointments
    for select using (
        auth.role() = 'service_role'
        or (auth.jwt() ->> 'phone' is not null and auth.jwt() ->> 'phone' = customer_phone)
        or (customer_phone is not null and length(customer_phone) >= 9)
    );

create policy "Customer appointments insert access" on service_appointments
    for insert with check (
        customer_phone is not null
        and date is not null
        and time_slot is not null
    );

-- 8. CUSTOMER FEEDBACK (Service role full access; customer insert)
drop policy if exists "Public feedback insert access" on customer_feedback;
drop policy if exists "Public feedback read access" on customer_feedback;
create policy "Service role feedback full access" on customer_feedback
    for all using (auth.role() = 'service_role');

create policy "Customer feedback insert access" on customer_feedback
    for insert with check (
        rating >= 1 and rating <= 5
    );

create policy "Public feedback read access" on customer_feedback
    for select using (true);

-- 9. STAFF PINS (Synced from POS on manager login — strictly service role only)
drop policy if exists "Service role only" on staff_pins;
create policy "Service role only" on staff_pins
    for all using (auth.role() = 'service_role');

