// Must stay in sync with backend/app/services/recipe_options.py
export const RECIPE_CATEGORIES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
] as const;

export const INGREDIENT_UNITS = [
  'g',
  'ml',
  'pcs',
  'tbsp',
  'cup',
  'slice',
] as const;
