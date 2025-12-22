import { 
  ShoppingCart, Home, Car, Heart, Gamepad2, Shirt, BookOpen, Zap, MoreHorizontal,
  Utensils, Coffee, Wine, Pizza, Plane, Train, Bus, Fuel, Bike,
  GraduationCap, Baby, Dog, Cat, Gift, Music, Film, Tv, Headphones,
  Smartphone, Laptop, Camera, Wifi, CreditCard, Wallet, PiggyBank, TrendingUp,
  Briefcase, Building, Hammer, Wrench, Scissors, Paintbrush, Flower2, Trees,
  Dumbbell, Trophy, Target, Sparkles, Star, Moon, Sun, Cloud, Umbrella,
  Thermometer, Pill, Stethoscope, Syringe, Cross, ShieldCheck, Lock, Key,
  MapPin, Compass, Globe, Flag, Ticket, PartyPopper, Cake, IceCream,
  LucideIcon 
} from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const categoryIcons: Record<string, LucideIcon> = {
  // Osnovno
  'shopping-cart': ShoppingCart,
  'home': Home,
  'car': Car,
  'heart': Heart,
  'gamepad-2': Gamepad2,
  'shirt': Shirt,
  'book-open': BookOpen,
  'zap': Zap,
  'more-horizontal': MoreHorizontal,
  
  // Hrana i piće
  'utensils': Utensils,
  'coffee': Coffee,
  'wine': Wine,
  'pizza': Pizza,
  'cake': Cake,
  'ice-cream': IceCream,
  
  // Prijevoz
  'plane': Plane,
  'train': Train,
  'bus': Bus,
  'fuel': Fuel,
  'bike': Bike,
  
  // Edukacija i obitelj
  'graduation-cap': GraduationCap,
  'baby': Baby,
  'dog': Dog,
  'cat': Cat,
  'gift': Gift,
  
  // Zabava
  'music': Music,
  'film': Film,
  'tv': Tv,
  'headphones': Headphones,
  'ticket': Ticket,
  'party-popper': PartyPopper,
  
  // Tehnologija
  'smartphone': Smartphone,
  'laptop': Laptop,
  'camera': Camera,
  'wifi': Wifi,
  
  // Financije
  'credit-card': CreditCard,
  'wallet': Wallet,
  'piggy-bank': PiggyBank,
  'trending-up': TrendingUp,
  
  // Posao i alati
  'briefcase': Briefcase,
  'building': Building,
  'hammer': Hammer,
  'wrench': Wrench,
  'scissors': Scissors,
  'paintbrush': Paintbrush,
  
  // Priroda
  'flower-2': Flower2,
  'trees': Trees,
  
  // Sport i fitness
  'dumbbell': Dumbbell,
  'trophy': Trophy,
  'target': Target,
  
  // Dekorativno
  'sparkles': Sparkles,
  'star': Star,
  'moon': Moon,
  'sun': Sun,
  'cloud': Cloud,
  'umbrella': Umbrella,
  
  // Zdravlje
  'thermometer': Thermometer,
  'pill': Pill,
  'stethoscope': Stethoscope,
  'syringe': Syringe,
  'cross': Cross,
  'shield-check': ShieldCheck,
  
  // Sigurnost
  'lock': Lock,
  'key': Key,
  
  // Lokacija i putovanja
  'map-pin': MapPin,
  'compass': Compass,
  'globe': Globe,
  'flag': Flag,
};

export const getCategoryIcon = (iconName: string): LucideIcon => {
  return categoryIcons[iconName] || MoreHorizontal;
};

export const getCategoryByName = (categories: Category[], name: string): Category | undefined => {
  return categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
};
