import React, { useState, useCallback } from 'react';
import {
  useShoppingList,
  ShoppingListRange,
} from '../../hooks/useShoppingList';
import WeekNavigator from '../meal-planner/WeekNavigator';
import { ShoppingListItem } from '../../services/shoppingListService';
import styles from './ShoppingList.module.css';

const RANGE_OPTIONS: {
  value: ShoppingListRange;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    value: 'first-half',
    label: 'First Half',
    shortLabel: 'Mon–Thu',
    description: 'Monday to Thursday',
  },
  {
    value: 'second-half',
    label: 'Second Half',
    shortLabel: 'Fri–Sun',
    description: 'Friday to Sunday',
  },
  {
    value: 'entire',
    label: 'Entire Week',
    shortLabel: 'Mon–Sun',
    description: 'Full week',
  },
];

function EditableQuantity({
  item,
  onUpdate,
}: {
  item: ShoppingListItem;
  onUpdate: (_id: string, _updates: Partial<ShoppingListItem>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(
    `${item.quantity ?? ''}${item.unit ? ` ${item.unit}` : ''}`.trim()
  );

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const parts = localValue.trim().split(/\s+/);
    const maybeNum = parseFloat(parts[0]);
    const quantity = Number.isNaN(maybeNum) ? undefined : maybeNum;
    const unit = parts.slice(1).join(' ') || undefined;
    onUpdate(item.id, { quantity, unit });
  }, [item.id, localValue, onUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  if (item.isCommon) return null;

  const startEditing = () => {
    setLocalValue(
      `${item.quantity ?? ''}${item.unit ? ` ${item.unit}` : ''}`.trim()
    );
    setIsEditing(true);
  };

  return isEditing ? (
    <input
      type="text"
      className={styles['quantity-input']}
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoFocus
      aria-label={`Edit quantity for ${item.name}`}
    />
  ) : (
    <button
      type="button"
      className={styles['quantity-display']}
      onClick={startEditing}
      aria-label={`Edit quantity for ${item.name}`}
    >
      {item.quantity != null
        ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`
        : '—'}
    </button>
  );
}

const ShoppingList: React.FC = () => {
  const [range, setRange] = useState<ShoppingListRange>('entire');
  const {
    weekStart,
    items,
    loading,
    error,
    navigateWeek,
    removeItem,
    updateItem,
  } = useShoppingList(range);

  const mainItems = items.filter(i => !i.isCommon);
  const commonItems = items.filter(i => i.isCommon);

  if (error) {
    return (
      <div className={styles['shopping-list']}>
        <div className={styles['error-message']}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles['shopping-list']}>
      <h2 className={styles['shopping-list-title']}>Shopping List</h2>
      <WeekNavigator weekStart={weekStart} onNavigate={navigateWeek} />
      <div className={styles['range-selector']}>
        {RANGE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            className={`${styles['range-option']} ${
              range === opt.value ? styles['range-active'] : ''
            }`}
            onClick={() => setRange(opt.value)}
          >
            <span className={styles['range-label']}>{opt.label}</span>
            <span className={styles['range-dates']}>{opt.shortLabel}</span>
          </button>
        ))}
      </div>
      {loading ? (
        <div className={styles['loading-message']}>
          Generating shopping list...
        </div>
      ) : items.length === 0 ? (
        <div className={styles['empty-state']}>
          No recipes planned for this range. Add meals to your calendar first.
        </div>
      ) : (
        <div className={styles['tables-container']}>
          {mainItems.length > 0 && (
            <section className={styles['list-section']}>
              <h3 className={styles['section-title']}>Main Ingredients</h3>
              <div className={styles['table-container']}>
                <table className={styles['ingredients-table']}>
                  <colgroup>
                    <col className={styles['col-name']} />
                    <col className={styles['col-recipes']} />
                    <col className={styles['col-quantity']} />
                    <col className={styles['col-remove']} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th className={styles['col-recipes']}>Recipes</th>
                      <th className={styles['col-quantity']}>Quantity</th>
                      <th
                        className={styles['col-remove']}
                        aria-label="Remove"
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {mainItems.map(item => (
                      <tr key={item.id}>
                        <td className={styles['col-name']}>{item.name}</td>
                        <td className={styles['col-recipes']}>
                          {item.recipes?.length > 0 ? (
                            <div className={styles['recipe-tags']}>
                              {item.recipes.map(recipe => (
                                <span
                                  key={recipe}
                                  className={styles['recipe-tag']}
                                >
                                  {recipe}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className={styles['no-recipes']}>—</span>
                          )}
                        </td>
                        <td className={styles['col-quantity']}>
                          <EditableQuantity item={item} onUpdate={updateItem} />
                        </td>
                        <td className={styles['col-remove']}>
                          <button
                            type="button"
                            className={styles['item-remove']}
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.name}`}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {commonItems.length > 0 && (
            <section
              className={`${styles['list-section']} ${styles['common-ingredients']}`}
            >
              <h3 className={styles['section-title']}>Common Ingredients</h3>
              <div className={styles['table-container']}>
                <table
                  className={`${styles['ingredients-table']} ${styles['ingredients-table-common']}`}
                >
                  <colgroup>
                    <col className={styles['col-name']} />
                    <col className={styles['col-recipes']} />
                    <col className={styles['col-remove']} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th className={styles['col-recipes']}>Recipes</th>
                      <th
                        className={styles['col-remove']}
                        aria-label="Remove"
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {commonItems.map(item => (
                      <tr key={item.id}>
                        <td className={styles['col-name']}>{item.name}</td>
                        <td className={styles['col-recipes']}>
                          {item.recipes?.length > 0 ? (
                            <div className={styles['recipe-tags']}>
                              {item.recipes.map(recipe => (
                                <span
                                  key={recipe}
                                  className={styles['recipe-tag']}
                                >
                                  {recipe}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className={styles['no-recipes']}>—</span>
                          )}
                        </td>
                        <td className={styles['col-remove']}>
                          <button
                            type="button"
                            className={styles['item-remove']}
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.name}`}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default ShoppingList;
