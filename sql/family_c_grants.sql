-- Run this once in the Supabase SQL Editor if tasks, activities or shopping items you add do not show in the lists.
grant select on public.family_tasks, public.family_events, public.family_shop to authenticated;
