import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import MainScreen from './components/MainScreen/MainScreen';
import Favorites from './components/Favorites/Favorites';
import MenuPlanning from './components/MenuPlanning/MenuPlanning';
import Fridge from './components/Fridge/Fridge';
import ShoppingList from './components/ShoppingList/ShoppingList';
import RecipeSwipe from './components/RecipeSwipe/RecipeSwipe';
import RecipeDetail from './components/RecipeDetail/RecipeDetail';
import AddRecipe from './components/AddRecipe/AddRecipe';
import { UserProvider } from './context/UserContext';

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/main" element={<MainScreen />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/menu" element={<MenuPlanning />} />
            <Route path="/fridge" element={<Fridge />} />
            <Route path="/shopping" element={<ShoppingList />} />
            <Route path="/swipe" element={<RecipeSwipe />} />
            <Route path="/recipe/add" element={<AddRecipe />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
            <Route path="/" element={<Navigate to="/main" replace />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;

