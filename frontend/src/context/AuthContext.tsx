import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../api/types';
import { authApi } from '../api/client';

interface AuthContextType {
  user: User | null;
  partner: User | null;
  users: User[];
  isLoading: boolean;
  login: (userId: number, pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const loadedUsers = await authApi.getUsers();
        setUsers(loadedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();

    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Get partner (the other user)
  const partner = user ? users.find((u) => u.id !== user.id) || null : null;

  const login = async (userId: number, pin: string) => {
    const response = await authApi.login({ user_id: userId, pin });
    setUser(response.user);
    localStorage.setItem('user', JSON.stringify(response.user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        partner,
        users,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
