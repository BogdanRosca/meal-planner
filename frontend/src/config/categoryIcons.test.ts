import { Apple, Coffee, Moon, Sun, Utensils } from 'lucide-react';
import { getCategoryIcon } from './categoryIcons';

describe('getCategoryIcon', () => {
  it.each([
    ['breakfast', Coffee],
    ['Lunch', Sun],
    ['DINNER', Moon],
    ['snack', Apple],
  ])('maps %s to its icon', (category, icon) => {
    expect(getCategoryIcon(category)).toBe(icon);
  });

  it('falls back to a generic icon for unknown categories', () => {
    expect(getCategoryIcon('dessert')).toBe(Utensils);
  });
});
