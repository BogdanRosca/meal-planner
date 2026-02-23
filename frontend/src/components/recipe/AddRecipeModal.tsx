import React, { useState } from 'react';
import { Recipe, Ingredient } from '../../types/recipe';
import './AddRecipeModal.css';

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecipe: (_recipe: Omit<Recipe, 'id'>) => void;
}

const AddRecipeModal: React.FC<AddRecipeModalProps> = ({
  isOpen,
  onClose,
  onAddRecipe,
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

    // Filter out any empty main ingredients
    const filteredMainIngredients = mainIngredients.filter(
      ing => ing.name.trim() !== '' && ing.quantity > 0
    );

    const newRecipe: Omit<Recipe, 'id'> = {
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

    onAddRecipe(newRecipe);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="add-recipe-modal">
        <div className="modal-header">
          <h2>Add New Recipe</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-recipe-form">
          <div className="form-group">
            <label htmlFor="recipe-name">Recipe Name</label>
            <input
              id="recipe-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Enter recipe name"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="recipe-category">Category</label>
            <select
              id="recipe-category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="form-select"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="recipe-foto-url">Photo URL (optional)</label>
            <input
              id="recipe-foto-url"
              type="url"
              value={fotoUrl}
              onChange={e => setFotoUrl(e.target.value)}
              placeholder="https://example.com/recipe-photo.jpg"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Main Ingredients</label>
            {mainIngredients.map((ingredient, index) => (
              <div key={index} className="ingredient-row">
                <input
                  type="text"
                  value={ingredient.name}
                  onChange={e =>
                    handleMainIngredientChange(index, 'name', e.target.value)
                  }
                  placeholder="Ingredient name"
                  className="ingredient-name"
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
                  className="ingredient-quantity"
                  min="0"
                  step="0.1"
                  required={index === 0}
                />
                <select
                  value={ingredient.unit}
                  onChange={e =>
                    handleMainIngredientChange(index, 'unit', e.target.value)
                  }
                  className="ingredient-unit"
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
                    className="remove-btn"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddMainIngredient}
              className="add-btn"
            >
              + Add Ingredient
            </button>
          </div>

          <div className="form-group">
            <label>Common Ingredients</label>
            <div className="common-ingredients-container">
              <div className="common-ingredient-input">
                <input
                  type="text"
                  value={commonIngredient}
                  onChange={e => setCommonIngredient(e.target.value)}
                  placeholder="Add common ingredient (salt, pepper, etc.)"
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={handleAddCommonIngredient}
                  className="add-common-btn"
                >
                  Add
                </button>
              </div>
              <div className="common-ingredients-list">
                {commonIngredients.map((ingredient, index) => (
                  <div key={index} className="common-ingredient-tag">
                    <span>{ingredient}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCommonIngredient(index)}
                      className="remove-tag-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="recipe-instructions">Instructions</label>
            <textarea
              id="recipe-instructions"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              required
              placeholder="Enter cooking instructions"
              className="form-textarea"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="recipe-video-url">Video URL (optional)</label>
            <input
              id="recipe-video-url"
              type="url"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="recipe-preptime">Prep Time (minutes)</label>
              <input
                id="recipe-preptime"
                type="number"
                value={prepTime}
                onChange={e => setPrepTime(Number(e.target.value))}
                min="1"
                required
                className="form-input"
              />
            </div>

            <div className="form-group half">
              <label htmlFor="recipe-portions">Portions</label>
              <input
                id="recipe-portions"
                type="number"
                value={portions}
                onChange={e => setPortions(Number(e.target.value))}
                min="1"
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Add Recipe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecipeModal;
