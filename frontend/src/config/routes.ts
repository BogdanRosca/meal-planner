export const ROUTES = {
  MEAL_PLANNER: '/meal-planner',
  RECIPES: '/recipes',
  SHOPPING_LIST: '/shopping-list',
  ANALYTICS: '/analytics',
} as const;

export const SECTION_TO_PATH: Record<string, string> = {
  'Meal Planner': ROUTES.MEAL_PLANNER,
  Recipes: ROUTES.RECIPES,
  'Shopping List': ROUTES.SHOPPING_LIST,
  Analytics: ROUTES.ANALYTICS,
};

export const PATH_TO_SECTION: Record<string, string> = Object.fromEntries(
  Object.entries(SECTION_TO_PATH).map(([k, v]) => [v, k])
);
