-- Adds an optional 1-5 star rating to recipes. NULL means "not rated yet".
-- Safe to re-run.

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS rating SMALLINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recipes_rating_range'
  ) THEN
    ALTER TABLE recipes
      ADD CONSTRAINT recipes_rating_range CHECK (rating BETWEEN 1 AND 5);
  END IF;
END $$;
