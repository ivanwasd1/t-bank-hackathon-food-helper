import React, { useState } from 'react';
import './FilterPanel.css';

interface FilterPanelProps {
  filters: any;
  setFilters: (filters: any) => void;
  user: any;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, setFilters, user }) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value === filters[key] ? '' : value });
  };

  return (
    <div className="filter-panel">
      <button
        className="filter-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Фильтры</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="filter-content">
          <div className="filter-group">
            <label>Кухня</label>
            <div className="filter-buttons">
              {['русская', 'итальянская', 'азиатская', 'греческая', 'мексиканская', 'тайская', 'японская', 'испанская', 'вьетнамская', 'американская'].map(cuisine => (
                <button
                  key={cuisine}
                  className={`filter-button ${filters.cuisine === cuisine ? 'active' : ''}`}
                  onClick={() => updateFilter('cuisine', cuisine)}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Время приготовления</label>
            <div className="filter-buttons">
              {['15', '30', '60'].map(time => (
                <button
                  key={time}
                  className={`filter-button ${filters.cooking_time === time ? 'active' : ''}`}
                  onClick={() => updateFilter('cooking_time', time)}
                >
                  до {time} мин
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Сложность</label>
            <div className="filter-buttons">
              {['легкий', 'средний', 'сложный'].map(difficulty => (
                <button
                  key={difficulty}
                  className={`filter-button ${filters.difficulty === difficulty ? 'active' : ''}`}
                  onClick={() => updateFilter('difficulty', difficulty)}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Тип блюда</label>
            <div className="filter-buttons">
              {['завтрак', 'обед', 'ужин'].map(mealType => (
                <button
                  key={mealType}
                  className={`filter-button ${filters.meal_type === mealType ? 'active' : ''}`}
                  onClick={() => updateFilter('meal_type', mealType)}
                >
                  {mealType}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Бюджет</label>
            <div className="filter-buttons">
              {['эконом', 'премиум'].map(budget => (
                <button
                  key={budget}
                  className={`filter-button ${filters.budget === budget ? 'active' : ''}`}
                  onClick={() => updateFilter('budget', budget)}
                >
                  {budget}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Сезон</label>
            <div className="filter-buttons">
              {['всесезонное', 'лето', 'зима'].map(season => (
                <button
                  key={season}
                  className={`filter-button ${filters.season === season ? 'active' : ''}`}
                  onClick={() => updateFilter('season', season)}
                >
                  {season}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;

