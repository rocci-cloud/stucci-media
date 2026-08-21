-- New submission kind for paid feature-article enquiries. ADD VALUE IF NOT
-- EXISTS is idempotent, which matters because the deploy runner is
-- forward-only and may re-run against a database that already has it.
ALTER TYPE "SubmissionKind" ADD VALUE IF NOT EXISTS 'FEATURE_ARTICLE';
