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
