import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import BottomNav from '../BottomNav/BottomNav';
import { saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from '../../utils/localStorage';
import './ShoppingList.css';

interface CartItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category?: string;
  checked: boolean;
}

interface RemovedItem {
  item: CartItem;
  timestamp: number;
}

const ShoppingList: React.FC = () => {
  const { user } = useUser();
  const location = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [removedItems, setRemovedItems] = useState<RemovedItem[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Функция для загрузки корзины
  const loadCart = () => {
    console.log('🛒 ShoppingList - loadCart вызвана');
    console.log('🛒 ShoppingList - user:', user);
    if (user) {
      const savedCart = loadFromLocalStorage<CartItem[]>('foodhelper_cart', user.id);
      console.log('🛒 ShoppingList - Загруженная корзина:', savedCart);
      if (savedCart && savedCart.length > 0) {
        console.log('🛒 ShoppingList - Устанавливаем корзину с', savedCart.length, 'элементами');
        setCartItems(savedCart);
        setIsInitialLoad(false);
      } else {
        console.log('🛒 ShoppingList - Корзина пуста или null');
        setCartItems([]);
        setIsInitialLoad(false);
      }
    } else {
      console.log('🛒 ShoppingList - user не определен');
    }
  };

  // Загрузка данных корзины из localStorage
  useEffect(() => {
    console.log('🛒 ShoppingList - useEffect [при изменении user]');
    loadCart();
  }, [user]);

  // Перезагрузка корзины при переходе на страницу
  useEffect(() => {
    console.log('🛒 ShoppingList - useEffect [при изменении location]', location.pathname);
    if (location.pathname === '/shopping') {
      console.log('🛒 ShoppingList - Находимся на странице /shopping, перезагружаем');
      loadCart();
    }
  }, [location, user]);

  // Слушаем событие обновления корзины
  useEffect(() => {
    const handleCartUpdate = (event: any) => {
      console.log('🛒 ShoppingList - Получено событие cartUpdated:', event.detail);
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [user]);

  // Перезагрузка корзины при возврате на страницу
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🛒 ShoppingList - Страница снова видима, перезагружаем');
        loadCart();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Отслеживание изменений cartItems
  useEffect(() => {
    console.log('🛒 ShoppingList - cartItems изменился:', cartItems.length, 'элементов');
  }, [cartItems]);

  // Сохранение корзины при изменении (только при удалении)
  useEffect(() => {
    // Не сохраняем при первой загрузке, чтобы не перезаписать данные
    if (user && !isInitialLoad) {
      console.log('🛒 ShoppingList - Сохраняем корзину с', cartItems.length, 'элементами');
      saveToLocalStorage('foodhelper_cart', cartItems, user.id);
    }
  }, [cartItems, user, isInitialLoad]);

  const toggleItemCheck = (id: string) => {
    const itemToRemove = cartItems.find(item => item.id === id);
    if (itemToRemove) {
      // Добавляем в список удаленных
      setRemovedItems(prev => [...prev, { item: itemToRemove, timestamp: Date.now() }]);
      // Удаляем из корзины
      setCartItems(items => items.filter(item => item.id !== id));
      // Показываем кнопку отмены
      setShowUndo(true);
      // Автоматически скрываем кнопку через 5 секунд
      setTimeout(() => {
        setShowUndo(false);
        setRemovedItems([]);
      }, 5000);
    }
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const undoRemove = () => {
    if (removedItems.length > 0) {
      // Восстанавливаем все удаленные элементы
      const itemsToRestore = removedItems.map(ri => ri.item);
      setCartItems(prev => [...prev, ...itemsToRestore]);
      setRemovedItems([]);
      setShowUndo(false);
    }
  };

  const clearAll = () => {
    if (window.confirm('Очистить всю корзину?')) {
      setCartItems([]);
    }
  };

  const groupedItems = cartItems.reduce((acc, item) => {
    const category = item.category || 'Другое';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  return (
    <div className="shopping-list-screen">
      <div className="shopping-header">
        <h1>Корзина</h1>
        {cartItems.length > 0 && (
          <div className="header-actions">
            <button onClick={clearAll} className="clear-all-btn">
              Очистить все
            </button>
          </div>
        )}
      </div>

      <div className="shopping-content">
        {cartItems.length === 0 ? (
          <div className="empty-state">
            <p>Корзина пуста</p>
            <p className="hint">Добавьте продукты из рецептов или создайте меню</p>
          </div>
        ) : (
          <div className="cart-items">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="category-group">
                <h3 className="category-title">{category}</h3>
                <div className="items-list">
                  {items.map(item => (
                    <div key={item.id} className="cart-item">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => toggleItemCheck(item.id)}
                        className="item-checkbox"
                      />
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        <span className="item-amount">{item.amount} {item.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUndo && (
        <div className="undo-container">
          <button onClick={undoRemove} className="undo-btn">
            <span className="undo-icon">↶</span>
            <span>Отменить удаление ({removedItems.length})</span>
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ShoppingList;

