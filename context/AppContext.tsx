
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Recipe, Ingredient, MealPlanDay, Goal } from '../types';
import { api } from '../services/api';

interface AppContextType {
  user: UserProfile;
  updateUser: (u: Partial<UserProfile>) => Promise<boolean>;
  fridge: Ingredient[];
  addToFridge: (items: string[]) => Promise<void>;
  removeFromFridge: (id: number) => Promise<void>;
  recipes: Recipe[];
  addRecipe: (r: Recipe) => Promise<void>;
  toggleFavorite: (id: string | number) => Promise<void>;
  mealPlan: MealPlanDay[];
  updateMealPlan: (date: string, type: 'breakfast'|'lunch'|'dinner', recipeId: string | number) => Promise<void>;
  shoppingList: Ingredient[];
  isLoading: boolean;
}

const defaultUser: UserProfile = {
  name: '',
  goals: Goal.MAINTENANCE,
  cuisines: [],
  isVegetarian: false,
  weight: '',
  onboardingComplete: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [fridge, setFridge] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize User
  useEffect(() => {
    const init = async () => {
        const storedId = localStorage.getItem('bentofy_user_id');
        if (storedId) {
            try {
                const u = await api.getUser(parseInt(storedId));
                if (u) {
                    setUser(u);
                    // Load Data
                    await loadUserData(u.id!);
                } else {
                  setIsLoading(false);
                }
            } catch (e) {
                console.error("Failed to load user", e);
                setIsLoading(false);
            }
        } else {
          setIsLoading(false);
        }
    };
    init();
  }, []);

  const loadUserData = async (userId: number) => {
    setIsLoading(true);
    try {
      // OPTIMIZATION: Fetch all data in parallel
      const [f, r, p] = await Promise.all([
        api.getFridge(userId),
        api.getRecipes(userId),
        api.getPlan(userId)
      ]);
      setFridge(f);
      setRecipes(r);
      setMealPlan(p);
    } catch (error) {
      console.error("Error loading data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (u: Partial<UserProfile>): Promise<boolean> => {
    // If onboarding completion
    if (u.onboardingComplete && !user.id) {
        setIsLoading(true);
        const newUser = { ...user, ...u };
        try {
          const created = await api.createUser(newUser);
          if (created && created.id) {
              localStorage.setItem('bentofy_user_id', created.id.toString());
              setUser({ ...newUser, id: created.id });
              // Load default data if needed, or seed empty
              await loadUserData(created.id);
              return true;
          }
          return false;
        } catch (e) {
          console.error(e);
          setIsLoading(false);
          return false;
        }
    } else {
        setUser(prev => ({ ...prev, ...u }));
        return true;
    }
  };

  const addToFridge = async (items: string[]) => {
    if (!user.id) return;
    try {
      const updatedFridge = await api.addToFridge(user.id, items);
      setFridge(updatedFridge);
    } catch (e) {
      console.error(e);
    }
  };

  const removeFromFridge = async (id: number) => {
    if (!user.id) return;
    // OPTIMISTIC UPDATE: Remove immediately from UI
    const previousFridge = [...fridge];
    setFridge(prev => prev.filter(i => i.id !== id));
    
    try {
      await api.removeFromFridge(user.id, id);
    } catch (e) {
      console.error(e);
      setFridge(previousFridge); // Revert on error
    }
  };

  const addRecipe = async (r: Recipe) => {
    if (!user.id) return;
    try {
      await api.createRecipe(user.id, r);
      const refreshed = await api.getRecipes(user.id);
      setRecipes(refreshed);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFavorite = async (id: string | number) => {
    // OPTIMISTIC UPDATE: Toggle immediately in UI
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));

    try {
      await api.toggleFavorite(Number(id));
    } catch (e) {
      console.error(e);
      // Revert on error
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
    }
  };

  const updateMealPlan = async (date: string, type: 'breakfast'|'lunch'|'dinner', recipeId: string | number) => {
    if (!user.id) return;
    
    // Optimistic update could be applied here too, but simpler to await for now for consistency in complex objects
    try {
      await api.updatePlan(user.id, date, type, recipeId);
      
      setMealPlan(prev => {
        const existingDayIndex = prev.findIndex(d => d.date === date);
        if (existingDayIndex >= 0) {
          const newPlan = [...prev];
          newPlan[existingDayIndex] = { ...newPlan[existingDayIndex], [type]: recipeId };
          return newPlan;
        } else {
          return [...prev, { date, [type]: recipeId }];
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Derived shopping list logic 
  const shoppingList = recipes
    .filter(r => mealPlan.some(day => day.breakfast === r.id || day.lunch === r.id || day.dinner === r.id))
    .flatMap(r => r.ingredients)
    .filter(i => !fridge.some(f => f.name.toLowerCase() === i.name.toLowerCase()));

  return (
    <AppContext.Provider value={{
      user,
      updateUser,
      fridge,
      addToFridge,
      removeFromFridge,
      recipes,
      addRecipe,
      toggleFavorite,
      mealPlan,
      updateMealPlan,
      shoppingList,
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
