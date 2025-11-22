
export enum Goal {
  WEIGHT_LOSS = 'Weight Loss',
  MUSCLE_GAIN = 'Muscle Gain',
  MAINTENANCE = 'Maintenance',
}

export enum Cuisine {
  JAPANESE = 'Japanese',
  ITALIAN = 'Italian',
  CHINESE = 'Chinese',
  INDIAN = 'Indian',
  MEXICAN = 'Mexican',
  FRENCH = 'French',
  SPANISH = 'Spanish',
  AMERICAN = 'American',
  THAI = 'Thai',
  KOREAN = 'Korean',
}

export interface Ingredient {
  id?: number; // Added ID for DB
  name: string;
  quantity: string;
  inFridge: boolean;
}

export interface Recipe {
  id: string | number; // ID can be from DB
  title: string;
  image: string; 
  calories: number;
  protein: string;
  time: string;
  cuisine: string; // String from DB
  tags: string[]; 
  ingredients: Ingredient[];
  steps: string[];
  isFavorite: boolean;
  isUserCreated: boolean;
}

export interface UserProfile {
  id?: number; // Added DB ID
  name: string;
  goals: Goal;
  cuisines: Cuisine[];
  isVegetarian: boolean;
  weight: string;
  onboardingComplete: boolean;
}

export interface MealPlanDay {
  date: string; 
  breakfast?: string | number; 
  lunch?: string | number; 
  dinner?: string | number; 
}
