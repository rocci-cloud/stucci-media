create table if not exists articles (
  id serial primary key,
  slug text not null unique,
  category_slug text not null,
  headline text not null,
  dek text not null,
  author text not null default 'Rocci Stucci',
  body text not null,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_category_slug_idx on articles (category_slug);
create index if not exists articles_status_published_at_idx on articles (status, published_at desc);
