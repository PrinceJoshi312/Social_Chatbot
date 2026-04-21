import React, { createContext, useContext, useState, useEffect } from 'react';

interface Business {
  id: number;
  name: string;
  config: any;
}

interface BusinessContextType {
  activeBusiness: Business | null;
  setActiveBusiness: (business: Business) => void;
  businesses: Business[];
  loading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch businesses on load
    fetch('/api/businesses/')
      .then(res => res.json())
      .then(data => {
        setBusinesses(data);
        if (data.length > 0) setActiveBusiness(data[0]);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch businesses", err);
        setLoading(false);
      });
  }, []);

  return (
    <BusinessContext.Provider value={{ activeBusiness, setActiveBusiness, businesses, loading }}>
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
