
import { UserProfile, Ingredient, Recipe, MealPlanDay } from "../types";

// Use environment variable or default to localhost
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export const api = {
  // User
  createUser: async (user: UserProfile) => {
    const res = await fetch(`${API_URL}/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: user.name,
        goals: user.goals,
        weight: user.weight,
        is_vegetarian: user.isVegetarian,
        cuisines: user.cuisines.join(','),
        onboarding_complete: user.onboardingComplete
      })
    });
    return res.json();
  },

  getUser: async (id: number) => {
    const res = await fetch(`${API_URL}/users/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    // Map back to frontend structure
    return {
      id: data.id,
      name: data.name,
      goals: data.goals,
      weight: data.weight,
      isVegetarian: data.is_vegetarian,
      cuisines: data.cuisines ? data.cuisines.split(',') : [],
      onboardingComplete: data.onboarding_complete
    } as UserProfile;
  },

  // Fridge
  getFridge: async (userId: number) => {
    const res = await fetch(`${API_URL}/fridge/${userId}`);
    const data = await res.json();
    return data.map((i: any) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        inFridge: i.in_fridge
    }));
  },

  addToFridge: async (userId: number, items: string[]) => {
    const res = await fetch(`${API_URL}/fridge/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    });
    const data = await res.json();
    return data.map((i: any) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        inFridge: i.in_fridge
    }));
  },

  removeFromFridge: async (userId: number, itemId: number) => {
    await fetch(`${API_URL}/fridge/${userId}/${itemId}`, { method: 'DELETE' });
  },

  // Recipes
  getRecipes: async (userId: number) => {
    const res = await fetch(`${API_URL}/recipes/${userId}`);
    const data = await res.json();
    return data.map((r: any) => ({
        ...r,
        id: r.id,
        cuisine: r.cuisine,
        isFavorite: r.is_favorite,
        isUserCreated: r.is_user_created,
        ingredients: r.ingredients.map((ri: any) => ({
            name: ri.name,
            quantity: ri.quantity,
            inFridge: true
        }))
    }));
  },

  createRecipe: async (userId: number, recipe: Recipe) => {
    const payload = {
        title: recipe.title,
        image: recipe.image,
        calories: recipe.calories,
        protein: recipe.protein,
        time: recipe.time,
        cuisine: recipe.cuisine,
        tags: JSON.stringify(recipe.tags),
        steps: JSON.stringify(recipe.steps),
        is_favorite: recipe.isFavorite,
        is_user_created: true,
        user_id: userId,
        ingredients: recipe.ingredients
    };
    const res = await fetch(`${API_URL}/recipes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return res.json();
  },

  toggleFavorite: async (recipeId: number) => {
    await fetch(`${API_URL}/recipes/${recipeId}/favorite`, { method: 'PUT' });
  },

  // Plan
  getPlan: async (userId: number) => {
    const res = await fetch(`${API_URL}/plan/${userId}`);
    const data = await res.json();
    // Convert flat DB rows to Frontend structure
    const planMap: Record<string, MealPlanDay> = {};
    
    data.forEach((row: any) => {
        if (!planMap[row.date]) planMap[row.date] = { date: row.date };
        (planMap[row.date] as any)[row.meal_type] = row.recipe_id;
    });

    return Object.values(planMap);
  },

  updatePlan: async (userId: number, date: string, type: string, recipeId: number | string) => {
    await fetch(`${API_URL}/plan/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            date,
            meal_type: type,
            recipe_id: recipeId,
            user_id: userId
        })
    });
  }
};
