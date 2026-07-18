-- P0#7: bucket to store opportunity cover images locally so the feed can
-- serve them from our own origin (opaque path) instead of exposing the
-- upstream source URL to the browser (which ad-blockers/hotlink protection
-- suppress). Idempotent.
insert into storage.buckets (id, name, public)
values ('opportunity-covers', 'opportunity-covers', true)
on conflict (id) do update set public = true;

-- Public read policy on the bucket (anyone can view cover images).
drop policy if exists "opportunity-covers public read" on storage.objects;
create policy "opportunity-covers public read"
  on storage.objects for select
  using ( bucket_id = 'opportunity-covers' );
