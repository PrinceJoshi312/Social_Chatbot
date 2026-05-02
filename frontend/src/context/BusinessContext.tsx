import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface Business {
  id: number;
  name: string;
  owner_email: string;
  config: any;
}

interface BusinessContextType {
  activeBusiness: Business | null;
  setActiveBusiness: (business: Business) => void;
  businesses: Business[];
  loading: boolean;
  refreshBusinesses: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAccessToken, isAuthenticated, loading: authLoading } = useAuth();
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshBusinesses = useCallback(async () => {
    if (authLoading || !isAuthenticated) {
      if (!authLoading) setLoading(false);
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      console.log("[DEBUG] Fetching businesses...");
      const res = await fetch('/api/businesses/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("[DEBUG] Businesses status:", res.status);
      if (res.status === 401) {
        console.warn("[DEBUG] 401 Unauthorized - Token may be invalid");
        return;
      }
      const data = await res.json();
      console.log("[DEBUG] Businesses received:", data);
      setBusinesses(data);
      
      setActiveBusiness(prev => {
        if (data.length > 0 && !prev) {
          return data[0];
        }
        // If activeBusiness was set but no longer in data, reset to first or null
        if (prev && !data.find((b: Business) => b.id === prev.id)) {
            return data[0] || null;
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to fetch businesses", err);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    refreshBusinesses();
  }, [refreshBusinesses]);

  // Re-fetch when token changes (e.g. after login)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && businesses.length === 0) {
      refreshBusinesses();
    }
  }, [businesses.length, refreshBusinesses]);

  return (
    <BusinessContext.Provider value={{ 
      activeBusiness, 
      setActiveBusiness, 
      businesses, 
      loading, 
      refreshBusinesses 
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
