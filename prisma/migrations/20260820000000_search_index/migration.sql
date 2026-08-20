-- Backing index for searchPublishedArticles(). The expression here must match
-- the one in the query exactly or Postgres will fall back to a sequential
-- scan. to_tsvector with a literal config and regexp_replace are both
-- IMMUTABLE, which is what makes them legal in an index expression.
CREATE INDEX IF NOT EXISTS articles_fulltext_idx ON articles USING GIN (
  to_tsvector(
    'english',
    coalesce(headline, '') || ' ' || coalesce(dek, '') || ' ' ||
    regexp_replace(coalesce(body, ''), '<[^>]*>', ' ', 'g')
  )
);

-- Supports the ILIKE arm of the same query (partial words and tag matches),
-- which a GIN full-text index cannot serve.
CREATE INDEX IF NOT EXISTS articles_tags_idx ON articles USING GIN (tags);
