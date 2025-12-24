import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';

const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
  const [currentBusinessId, setCurrentBusinessId] = useState(() => {
    return localStorage.getItem('currentBusinessId') || null;
  });

  const businesses = useLiveQuery(() => db.businesses.toArray()) || [];
  
  const currentBusiness = businesses.find(b => b.id === Number(currentBusinessId)) || businesses[0];

  useEffect(() => {
    if (currentBusiness) {
      setCurrentBusinessId(currentBusiness.id);
      localStorage.setItem('currentBusinessId', currentBusiness.id);
    }
  }, [currentBusiness]);

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
