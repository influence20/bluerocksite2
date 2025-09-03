import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authAPI } from './api';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  balance?: number;
  totalInvested?: number;
  totalEarnings?: number;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token on mount
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login({ email, password });
      const { user: userData, token } = response.data.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      toast.success('Login successful!');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Login failed';
      toast.error(message);
      return false;
    }
  };

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.adminLogin({ email, password });
      const { user: userData, token } = response.data.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      toast.success('Admin login successful!');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Admin login failed';
      toast.error(message);
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const response = await authAPI.register(data);
      const { user: userData, token } = response.data.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      toast.success('Registration successful! Welcome to BlueRock Asset Management.');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Registration failed';
      toast.error(message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    adminLogin,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Auth guard hook
export const useAuthGuard = (redirectTo: string = '/login') => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [isAuthenticated, isLoading, redirectTo]);

  return { isAuthenticated, isLoading };
};

// Admin guard hook
export const useAdminGuard = (redirectTo: string = '/admin/login') => {
  const { user, isLoading } = useAuth();
  const isAdmin = user?.role && ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'].includes(user.role);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      window.location.href = redirectTo;
    }
  }, [isAdmin, isLoading, redirectTo]);

  return { isAdmin, isLoading };
};

// Utility functions
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const formatUserName = (user: User | null): string => {
  if (!user) return '';
  return `${user.firstName} ${user.lastName}`;
};

export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100);
};