import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { useUser } from '../../context/UserContext';
import './Onboarding.css';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    diet_type: '',
    cuisines: [] as string[],
    weight: '',
    allergies: [] as string[],
  });

  const goals = ['похудение', 'набор массы', 'поддержание формы'];
  const dietTypes = ['обычное', 'вегетарианское', 'веганское'];
  const cuisinesList = ['русская', 'итальянская', 'азиатская', 'французская', 'мексиканская', 'японская'];
  const commonAllergies = ['молочные продукты', 'глютен', 'орехи', 'яйца', 'рыба', 'морепродукты'];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'cuisines' | 'allergies', value: string) => {
    setFormData(prev => {
      const arr = prev[field];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...arr, value] };
      }
    });
  };

  const handleSubmit = async () => {
    try {
      const userData = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
      };
      
      const response = await userAPI.create(userData);
      if (response.data.success) {
        const newUser = response.data.data;
        setUser(newUser);
        localStorage.setItem('userId', newUser.id.toString());
        navigate('/main');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Ошибка при создании профиля. Попробуйте снова.');
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Добро пожаловать в FoodHelper</h1>
          <p>Давайте настроим ваш профиль</p>
        </div>

        <div className="onboarding-content">
          {step === 1 && (
            <div className="onboarding-step">
              <h2>Как вас зовут?</h2>
              <input
                type="text"
                placeholder="Введите ваше имя"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="onboarding-input"
              />
              <button
                onClick={() => setStep(2)}
                disabled={!formData.name.trim()}
                className="onboarding-button"
              >
                Далее
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step">
              <h2>Какая у вас цель?</h2>
              <div className="options-grid">
                {goals.map(goal => (
                  <button
                    key={goal}
                    onClick={() => handleInputChange('goal', goal)}
                    className={`option-button ${formData.goal === goal ? 'active' : ''}`}
                  >
                    <span>{goal}</span>
                  </button>
                ))}
              </div>
              <div className="onboarding-nav">
                <button onClick={() => setStep(1)} className="onboarding-button secondary">
                  Назад
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.goal}
                  className="onboarding-button"
                >
                  Далее
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-step">
              <h2>Тип питания</h2>
              <div className="options-grid">
                {dietTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => handleInputChange('diet_type', type)}
                    className={`option-button ${formData.diet_type === type ? 'active' : ''}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="onboarding-nav">
                <button onClick={() => setStep(2)} className="onboarding-button secondary">
                  Назад
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!formData.diet_type}
                  className="onboarding-button"
                >
                  Далее
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="onboarding-step">
              <h2>Любимые кухни</h2>
              <p className="onboarding-hint">Выберите одну или несколько</p>
              <div className="options-grid">
                {cuisinesList.map(cuisine => (
                  <button
                    key={cuisine}
                    onClick={() => toggleArrayItem('cuisines', cuisine)}
                    className={`option-button ${formData.cuisines.includes(cuisine) ? 'active' : ''}`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
              <div className="onboarding-nav">
                <button onClick={() => setStep(3)} className="onboarding-button secondary">
                  Назад
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="onboarding-button"
                >
                  Далее
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="onboarding-step">
              <h2>Дополнительная информация</h2>
              <label>
                Ваш вес (кг)
                <input
                  type="number"
                  placeholder="Введите вес"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="onboarding-input"
                />
              </label>
              <div className="onboarding-nav">
                <button onClick={() => setStep(4)} className="onboarding-button secondary">
                  Назад
                </button>
                <button
                  onClick={() => setStep(6)}
                  className="onboarding-button"
                >
                  Далее
                </button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="onboarding-step">
              <h2>Аллергии и непереносимости</h2>
              <p className="onboarding-hint">Выберите, если есть</p>
              <div className="options-grid">
                {commonAllergies.map(allergy => (
                  <button
                    key={allergy}
                    onClick={() => toggleArrayItem('allergies', allergy)}
                    className={`option-button ${formData.allergies.includes(allergy) ? 'active' : ''}`}
                  >
                    {allergy}
                  </button>
                ))}
              </div>
              <div className="onboarding-nav">
                <button onClick={() => setStep(5)} className="onboarding-button secondary">
                  Назад
                </button>
                <button
                  onClick={handleSubmit}
                  className="onboarding-button primary"
                >
                  Готово
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

