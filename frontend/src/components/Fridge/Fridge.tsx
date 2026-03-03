import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { fridgeAPI, analyzeAPI } from '../../services/api';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import BottomNav from '../BottomNav/BottomNav';
import './Fridge.css';

const Fridge: React.FC = () => {
  const { user } = useUser();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    unit: 'шт',
  });

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user]);

  const loadItems = async () => {
    try {
      setLoading(true);
      
      // Сначала пробуем загрузить из localStorage
      const localData = loadFromLocalStorage<any[]>('foodhelper_fridge', user!.id);
      if (localData) {
        setItems(localData);
        setLoading(false);
      }
      
      // Затем пробуем загрузить с сервера
      try {
        const response = await fridgeAPI.getAll(user!.id);
        if (response.data.success) {
          setItems(response.data.data);
          saveToLocalStorage('foodhelper_fridge', response.data.data, user!.id);
        }
      } catch (apiError) {
        console.warn('⚠️ API недоступен, используются локальные данные');
      }
    } catch (error) {
      console.error('Error loading fridge items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setScanning(true);
      const response = await analyzeAPI.analyzeImage(file);
      if (response.data.success && response.data.data.products) {
        for (const product of response.data.data.products) {
          await fridgeAPI.add(user.id, {
            name: product.name,
            amount: product.amount || 1,
            unit: product.unit || 'шт',
            category: product.category,
            expiry_date: product.expiry_date,
          });
        }
        await loadItems();
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      alert('Ошибка при анализе изображения');
    } finally {
      setScanning(false);
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim() || !formData.amount) return;

    try {
      const newItem = {
        id: Date.now(),
        name: formData.name.trim(),
        amount: parseFloat(formData.amount) || 1,
        unit: formData.unit,
      };
      
      // Добавляем в localStorage
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      saveToLocalStorage('foodhelper_fridge', updatedItems, user.id);
      
      // Пробуем добавить на сервер
      try {
        await fridgeAPI.add(user.id, newItem);
      } catch (apiError) {
        console.warn('⚠️ API недоступен, данные сохранены только локально');
      }
      
      setFormData({ name: '', amount: '', unit: 'шт' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Ошибка при добавлении продукта');
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!user) return;
    if (!window.confirm('Удалить этот продукт?')) return;

    try {
      // Удаляем из localStorage
      const updatedItems = items.filter(item => item.id !== itemId);
      setItems(updatedItems);
      saveToLocalStorage('foodhelper_fridge', updatedItems, user.id);
      
      // Пробуем удалить с сервера
      try {
        await fridgeAPI.delete(user.id, itemId);
      } catch (apiError) {
        console.warn('⚠️ API недоступен, данные удалены только локально');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Ошибка при удалении продукта');
    }
  };

  if (!user) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="fridge-screen">
      <div className="fridge-header">
        <h1>Холодильник</h1>
      </div>

      <div className="fridge-actions">
        <label className="scan-button">
          Сканировать фото
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            disabled={scanning}
          />
        </label>
        <button 
          className="add-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Отмена' : 'Добавить вручную'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-form-container">
          <form className="add-form" onSubmit={handleAddManual}>
            <div className="form-group">
              <label>Название продукта</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: яйца"
                required
                className="form-input"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Количество</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="1"
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Единица измерения</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="form-input"
                >
                  <option value="шт">шт</option>
                  <option value="г">г</option>
                  <option value="кг">кг</option>
                  <option value="мл">мл</option>
                  <option value="л">л</option>
                  <option value="ст.л">ст.л</option>
                  <option value="ч.л">ч.л</option>
                </select>
              </div>
            </div>
            <button type="submit" className="submit-button">
              Добавить
            </button>
          </form>
        </div>
      )}

      <div className="fridge-content">
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : scanning ? (
          <div className="loading">Анализируем изображение...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>Холодильник пуст</p>
            <p className="hint">Добавьте продукты вручную или отсканируйте фото</p>
          </div>
        ) : (
          <div className="fridge-items">
            {items.map(item => (
              <div key={item.id} className="fridge-item">
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <p>{item.amount} {item.unit}</p>
                  {item.category && <span className="item-category">{item.category}</span>}
                </div>
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(item.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Fridge;
