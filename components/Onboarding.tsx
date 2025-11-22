
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Goal, Cuisine } from '../types';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { updateUser } = useApp();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    goal: Goal.MAINTENANCE,
    cuisines: [] as Cuisine[],
    veg: false,
    weight: ''
  });

  const nextStep = () => setStep(s => s + 1);

  const toggleCuisine = (c: Cuisine) => {
    if (formData.cuisines.includes(c)) {
      setFormData(prev => ({ ...prev, cuisines: prev.cuisines.filter(x => x !== c) }));
    } else {
      setFormData(prev => ({ ...prev, cuisines: [...prev.cuisines, c] }));
    }
  };

  const finish = async () => {
    setIsSubmitting(true);
    const success = await updateUser({
      name: formData.name,
      goals: formData.goal,
      cuisines: formData.cuisines,
      isVegetarian: formData.veg,
      weight: formData.weight,
      onboardingComplete: true
    });
    
    if (!success) {
      setIsSubmitting(false);
      alert("Failed to connect to server. Please ensure the Python backend is running.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-amber-500 tracking-tight">Bentofy</h1>
              <p className="text-gray-500">Let's get to know you.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What should we call you?</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border-gray-300 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
                placeholder="Your name"
              />
            </div>
            <button
              disabled={!formData.name}
              onClick={nextStep}
              className="w-full bg-amber-400 hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              Next <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">Your Goal</h2>
              <p className="text-gray-500">What are you aiming for?</p>
            </div>
            <div className="space-y-3">
              {Object.values(Goal).map(g => (
                <button
                  key={g}
                  onClick={() => setFormData({...formData, goal: g})}
                  className={`w-full p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all ${formData.goal === g ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-gray-100 hover:border-amber-200'}`}
                >
                  <span className="font-medium">{g}</span>
                  {formData.goal === g && <Check className="text-amber-500" size={20} />}
                </button>
              ))}
            </div>
            <button onClick={nextStep} className="w-full bg-black text-white font-bold py-4 rounded-xl">Continue</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">Favorite Cuisines</h2>
              <p className="text-gray-500">Select all that apply</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(Cuisine).map(c => (
                <button
                  key={c}
                  onClick={() => toggleCuisine(c)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${formData.cuisines.includes(c) ? 'bg-amber-400 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button onClick={nextStep} className="w-full bg-black text-white font-bold py-4 rounded-xl">Continue</button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">Final Details</h2>
              <p className="text-gray-500">Personalize your plan</p>
            </div>
            
            <div className="space-y-4">
               <label className="flex items-center space-x-3 p-4 border rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.veg}
                  onChange={(e) => setFormData({...formData, veg: e.target.checked})}
                  className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                />
                <span className="text-gray-700 font-medium">I am Vegetarian</span>
              </label>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Current Weight (kg/lbs)</label>
                 <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full border-gray-300 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="e.g. 70"
                />
              </div>
            </div>

            <button
              disabled={!formData.weight || isSubmitting}
              onClick={finish}
              className="w-full bg-amber-400 hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} /> Creating Profile...
                </>
              ) : (
                "Start Planning"
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
