import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { recipeAPI, favoritesAPI } from '../../services/api';
import './MainScreen.css';
import BottomNav from '../BottomNav/BottomNav';
import RecipeCard from '../RecipeCard/RecipeCard';
import FilterPanel from '../FilterPanel/FilterPanel';
import Logo from '../Logo/Logo';

const MainScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'recommendations' | 'my-recipes' | 'available'>('recommendations');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    cuisine: '',
    cooking_time: '',
    difficulty: '',
    season: '',
    budget: '',
    meal_type: '',
  });

  useEffect(() => {
    if (user) {
      loadRecipes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, activeTab === 'recommendations' ? JSON.stringify(filters) : null]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      let response;
      
      if (activeTab === 'recommendations') {
        // Формируем параметры фильтров
        const params: any = {};
        if (filters.cuisine) params.cuisine = filters.cuisine;
        if (filters.cooking_time) params.cooking_time = filters.cooking_time;
        if (filters.difficulty) params.difficulty = filters.difficulty;
        if (filters.season) params.season = filters.season;
        if (filters.budget) params.budget = filters.budget;
        if (filters.meal_type) params.meal_type = filters.meal_type;
        
        response = await recipeAPI.getRecommendations(user!.id, params);
      } else if (activeTab === 'available') {
        // Рецепты из избранного, которые можно приготовить
        response = await favoritesAPI.getAvailable(user!.id);
        if (response.data.success) {
          // Преобразуем данные из формата favorites в формат recipes
          const favorites = response.data.data;
          setRecipes(favorites.map((f: any) => f.recipe || f));
          return;
        }
      } else {
        response = await recipeAPI.getAll({ user_id: user!.id, is_custom: true });
      }
      
      if (response.data.success) {
        setRecipes(response.data.data);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="main-screen">
      <div className="main-header">
        <Logo size="xlarge" />
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Рекомендации
        </button>
        <button
          className={`tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Можно <br></br>приготовить
        </button>
        <button
          className={`tab ${activeTab === 'my-recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-recipes')}
        >
          Мои рецепты
        </button>
      </div>

      {activeTab === 'recommendations' && (
        <FilterPanel filters={filters} setFilters={setFilters} user={user} />
      )}

      {activeTab === 'my-recipes' && (
        <div className="my-recipes-header">
          <button
            className="add-recipe-fab"
            onClick={() => navigate('/recipe/add')}
            title="Добавить рецепт"
          >
            + Добавить рецепт
          </button>
        </div>
      )}

      <div className="recipes-container">
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : recipes.length === 0 ? (
          <div className="empty-state">
            <p>
              {activeTab === 'available' 
                ? 'Нет рецептов, которые можно приготовить. Добавьте продукты в холодильник и рецепты в избранное.'
                : activeTab === 'my-recipes'
                ? 'У вас пока нет своих рецептов. Нажмите кнопку "Добавить рецепт" выше, чтобы создать свой первый рецепт!'
                : 'Рецепты не найдены'
              }
            </p>
          </div>
        ) : (
          <div className="recipes-grid">
            {recipes.map(recipe => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                onDelete={activeTab === 'my-recipes' ? loadRecipes : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MainScreen;

