
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { MealPlanDay } from '../types';

export const Planner: React.FC = () => {
  const { mealPlan, updateMealPlan, shoppingList, recipes, isLoading } = useApp();
  const [view, setView] = useState<'calendar' | 'shopping'>('calendar');
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Simple recipe selector mock
  const handleAddMeal = (day: string, type: 'breakfast'|'lunch'|'dinner') => {
    // In a real app, this opens a modal. Here we just cycle the first recipe for demo.
    if (recipes.length > 0) {
      updateMealPlan(day, type, recipes[0].id);
    }
  };

  const getRecipeName = (id?: string | number) => {
    if (!id) return null;
    return recipes.find(r => r.id === id)?.title;
  };

  if (isLoading) {
      return (
          <div className="p-6 pt-10 min-h-full flex flex-col animate-pulse">
             <div className="h-10 bg-gray-200 rounded-xl mb-6"></div>
             <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
             <div className="flex-1 bg-gray-200 rounded-xl opacity-50"></div>
          </div>
      )
  }

  return (
    <div className="p-6 pt-10 min-h-full flex flex-col">
      {/* Toggle */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button 
          onClick={() => setView('calendar')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${view === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
        >
          Calendar
        </button>
        <button 
          onClick={() => setView('shopping')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${view === 'shopping' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
        >
          Shopping List
        </button>
      </div>

      {view === 'calendar' ? (
        <div className="space-y-6 pb-20">
           <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold">Weekly Plan</h2>
             <button className="text-amber-500 text-sm font-bold">Generate for me</button>
           </div>
           
           <div className="overflow-x-auto">
             <div className="min-w-[600px] grid grid-cols-8 gap-2 text-xs">
               <div className="col-span-1"></div>
               {days.map(d => <div key={d} className="font-bold text-center text-gray-400">{d}</div>)}

               {['breakfast', 'lunch', 'dinner'].map((type) => (
                 <React.Fragment key={type}>
                   <div className="col-span-1 font-bold text-gray-500 capitalize py-4">{type}</div>
                   {days.map(day => {
                     const plan = mealPlan.find(p => p.date === day);
                     const recipeId = plan ? (plan as any)[type] : undefined;
                     return (
                       <div key={`${day}-${type}`} className="col-span-1 h-20 bg-white border border-gray-100 rounded-lg p-1 flex flex-col justify-center items-center text-center relative group transition-colors hover:border-amber-200">
                         {recipeId ? (
                           <span className="text-[10px] leading-tight overflow-hidden line-clamp-3">{getRecipeName(recipeId)}</span>
                         ) : (
                           <button onClick={() => handleAddMeal(day, type as any)} className="text-gray-300 hover:text-amber-500 w-full h-full flex items-center justify-center">
                             <PlusCircle size={16} />
                           </button>
                         )}
                       </div>
                     );
                   })}
                 </React.Fragment>
               ))}
             </div>
           </div>
        </div>
      ) : (
        <div className="space-y-4 pb-20 animate-in slide-in-from-right-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Shopping List</h2>
            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold">{shoppingList.length} items</span>
          </div>
          
          {shoppingList.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
              <p>Everything is in stock!<br/>Add meals to generate a list.</p>
            </div>
          ) : (
            shoppingList.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border-b border-gray-100">
                <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                <span className="flex-1 font-medium text-gray-700">{item.name}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{item.quantity}</span>
              </div>
            ))
          )}
          
          {shoppingList.length > 0 && (
             <button className="w-full bg-black text-white py-4 rounded-xl font-bold mt-4 sticky bottom-20 shadow-lg active:scale-95 transition-transform">
               Add to Cart
             </button>
          )}
        </div>
      )}
    </div>
  );
};
