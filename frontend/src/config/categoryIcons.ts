import { Apple, Coffee, LucideIcon, Moon, Sun, Utensils } from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  breakfast: Coffee,
  snack: Apple,
  lunch: Sun,
  dinner: Moon,
};

export const getCategoryIcon = (category: string): LucideIcon =>
  CATEGORY_ICONS[category.toLowerCase()] ?? Utensils;
