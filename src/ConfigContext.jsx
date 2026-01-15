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

  // Deep merge utility
  const deepMerge = (target, source) => {
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        Object.assign(source[key], deepMerge(target[key], source[key]));
      }
    }
    Object.assign(target || {}, source);
    return target;
  };

  const loadConfig = async () => {
    try {
      const response = await fetch('/config.json?v=' + Date.now());
      if (response.ok) {
        const configData = await response.json();
        console.log('Config loaded:', configData);
        setConfig(prevConfig => {
          // Create a deep copy of prevConfig to avoid mutation
          const newConfig = JSON.parse(JSON.stringify(prevConfig));
          return deepMerge(newConfig, configData);
        });
      } else {
        console.log('Config fetch failed:', response.status);
      }
    } catch (error) {
      console.log('Config not found, using defaults:', error);
    }
  };

  useEffect(() => {
    loadConfig();
    
    // Only reload config when window gains focus (e.g., after editing config.json)
    const handleFocus = () => loadConfig();
    window.addEventListener('focus', handleFocus);
    
    return () => {
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