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
}

export interface RecipesResponse {
  status: string;
  count: number;
  recipes: Recipe[];
}
