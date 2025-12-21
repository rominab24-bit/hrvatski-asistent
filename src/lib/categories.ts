import { ShoppingCart, Home, Car, Heart, Gamepad2, Shirt, BookOpen, Zap, MoreHorizontal, LucideIcon } from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const categoryIcons: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  'home': Home,
  'car': Car,
  'heart': Heart,
  'gamepad-2': Gamepad2,
  'shirt': Shirt,
  'book-open': BookOpen,
  'zap': Zap,
  'more-horizontal': MoreHorizontal,
};

export const getCategoryIcon = (iconName: string): LucideIcon => {
  return categoryIcons[iconName] || MoreHorizontal;
};

export const getCategoryByName = (categories: Category[], name: string): Category | undefined => {
  return categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
};
