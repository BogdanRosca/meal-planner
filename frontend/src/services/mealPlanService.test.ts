import { mealPlanService } from './mealPlanService';
import { MealPlanEntry } from '../types/recipe';

const mockEntry: MealPlanEntry = {
  id: 1,
  week_start: '2026-03-02',
  day_of_week: 0,
  meal_slot: 'breakfast',
  recipe_id: 10,
  recipe_name: 'Pancakes',
  recipe_category: 'breakfast',
  recipe_foto_url: null,
};

describe('mealPlanService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('getMealPlan', () => {
    it('should return entries on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ entries: [mockEntry] }),
      });

      const result = await mealPlanService.getMealPlan('2026-03-02');

      expect(result).toEqual([mockEntry]);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('week_start=2026-03-02')
      );
    });

    it('should throw on HTTP error', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(mealPlanService.getMealPlan('2026-03-02')).rejects.toThrow();

      consoleErrorSpy.mockRestore();
    });

    it('should throw on network error', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(mealPlanService.getMealPlan('2026-03-02')).rejects.toThrow(
        'Network error'
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('addMealPlanEntry', () => {
    it('should return the created entry', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ entry: mockEntry }),
      });

      const result = await mealPlanService.addMealPlanEntry({
        week_start: '2026-03-02',
        day_of_week: 0,
        meal_slot: 'breakfast',
        recipe_id: 10,
      });

      expect(result).toEqual(mockEntry);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/meal-plans'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should throw on HTTP error', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
      });

      await expect(
        mealPlanService.addMealPlanEntry({
          week_start: '2026-03-02',
          day_of_week: 0,
          meal_slot: 'breakfast',
          recipe_id: 10,
        })
      ).rejects.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteMealPlanEntry', () => {
    it('should complete without error on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await expect(
        mealPlanService.deleteMealPlanEntry(1)
      ).resolves.toBeUndefined();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/meal-plans/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should throw on HTTP error', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(mealPlanService.deleteMealPlanEntry(999)).rejects.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });
});
