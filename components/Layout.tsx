import React from 'react';
import { Home, Utensils, Calendar, ShoppingCart, User, Search, Sparkles } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (t: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'recipes', icon: Utensils, label: 'Recipes' },
    { id: 'fridge', icon: Search, label: 'Fridge' }, // Using Search icon for Fridge scan/search context or use 'Box'
    { id: 'planner', icon: Calendar, label: 'Schedule' },
    { id: 'discovery', icon: Sparkles, label: 'Discover' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      {/* Mobile Container Simulator for Desktop */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
          {children}
        </main>

        {/* Floating Bottom Nav */}
        <div className="absolute bottom-6 left-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50">
           <div className="flex justify-between items-center">
             {tabs.map((tab) => {
               const Icon = tab.icon;
               const isActive = activeTab === tab.id;
               return (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${isActive ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-gray-600'}`}
                 >
                   <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                   <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
                 </button>
               )
             })}
           </div>
        </div>

      </div>
    </div>
  );
};
