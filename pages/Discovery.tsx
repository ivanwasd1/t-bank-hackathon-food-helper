import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Heart, RotateCcw, Sparkles } from 'lucide-react';
import { generateRecipeSuggestions } from '../services/geminiService';
import { Recipe } from '../types';

export const Discovery: React.FC = () => {
  const { user, fridge, addRecipe } = useApp();
  const [suggestions, setSuggestions] = useState<Partial<Recipe>[]>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);

  const loadSuggestions = async () => {
    setLoading(true);
    // Get fridge item names
    const fridgeItems = fridge.map(i => i.name);
    // If fridge empty, use generic
    const ingredients = fridgeItems.length > 0 ? fridgeItems : ['Chicken', 'Rice', 'Broccoli'];
    
    const results = await generateRecipeSuggestions(ingredients, {
      goal: user.goals,
      cuisines: user.cuisines.length > 0 ? user.cuisines : [],
      veg: user.isVegetarian
    });
    
    // Add generic images for demo since Gemini doesn't return images in the basic prompt
    const enhancedResults = results.map(r => ({
      ...r,
      image: `https://picsum.photos/400/600?random=${Math.random()}`,
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    setSuggestions(enhancedResults);
    setLoading(false);
    setIndex(0);
  };

  useEffect(() => {
    if (suggestions.length === 0 && !loading) {
      loadSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      const current = suggestions[index] as Recipe;
      addRecipe({ ...current, isFavorite: true, isUserCreated: false });
    }
    if (index < suggestions.length - 1) {
      setIndex(i => i + 1);
    } else {
      // Refresh or show end
      setIndex(i => i + 1);
    }
  };

  const currentCard = suggestions[index];

  return (
    <div className="h-full flex flex-col p-6 pt-10">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Sparkles className="text-amber-400" /> Discover
      </h2>

      <div className="flex-1 relative flex items-center justify-center">
        {loading ? (
          <div className="text-center animate-pulse">
             <div className="w-16 h-16 bg-amber-200 rounded-full mx-auto mb-4"></div>
             <p className="text-gray-500 font-medium">Curating recipes...</p>
          </div>
        ) : !currentCard ? (
           <div className="text-center">
             <p className="text-gray-500 mb-4">That's all for now!</p>
             <button onClick={loadSuggestions} className="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto">
               <RotateCcw size={18} /> Refresh
             </button>
           </div>
        ) : (
          <div className="w-full h-[500px] relative group perspective-1000">
            {/* Card */}
            <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transform transition-transform duration-300">
              <div className="h-3/5 relative">
                <img src={currentCard.image} alt="recipe" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                   <h3 className="text-white text-2xl font-bold">{currentCard.title}</h3>
                   <div className="flex gap-2 mt-2">
                     <span className="bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded text-xs">{currentCard.time}</span>
                     <span className="bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded text-xs">{currentCard.calories} kcal</span>
                   </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                   {currentCard.ingredients?.slice(0, 4).map((ing, i) => (
                     <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{ing.name}</span>
                   ))}
                   {(currentCard.ingredients?.length || 0) > 4 && <span className="text-xs text-gray-400 px-2 py-1">+more</span>}
                </div>
                <p className="text-sm text-gray-500 line-clamp-3">
                  Perfect for your goal of {user.goals}. Uses ingredients you might have!
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute -bottom-20 left-0 right-0 flex justify-center gap-6">
              <button onClick={() => handleSwipe('left')} className="w-16 h-16 bg-white text-red-500 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform border border-red-100">
                <X size={32} />
              </button>
              <button onClick={() => handleSwipe('right')} className="w-16 h-16 bg-amber-400 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform border border-amber-300">
                <Heart size={32} fill="currentColor" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
