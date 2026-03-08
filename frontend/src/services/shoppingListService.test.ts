import { aggregateIngredients } from './shoppingListService';
import { Recipe } from '../types/recipe';

describe('shoppingListService', () => {
  describe('aggregateIngredients', () => {
    it('aggregates main ingredients with same name and unit', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Pasta Carbonara',
          category: 'Italian',
          main_ingredients: [
            { name: 'Pasta', unit: 'g', quantity: 400 },
            { name: 'Eggs', unit: 'count', quantity: 2 },
          ],
          common_ingredients: [],
          instructions: 'Cook and mix',
          prep_time: 20,
          portions: 4,
        },
        {
          id: 2,
          name: 'Pasta Bolognese',
          category: 'Italian',
          main_ingredients: [
            { name: 'Pasta', unit: 'g', quantity: 400 },
            { name: 'Ground Beef', unit: 'kg', quantity: 0.5 },
          ],
          common_ingredients: [],
          instructions: 'Cook and serve',
          prep_time: 30,
          portions: 4,
        },
      ];

      const result = aggregateIngredients(recipes);

      const pasta = result.find(
        item => item.name === 'Pasta' && item.unit === 'g'
      );
      expect(pasta).toBeDefined();
      expect(pasta!.quantity).toBe(800);
      expect(pasta!.recipes).toEqual(['Pasta Carbonara', 'Pasta Bolognese']);
      expect(pasta!.isCommon).toBe(false);
    });

    it('handles ingredients without unit', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Simple Recipe',
          category: 'Simple',
          main_ingredients: [
            {
              name: 'Salt',
              unit: '',
              quantity: 1,
            },
          ],
          common_ingredients: [],
          instructions: 'Mix',
          prep_time: 10,
          portions: 2,
        },
      ];

      const result = aggregateIngredients(recipes);

      const salt = result.find(item => item.name === 'Salt');
      expect(salt).toBeDefined();
      expect(salt!.unit).toBeUndefined();
      expect(salt!.quantity).toBe(1);
    });

    it('normalizes ingredient names and units', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Recipe 1',
          category: 'Test',
          main_ingredients: [
            {
              name: '  SALT  ',
              unit: '  TSP  ',
              quantity: 1,
            },
          ],
          common_ingredients: [],
          instructions: 'Test',
          prep_time: 15,
          portions: 1,
        },
        {
          id: 2,
          name: 'Recipe 2',
          category: 'Test',
          main_ingredients: [
            {
              name: 'salt',
              unit: 'tsp',
              quantity: 2,
            },
          ],
          common_ingredients: [],
          instructions: 'Test',
          prep_time: 15,
          portions: 1,
        },
      ];

      const result = aggregateIngredients(recipes);

      expect(result).toHaveLength(1);
      const salt = result[0];
      expect(salt.quantity).toBe(3);
      expect(salt.recipes).toEqual(['Recipe 1', 'Recipe 2']);
    });

    it('aggregates common ingredients', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Recipe 1',
          category: 'Test',
          main_ingredients: [],
          common_ingredients: ['Salt', 'Pepper'],
          instructions: 'Mix',
          prep_time: 10,
          portions: 2,
        },
        {
          id: 2,
          name: 'Recipe 2',
          category: 'Test',
          main_ingredients: [],
          common_ingredients: ['Salt', 'Garlic'],
          instructions: 'Mix',
          prep_time: 10,
          portions: 2,
        },
      ];

      const result = aggregateIngredients(recipes);

      const salt = result.find(item => item.name === 'Salt' && item.isCommon);
      expect(salt).toBeDefined();
      expect(salt!.recipes).toEqual(['Recipe 1', 'Recipe 2']);
      expect(salt!.isCommon).toBe(true);
      expect(salt!.quantity).toBeUndefined();
      expect(salt!.unit).toBeUndefined();
    });

    it('deduplicates common ingredients', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Recipe 1',
          category: 'Test',
          main_ingredients: [],
          common_ingredients: ['Salt'],
          instructions: 'Mix',
          prep_time: 10,
          portions: 2,
        },
        {
          id: 2,
          name: 'Recipe 2',
          category: 'Test',
          main_ingredients: [],
          common_ingredients: ['  SALT  '],
          instructions: 'Mix',
          prep_time: 10,
          portions: 2,
        },
      ];

      const result = aggregateIngredients(recipes);

      const saltItems = result.filter(item => item.isCommon && item.recipes);
      expect(saltItems).toHaveLength(1);
      expect(saltItems[0].recipes).toEqual(['Recipe 1', 'Recipe 2']);
    });

    it('returns empty array for empty recipes', () => {
      const result = aggregateIngredients([]);
      expect(result).toEqual([]);
    });

    it('handles recipes with no ingredients', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Empty Recipe',
          category: 'Test',
          main_ingredients: [],
          common_ingredients: [],
          instructions: 'None',
          prep_time: 0,
          portions: 1,
        },
      ];

      const result = aggregateIngredients(recipes);
      expect(result).toEqual([]);
    });

    it('handles recipes with empty ingredient arrays', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Empty Recipe',
          category: 'Test',
          main_ingredients: [],
          common_ingredients: [],
          instructions: 'None',
          prep_time: 0,
          portions: 1,
        },
      ];

      const result = aggregateIngredients(recipes);
      expect(result).toEqual([]);
    });

    it('assigns correct IDs to items', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Recipe 1',
          category: 'Test',
          main_ingredients: [{ name: 'Flour', unit: 'g', quantity: 500 }],
          common_ingredients: ['Salt'],
          instructions: 'Mix',
          prep_time: 20,
          portions: 4,
        },
      ];

      const result = aggregateIngredients(recipes);

      const mainItem = result.find(item => !item.isCommon);
      const commonItem = result.find(item => item.isCommon);

      expect(mainItem?.id).toBe('main-0');
      expect(commonItem?.id).toMatch(/^common-\d+$/);
    });

    it('separates main and common ingredients', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Complex Recipe',
          category: 'Test',
          main_ingredients: [
            { name: 'Flour', unit: 'g', quantity: 500 },
            { name: 'Butter', unit: 'g', quantity: 200 },
          ],
          common_ingredients: ['Salt', 'Pepper'],
          instructions: 'Mix',
          prep_time: 30,
          portions: 6,
        },
      ];

      const result = aggregateIngredients(recipes);

      const mainItems = result.filter(item => !item.isCommon);
      const commonItems = result.filter(item => item.isCommon);

      expect(mainItems).toHaveLength(2);
      expect(commonItems).toHaveLength(2);
    });

    it('handles multiple recipes with different quantities', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Small Batch',
          category: 'Test',
          main_ingredients: [{ name: 'Sugar', unit: 'g', quantity: 100 }],
          common_ingredients: [],
          instructions: 'Mix',
          prep_time: 15,
          portions: 2,
        },
        {
          id: 2,
          name: 'Large Batch',
          category: 'Test',
          main_ingredients: [{ name: 'Sugar', unit: 'g', quantity: 500 }],
          common_ingredients: [],
          instructions: 'Mix',
          prep_time: 15,
          portions: 2,
        },
        {
          id: 3,
          name: 'Medium Batch',
          category: 'Test',
          main_ingredients: [{ name: 'Sugar', unit: 'g', quantity: 250 }],
          common_ingredients: [],
          instructions: 'Mix',
          prep_time: 15,
          portions: 2,
        },
      ];

      const result = aggregateIngredients(recipes);

      const sugar = result.find(item => item.name === 'Sugar');
      expect(sugar!.quantity).toBe(850);
      expect(sugar!.recipes).toEqual([
        'Small Batch',
        'Large Batch',
        'Medium Batch',
      ]);
    });

    it('preserves trimmed names for main ingredients', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Recipe',
          category: 'Test',
          main_ingredients: [
            {
              name: '  Olive Oil  ',
              unit: '  ml  ',
              quantity: 100,
            },
          ],
          common_ingredients: [],
          instructions: 'Mix',
          prep_time: 10,
          portions: 1,
        },
      ];

      const result = aggregateIngredients(recipes);

      expect(result[0].name).toBe('Olive Oil');
      expect(result[0].unit).toBe('ml');
    });

    it('preserves trimmed names for common ingredients', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Recipe',
          category: 'Test',
          main_ingredients: [],
          common_ingredients: ['  Black Pepper  '],
          instructions: 'Mix',
          prep_time: 10,
          portions: 1,
        },
      ];

      const result = aggregateIngredients(recipes);

      expect(result[0].name).toBe('Black Pepper');
    });

    it('handles complex multi-recipe scenario', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Pasta Carbonara',
          category: 'Italian',
          main_ingredients: [
            { name: 'Pasta', unit: 'g', quantity: 400 },
            { name: 'Eggs', unit: 'count', quantity: 4 },
            { name: 'Bacon', unit: 'g', quantity: 200 },
          ],
          common_ingredients: ['Salt', 'Black Pepper'],
          instructions: 'Cook pasta and mix',
          prep_time: 25,
          portions: 4,
        },
        {
          id: 2,
          name: 'Caesar Salad',
          category: 'Salad',
          main_ingredients: [
            { name: 'Lettuce', unit: 'g', quantity: 500 },
            { name: 'Parmesan', unit: 'g', quantity: 100 },
          ],
          common_ingredients: ['Salt', 'Black Pepper'],
          instructions: 'Mix ingredients',
          prep_time: 15,
          portions: 4,
        },
      ];

      const result = aggregateIngredients(recipes);

      expect(result).toHaveLength(7);

      const salt = result.find(item => item.name === 'Salt' && item.isCommon);
      expect(salt!.recipes).toEqual(['Pasta Carbonara', 'Caesar Salad']);

      const mainItemsCount = result.filter(item => !item.isCommon).length;
      expect(mainItemsCount).toBe(5);
    });

    it('handles recipes with undefined main_ingredients array', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Recipe',
          category: 'Test',
          main_ingredients: undefined as any,
          common_ingredients: ['Salt'],
          instructions: 'Mix',
          prep_time: 10,
          portions: 1,
        },
      ];

      const result = aggregateIngredients(recipes);

      const salt = result.find(item => item.name === 'Salt');
      expect(salt).toBeDefined();
      expect(salt!.isCommon).toBe(true);
    });

    it('handles recipes with undefined common_ingredients array', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Recipe',
          category: 'Test',
          main_ingredients: [{ name: 'Flour', unit: 'g', quantity: 500 }],
          common_ingredients: undefined as any,
          instructions: 'Mix',
          prep_time: 10,
          portions: 1,
        },
      ];

      const result = aggregateIngredients(recipes);

      const flour = result.find(item => item.name === 'Flour');
      expect(flour).toBeDefined();
      expect(flour!.isCommon).toBe(false);
    });

    it('correctly updates existing main ingredient recipe set', () => {
      const recipes: Recipe[] = [
        {
          id: 1,
          name: 'Recipe A',
          category: 'Test',
          main_ingredients: [{ name: 'Sugar', unit: 'g', quantity: 100 }],
          common_ingredients: [],
          instructions: 'Mix',
          prep_time: 10,
          portions: 1,
        },
        {
          id: 2,
          name: 'Recipe B',
          category: 'Test',
          main_ingredients: [{ name: 'Sugar', unit: 'g', quantity: 50 }],
          common_ingredients: [],
          instructions: 'Mix',
          prep_time: 10,
          portions: 1,
        },
        {
          id: 3,
          name: 'Recipe C',
          category: 'Test',
          main_ingredients: [{ name: 'Sugar', unit: 'g', quantity: 75 }],
          common_ingredients: [],
          instructions: 'Mix',
          prep_time: 10,
          portions: 1,
        },
      ];

      const result = aggregateIngredients(recipes);

      const sugar = result.find(item => item.name === 'Sugar');
      expect(sugar).toBeDefined();
      expect(sugar!.quantity).toBe(225);
      expect(sugar!.recipes).toHaveLength(3);
      expect(sugar!.recipes).toEqual(['Recipe A', 'Recipe B', 'Recipe C']);
    });
  });
});
