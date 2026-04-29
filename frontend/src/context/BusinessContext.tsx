import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshBusinesses = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/businesses/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        // Avoid hard redirect in provider to prevent infinite loop on login page
        return;
      }
      const data = await res.json();
      setBusinesses(data);
      
      // Use functional state update to avoid dependency on activeBusiness
      setActiveBusiness(prev => {
        if (data.length > 0 && !prev) {
          return data[0];
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to fetch businesses", err);
    } finally {
      setLoading(false);
    }
  }, []); // Remove activeBusiness dependency

  useEffect(() => {
    refreshBusinesses();
  }, [refreshBusinesses]);

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
