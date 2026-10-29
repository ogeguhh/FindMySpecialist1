create table if not exists public.user_preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,
    age_group text not null check (
        age_group in (
            'under-18', '18-24', '25-34', '35-44',
            '45-54', '55-64', '65-plus'
        )
    ),
    location text not null check (char_length(location) <= 100),
    insurance_provider text check (
        insurance_provider is null or char_length(insurance_provider) <= 100
    ),
    insurance_plan text check (
        insurance_plan is null or char_length(insurance_plan) <= 100
    ),
    preferred_language text not null check (
        preferred_language in (
            'English', 'Spanish', 'Somali', 'Hmong', 'Vietnamese',
            'Arabic', 'American Sign Language', 'Another language'
        )
    ),
    appointment_type text not null check (
        appointment_type in ('in-person', 'telehealth')
    ),
    travel_distance integer not null check (
        travel_distance in (5, 10, 15, 25, 50)
    ),
    accessibility text check (
        accessibility is null or char_length(accessibility) <= 200
    ),
    transportation text check (
        transportation is null or transportation in (
            'public-transit', 'personal-vehicle', 'rideshare', 'other'
        )
    ),
    consent_at timestamptz not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "Users can read their own preferences"
    on public.user_preferences;
create policy "Users can read their own preferences"
    on public.user_preferences for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own preferences"
    on public.user_preferences;
create policy "Users can insert their own preferences"
    on public.user_preferences for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own preferences"
    on public.user_preferences;
create policy "Users can update their own preferences"
    on public.user_preferences for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own preferences"
    on public.user_preferences;
create policy "Users can delete their own preferences"
    on public.user_preferences for delete to authenticated
    using ((select auth.uid()) = user_id);
