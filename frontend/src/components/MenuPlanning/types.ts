export interface Recipe {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  cooking_time?: number;
  difficulty?: string;
  cuisine?: string;
  calories?: number;
  ingredients?: Array<{
    name: string;
    amount: number;
    unit: string;
    category?: string;
  }>;
}

export interface MealItem {
  recipe?: Recipe;
  consumed?: boolean;
}

export interface MenuCell {
  breakfast?: MealItem;
  lunch?: MealItem;
  dinner?: MealItem;
}