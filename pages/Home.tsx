
import React from 'react';
import { useApp } from '../context/AppContext';
import { Search, ChevronRight, Clock, Flame } from 'lucide-react';
import { Cuisine } from '../types';

export const Home: React.FC = () => {
  const { user, recipes, isLoading } = useApp();
  const todayMeals = recipes.slice(0, 3); // Mock today's meals

  // Helper for cuisine colors
  const getCuisineColor = (c: string) => {
    const colors: Record<string, string> = {
      [Cuisine.JAPANESE]: 'bg-red-100 text-red-800',
      [Cuisine.ITALIAN]: 'bg-orange-100 text-orange-800',
      [Cuisine.CHINESE]: 'bg-yellow-100 text-yellow-800',
      [Cuisine.INDIAN]: 'bg-lime-100 text-lime-800',
      [Cuisine.MEXICAN]: 'bg-green-100 text-green-800',
      [Cuisine.FRENCH]: 'bg-blue-100 text-blue-800',
      [Cuisine.SPANISH]: 'bg-purple-100 text-purple-800',
      [Cuisine.AMERICAN]: 'bg-sky-100 text-sky-800',
      [Cuisine.THAI]: 'bg-amber-100 text-amber-800',
      [Cuisine.KOREAN]: 'bg-violet-100 text-violet-800',
    };
    return colors[c] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-8 animate-pulse">
        <div className="pt-6 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="h-12 bg-gray-200 rounded-2xl"></div>
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
           <div className="h-6 bg-gray-200 rounded w-1/3"></div>
           <div className="grid grid-cols-2 gap-3">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className="h-16 bg-gray-200 rounded-2xl"></div>
             ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="pt-6">
        <h2 className="text-gray-500 text-sm font-medium">Good morning</h2>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-amber-400">☀</span> {user.name || 'User'}
        </h1>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Meal ideas, recipes, ingredients"
          className="w-full bg-gray-100 rounded-2xl py-3 pl-12 pr-4 text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-200 outline-none transition-colors"
        />
      </div>

      {/* Today's Meals */}
      <div>
        <div className="flex justify-between items-end mb-4">
           <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
             📅 Today's meals
           </h3>
           <button className="text-xs text-gray-400 hover:text-amber-500 flex items-center">
             1 Jan <ChevronRight size={14} />
           </button>
        </div>
        
        <div className="space-y-3">
          {todayMeals.length === 0 ? (
             <div className="p-4 bg-gray-50 rounded-2xl text-center text-gray-400 text-sm">
               No meals planned for today.
             </div>
          ) : (
            todayMeals.map((meal) => (
              <div key={meal.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                <img src={meal.image} alt={meal.title} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 line-clamp-1">{meal.title}</h4>
                  <div className="flex gap-3 text-xs text-gray-400 mt-1">
                    <span className="flex items-center gap-1"><Flame size={10} /> {meal.calories} kcal</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {meal.time}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Discover by Cuisine */}
      <div>
         <h3 className="text-lg font-bold text-gray-900 mb-4">Discover by cuisine</h3>
         <div className="grid grid-cols-2 gap-3">
            {Object.values(Cuisine).map(c => (
              <div key={c} className={`p-4 rounded-2xl flex items-center justify-between ${getCuisineColor(c)}`}>
                <span className="font-semibold">{c}</span>
                {/* Placeholder for emoji or small icon if needed, sticking to text for cleanliness */}
              </div>
            ))}
         </div>
      </div>

       <div className="h-12"></div>
    </div>
  );
};
