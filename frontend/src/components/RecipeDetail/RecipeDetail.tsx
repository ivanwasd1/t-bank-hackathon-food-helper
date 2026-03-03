import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { recipeAPI, favoritesAPI } from '../../services/api';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import './RecipeDetail.css';

interface CartItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category?: string;
  checked: boolean;
}

interface FridgeItem {
  id: number;
  name: string;
  amount: number;
  unit: string;
  category?: string;
}

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      loadRecipe();
    }
  }, [id]);

  useEffect(() => {
    if (user && recipe) {
      checkFavorite();
    }
  }, [user, recipe]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const response = await recipeAPI.get(Number(id));
      if (response.data.success) {
        setRecipe(response.data.data);
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    if (!user || !recipe) return;
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

  const toggleFavorite = async () => {
    if (!user || !recipe) return;
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

  const addMissingIngredientsToCart = async () => {
    if (!user || !recipe) return;

    try {
      setAddingToCart(true);

      // Загружаем продукты из холодильника
      const fridgeData = loadFromLocalStorage<FridgeItem[]>('foodhelper_fridge', user.id) || [];

      // Создаем карту продуктов в холодильнике
      const fridgeMap = new Map<string, number>();
      fridgeData.forEach(item => {
        const key = item.name.toLowerCase().trim();
        fridgeMap.set(key, (fridgeMap.get(key) || 0) + item.amount);
      });

      // Находим недостающие ингредиенты
      const missingIngredients: CartItem[] = [];

      recipe.ingredients?.forEach((ingredient: any) => {
        const ingredientName = ingredient.name.toLowerCase().trim();
        const requiredAmount = parseFloat(ingredient.amount) || 1;
        const availableAmount = fridgeMap.get(ingredientName) || 0;

        if (availableAmount < requiredAmount) {
          const missingAmount = requiredAmount - availableAmount;
          missingIngredients.push({
            id: `${Date.now()}-${Math.random()}`,
            name: ingredient.name,
            amount: missingAmount,
            unit: ingredient.unit || 'шт',
            category: ingredient.category || 'Другое',
            checked: false
          });
        }
      });

      if (missingIngredients.length === 0) {
        alert('Все ингредиенты уже есть в холодильнике!');
        return;
      }

      // Загружаем текущую корзину
      const currentCart = loadFromLocalStorage<CartItem[]>('foodhelper_cart', user.id) || [];
      console.log('🛒 RecipeDetail - Текущая корзина:', currentCart);
      console.log('🛒 RecipeDetail - Недостающие ингредиенты:', missingIngredients);

      // Добавляем недостающие ингредиенты
      const updatedCart = [...currentCart, ...missingIngredients];
      console.log('🛒 RecipeDetail - Обновленная корзина:', updatedCart);

      // Сохраняем корзину
      const saveResult = saveToLocalStorage('foodhelper_cart', updatedCart, user.id);
      console.log('🛒 RecipeDetail - Результат сохранения:', saveResult);
      
      // Проверяем, что данные действительно сохранились
      const verifyCart = loadFromLocalStorage<CartItem[]>('foodhelper_cart', user.id);
      console.log('🛒 RecipeDetail - Проверка сохранения:', verifyCart);

      alert(`Добавлено ${missingIngredients.length} продуктов в корзину!`);
      
      // Диспатчим событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: updatedCart } }));

    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Ошибка при добавлении в корзину');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="recipe-detail">
        <div className="loading">Загрузка рецепта...</div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="recipe-detail">
        <div className="error">Рецепт не найден</div>
        <button onClick={() => navigate('/main')} className="back-button">
          ← Вернуться назад
        </button>
      </div>
    );
  }

  return (
    <div className="recipe-detail">
      <div className="recipe-detail-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Назад
        </button>
        {user && (
          <button
            onClick={toggleFavorite}
            className={`favorite-button ${isFavorite ? 'active' : ''}`}
            disabled={checkingFavorite}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        )}
      </div>

      <div className="recipe-detail-content">
        <div className="recipe-title-section">
          <h1>{recipe.name}</h1>
          {recipe.description && (
            <p className="recipe-description">{recipe.description}</p>
          )}
        </div>

        <div className="recipe-info-grid">
          {recipe.cooking_time && (
            <div className="info-item">
              <span className="info-label">Время</span>
              <span className="info-value">{recipe.cooking_time} мин</span>
            </div>
          )}
          {recipe.difficulty && (
            <div className="info-item">
              <span className="info-label">Сложность</span>
              <span className="info-value">{recipe.difficulty}</span>
            </div>
          )}
          {recipe.cuisine && (
            <div className="info-item">
              <span className="info-label">Кухня</span>
              <span className="info-value">{recipe.cuisine}</span>
            </div>
          )}
          {recipe.servings && (
            <div className="info-item">
              <span className="info-label">Порций</span>
              <span className="info-value">{recipe.servings}</span>
            </div>
          )}
        </div>

        {recipe.calories && (
          <div className="nutrition-info">
            <h3>Пищевая ценность (на порцию)</h3>
            <div className="nutrition-grid">
              <div className="nutrition-item">
                <span className="nutrition-value">{recipe.calories}</span>
                <span className="nutrition-label">ккал</span>
              </div>
              {recipe.protein && (
                <div className="nutrition-item">
                  <span className="nutrition-value">{recipe.protein}г</span>
                  <span className="nutrition-label">белки</span>
                </div>
              )}
              {recipe.carbs && (
                <div className="nutrition-item">
                  <span className="nutrition-value">{recipe.carbs}г</span>
                  <span className="nutrition-label">углеводы</span>
                </div>
              )}
              {recipe.fat && (
                <div className="nutrition-item">
                  <span className="nutrition-value">{recipe.fat}г</span>
                  <span className="nutrition-label">жиры</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="ingredients-section">
          <div className="ingredients-header">
            <h2>Ингредиенты</h2>
            {user && (
              <button
                onClick={addMissingIngredientsToCart}
                className="add-to-cart-button"
                disabled={addingToCart}
              >
                {addingToCart ? 'Добавление...' : 'Добавить недостающие в корзину'}
              </button>
            )}
          </div>
          <ul className="ingredients-list">
            {recipe.ingredients && recipe.ingredients.map((ingredient: any, index: number) => (
              <li key={index} className="ingredient-item">
                <span className="ingredient-name">{ingredient.name}</span>
                <span className="ingredient-amount">
                  {ingredient.amount} {ingredient.unit || ''}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="steps-section">
          <h2>Приготовление</h2>
          <ol className="steps-list">
            {recipe.steps && recipe.steps.map((step: string, index: number) => (
              <li key={index} className="step-item">
                <span className="step-number">{index + 1}</span>
                <span className="step-text">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;

