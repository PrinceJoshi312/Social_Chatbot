import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      // HARD ENFORCEMENT: Only this specific email is an Admin
      if (parsedUser.email === 'princejoshij736@gmail.com') {
        parsedUser.role = 'super_admin';
      } else {
        parsedUser.role = 'business_owner';
      }
      setUser(parsedUser);
    }
  }, [token]);

  const login = (newToken: string, userData: User) => {
    // ENFORCE AT LOGIN TIME
    const finalUser = { ...userData };
    if (finalUser.email === 'princejoshij736@gmail.com') {
      finalUser.role = 'super_admin';
    } else {
      finalUser.role = 'business_owner';
    }
    
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(finalUser));
    setToken(newToken);
    setUser(finalUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  const isAdmin = user?.role === 'super_admin' || user?.email === 'princejoshij736@gmail.com';

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      isAuthenticated: !!token,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
