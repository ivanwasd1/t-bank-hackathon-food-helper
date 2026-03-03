import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userAPI } from '../services/api';

interface User {
  id: number;
  name: string;
  goal?: string;
  diet_type?: string;
  cuisines?: string[];
  weight?: number;
  allergies?: string[];
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем пользователя из localStorage или создаем нового
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      const userId = parseInt(savedUserId);
      userAPI.get(userId)
        .then(response => {
          if (response.data.success) {
            setUser(response.data.data);
          } else {
            createDefaultUser();
          }
        })
        .catch(() => {
          localStorage.removeItem('userId');
          createDefaultUser();
        })
        .finally(() => setLoading(false));
    } else {
      createDefaultUser();
    }
  }, []);

  const createDefaultUser = async () => {
    try {
      const response = await userAPI.create({
        name: 'Пользователь',
        goal: 'поддержание формы',
        diet_type: 'обычное'
      });
      if (response.data.success) {
        const newUser = response.data.data;
        setUser(newUser);
        localStorage.setItem('userId', newUser.id.toString());
      }
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    
    try {
      const response = await userAPI.update(user.id, data);
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

