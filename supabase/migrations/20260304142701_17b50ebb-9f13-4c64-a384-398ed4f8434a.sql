
create type user_role as enum (
  'super_admin', 'admin', 'hr_manager',
  'medical_staff', 'security', 'viewer'
);

create table public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  contact_email text not null,
  created_at    timestamptz not null default now()
);

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  role            user_role not null default 'viewer',
  organization_id uuid references public.organizations(id) on delete set null,
  created_at      timestamptz not null default now()
);

create table public.organization_features (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  feature         text not null,
  enabled         boolean not null default false,
  updated_at      timestamptz not null default now(),
  unique(organization_id, feature)
);

create table public.super_admin_audit_log (
  id                       uuid primary key default gen_random_uuid(),
  super_admin_id           uuid not null references public.profiles(id),
  super_admin_email        text not null,
  action                   text not null,
  target_organization_id   uuid references public.organizations(id),
  target_organization_name text,
  reason                   text,
  metadata                 jsonb,
  ip_address               inet,
  timestamp                timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_features enable row level security;
alter table public.super_admin_audit_log enable row level security;

-- Security definer function to check role without RLS recursion
create or replace function public.get_user_role(_user_id uuid)
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = _user_id
$$;

-- Profiles: users can read own profile, super_admins can read all
create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Super admins can read all profiles"
  on public.profiles for select
  using (public.get_user_role(auth.uid()) = 'super_admin');

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Organizations: members can read own org, super_admins can read all
create policy "Members can read own organization"
  on public.organizations for select
  using (
    id in (select organization_id from public.profiles where id = auth.uid())
  );

create policy "Super admins can manage organizations"
  on public.organizations for all
  using (public.get_user_role(auth.uid()) = 'super_admin');

-- Organization features: members can read own org features
create policy "Members can read own org features"
  on public.organization_features for select
  using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
  );

create policy "Super admins can manage features"
  on public.organization_features for all
  using (public.get_user_role(auth.uid()) = 'super_admin');

-- Audit log: only super admins can insert and read
create policy "Super admins can insert audit log"
  on public.super_admin_audit_log for insert
  with check (public.get_user_role(auth.uid()) = 'super_admin');

create policy "Super admins can read audit log"
  on public.super_admin_audit_log for select
  using (public.get_user_role(auth.uid()) = 'super_admin');

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'viewer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable realtime for organization_features
alter publication supabase_realtime add table public.organization_features;
