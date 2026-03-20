create extension if not exists "pgcrypto";

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,
  date date not null,
  description text,
  cover_image_url text,
  event_code text unique not null,
  host_id uuid,
  created_at timestamptz default now()
);

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  joined_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  guest_name text not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  guest_name text not null,
  file_url text not null,
  type text not null check (type in ('image', 'video')),
  created_at timestamptz default now()
);

create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  donor_name text not null,
  amount numeric(12, 2) not null,
  message text,
  visibility text not null check (visibility in ('public', 'anonymous')),
  created_at timestamptz default now()
);

create table if not exists livestreams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  embed_url text not null,
  platform text not null check (platform in ('youtube', 'zoom')),
  created_at timestamptz default now()
);

create index if not exists idx_messages_event_id on messages(event_id);
create index if not exists idx_media_event_id on media(event_id);
create index if not exists idx_donations_event_id on donations(event_id);
