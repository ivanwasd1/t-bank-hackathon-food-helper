import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { favoritesAPI } from '../../services/api';
import RecipeCard from '../RecipeCard/RecipeCard';
import BottomNav from '../BottomNav/BottomNav';
import './Favorites.css';

const Favorites: React.FC = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'all' | 'available'>('all');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user, activeTab]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      let response;
      if (activeTab === 'available') {
        response = await favoritesAPI.getAvailable(user!.id);
      } else {
        response = await favoritesAPI.getAll(user!.id);
      }
      if (response.data.success) {
        setFavorites(response.data.data.map((f: any) => f.recipe || f));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="favorites-screen">
      <div className="favorites-header">
        <h1>Избранное</h1>
      </div>

      <div className="favorites-tabs">
        <button
          className={`favorites-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Все рецепты
        </button>
        <button
          className={`favorites-tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Холодильник
        </button>
      </div>

      <div className="favorites-content">
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : favorites.length === 0 ? (
          <div className="empty-state">
            <p>Нет избранных рецептов</p>
            <p className="hint">Добавьте рецепты в избранное, чтобы они были здесь</p>
          </div>
        ) : (
          <div className="recipes-grid">
            {favorites.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Favorites;

