import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/main', label: 'Главная' },
    { path: '/favorites', label: 'Избранное' },
    { path: '/menu', label: 'Меню' },
    { path: '/fridge', label: 'Холодильник' },
    { path: '/shopping', label: 'Корзина' },
  ];

  const getIcon = (path: string) => {
    const icons: { [key: string]: string } = {
      '/main': '🏠',
      '/favorites': '❤️',
      '/menu': '📋',
      '/fridge': '🧊',
      '/shopping': '🛒',
    };
    return icons[path] || '●';
  };

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          <span className="nav-icon">{getIcon(item.path)}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
