import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { User, AuthState } from '../types';

// Mock user database - in a real app this would be a backend API
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@discussion.app',
    displayName: 'Admin User',
    password: 'admin123',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string): Promise<boolean> => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check stored users in localStorage
        const storedUsers = JSON.parse(localStorage.getItem('discussion-app-users') || '[]');
        const allUsers = [...MOCK_USERS, ...storedUsers];
        
        const user = allUsers.find(u => u.email === email && u.password === password);
        
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          set({
            user: userWithoutPassword,
            isAuthenticated: true
          });
          return true;
        }
        
        return false;
      },

      register: async (userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<boolean> => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if user already exists
        const storedUsers = JSON.parse(localStorage.getItem('discussion-app-users') || '[]');
        const allUsers = [...MOCK_USERS, ...storedUsers];
        
        if (allUsers.some(u => u.email === userData.email || u.username === userData.username)) {
          return false;
        }
        
        const newUser = {
          ...userData,
          id: uuidv4(),
          createdAt: new Date().toISOString()
        };
        
        // Store user
        const updatedUsers = [...storedUsers, newUser];
        localStorage.setItem('discussion-app-users', JSON.stringify(updatedUsers));
        
        // Auto-login after registration
        const { password: _, ...userWithoutPassword } = newUser;
        set({
          user: userWithoutPassword,
          isAuthenticated: true
        });
        
        return true;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false
        });
      }
    }),
    {
      name: 'discussion-app-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
