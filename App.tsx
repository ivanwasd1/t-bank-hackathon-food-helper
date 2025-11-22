import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Onboarding } from './components/Onboarding';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Fridge } from './pages/Fridge';
import { Planner } from './pages/Planner';
import { Discovery } from './pages/Discovery';
import { Recipes } from './pages/Recipes';

const AppContent: React.FC = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('home');

  if (!user.onboardingComplete) {
    return <Onboarding />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <Home />;
      case 'recipes': return <Recipes />;
      case 'fridge': return <Fridge />;
      case 'planner': return <Planner />;
      case 'discovery': return <Discovery />;
      default: return <Home />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderScreen()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;