-- Pet Content table for storing dog facts and animal jokes
-- Run this in Supabase SQL Editor

create table pet_content (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('fact', 'joke')),
  content text not null,
  created_at timestamp with time zone default now()
);

-- Index for faster random queries by type
create index pet_content_type_idx on pet_content(type);
