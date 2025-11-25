import React from 'react';
import './RecipeSwipe.css';

const RecipeSwipe: React.FC = () => {
  return (
    <div className="recipe-swipe-screen">
      <div className="swipe-header">
        <h1>Подбор рецептов</h1>
        <p>Свайпайте вправо, если нравится, влево - если нет</p>
      </div>

      <div className="swipe-content">
        <div className="swipe-card">
          <div className="card-content">
            <h2>Рецепт</h2>
            <p>Здесь будет карточка рецепта для свайпа</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeSwipe;

