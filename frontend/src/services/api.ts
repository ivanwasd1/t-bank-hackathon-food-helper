import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API
export const userAPI = {
  create: (data: any) => api.post('/users', data),
  get: (id: number) => api.get(`/users/${id}`),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
};

// Recipe API
export const recipeAPI = {
  getAll: (params?: any) => api.get('/recipes', { params }),
  get: (id: number) => api.get(`/recipes/${id}`),
  create: (data: any) => api.post('/recipes', data),
  update: (id: number, data: any) => api.put(`/recipes/${id}`, data),
  delete: (id: number) => api.delete(`/recipes/${id}`),
  getRecommendations: (userId: number, params?: any) => 
    api.get(`/users/${userId}/recipes/recommendations`, { params }),
  getAvailable: (userId: number) => 
    api.get(`/users/${userId}/recipes/available`),
};

// Favorites API
export const favoritesAPI = {
  getAll: (userId: number) => api.get(`/users/${userId}/favorites`),
  add: (userId: number, recipeId: number) => 
    api.post(`/users/${userId}/favorites`, { recipe_id: recipeId }),
  remove: (userId: number, recipeId: number) => 
    api.delete(`/users/${userId}/favorites/${recipeId}`),
  getAvailable: (userId: number) => 
    api.get(`/users/${userId}/favorites/available`),
};

// Menu API
export const menuAPI = {
  getAll: (userId: number) => api.get(`/users/${userId}/menus`),
  get: (id: number) => api.get(`/menus/${id}`),
  create: (userId: number, data: any) =>
    api.post(`/users/${userId}/menus`, data),
  update: (id: number, data: any) => api.put(`/menus/${id}`, data),
  delete: (id: number) => api.delete(`/menus/${id}`),
  generate: (data: any) => api.post('/menus/generate', data),
};

// Fridge API
export const fridgeAPI = {
  getAll: (userId: number) => api.get(`/users/${userId}/fridge`),
  add: (userId: number, data: any) => 
    api.post(`/users/${userId}/fridge`, data),
  update: (userId: number, itemId: number, data: any) => 
    api.put(`/users/${userId}/fridge/${itemId}`, data),
  delete: (userId: number, itemId: number) => 
    api.delete(`/users/${userId}/fridge/${itemId}`),
};

// Shopping List API
export const shoppingListAPI = {
  getAll: (userId: number) => api.get(`/users/${userId}/shopping-lists`),
  get: (id: number) => api.get(`/shopping-lists/${id}`),
  generate: (userId: number, menuId: number) => 
    api.post(`/users/${userId}/shopping-lists/generate`, { menu_id: menuId }),
  updateItem: (listId: number, itemId: number, data: any) => 
    api.put(`/shopping-lists/${listId}/items/${itemId}`, data),
};

// AI Analysis API
export const analyzeAPI = {
  analyzeImage: (imageFile: File) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;

