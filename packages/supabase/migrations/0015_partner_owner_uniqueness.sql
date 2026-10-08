-- 0015_partner_owner_uniqueness.sql
-- One organizer / business row per owner.
--
-- Why: the console self-heals a missing partner row (lib/provision.ts).
-- Next renders a layout and its page concurrently, so two `ensureOrganizer`
-- calls could race, both find nothing, and both insert. Nothing stopped that:
-- `idx_organizers_owner` / `idx_businesses_owner` are plain (non-unique)
-- indexes. The second row is invisible for a while and then breaks the owner
-- permanently, because `.maybeSingle()` on a multi-row result errors and the
-- dashboard can no longer resolve which row is theirs.
--
-- The unique index is the real fix. The dedupe below first collapses any
-- duplicates that already exist, keeping the oldest row so ids referenced by
-- events / branches / reservations stay valid.

-- 1) Collapse duplicates that predate this constraint.
--    Oldest row wins: foreign keys point at it.
delete from public.organizers o
using public.organizers keep
where o.owner_id = keep.owner_id
  and o.owner_id is not null
  and (o.created_at, o.id) > (keep.created_at, keep.id);

delete from public.businesses b
using public.businesses keep
where b.owner_id = keep.owner_id
  and b.owner_id is not null
  and (b.created_at, b.id) > (keep.created_at, keep.id);

-- 2) Now make it impossible.
--    Partial, not table-level unique: owner_id is nullable and `on delete set
--    null`, so many unowned rows must coexist.
create unique index if not exists ux_organizers_owner_unique
  on public.organizers (owner_id)
  where owner_id is not null;

create unique index if not exists ux_businesses_owner_unique
  on public.businesses (owner_id)
  where owner_id is not null;