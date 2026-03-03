import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { recipeAPI, favoritesAPI, menuAPI } from '../../services/api';
import BottomNav from '../BottomNav/BottomNav';
import RecipeSelectionModal from './RecipeSelectionModal';
import { Recipe, MenuCell, MealItem } from './types';
import { saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from '../../utils/localStorage';
import './MenuPlanning.css';

const daysOfWeek = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье'
];

const MenuPlanning: React.FC = () => {
  const { user } = useUser();
  const [menuData, setMenuData] = useState<Record<string, MenuCell>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{day: string, meal: 'breakfast' | 'lunch' | 'dinner'} | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [addingToCart, setAddingToCart] = useState(false);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadMenuData();
      loadRecipes();
      loadFavorites();
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      const container = tableContainerRef.current;
      if (!container) return;

      const isScrolled = container.scrollLeft > 0;
      const isScrolledEnd = container.scrollLeft >= (container.scrollWidth - container.clientWidth - 10);

      if (isScrolled) {
        container.classList.add('scrolled');
      } else {
        container.classList.remove('scrolled');
      }

      if (isScrolledEnd) {
        container.classList.add('scrolled-end');
      } else {
        container.classList.remove('scrolled-end');
      }
    };

    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const loadMenuData = async () => {
    try {
      // First, try to load from localStorage
      const localData = loadFromLocalStorage<Record<string, MenuCell>>(STORAGE_KEYS.MENU_DATA, user!.id);
      if (localData) {
        console.log('📂 Данные меню загружены из localStorage');
        setMenuData(localData);
        return;
      }

      // If no local data, try to load from API
      const response = await menuAPI.getAll(user!.id);
      if (response.data.success && response.data.data.length > 0) {
        // Load existing menu data
        const menu = response.data.data[0]; // Get latest menu
        const menuData = menu.data || {};
        setMenuData(menuData);
        // Save to localStorage for future use
        saveToLocalStorage(STORAGE_KEYS.MENU_DATA, menuData, user!.id);
      }
    } catch (error) {
      console.error('Error loading menu data:', error);
      // Try to load from localStorage as fallback
      const localData = loadFromLocalStorage<Record<string, MenuCell>>(STORAGE_KEYS.MENU_DATA, user!.id);
      if (localData) {
        console.log('📂 Данные меню загружены из localStorage (fallback)');
        setMenuData(localData);
      }
    }
  };

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const response = await recipeAPI.getAll();
      if (response.data.success) {
        setRecipes(response.data.data);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await favoritesAPI.getAll(user!.id);
      if (response.data.success) {
        setFavorites(response.data.data.map((f: any) => f.recipe || f));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const handleCellClick = (day: string, meal: 'breakfast' | 'lunch' | 'dinner') => {
    setSelectedCell({ day, meal });
    setIsModalOpen(true);
  };

  const handleRecipeSelect = async (recipe: Recipe) => {
    if (!selectedCell) return;

    const updatedMenuData = {
      ...menuData,
      [selectedCell.day]: {
        ...menuData[selectedCell.day],
        [selectedCell.meal]: { recipe, consumed: false }
      }
    };

    setMenuData(updatedMenuData);

    // Automatically save the menu data to localStorage
    setSaving(true);
    setSaveStatus('saving');
    try {
      // Save to localStorage first (always works)
      const localSaved = saveToLocalStorage(STORAGE_KEYS.MENU_DATA, updatedMenuData, user!.id);
      
      // Try to save to API as well (may fail if backend is down)
      try {
        await menuAPI.create(user!.id, { data: updatedMenuData });
      } catch (apiError) {
        console.warn('⚠️ API недоступен, данные сохранены только локально', apiError);
      }
      
      if (localSaved) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error auto-saving menu:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }

    setIsModalOpen(false);
    setSelectedCell(null);
  };

  const generateRandomMenu = async () => {
    setSaving(true);
    setSaveStatus('saving');
    
    // Объединяем все рецепты из всех категорий
    const allRecipes = {
      breakfast: [
        'Овсянка с протеином', 'Яичница с ветчиной', 'Белковые оладьи',
        'Блинчики', 'Хачапури', 'Французский тост',
        'Йогурт с фруктами', 'Фруктовый салат', 'Греческий салат',
        'Омлет с овощами', 'Сырники', 'Каша с ягодами',
        'Тосты с авокадо', 'Мюсли', 'Панкейки'
      ],
      lunch: [
        'Куриная грудка с гречкой', 'Рыба на пару с рисом', 'Говядина с овощами',
        'Борщ', 'Паста карбонара', 'Роллы',
        'Овощной суп', 'Салат с курицей', 'Рыба с овощами',
        'Плов', 'Лазанья', 'Ризотто',
        'Стейк с картофелем', 'Суши', 'Рамен'
      ],
      dinner: [
        'Творог с ягодами', 'Запеченная рыба', 'Куриные котлеты',
        'Пицца', 'Суши', 'Шашлык',
        'Овощная запеканка', 'Салат', 'Бульон',
        'Паста с морепродуктами', 'Тушеные овощи', 'Гриль',
        'Фаршированный перец', 'Киш', 'Тако'
      ]
    };

    const newMenuData: Record<string, MenuCell> = {};
    daysOfWeek.forEach(day => {
      newMenuData[day] = {
        breakfast: { 
          recipe: { 
            id: Math.random(), 
            name: allRecipes.breakfast[Math.floor(Math.random() * allRecipes.breakfast.length)] 
          } as Recipe,
          consumed: false
        },
        lunch: { 
          recipe: { 
            id: Math.random(), 
            name: allRecipes.lunch[Math.floor(Math.random() * allRecipes.lunch.length)] 
          } as Recipe,
          consumed: false
        },
        dinner: { 
          recipe: { 
            id: Math.random(), 
            name: allRecipes.dinner[Math.floor(Math.random() * allRecipes.dinner.length)] 
          } as Recipe,
          consumed: false
        }
      };
    });

    setMenuData(newMenuData);

    // Automatically save the generated menu to localStorage
    try {
      const localSaved = saveToLocalStorage(STORAGE_KEYS.MENU_DATA, newMenuData, user!.id);
      
      try {
        await menuAPI.create(user!.id, { data: newMenuData });
      } catch (apiError) {
        console.warn('⚠️ API недоступен, данные сохранены только локально', apiError);
      }
      
      if (localSaved) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error auto-saving generated menu:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const generateQuickMenu = async (type: 'sport' | 'diverse' | 'light') => {
    setSaving(true);
    setSaveStatus('saving');
    const sportRecipes = {
      breakfast: ['Овсянка с протеином', 'Яичница с ветчиной', 'Белковые оладьи'],
      lunch: ['Куриная грудка с гречкой', 'Рыба на пару с рисом', 'Говядина с овощами'],
      dinner: ['Творог с ягодами', 'Запеченная рыба', 'Куриные котлеты']
    };

    const diverseRecipes = {
      breakfast: ['Блинчики', 'Хачапури', 'Французский тост'],
      lunch: ['Борщ', 'Паста карбонара', 'Роллы'],
      dinner: ['Пицца', 'Суши', 'Шашлык']
    };

    const lightRecipes = {
      breakfast: ['Йогурт с фруктами', 'Фруктовый салат', 'Греческий салат'],
      lunch: ['Овощной суп', 'Салат с курицей', 'Рыба с овощами'],
      dinner: ['Овощная запеканка', 'Салат', 'Бульон']
    };

    let menuTemplate: { breakfast: string[]; lunch: string[]; dinner: string[] };
    switch (type) {
      case 'sport':
        menuTemplate = sportRecipes;
        break;
      case 'diverse':
        menuTemplate = diverseRecipes;
        break;
      case 'light':
        menuTemplate = lightRecipes;
        break;
      default:
        menuTemplate = lightRecipes;
    }

    const newMenuData: Record<string, MenuCell> = {};
    daysOfWeek.forEach(day => {
      newMenuData[day] = {
        breakfast: { 
          recipe: { id: Math.random(), name: menuTemplate.breakfast[Math.floor(Math.random() * menuTemplate.breakfast.length)] } as Recipe,
          consumed: false
        },
        lunch: { 
          recipe: { id: Math.random(), name: menuTemplate.lunch[Math.floor(Math.random() * menuTemplate.lunch.length)] } as Recipe,
          consumed: false
        },
        dinner: { 
          recipe: { id: Math.random(), name: menuTemplate.dinner[Math.floor(Math.random() * menuTemplate.dinner.length)] } as Recipe,
          consumed: false
        }
      };
    });

    setMenuData(newMenuData);

    // Automatically save the generated menu to localStorage
    try {
      // Save to localStorage first (always works)
      const localSaved = saveToLocalStorage(STORAGE_KEYS.MENU_DATA, newMenuData, user!.id);
      
      // Try to save to API as well (may fail if backend is down)
      try {
        await menuAPI.create(user!.id, { data: newMenuData });
      } catch (apiError) {
        console.warn('⚠️ API недоступен, данные сохранены только локально', apiError);
      }
      
      if (localSaved) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error auto-saving generated menu:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const getButtonText = (day: string, meal: 'breakfast' | 'lunch' | 'dinner') => {
    const cell = menuData[day];
    if (cell && cell[meal]) {
      const mealItem = cell[meal] as any;
      // Support both old and new format
      if (mealItem.recipe) {
        return mealItem.recipe.name || '+';
      } else if (mealItem.name) {
        return mealItem.name || '+';
      }
    }
    return '+';
  };

  const isMealConsumed = (day: string, meal: 'breakfast' | 'lunch' | 'dinner') => {
    const cell = menuData[day];
    if (cell && cell[meal]) {
      const mealItem = cell[meal] as any;
      // Support new format with consumed property
      if (mealItem.consumed !== undefined) {
        return mealItem.consumed;
      }
    }
    return false;
  };

  const toggleMealConsumed = async (day: string, meal: 'breakfast' | 'lunch' | 'dinner', event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    
    const cell = menuData[day];
    if (!cell || !cell[meal]) return;

    const mealItem = cell[meal] as any;
    let updatedMealItem: MealItem;

    // Support both old and new format
    if (mealItem.recipe) {
      updatedMealItem = {
        recipe: mealItem.recipe,
        consumed: !mealItem.consumed
      };
    } else if (mealItem.name) {
      // Convert old format to new format
      updatedMealItem = {
        recipe: mealItem as Recipe,
        consumed: !(mealItem.consumed || false)
      };
    } else {
      return;
    }

    const updatedMenuData = {
      ...menuData,
      [day]: {
        ...menuData[day],
        [meal]: updatedMealItem
      }
    };

    setMenuData(updatedMenuData);

    // Save to localStorage
    try {
      saveToLocalStorage(STORAGE_KEYS.MENU_DATA, updatedMenuData, user!.id);
      console.log('✓ Состояние приема пищи сохранено');
    } catch (error) {
      console.error('Error saving consumed state:', error);
    }
  };

  const addMissingIngredientsToCart = async () => {
    if (!user) return;

    try {
      setAddingToCart(true);

      console.log('🔍 === НАЧАЛО АНАЛИЗА НЕДОСТАЮЩИХ ПРОДУКТОВ ===');

      // Собираем все неупотребленные блюда
      const nonConsumedMeals: Recipe[] = [];
      
      daysOfWeek.forEach(day => {
        const cell = menuData[day];
        if (!cell) return;

        ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
          const meal = cell[mealType as 'breakfast' | 'lunch' | 'dinner'];
          if (!meal) return;

          const mealItem = meal as any;
          const isConsumed = mealItem.consumed || false;
          
          console.log(`📋 ${day} - ${mealType}:`, {
            название: mealItem.recipe?.name || mealItem.name,
            употреблено: isConsumed,
            есть_ингредиенты: !!(mealItem.recipe?.ingredients || mealItem.ingredients)
          });
          
          if (!isConsumed) {
            const recipe = mealItem.recipe || mealItem;
            if (recipe && recipe.name) {
              nonConsumedMeals.push(recipe);
            }
          }
        });
      });

      if (nonConsumedMeals.length === 0) {
        alert('Все блюда уже употреблены!');
        return;
      }

      console.log('🍴 Неупотребленные блюда:', nonConsumedMeals.length);
      console.log('📝 Список неупотребленных блюд:', nonConsumedMeals.map(r => r.name));

      // Собираем все ингредиенты
      const allIngredients = new Map<string, { amount: number; unit: string; category?: string }>();
      let recipesWithIngredients = 0;
      let recipesWithoutIngredients = 0;
      
      nonConsumedMeals.forEach(recipe => {
        if (recipe.ingredients && recipe.ingredients.length > 0) {
          recipesWithIngredients++;
          console.log(`✅ Рецепт "${recipe.name}" имеет ${recipe.ingredients.length} ингредиентов`);
          recipe.ingredients.forEach(ingredient => {
            const key = ingredient.name.toLowerCase().trim();
            const existing = allIngredients.get(key);
            
            if (existing) {
              allIngredients.set(key, {
                amount: existing.amount + (ingredient.amount || 0),
                unit: ingredient.unit || existing.unit,
                category: ingredient.category || existing.category
              });
            } else {
              allIngredients.set(key, {
                amount: ingredient.amount || 1,
                unit: ingredient.unit || 'шт',
                category: ingredient.category
              });
            }
          });
        } else {
          recipesWithoutIngredients++;
          console.warn(`⚠️ Рецепт "${recipe.name}" НЕ имеет ингредиентов!`);
        }
      });

      console.log(`📊 Статистика: ${recipesWithIngredients} рецептов с ингредиентами, ${recipesWithoutIngredients} без ингредиентов`);
      console.log('🥗 Всего уникальных ингредиентов:', allIngredients.size);
      
      if (allIngredients.size > 0) {
        console.log('📋 Список всех ингредиентов:', Array.from(allIngredients.keys()));
      }

      // Загружаем продукты из холодильника
      const fridgeData = loadFromLocalStorage<any[]>('foodhelper_fridge', user.id) || [];
      console.log('🧊 Загружено продуктов из холодильника:', fridgeData.length);
      
      const fridgeMap = new Map<string, number>();
      fridgeData.forEach(item => {
        const key = item.name.toLowerCase().trim();
        const currentAmount = fridgeMap.get(key) || 0;
        const newAmount = currentAmount + (item.amount || 0);
        fridgeMap.set(key, newAmount);
        console.log(`  📦 ${item.name}: ${item.amount} ${item.unit} (всего: ${newAmount})`);
      });

      console.log('🧊 Уникальных продуктов в холодильнике:', fridgeMap.size);

      // Находим недостающие ингредиенты
      const missingIngredients: any[] = [];
      
      console.log('🔍 Проверка недостающих ингредиентов:');
      allIngredients.forEach((ingredientData, ingredientName) => {
        const availableAmount = fridgeMap.get(ingredientName) || 0;
        const requiredAmount = ingredientData.amount;

        console.log(`  🔎 ${ingredientName}: требуется ${requiredAmount} ${ingredientData.unit}, есть ${availableAmount}`);

        if (availableAmount < requiredAmount) {
          const missingAmount = requiredAmount - availableAmount;
          console.log(`    ❌ НЕДОСТАЁТ: ${missingAmount} ${ingredientData.unit}`);
          missingIngredients.push({
            id: `${Date.now()}-${Math.random()}`,
            name: ingredientName.charAt(0).toUpperCase() + ingredientName.slice(1),
            amount: missingAmount,
            unit: ingredientData.unit,
            category: ingredientData.category || 'Другое',
            checked: false
          });
        } else {
          console.log(`    ✅ ДОСТАТОЧНО (излишек: ${availableAmount - requiredAmount})`);
        }
      });

      console.log('🛒 Итого недостающих ингредиентов:', missingIngredients.length);

      if (missingIngredients.length === 0) {
        if (allIngredients.size === 0) {
          alert('⚠️ У рецептов в меню отсутствуют ингредиенты!\n\nПожалуйста, выберите рецепты с детальной информацией об ингредиентах.');
        } else {
          alert('✅ Все необходимые ингредиенты уже есть в холодильнике!');
        }
        console.log('🔍 === АНАЛИЗ ЗАВЕРШЁН (нечего добавлять) ===');
        return;
      }

      console.log('📋 Список недостающих продуктов:', missingIngredients.map(i => `${i.name} (${i.amount} ${i.unit})`));

      const currentCart = loadFromLocalStorage<any[]>('foodhelper_cart', user.id) || [];
      console.log('🛒 Текущая корзина:', currentCart.length, 'товаров');
      
      const updatedCart = [...currentCart, ...missingIngredients];
      saveToLocalStorage('foodhelper_cart', updatedCart, user.id);
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: updatedCart } }));

      console.log('✅ Корзина обновлена:', updatedCart.length, 'товаров');
      console.log('🔍 === АНАЛИЗ ЗАВЕРШЁН УСПЕШНО ===');

      alert(`✅ Добавлено ${missingIngredients.length} продуктов в корзину!`);

    } catch (error) {
      console.error('❌ Ошибка при добавлении в корзину:', error);
      alert('Ошибка при добавлении в корзину');
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="menu-planning-screen">
      <div className="menu-header">
        <h1>Планирование меню</h1>
        {saveStatus === 'saving' && <span className="save-status saving">Сохранение...</span>}
        {saveStatus === 'saved' && <span className="save-status saved">✓ Сохранено</span>}
        {saveStatus === 'error' && <span className="save-status error">✗ Ошибка сохранения</span>}
      </div>

      <div className="menu-content">
        <div className="quick-menu-options">
          <button
            className="quick-menu-button sport"
            onClick={() => generateQuickMenu('sport')}
          >
            Спортивное меню
          </button>
          <button
            className="quick-menu-button diverse"
            onClick={() => generateQuickMenu('diverse')}
          >
            Разнообразное меню
          </button>
          <button
            className="quick-menu-button light"
            onClick={() => generateQuickMenu('light')}
          >
            Легкое меню
          </button>
          <button
            className="quick-menu-button random"
            onClick={generateRandomMenu}
          >
            Случайное меню
          </button>
        </div>

        <div className="add-to-cart-section">
          <button
            className="add-missing-to-cart-button"
            onClick={addMissingIngredientsToCart}
            disabled={addingToCart}
          >
            {addingToCart ? 'Добавление...' : '🛒 Добавить недостающие продукты в корзину'}
          </button>
        </div>

        <div className="scroll-hint">
          <span>Листайте таблицу влево-вправо, чтобы увидеть все приемы пищи</span>
        </div>

        <div className="menu-table-container" ref={tableContainerRef}>
          <table className="menu-table">
            <thead>
              <tr>
                <th>День недели</th>
                <th>Завтрак</th>
                <th>Обед</th>
                <th>Ужин</th>
              </tr>
            </thead>
            <tbody>
              {daysOfWeek.map(day => (
                <tr key={day}>
                  <td className="day-cell">{day}</td>
                  <td className="meal-cell">
                    <div className="meal-cell-content">
                      <input
                        type="checkbox"
                        checked={isMealConsumed(day, 'breakfast')}
                        onChange={(e) => toggleMealConsumed(day, 'breakfast', e)}
                        className="meal-checkbox"
                        title="Отметить как употребленное"
                      />
                      <button
                        className={`recipe-button ${isMealConsumed(day, 'breakfast') ? 'consumed' : ''}`}
                        onClick={() => handleCellClick(day, 'breakfast')}
                      >
                        {getButtonText(day, 'breakfast')}
                      </button>
                    </div>
                  </td>
                  <td className="meal-cell">
                    <div className="meal-cell-content">
                      <input
                        type="checkbox"
                        checked={isMealConsumed(day, 'lunch')}
                        onChange={(e) => toggleMealConsumed(day, 'lunch', e)}
                        className="meal-checkbox"
                        title="Отметить как употребленное"
                      />
                      <button
                        className={`recipe-button ${isMealConsumed(day, 'lunch') ? 'consumed' : ''}`}
                        onClick={() => handleCellClick(day, 'lunch')}
                      >
                        {getButtonText(day, 'lunch')}
                      </button>
                    </div>
                  </td>
                  <td className="meal-cell">
                    <div className="meal-cell-content">
                      <input
                        type="checkbox"
                        checked={isMealConsumed(day, 'dinner')}
                        onChange={(e) => toggleMealConsumed(day, 'dinner', e)}
                        className="meal-checkbox"
                        title="Отметить как употребленное"
                      />
                      <button
                        className={`recipe-button ${isMealConsumed(day, 'dinner') ? 'consumed' : ''}`}
                        onClick={() => handleCellClick(day, 'dinner')}
                      >
                        {getButtonText(day, 'dinner')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      <RecipeSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectRecipe={handleRecipeSelect}
        recipes={recipes}
        favorites={favorites}
      />

      <BottomNav />
    </div>
  );
};

export default MenuPlanning;
