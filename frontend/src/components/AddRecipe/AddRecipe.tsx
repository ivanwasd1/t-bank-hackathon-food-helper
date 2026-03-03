import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { recipeAPI } from '../../services/api';
import './AddRecipe.css';

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

const AddRecipe: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cuisine: '',
    cooking_time: '',
    difficulty: 'medium',
    servings: '2',
    calories: '',
    image_url: '',
    season: '',
    budget: 'medium',
    meal_type: '',
  });
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', quantity: '', unit: '' }
  ]);
  
  const [instructions, setInstructions] = useState<string[]>(['']);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Валидация
    if (!formData.title.trim()) {
      alert('Пожалуйста, введите название рецепта');
      return;
    }

    const validIngredients = ingredients.filter(ing => ing.name.trim());
    if (validIngredients.length === 0) {
      alert('Пожалуйста, добавьте хотя бы один ингредиент');
      return;
    }

    const validInstructions = instructions.filter(inst => inst.trim());
    if (validInstructions.length === 0) {
      alert('Пожалуйста, добавьте хотя бы один шаг приготовления');
      return;
    }

    try {
      setLoading(true);
      
      // Форматируем ингредиенты в нужный формат для backend
      const formattedIngredients = validIngredients.map(ing => ({
        name: ing.name,
        amount: ing.quantity,
        unit: ing.unit || 'шт'
      }));
      
      const recipeData = {
        name: formData.title,
        description: formData.description,
        image_url: formData.image_url,
        cuisine: formData.cuisine,
        cooking_time: parseInt(formData.cooking_time) || 30,
        difficulty: formData.difficulty,
        servings: parseInt(formData.servings) || 2,
        calories: parseFloat(formData.calories) || 0,
        season: formData.season || 'всесезонное',
        budget: formData.budget,
        meal_type: formData.meal_type,
        user_id: user.id,
        is_custom: true,
        ingredients: formattedIngredients,
        steps: validInstructions,
      };

      const response = await recipeAPI.create(recipeData);
      
      if (response.data.success) {
        alert('Рецепт успешно добавлен!');
        navigate('/main');
      } else {
        alert('Ошибка при добавлении рецепта');
      }
    } catch (error) {
      console.error('Error creating recipe:', error);
      alert('Произошла ошибка при создании рецепта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-recipe-screen">
      <div className="add-recipe-header">
        <button className="back-button" onClick={() => navigate('/main')}>
          ← Назад
        </button>
        <h1>Добавить рецепт</h1>
      </div>

      <form className="add-recipe-form" onSubmit={handleSubmit}>
        {/* Основная информация */}
        <div className="form-section">
          <h2>Основная информация</h2>
          
          <div className="form-group">
            <label htmlFor="title">Название рецепта *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Например: Борщ классический"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Краткое описание рецепта"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="image_url">URL изображения</label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        {/* Характеристики */}
        <div className="form-section">
          <h2>Характеристики</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cuisine">Кухня</label>
              <select
                id="cuisine"
                name="cuisine"
                value={formData.cuisine}
                onChange={handleInputChange}
              >
                <option value="">Выберите кухню</option>
                <option value="russian">Русская</option>
                <option value="italian">Итальянская</option>
                <option value="asian">Азиатская</option>
                <option value="french">Французская</option>
                <option value="mexican">Мексиканская</option>
                <option value="american">Американская</option>
                <option value="mediterranean">Средиземноморская</option>
                <option value="other">Другая</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="meal_type">Тип блюда</label>
              <select
                id="meal_type"
                name="meal_type"
                value={formData.meal_type}
                onChange={handleInputChange}
              >
                <option value="">Выберите тип</option>
                <option value="breakfast">Завтрак</option>
                <option value="lunch">Обед</option>
                <option value="dinner">Ужин</option>
                <option value="snack">Перекус</option>
                <option value="dessert">Десерт</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cooking_time">Время приготовления (мин)</label>
              <input
                type="number"
                id="cooking_time"
                name="cooking_time"
                value={formData.cooking_time}
                onChange={handleInputChange}
                placeholder="30"
                min="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="servings">Порций</label>
              <input
                type="number"
                id="servings"
                name="servings"
                value={formData.servings}
                onChange={handleInputChange}
                placeholder="2"
                min="1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="difficulty">Сложность</label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
              >
                <option value="easy">Легко</option>
                <option value="medium">Средне</option>
                <option value="hard">Сложно</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="budget">Бюджет</label>
              <select
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="season">Сезон</label>
              <select
                id="season"
                name="season"
                value={formData.season}
                onChange={handleInputChange}
              >
                <option value="">Любой</option>
                <option value="winter">Зима</option>
                <option value="spring">Весна</option>
                <option value="summer">Лето</option>
                <option value="autumn">Осень</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="calories">Калории</label>
              <input
                type="number"
                id="calories"
                name="calories"
                value={formData.calories}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Ингредиенты */}
        <div className="form-section">
          <h2>Ингредиенты *</h2>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="ingredient-row">
              <input
                type="text"
                placeholder="Название"
                value={ingredient.name}
                onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
              />
              <input
                type="text"
                placeholder="Количество"
                value={ingredient.quantity}
                onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
              />
              <input
                type="text"
                placeholder="Единица"
                value={ingredient.unit}
                onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
              />
              <button
                type="button"
                className="remove-button"
                onClick={() => removeIngredient(index)}
                disabled={ingredients.length === 1}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="add-button" onClick={addIngredient}>
            + Добавить ингредиент
          </button>
        </div>

        {/* Инструкции */}
        <div className="form-section">
          <h2>Инструкции по приготовлению *</h2>
          {instructions.map((instruction, index) => (
            <div key={index} className="instruction-row">
              <span className="step-number">{index + 1}.</span>
              <textarea
                placeholder="Опишите шаг приготовления"
                value={instruction}
                onChange={(e) => handleInstructionChange(index, e.target.value)}
                rows={2}
              />
              <button
                type="button"
                className="remove-button"
                onClick={() => removeInstruction(index)}
                disabled={instructions.length === 1}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="add-button" onClick={addInstruction}>
            + Добавить шаг
          </button>
        </div>

        {/* Кнопки действий */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate('/main')}
            disabled={loading}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Сохранение...' : 'Сохранить рецепт'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRecipe;
