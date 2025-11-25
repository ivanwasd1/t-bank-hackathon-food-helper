import React from 'react';
import './Logo.css';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  alt?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  className = '', 
  alt = 'vkusTno Logo' 
}) => {
  return (
    <div className={`logo-container ${size} ${className}`}>
      <img 
        src="/logoT3.jpg" 
        alt={alt}
        className="logo-image"
        onError={(e) => {
          // Fallback to text if image fails to load
          e.currentTarget.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = 'logo-fallback';
          fallback.textContent = 'вкусТно';
          e.currentTarget.parentNode?.appendChild(fallback);
        }}
      />
    </div>
  );
};

export default Logo;