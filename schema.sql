-- Enable the UUID extension if it's not already enabled
create extension if not exists "uuid-ossp";

-- Create the registrations table
create table public.registrations (
    id uuid default uuid_generate_v4() primary key,
    full_name text not null,
    father_name text not null,
    mobile_number text not null,
    email_address text,
    age integer not null,
    city text not null,
    short_address text not null,
    skill_level text not null,
    skills_to_learn text[] not null, -- Stores the array of selected skills
    additional_notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Optional: Set up Row Level Security (RLS)
-- This ensures that only authorized access is allowed.
-- If you are using the SUPABASE_SERVICE_ROLE_KEY in your backend, 
-- you do not need to allow public inserts. The service role bypasses RLS.
alter table public.registrations enable row level security;

-- If you want to view the data in the Supabase dashboard but not allow public read/write:
create policy "Allow authenticated users to read"
on public.registrations
for select
to authenticated
using (true);

-- Create an index on email and mobile for faster lookups
create index if not exists idx_registrations_email on public.registrations (email_address);
create index if not exists idx_registrations_mobile on public.registrations (mobile_number);
