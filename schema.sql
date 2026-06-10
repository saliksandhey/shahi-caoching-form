-- Enable the UUID extension if it's not already enabled
create extension if not exists "uuid-ossp";

-- Create the registrations table
create table public.registrations (
    id uuid default uuid_generate_v4() primary key,
    full_name text not null,
    father_name text not null,
    mobile_number text not null,
    email_address text,
    date_of_birth date not null,
    city text not null,
    short_address text not null,
    skill_level text not null,
    additional_notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Optional: Set up Row Level Security (RLS)
alter table public.registrations enable row level security;

-- Allow authenticated users (you) to view the data in the dashboard
create policy "Allow authenticated users to read"
on public.registrations
for select
to authenticated
using (true);

-- Allow public to insert new registrations
create policy "Allow public inserts"
on public.registrations
for insert
to public
with check (true);

-- Create an index on email and mobile for faster lookups
create index if not exists idx_registrations_email on public.registrations (email_address);
create index if not exists idx_registrations_mobile on public.registrations (mobile_number);
