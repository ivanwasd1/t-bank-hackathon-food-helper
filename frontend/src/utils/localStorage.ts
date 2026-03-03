/**
 * Utility for managing local storage with type safety
 */

const STORAGE_KEYS = {
  MENU_DATA: 'foodhelper_menu_data',
  USER_DATA: 'foodhelper_user_data',
  RECIPES: 'foodhelper_recipes',
  FAVORITES: 'foodhelper_favorites',
} as const;

export interface StorageData<T> {
  data: T;
  timestamp: number;
  userId?: number;
}

/**
 * Save data to localStorage with timestamp
 */
export const saveToLocalStorage = <T>(key: string, data: T, userId?: number): boolean => {
  try {
    const storageData: StorageData<T> = {
      data,
      timestamp: Date.now(),
      userId,
    };
    localStorage.setItem(key, JSON.stringify(storageData));
    console.log(`✅ Данные сохранены в localStorage: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка сохранения в localStorage: ${key}`, error);
    return false;
  }
};

/**
 * Load data from localStorage
 */
export const loadFromLocalStorage = <T>(key: string, userId?: number): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      console.log(`ℹ️ Данные не найдены в localStorage: ${key}`);
      return null;
    }

    const storageData: StorageData<T> = JSON.parse(item);

    // Check if userId matches (if provided)
    if (userId !== undefined && storageData.userId !== userId) {
      console.log(`⚠️ UserId не совпадает для ${key}`);
      return null;
    }

    console.log(`✅ Данные загружены из localStorage: ${key}`);
    return storageData.data;
  } catch (error) {
    console.error(`❌ Ошибка загрузки из localStorage: ${key}`, error);
    return null;
  }
};

/**
 * Remove data from localStorage
 */
export const removeFromLocalStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    console.log(`✅ Данные удалены из localStorage: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка удаления из localStorage: ${key}`, error);
    return false;
  }
};

/**
 * Clear all app data from localStorage
 */
export const clearAllLocalStorage = (): boolean => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('✅ Все данные приложения удалены из localStorage');
    return true;
  } catch (error) {
    console.error('❌ Ошибка очистки localStorage', error);
    return false;
  }
};

/**
 * Check if localStorage is available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('⚠️ localStorage недоступен');
    return false;
  }
};

/**
 * Get storage size in bytes
 */
export const getStorageSize = (): number => {
  try {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  } catch (error) {
    console.error('❌ Ошибка получения размера localStorage', error);
    return 0;
  }
};

/**
 * Export storage keys for use in components
 */
export { STORAGE_KEYS };
