-- Create saved_reports table
create table public.saved_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  site_id uuid references public.rank_rent_sites(id) on delete cascade not null,
  report_name text not null,
  report_data jsonb not null,
  style jsonb not null,
  financial_config jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.saved_reports enable row level security;

-- RLS Policies
create policy "Users can manage own reports"
on public.saved_reports
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Create scheduled_reports table
create table public.scheduled_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  site_id uuid references public.rank_rent_sites(id) on delete cascade not null,
  report_config jsonb not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  email_to text not null,
  last_sent_at timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.scheduled_reports enable row level security;

-- RLS Policies
create policy "Users can manage own scheduled reports"
on public.scheduled_reports
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Create report_shares table for public links
create table public.report_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  site_id uuid references public.rank_rent_sites(id) on delete cascade not null,
  report_data jsonb not null,
  share_token text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamp with time zone not null default (now() + interval '7 days'),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.report_shares enable row level security;

-- RLS Policies
create policy "Users can manage own report shares"
on public.report_shares
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Public can view valid report shares"
on public.report_shares
for select
using (expires_at > now());

-- Trigger for updated_at on saved_reports
create trigger update_saved_reports_updated_at
before update on public.saved_reports
for each row
execute function public.update_updated_at_column();