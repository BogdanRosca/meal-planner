import React from 'react';
import { MealPlanEntry } from '../../types/recipe';
import styles from './CalendarGrid.module.css';

interface CalendarGridProps {
  weekStart: Date;
  getEntry: (
    _dayOfWeek: number,
    _mealSlot: string
  ) => MealPlanEntry | undefined;
  onCellClick: (_dayOfWeek: number, _mealSlot: string) => void;
  onRemoveEntry: (_entryId: number) => void;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MEAL_SLOTS: { key: string; label: string; category: string }[] = [
  { key: 'breakfast', label: 'Breakfast', category: 'breakfast' },
  { key: 'morning_snack', label: 'Snack', category: 'snack' },
  { key: 'lunch', label: 'Lunch', category: 'lunch' },
  { key: 'afternoon_snack', label: 'Snack', category: 'snack' },
  { key: 'dinner', label: 'Dinner', category: 'dinner' },
];

const CATEGORY_EMOJI: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍽️',
  snack: '🍿',
};

const CalendarGrid: React.FC<CalendarGridProps> = ({
  weekStart,
  getEntry,
  onCellClick,
  onRemoveEntry,
}) => {
  const getDayDate = (dayIndex: number): string => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dayIndex);
    return d.getDate().toString();
  };

  return (
    <div className={styles['calendar-wrapper']}>
      <div className={styles['calendar-grid']}>
        {/* Corner cell */}
        <div
          className={`${styles['calendar-cell']} ${styles['calendar-corner']}`}
        />

        {/* Day headers */}
        {DAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`${styles['calendar-cell']} ${styles['calendar-day-header']}`}
          >
            <span className={styles['day-name']}>{label}</span>
            <span className={styles['day-date']}>{getDayDate(i)}</span>
          </div>
        ))}

        {/* Meal rows */}
        {MEAL_SLOTS.map(slot => (
          <React.Fragment key={slot.key}>
            {/* Row label */}
            <div
              className={`${styles['calendar-cell']} ${styles['calendar-row-label']}`}
            >
              <span className={styles['slot-emoji']}>
                {CATEGORY_EMOJI[slot.category] || '🍴'}
              </span>
              <span className={styles['slot-label']}>{slot.label}</span>
            </div>

            {/* Day cells for this meal slot */}
            {DAY_LABELS.map((_label, dayIndex) => {
              const entry = getEntry(dayIndex, slot.key);
              return (
                <div
                  key={`${slot.key}-${dayIndex}`}
                  className={`${styles['calendar-cell']} ${
                    styles['calendar-meal-cell']
                  } ${entry ? styles['cell-filled'] : styles['cell-empty']}`}
                  onClick={() => !entry && onCellClick(dayIndex, slot.key)}
                  role={entry ? undefined : 'button'}
                  tabIndex={entry ? undefined : 0}
                  onKeyDown={e => {
                    if (!entry && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onCellClick(dayIndex, slot.key);
                    }
                  }}
                >
                  {entry ? (
                    <div className={styles['cell-content']}>
                      <span className={styles['cell-recipe-name']}>
                        {entry.recipe_name}
                      </span>
                      <button
                        className={styles['cell-remove']}
                        onClick={e => {
                          e.stopPropagation();
                          onRemoveEntry(entry.id);
                        }}
                        aria-label={`Remove ${entry.recipe_name}`}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <span className={styles['cell-add']}>+</span>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;
