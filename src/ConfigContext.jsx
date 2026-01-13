import React, { createContext, useContext, useState, useEffect } from 'react';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    businessType: 'general',
    features: {
      dashboard: true,
      parties: true,
      items: true,
      sales: true,
      purchases: true,
      expenses: true,
      opticals: false,
      payments: true,
      reports: true,
      backup: true,
      settings: true
    },
    multiBusiness: true,
    useIndexedDB: true,
    theme: {
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e'
    }
  });

  const loadConfig = async () => {
    try {
      const response = await fetch('/config.json?v=' + Date.now());
      if (response.ok) {
        const configData = await response.json();
        console.log('Config loaded:', configData);
        setConfig(prevConfig => ({ ...prevConfig, ...configData }));
      } else {
        console.log('Config fetch failed:', response.status);
      }
    } catch (error) {
      console.log('Config not found, using defaults:', error);
    }
  };

  useEffect(() => {
    loadConfig();
    // Poll for config changes every 5 seconds
    const interval = setInterval(loadConfig, 5000);
    
    // Reload config when window gains focus
    const handleFocus = () => loadConfig();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const reloadConfig = () => {
    console.log('Manually reloading config');
    loadConfig();
  };

  return (
    <ConfigContext.Provider value={{ config, reloadConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);