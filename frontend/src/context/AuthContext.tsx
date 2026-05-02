import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  type User as FirebaseUser,
  signOut,
  getIdToken
} from 'firebase/auth';
import { auth } from '../firebase';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: string;
  provider: string;
  createdAt: string;
  lastLogin: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPER_ADMIN_EMAIL = 'princejoshij736@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // Map Firebase user to our User interface
          const mappedUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: firebaseUser.email === SUPER_ADMIN_EMAIL ? 'super_admin' : 'business_owner',
            provider: firebaseUser.providerData[0]?.providerId || 'password',
            createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
            lastLogin: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
          };
          setUser(mappedUser);
          
          // Store token for other components that might not use useAuth
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('token', token);
        } else {
          setUser(null);
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getAccessToken = async () => {
    console.log("[DEBUG] getAccessToken called. Current Firebase User:", auth.currentUser?.email);
    if (auth.currentUser) {
      try {
        const token = await getIdToken(auth.currentUser);
        console.log("[DEBUG] Token retrieved successfully.");
        localStorage.setItem('token', token);
        return token;
      } catch (err) {
        console.error("[DEBUG] Failed to get ID token:", err);
        return null;
      }
    }
    console.warn("[DEBUG] No current user in firebase auth.");
    return null;
  };

  const isAdmin = user?.role === 'super_admin' || user?.email === SUPER_ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      logout, 
      isAuthenticated: !!user,
      isAdmin,
      getAccessToken
    }}>
      {!loading && children}
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
