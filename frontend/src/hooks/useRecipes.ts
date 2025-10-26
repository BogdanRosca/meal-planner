import { useState, useEffect } from 'react';
import { Recipe } from '../types/recipe';
import { recipeService } from '../services/recipeService';

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await recipeService.getAllRecipes();
        setRecipes(data);
      } catch (err) {
        setError('Failed to load recipes. Please try again later.');
        console.error('Error loading recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  const addRecipe = async (newRecipe: Omit<Recipe, 'id'>) => {
    try {
      const addedRecipe = await recipeService.addRecipe(newRecipe);
      setRecipes([...recipes, addedRecipe]);
      return true;
    } catch (err) {
      console.error('Error adding recipe:', err);
      return false;
    }
  };

  const deleteRecipe = async (recipeId: number) => {
    try {
      await recipeService.deleteRecipe(recipeId);
      setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
      return true;
    } catch (err) {
      console.error('Error deleting recipe:', err);
      return false;
    }
  };

  return { recipes, loading, error, addRecipe, deleteRecipe };
};
