import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { favoritesAPI, recipeAPI } from '../../services/api';
import './RecipeCard.css';

interface RecipeCardProps {
  recipe: {
    id: number;
    name: string;
    description?: string;
    image_url?: string;
    cooking_time?: number;
    difficulty?: string;
    cuisine?: string;
    calories?: number;
    is_custom?: boolean;
    user_id?: number;
    ingredients?: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
  onDelete?: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onDelete }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(false);

  useEffect(() => {
    if (user) {
      checkFavorite();
    }
  }, [user, recipe.id]);

  const checkFavorite = async () => {
    if (!user) return;
    try {
      setCheckingFavorite(true);
      const response = await favoritesAPI.getAll(user.id);
      if (response.data.success) {
        const favorites = response.data.data.map((f: any) => f.recipe || f);
        const favoriteIds = favorites.map((r: any) => r.id);
        setIsFavorite(favoriteIds.includes(recipe.id));
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    } finally {
      setCheckingFavorite(false);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем переход на страницу рецепта
    if (!user) return;
    
    try {
      if (isFavorite) {
        await favoritesAPI.remove(user.id, recipe.id);
        setIsFavorite(false);
      } else {
        await favoritesAPI.add(user.id, recipe.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Ошибка при изменении избранного');
    }
  };

  const handleCardClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    if (window.confirm(`Вы уверены, что хотите удалить рецепт "${recipe.name}"?`)) {
      try {
        await recipeAPI.delete(recipe.id);
        alert('Рецепт успешно удален!');
        if (onDelete) {
          onDelete();
        }
      } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Ошибка при удалении рецепта');
      }
    }
  };

  // Показываем первые 3-4 ингредиента
  const displayIngredients = recipe.ingredients && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
    ? recipe.ingredients.slice(0, 4).map((ing: any) => typeof ing === 'string' ? ing : ing.name).join(', ')
    : '';

  return (
    <div className="recipe-card" onClick={handleCardClick}>
      <div className="recipe-card-header">
        {recipe.image_url && (
          <div className="recipe-image">
            <img src={recipe.image_url} alt={recipe.name} />
          </div>
        )}
        <div className="recipe-card-actions">
          {user && (
            <button
              className={`favorite-button ${isFavorite ? 'active' : ''}`}
              onClick={handleFavoriteClick}
              disabled={checkingFavorite}
              title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              {isFavorite ? '★' : '☆'}
            </button>
          )}
          {user && recipe.is_custom && recipe.user_id === user.id && (
            <button
              className="delete-button"
              onClick={handleDeleteClick}
              title="Удалить рецепт"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="recipe-content">
        <h3 className="recipe-name">{recipe.name}</h3>
        {recipe.description && (
          <p className="recipe-description">{recipe.description}</p>
        )}
        {displayIngredients && (
          <div className="recipe-ingredients">
            <span className="ingredients-label">Ингредиенты:</span>
            <span className="ingredients-list">{displayIngredients}</span>
            {recipe.ingredients && recipe.ingredients.length > 4 && (
              <span className="ingredients-more">+{recipe.ingredients.length - 4}</span>
            )}
          </div>
        )}
        <div className="recipe-meta">
          {recipe.cooking_time && (
            <span className="meta-item">{recipe.cooking_time} мин</span>
          )}
          {recipe.difficulty && (
            <span className="meta-item">{recipe.difficulty}</span>
          )}
          {recipe.cuisine && (
            <span className="meta-item">{recipe.cuisine}</span>
          )}
        </div>
        {recipe.calories && (
          <div className="recipe-calories">
            {recipe.calories} ккал
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeCard;
