
import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Camera, Plus, Trash2, Loader2, ScanLine } from 'lucide-react';
import { identifyIngredientsFromImage } from '../services/geminiService';

export const Fridge: React.FC = () => {
  const { fridge, addToFridge, removeFromFridge } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [newItem, setNewItem] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const cleanBase64 = base64.split(',')[1];
      try {
        const detectedIngredients = await identifyIngredientsFromImage(cleanBase64);
        if (detectedIngredients.length > 0) {
          await addToFridge(detectedIngredients);
        } else {
          alert("Couldn't identify items. Try again.");
        }
      } catch (err) {
        alert("Error scanning image. Check API Key.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualAdd = async () => {
    if (newItem.trim()) {
      await addToFridge([newItem]);
      setNewItem('');
    }
  };

  return (
    <div className="p-6 min-h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 pt-6">
        <h1 className="text-3xl font-bold text-gray-900">My Fridge</h1>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-black text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform"
        >
          {isScanning ? <Loader2 className="animate-spin" /> : <Camera />}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileUpload}
        />
      </div>

      {/* Add Manual */}
      <div className="flex gap-2 mb-6">
        <input 
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add item manually..." 
          className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-400 outline-none"
        />
        <button 
          onClick={handleManualAdd}
          className="bg-amber-400 text-white px-4 rounded-xl font-bold"
        >
          <Plus />
        </button>
      </div>

      {/* Inventory List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {fridge.length === 0 ? (
           <div className="text-center py-10 text-gray-400">
             <ScanLine size={48} className="mx-auto mb-4 opacity-20" />
             <p>Fridge is empty.<br/>Scan a photo or add items.</p>
           </div>
        ) : (
          fridge.map((item, idx) => (
            <div key={`${item.id || idx}`} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center animate-in fade-in duration-300">
              <div>
                <p className="font-semibold text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-400">{item.quantity}</p>
              </div>
              <button onClick={() => item.id && removeFromFridge(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
