import { Recipe } from '../types/recipe';

export interface ShoppingListItem {
  id: string;
  name: string;
  unit?: string;
  quantity?: number;
  isCommon?: boolean;
  recipes: string[];
}

function normalize(str: string): string {
  return str.trim().toLowerCase();
}

interface MainAggregate {
  name: string;
  unit: string;
  quantity: number;
  recipes: Set<string>;
}

interface CommonAggregate {
  name: string;
  recipes: Set<string>;
}

/**
 * Aggregates ingredients from recipes: sums quantities for main ingredients
 * (grouped by name+unit), deduplicates common ingredients. Tracks which
 * recipes require each ingredient.
 */
export function aggregateIngredients(recipes: Recipe[]): ShoppingListItem[] {
  const mainAggregates: Map<string, MainAggregate> = new Map();
  const commonMap: Map<string, CommonAggregate> = new Map();

  for (const recipe of recipes) {
    for (const ing of recipe.main_ingredients ?? []) {
      const key = `${normalize(ing.name)}|${normalize(ing.unit)}`;
      const existing = mainAggregates.get(key);
      if (existing) {
        existing.quantity += ing.quantity;
        existing.recipes.add(recipe.name);
      } else {
        mainAggregates.set(key, {
          name: ing.name.trim(),
          unit: ing.unit?.trim() ?? '',
          quantity: ing.quantity,
          recipes: new Set([recipe.name]),
        });
      }
    }

    for (const ing of recipe.common_ingredients ?? []) {
      const key = normalize(ing);
      const existing = commonMap.get(key);
      if (existing) {
        existing.recipes.add(recipe.name);
      } else {
        commonMap.set(key, {
          name: ing.trim(),
          recipes: new Set([recipe.name]),
        });
      }
    }
  }

  const result: ShoppingListItem[] = [];
  let idCounter = 0;

  for (const agg of Array.from(mainAggregates.values())) {
    result.push({
      id: `main-${idCounter++}`,
      name: agg.name,
      unit: agg.unit || undefined,
      quantity: agg.quantity,
      isCommon: false,
      recipes: Array.from(agg.recipes),
    });
  }

  for (const agg of Array.from(commonMap.values())) {
    result.push({
      id: `common-${idCounter++}`,
      name: agg.name,
      isCommon: true,
      recipes: Array.from(agg.recipes),
    });
  }

  return result;
}
