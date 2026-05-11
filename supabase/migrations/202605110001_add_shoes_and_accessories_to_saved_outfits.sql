alter table public.saved_outfits
add column if not exists shoes jsonb,
add column if not exists accessories jsonb not null default '[]'::jsonb;

comment on column public.saved_outfits.shoes is
'Stores a single saved shoe item for an outfit as JSON.';

comment on column public.saved_outfits.accessories is
'Stores zero or more saved accessory items for an outfit as a JSON array.';
