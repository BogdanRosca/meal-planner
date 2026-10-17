-- Adds users and per-user ownership of recipes and meal plans.
-- Safe to re-run: every step checks whether it has already been applied.
-- Apply with backend/db/migrate.sh, which wraps each file in a transaction.

-- Lets passwords be set straight from SQL via crypt(..., gen_salt('bf'))
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE CHECK (email = lower(email)),
  -- NULL until a password is set; such users cannot log in
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recipes copied to every newly created user
CREATE TABLE IF NOT EXISTS starter_recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(20) CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snack')),
  main_ingredients JSONB,
  common_ingredients TEXT[] DEFAULT '{}',
  instructions TEXT NOT NULL,
  prep_time INTEGER,
  portions INTEGER,
  foto_url TEXT,
  video_url TEXT
);

INSERT INTO users (email) VALUES ('rosca.bogdan02@gmail.com') ON CONFLICT (email) DO NOTHING;

DO $$
DECLARE
  owner_id INTEGER;
BEGIN
  SELECT id INTO owner_id FROM users WHERE email = 'rosca.bogdan02@gmail.com';

  -- First run only: snapshot today's recipes as the starter set, then hand them to the owner
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'user_id'
  ) THEN
    INSERT INTO starter_recipes (name, category, main_ingredients, common_ingredients,
                                 instructions, prep_time, portions, foto_url, video_url)
    SELECT name, category, main_ingredients, common_ingredients,
           instructions, prep_time, portions, foto_url, video_url
    FROM recipes
    ORDER BY id;

    ALTER TABLE recipes ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    UPDATE recipes SET user_id = owner_id;
    ALTER TABLE recipes ALTER COLUMN user_id SET NOT NULL;
    CREATE INDEX recipes_user_id_idx ON recipes (user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_plans' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    UPDATE meal_plans SET user_id = owner_id;
    ALTER TABLE meal_plans ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE meal_plans DROP CONSTRAINT IF EXISTS meal_plans_week_start_day_of_week_meal_slot_key;
    ALTER TABLE meal_plans ADD CONSTRAINT meal_plans_user_slot_key
      UNIQUE (user_id, week_start, day_of_week, meal_slot);
  END IF;
END $$;
