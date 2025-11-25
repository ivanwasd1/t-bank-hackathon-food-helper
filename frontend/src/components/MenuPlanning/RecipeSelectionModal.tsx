import React, { useState } from 'react';
import { Recipe } from './types';
import './RecipeSelectionModal.css';

interface RecipeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  recipes: Recipe[];
  favorites: Recipe[];
}

const RecipeSelectionModal: React.FC<RecipeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectRecipe,
  recipes,
  favorites
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Combine favorites first, then other recipes
  const allRecipes = [
    ...favorites.map(recipe => ({ ...recipe, isFavorite: true })),
    ...recipes
      .filter(recipe => !favorites.some(fav => fav.id === recipe.id))
      .map(recipe => ({ ...recipe, isFavorite: false }))
  ];

  // Filter recipes based on search term
  const filteredRecipes = allRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Выберите рецепт</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-search">
          <input
            type="text"
            placeholder="Поиск рецептов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="modal-body">
          {filteredRecipes.length === 0 ? (
            <div className="no-recipes">
              <p>Рецепты не найдены</p>
            </div>
          ) : (
            <div className="recipes-list">
              {filteredRecipes.map(recipe => (
                <div
                  key={recipe.id}
                  className="recipe-item"
                  onClick={() => onSelectRecipe(recipe)}
                >
                  <div className="recipe-item-header">
                    <h3 className="recipe-name">{recipe.name}</h3>
                    {recipe.isFavorite && (
                      <span className="favorite-badge">★</span>
                    )}
                  </div>
                  {recipe.description && (
                    <p className="recipe-description">{recipe.description}</p>
                  )}
                  <div className="recipe-meta">
                    {recipe.cooking_time && (
                      <span className="meta-item">{recipe.cooking_time} мин</span>
                    )}
                    {recipe.calories && (
                      <span className="meta-item">{recipe.calories} ккал</span>
                    )}
                    {recipe.cuisine && (
                      <span className="meta-item">{recipe.cuisine}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeSelectionModal;