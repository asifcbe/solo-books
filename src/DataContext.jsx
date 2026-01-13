import React, { createContext, useContext, useState, useEffect } from 'react';
import { firestore } from './db';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [data, setData] = useState({
    businesses: [],
    parties: [],
    items: [],
    transactions: [],
    expenses: [],
    opticals: [],
    settings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadData();
    } else {
      setData({
        businesses: [],
        parties: [],
        items: [],
        transactions: [],
        expenses: [],
        opticals: [],
        settings: []
      });
      setLoading(false);
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().accountingdata) {
        setData(userDoc.data().accountingdata);
      } else {
        // Initialize with default business
        const defaultData = {
          businesses: [{
            id: 1,
            name: 'My Accounting Business',
            gstNumber: '',
            address: '',
            phone: '',
            email: '',
            state: 'Unknown'
          }],
          parties: [],
          items: [],
          transactions: [],
          expenses: [],
          opticals: [],
          settings: []
        };
        setData(defaultData);
        await setDoc(userDocRef, { accountingdata: defaultData }, { merge: true });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const saveData = async (newData) => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      await setDoc(userDocRef, { accountingdata: newData }, { merge: true });
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const updateData = (table, items) => {
    const newData = { ...data, [table]: items };
    setData(newData);
    saveData(newData);
  };

  const addItem = (table, item) => {
    const items = [...data[table], { ...item, id: Date.now() }];
    updateData(table, items);
  };

  const updateItem = (table, id, updates) => {
    const items = data[table].map(item => item.id === id ? { ...item, ...updates } : item);
    updateData(table, items);
  };

  const deleteItem = (table, id) => {
    const items = data[table].filter(item => item.id !== id);
    updateData(table, items);
  };

  const getItems = (table) => data[table];

  const getItem = (table, id) => data[table].find(item => item.id === id);

  return (
    <DataContext.Provider value={{
      data,
      loading,
      addItem,
      updateItem,
      deleteItem,
      getItems,
      getItem,
      reloadData: loadData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);