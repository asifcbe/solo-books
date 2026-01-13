import React, { createContext, useContext, useState, useEffect } from 'react';
import { useData } from './DataContext';

const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
  const { data, loading } = useData();
  const [currentBusinessId, setCurrentBusinessId] = useState(() => {
    return localStorage.getItem('currentBusinessId') || null;
  });

  const businesses = data.businesses || [];
  
  const currentBusiness = businesses.find(b => b.id === Number(currentBusinessId)) || businesses[0];

  useEffect(() => {
    if (currentBusiness && !loading) {
      setCurrentBusinessId(currentBusiness.id);
      localStorage.setItem('currentBusinessId', currentBusiness.id);
    }
  }, [currentBusiness, loading]);

  const switchBusiness = (id) => {
    setCurrentBusinessId(id);
    localStorage.setItem('currentBusinessId', id);
  };

  return (
    <BusinessContext.Provider value={{ currentBusiness, businesses, switchBusiness, setCurrentBusinessId }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
