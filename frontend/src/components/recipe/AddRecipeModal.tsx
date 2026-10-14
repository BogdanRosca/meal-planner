import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  BookOpen,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  Recipe,
  Ingredient,
  FieldFlags,
  RecipeDraftField,
  DuplicateRecipe,
} from '../../types/recipe';
import {
  INGREDIENT_UNITS,
  RECIPE_CATEGORIES,
} from '../../config/recipeOptions';
import styles from './AddRecipeModal.module.css';

export type RecipeFormValues = Partial<{
  [K in keyof Omit<Recipe, 'id'>]: Omit<Recipe, 'id'>[K] | null;
}>;

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecipe: (_recipe: Omit<Recipe, 'id'>) => void;
  initialValues?: RecipeFormValues;
  fieldFlags?: FieldFlags;
  duplicateOf?: DuplicateRecipe | null;
}

const FLAG_HINTS = {
  missing: 'Missing — please fill in',
  estimated: 'Estimated — please check',
} as const;

const EMPTY_INGREDIENT: Ingredient = { name: '', unit: 'g', quantity: 0 };

const AddRecipeModal: React.FC<AddRecipeModalProps> = ({
  isOpen,
  onClose,
  onAddRecipe,
  initialValues,
  fieldFlags,
  duplicateOf,
}) => {
  // Initial values are read once on mount; render with a fresh `key` per draft
  const [name, setName] = useState<string>(initialValues?.name ?? '');
  const [category, setCategory] = useState<string>(
    initialValues?.category ?? 'dinner'
  );
  const [instructions, setInstructions] = useState<string>(
    initialValues?.instructions ?? ''
  );
  const [prepTime, setPrepTime] = useState<number | ''>(
    initialValues ? initialValues.prep_time ?? '' : 15
  );
  const [portions, setPortions] = useState<number | ''>(
    initialValues ? initialValues.portions ?? '' : 2
  );
  const [fotoUrl, setFotoUrl] = useState<string>(initialValues?.foto_url ?? '');
  const [videoUrl, setVideoUrl] = useState<string>(
    initialValues?.video_url ?? ''
  );
  const [mainIngredients, setMainIngredients] = useState<Ingredient[]>(
    initialValues?.main_ingredients?.length
      ? initialValues.main_ingredients
      : [EMPTY_INGREDIENT]
  );
  const [commonIngredient, setCommonIngredient] = useState<string>('');
  const [commonIngredients, setCommonIngredients] = useState<string[]>(
    initialValues?.common_ingredients ?? []
  );
  const [flags, setFlags] = useState<FieldFlags>(fieldFlags ?? {});

  const clearFlag = (field: RecipeDraftField) => {
    if (flags[field]) {
      setFlags(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const hintId = (field: RecipeDraftField) =>
    flags[field] ? `${field}-flag-hint` : undefined;

  const renderFlagHint = (field: RecipeDraftField) => {
    const flag = flags[field];
    if (!flag) return null;
    return (
      <span
        id={`${field}-flag-hint`}
        className={`${styles['flag-hint']} ${styles[`flag-${flag}`]}`}
      >
        {FLAG_HINTS[flag]}
      </span>
    );
  };

  const toNumberOrEmpty = (value: string): number | '' =>
    value === '' ? '' : Number(value);

  const handleAddMainIngredient = () => {
    setMainIngredients([...mainIngredients, EMPTY_INGREDIENT]);
  };

  const handleMainIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: string | number
  ) => {
    clearFlag('main_ingredients');
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
    clearFlag('main_ingredients');
    const updatedIngredients = [...mainIngredients];
    updatedIngredients.splice(index, 1);
    setMainIngredients(updatedIngredients);
  };

  const handleAddCommonIngredient = () => {
    if (commonIngredient.trim()) {
      clearFlag('common_ingredients');
      setCommonIngredients([...commonIngredients, commonIngredient.trim()]);
      setCommonIngredient('');
    }
  };

  const handleRemoveCommonIngredient = (index: number) => {
    clearFlag('common_ingredients');
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
      prep_time: Number(prepTime),
      portions: Number(portions),
      main_ingredients: filteredMainIngredients,
      common_ingredients: commonIngredients,
      foto_url: fotoUrl.trim() || null,
      video_url: videoUrl.trim() || null,
    };

    onAddRecipe(newRecipe);
  };

  if (!isOpen) return null;

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['add-recipe-modal']}>
        <div className={styles['modal-header']}>
          <h2>
            <BookOpen size={24} />
            Add New Recipe
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
          {initialValues && (
            <div className={styles['import-banner']} role="status">
              <Sparkles size={18} aria-hidden />
              Prefilled from YouTube — please review before saving.
            </div>
          )}

          {duplicateOf && (
            <div className={styles['duplicate-warning']} role="note">
              <AlertTriangle size={18} aria-hidden />
              <span>
                You already have <em>{duplicateOf.name}</em> from this video.
              </span>
            </div>
          )}

          <div className={styles['form-group']}>
            <label htmlFor="recipe-name">Recipe Name</label>
            <input
              id="recipe-name"
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                clearFlag('name');
              }}
              required
              maxLength={255}
              placeholder="Enter recipe name"
              className={styles['form-input']}
              aria-describedby={hintId('name')}
            />
            {renderFlagHint('name')}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="recipe-category">Category</label>
            <select
              id="recipe-category"
              value={category}
              onChange={e => {
                setCategory(e.target.value);
                clearFlag('category');
              }}
              className={styles['form-select']}
              aria-describedby={hintId('category')}
            >
              {RECIPE_CATEGORIES.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {renderFlagHint('category')}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="recipe-foto-url">Photo URL (optional)</label>
            <input
              id="recipe-foto-url"
              type="url"
              value={fotoUrl}
              onChange={e => {
                setFotoUrl(e.target.value);
                clearFlag('foto_url');
              }}
              aria-describedby={hintId('foto_url')}
              placeholder="https://example.com/recipe-photo.jpg"
              className={styles['form-input']}
            />
            {renderFlagHint('foto_url')}
          </div>

          <div className={styles['form-group']}>
            <label>Main Ingredients</label>
            {renderFlagHint('main_ingredients')}
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
                  aria-describedby={
                    index === 0 ? hintId('main_ingredients') : undefined
                  }
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
                  {INGREDIENT_UNITS.map(unit => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
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
            {renderFlagHint('common_ingredients')}
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
              onChange={e => {
                setInstructions(e.target.value);
                clearFlag('instructions');
              }}
              required
              placeholder="Enter cooking instructions"
              className={styles['form-textarea']}
              rows={initialValues ? 8 : 4}
              aria-describedby={hintId('instructions')}
            />
            {renderFlagHint('instructions')}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="recipe-video-url">Video URL (optional)</label>
            <input
              id="recipe-video-url"
              type="url"
              value={videoUrl}
              onChange={e => {
                setVideoUrl(e.target.value);
                clearFlag('video_url');
              }}
              placeholder="https://youtube.com/watch?v=..."
              className={styles['form-input']}
              aria-describedby={hintId('video_url')}
            />
            {renderFlagHint('video_url')}
          </div>

          <div className={styles['form-row']}>
            <div className={`${styles['form-group']} ${styles.half}`}>
              <label htmlFor="recipe-preptime">Prep Time (minutes)</label>
              <input
                id="recipe-preptime"
                type="number"
                value={prepTime}
                onChange={e => {
                  setPrepTime(toNumberOrEmpty(e.target.value));
                  clearFlag('prep_time');
                }}
                min="1"
                required
                className={styles['form-input']}
                aria-describedby={hintId('prep_time')}
              />
              {renderFlagHint('prep_time')}
            </div>

            <div className={`${styles['form-group']} ${styles.half}`}>
              <label htmlFor="recipe-portions">Portions</label>
              <input
                id="recipe-portions"
                type="number"
                value={portions}
                onChange={e => {
                  setPortions(toNumberOrEmpty(e.target.value));
                  clearFlag('portions');
                }}
                min="1"
                required
                className={styles['form-input']}
                aria-describedby={hintId('portions')}
              />
              {renderFlagHint('portions')}
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
              Add Recipe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecipeModal;
