import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, BookOpen } from 'lucide-react';
import { Recipe, Ingredient } from '../../types/recipe';
import styles from './AddRecipeModal.module.css';

interface EditRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditRecipe: (_recipe: Omit<Recipe, 'id'>) => void;
  recipe: Recipe | null;
}

const EditRecipeModal: React.FC<EditRecipeModalProps> = ({
  isOpen,
  onClose,
  onEditRecipe,
  recipe,
}) => {
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('dinner');
  const [instructions, setInstructions] = useState<string>('');
  const [prepTime, setPrepTime] = useState<number>(15);
  const [portions, setPortions] = useState<number>(2);
  const [fotoUrl, setFotoUrl] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [mainIngredients, setMainIngredients] = useState<Ingredient[]>([
    { name: '', unit: 'g', quantity: 0 },
  ]);
  const [commonIngredient, setCommonIngredient] = useState<string>('');
  const [commonIngredients, setCommonIngredients] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && recipe) {
      setName(recipe.name);
      setCategory(recipe.category);
      setInstructions(recipe.instructions);
      setPrepTime(recipe.prep_time);
      setPortions(recipe.portions);
      setFotoUrl(recipe.foto_url || '');
      setVideoUrl(recipe.video_url || '');
      setMainIngredients(
        recipe.main_ingredients.length > 0
          ? recipe.main_ingredients
          : [{ name: '', unit: 'g', quantity: 0 }]
      );
      setCommonIngredients(recipe.common_ingredients || []);
      setCommonIngredient('');
    }
  }, [isOpen, recipe]);

  const handleAddMainIngredient = () => {
    setMainIngredients([
      ...mainIngredients,
      { name: '', unit: 'g', quantity: 0 },
    ]);
  };

  const handleMainIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: string | number
  ) => {
    const updatedIngredients = [...mainIngredients];

    if (field === 'quantity') {
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: Number(value),
      };
    } else {
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: value,
      };
    }

    setMainIngredients(updatedIngredients);
  };

  const handleRemoveMainIngredient = (index: number) => {
    const updatedIngredients = [...mainIngredients];
    updatedIngredients.splice(index, 1);
    setMainIngredients(updatedIngredients);
  };

  const handleAddCommonIngredient = () => {
    if (commonIngredient.trim()) {
      setCommonIngredients([...commonIngredients, commonIngredient.trim()]);
      setCommonIngredient('');
    }
  };

  const handleRemoveCommonIngredient = (index: number) => {
    const updatedIngredients = [...commonIngredients];
    updatedIngredients.splice(index, 1);
    setCommonIngredients(updatedIngredients);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const filteredMainIngredients = mainIngredients.filter(
      ing => ing.name.trim() !== '' && ing.quantity > 0
    );

    const updatedRecipe: Omit<Recipe, 'id'> = {
      name,
      category,
      instructions,
      prep_time: prepTime,
      portions,
      main_ingredients: filteredMainIngredients,
      common_ingredients: commonIngredients,
      foto_url: fotoUrl.trim() || null,
      video_url: videoUrl.trim() || null,
    };

    onEditRecipe(updatedRecipe);
  };

  if (!isOpen || !recipe) return null;

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['add-recipe-modal']}>
        <div className={styles['modal-header']}>
          <h2>
            <BookOpen size={24} />
            Edit Recipe
          </h2>
          <button
            className={styles['close-button']}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles['add-recipe-form']}>
          <div className={styles['form-group']}>
            <label htmlFor="recipe-name">Recipe Name</label>
            <input
              id="recipe-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Enter recipe name"
              className={styles['form-input']}
            />
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="recipe-category">Category</label>
            <select
              id="recipe-category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className={styles['form-select']}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="recipe-foto-url">Photo URL (optional)</label>
            <input
              id="recipe-foto-url"
              type="url"
              value={fotoUrl}
              onChange={e => setFotoUrl(e.target.value)}
              placeholder="https://example.com/recipe-photo.jpg"
              className={styles['form-input']}
            />
          </div>

          <div className={styles['form-group']}>
            <label>Main Ingredients</label>
            {mainIngredients.map((ingredient, index) => (
              <div key={index} className={styles['ingredient-row']}>
                <input
                  type="text"
                  value={ingredient.name}
                  onChange={e =>
                    handleMainIngredientChange(index, 'name', e.target.value)
                  }
                  placeholder="Ingredient name"
                  className={styles['ingredient-name']}
                  required={index === 0}
                />
                <input
                  type="number"
                  value={ingredient.quantity === 0 ? '' : ingredient.quantity}
                  onChange={e =>
                    handleMainIngredientChange(
                      index,
                      'quantity',
                      e.target.value
                    )
                  }
                  placeholder="Qty"
                  className={styles['ingredient-quantity']}
                  min="0"
                  step="0.1"
                  required={index === 0}
                />
                <select
                  value={ingredient.unit}
                  onChange={e =>
                    handleMainIngredientChange(index, 'unit', e.target.value)
                  }
                  className={styles['ingredient-unit']}
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="pcs">pcs</option>
                  <option value="tbsp">tbsp</option>
                </select>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMainIngredient(index)}
                    className={styles['remove-btn']}
                    aria-label="Remove ingredient"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddMainIngredient}
              className={styles['add-btn']}
            >
              <Plus size={18} />
              Add Ingredient
            </button>
          </div>

          <div className={styles['form-group']}>
            <label>Common Ingredients</label>
            <div className={styles['common-ingredients-container']}>
              <div className={styles['common-ingredient-input']}>
                <input
                  type="text"
                  value={commonIngredient}
                  onChange={e => setCommonIngredient(e.target.value)}
                  placeholder="Add common ingredient (salt, pepper, etc.)"
                  className={styles['form-input']}
                />
                <button
                  type="button"
                  onClick={handleAddCommonIngredient}
                  className={styles['add-common-btn']}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
              <div className={styles['common-ingredients-list']}>
                {commonIngredients.map((ingredient, index) => (
                  <div key={index} className={styles['common-ingredient-tag']}>
                    <span>{ingredient}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCommonIngredient(index)}
                      className={styles['remove-tag-btn']}
                      aria-label={`Remove ${ingredient}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="recipe-instructions">Instructions</label>
            <textarea
              id="recipe-instructions"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              required
              placeholder="Enter cooking instructions"
              className={styles['form-textarea']}
              rows={4}
            />
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="recipe-video-url">Video URL (optional)</label>
            <input
              id="recipe-video-url"
              type="url"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className={styles['form-input']}
            />
          </div>

          <div className={styles['form-row']}>
            <div className={`${styles['form-group']} ${styles.half}`}>
              <label htmlFor="recipe-preptime">Prep Time (minutes)</label>
              <input
                id="recipe-preptime"
                type="number"
                value={prepTime}
                onChange={e => setPrepTime(Number(e.target.value))}
                min="1"
                required
                className={styles['form-input']}
              />
            </div>

            <div className={`${styles['form-group']} ${styles.half}`}>
              <label htmlFor="recipe-portions">Portions</label>
              <input
                id="recipe-portions"
                type="number"
                value={portions}
                onChange={e => setPortions(Number(e.target.value))}
                min="1"
                required
                className={styles['form-input']}
              />
            </div>
          </div>

          <div className={styles['form-actions']}>
            <button
              type="button"
              onClick={onClose}
              className={styles['cancel-btn']}
            >
              Cancel
            </button>
            <button type="submit" className={styles['submit-btn']}>
              <Plus size={18} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecipeModal;
