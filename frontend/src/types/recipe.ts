export interface Ingredient {
  name: string;
  unit: string;
  quantity: number;
}

export interface Recipe {
  id: number;
  name: string;
  category: string;
  main_ingredients: Ingredient[];
  common_ingredients: string[];
  instructions: string;
  prep_time: number;
  portions: number;
  foto_url?: string | null;
  video_url?: string | null;
}

export interface RecipesResponse {
  status: string;
  count: number;
  recipes: Recipe[];
}

export interface MealPlanEntry {
  id: number;
  week_start: string;
  day_of_week: number;
  meal_slot: string;
  recipe_id: number;
  recipe_name: string;
  recipe_category: string;
  recipe_foto_url?: string | null;
}

export type RecipeDraftField = keyof Omit<Recipe, 'id'>;

export type FieldFlag = 'missing' | 'estimated';

export type ImportPlatform = 'youtube' | 'instagram';

export type FieldFlags = Partial<Record<RecipeDraftField, FieldFlag>>;

export interface DuplicateRecipe {
  id: number;
  name: string;
}

export interface RecipeDraft {
  name: string | null;
  category: string | null;
  main_ingredients: Ingredient[] | null;
  common_ingredients: string[] | null;
  instructions: string | null;
  prep_time: number | null;
  portions: number | null;
  foto_url: string | null;
  video_url: string | null;
  field_flags: FieldFlags;
  duplicate_of: DuplicateRecipe | null;
  source: {
    platform: ImportPlatform;
    video_id: string;
    title: string;
    channel: string;
    transcript_used: boolean;
  };
}

export interface RecipeDraftResponse {
  status: string;
  draft: RecipeDraft;
}

export type RecipeImportErrorCode =
  | 'invalid_url'
  | 'video_not_found'
  | 'not_a_recipe'
  | 'not_configured'
  | 'upstream_error'
  | 'timeout'
  | 'internal_error'
  | 'network_error';
