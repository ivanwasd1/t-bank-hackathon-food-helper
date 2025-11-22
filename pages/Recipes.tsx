
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, ChefHat, Heart } from 'lucide-react';

export const Recipes: React.FC = () => {
  const { recipes, toggleFavorite, isLoading } = useApp();
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  const displayedRecipes = filter === 'favorites' 
    ? recipes.filter(r => r.isFavorite)
    : recipes;

  if (isLoading) {
      return (
        <div className="p-6 pt-10 min-h-full animate-pulse space-y-6">
            <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex gap-4">
                <div className="h-9 w-24 bg-gray-200 rounded-full"></div>
                <div className="h-9 w-24 bg-gray-200 rounded-full"></div>
            </div>
            <div className="space-y-4">
                {[1,2,3].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-64">
                        <div className="h-40 bg-gray-200"></div>
                        <div className="p-4 space-y-2">
                            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )
  }

  return (
    <div className="p-6 pt-10 min-h-full">
       <div className="flex justify-between items-center mb-6">
         <h2 className="text-3xl font-bold">Recipes</h2>
         <button className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform">
           <Plus />
         </button>
       </div>

       <div className="flex gap-4 mb-6 overflow-x-auto no-scrollbar">
         <button 
           onClick={() => setFilter('all')}
           className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'}`}
         >
           All Recipes
         </button>
         <button 
           onClick={() => setFilter('favorites')}
           className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === 'favorites' ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'}`}
         >
           Favorites
         </button>
       </div>

       <div className="space-y-4 pb-20">
         {displayedRecipes.length === 0 ? (
           <div className="text-center py-10 text-gray-400">
             <ChefHat size={48} className="mx-auto mb-4 opacity-20" />
             <p>No recipes found.</p>
           </div>
         ) : (
           displayedRecipes.map(r => (
             <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group transition-transform hover:scale-[1.02] duration-300">
               <div className="relative h-40">
                 <img src={r.image} alt={r.title} className="w-full h-full object-cover" />
                 <button 
                   onClick={(e) => { e.stopPropagation(); toggleFavorite(r.id); }}
                   className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                 >
                   <Heart size={16} className={r.isFavorite ? "fill-red-500 text-red-500 transition-colors" : "text-gray-400 transition-colors"} />
                 </button>
                 <div className="absolute bottom-3 left-3 flex gap-2">
                    {r.tags.map(t => (
                      <span key={t} className="bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded-md">{t}</span>
                    ))}
                 </div>
               </div>
               <div className="p-4">
                 <h3 className="font-bold text-lg text-gray-900">{r.title}</h3>
                 <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                   <span>{r.time} • {r.calories} kcal</span>
                   <button className="text-amber-500 font-semibold text-xs uppercase tracking-wide">Cook Now</button>
                 </div>
               </div>
             </div>
           ))
         )}
       </div>
    </div>
  );
};
