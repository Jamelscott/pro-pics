create table public.local_media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  folder_id uuid references public.folders (id) on delete set null,
  device_id text not null,
  asset_id text not null,
  kind text not null default 'photo',
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  duration_sec double precision,
  captured_at timestamptz,
  location_name text,
  lat double precision,
  lng double precision,
  device text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index local_media_owner_device_idx on public.local_media (owner_id, device_id);
create index local_media_project_idx on public.local_media (project_id);

alter table public.local_media enable row level security;

create policy "local_media owner access" on public.local_media
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
