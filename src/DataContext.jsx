import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { firestore } from './db';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { currentUser, isAuthorized } = useAuth();
  const [data, setData] = useState({
    parties: [],
    items: [],
    sales: [],
    purchases: [],
    expenses: [],
    opticals: [],
    payments: [],
    settings: []
  });
  const [allBusinessData, setAllBusinessData] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentBusinessId, setCurrentBusinessId] = useState(null);
  const [saving, setSaving] = useState(false);
  const isUpdatingDataRef = useRef(false); // Prevent reload during data updates

  useEffect(() => {
    if (currentUser && isAuthorized) {
      loadAllData();
    } else {
      setData({
        parties: [],
        items: [],
        sales: [],
        purchases: [],
        expenses: [],
        opticals: [],
        payments: [],
        settings: []
      });
      setAllBusinessData({});
      setLoading(false);
    }
  }, [currentUser, isAuthorized]);

  // Listen for business changes from localStorage
  useEffect(() => {
    const storedBusinessId = Number(localStorage.getItem('currentBusinessId')) || 1;
    setCurrentBusinessId(storedBusinessId);
  }, []);

  // Reload data when business changes (but not during active data updates)
  useEffect(() => {
    if (currentBusinessId && Object.keys(allBusinessData).length > 0 && !isUpdatingDataRef.current) {
      loadBusinessData(currentBusinessId);
    }
  }, [currentBusinessId, allBusinessData]);

  const loadAllData = async () => {
    if (!currentUser || !isAuthorized) return;
    try {
      console.log('📂 Loading business data from Firestore...');
      setLoading(true);
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const firestoreData = userDoc.data().businesses;
        
        if (firestoreData && typeof firestoreData === 'object') {
          console.log('✅ Loaded businesses:', Object.keys(firestoreData));
          setAllBusinessData(firestoreData);
          
          // Set currentBusinessId if not already set
          const storedBusinessId = Number(localStorage.getItem('currentBusinessId'));
          const businessIds = Object.values(firestoreData).map(b => b.id);
          const validBusinessId = businessIds.includes(storedBusinessId) ? storedBusinessId : businessIds[0];
          
          if (validBusinessId) {
            console.log('🔧 Setting current business ID:', validBusinessId);
            setCurrentBusinessId(validBusinessId);
            localStorage.setItem('currentBusinessId', validBusinessId.toString());
          }
        } else {
          // Create default
          const defaultData = createDefaultBusinessData();
          setAllBusinessData(defaultData);
          setCurrentBusinessId(1);
          localStorage.setItem('currentBusinessId', '1');
          await saveAllData(defaultData);
        }
      } else {
        // New user
        const defaultData = createDefaultBusinessData();
        setAllBusinessData(defaultData);
        setCurrentBusinessId(1);
        localStorage.setItem('currentBusinessId', '1');
        await saveAllData(defaultData);
      }
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      alert('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultBusinessData = () => {
    return {
      '1': {
        id: 1,
        name: 'My Accounting Business',
        gstNumber: '',
        address: '',
        phone: '',
        email: '',
        state: 'Unknown',
        data: {
          parties: [],
          items: [],
          sales: [],
          purchases: [],
          expenses: [],
          opticals: [],
          payments: [],
          settings: []
        }
      }
    };
  };

  const loadBusinessData = (businessId) => {
    const businessKey = String(businessId);
    const business = allBusinessData[businessKey];
    
    if (business && business.data) {
      console.log('📊 Loading data for business:', business.name);
      setData(business.data);
    } else {
      console.warn('⚠️ Business not found:', businessId);
      setData({
        parties: [],
        items: [],
        sales: [],
        purchases: [],
        expenses: [],
        opticals: [],
        payments: [],
        settings: []
      });
    }
  };

  const saveAllData = async (businessData) => {
    if (!currentUser || !isAuthorized) {
      console.warn('⚠️ Cannot save: No user logged in or not authorized');
      return false;
    }
    
    if (saving) {
      console.log('⏳ Save already in progress, but continuing...');
      // Don't return false, just log - allow the save to proceed
    }

    try {
      setSaving(true);
      console.log('💾 Saving business data to Firestore...', {
        userId: currentUser.uid,
        businessCount: Object.keys(businessData).length
      });
      
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      await setDoc(userDocRef, { businesses: businessData }, { merge: true });
      
      console.log('✅ Data saved successfully to Firestore');
      return true;
    } catch (error) {
      console.error('❌ Failed to save data:', error);
      // Don't throw, just return false so the caller can handle it
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveCurrentBusinessData = async (newData) => {
    const businessId = currentBusinessId || Number(localStorage.getItem('currentBusinessId')) || 1;
    const businessKey = String(businessId);
    
    console.log('💾 Attempting to save business data:', { 
      businessId, 
      businessKey,
      hasBusinessData: !!allBusinessData[businessKey],
      allBusinessKeys: Object.keys(allBusinessData)
    });
    
    if (!allBusinessData[businessKey]) {
      console.error('⚠️ Business not found! Available businesses:', Object.keys(allBusinessData));
      console.error('Looking for business key:', businessKey);
      return false;
    }

    // Set flag to prevent useEffect from overwriting our update
    isUpdatingDataRef.current = true;

    // Update local data state immediately to ensure UI reflects changes
    setData(newData);

    const updatedBusinessData = {
      ...allBusinessData,
      [businessKey]: {
        ...allBusinessData[businessKey],
        data: newData
      }
    };

    setAllBusinessData(updatedBusinessData);
    const saved = await saveAllData(updatedBusinessData);
    
    // Reset flag after a short delay to allow state to settle
    setTimeout(() => {
      isUpdatingDataRef.current = false;
    }, 100);
    
    return saved;
  };

  const updateCurrentBusinessId = (businessId) => {
    setCurrentBusinessId(businessId);
    localStorage.setItem('currentBusinessId', businessId.toString());
  };

  // ✅ FIXED: Optimized CRUD operations with better logging and validation
  const updateData = async (table, items) => {
    // Validate that items is an array
    if (!Array.isArray(items)) {
      console.error(`❌ Invalid items array for ${table}:`, items);
      return false;
    }

    console.log(`📝 Updating ${table}:`, { itemCount: items.length });
    
    // Use functional update to ensure we get the latest state
    // and wrap in a Promise to ensure state is set before saving
    const newData = await new Promise((resolve) => {
      setData(prevData => {
        const updated = { ...prevData, [table]: items };
        // Resolve with the new data after state update is scheduled
        setTimeout(() => resolve(updated), 0);
        return updated;
      });
    });
    
    // Save the updated data to backend
    const saved = await saveCurrentBusinessData(newData);
    
    if (saved) {
      console.log(`✅ ${table} updated (${items.length} items)`);
    } else {
      console.error(`❌ Failed to save ${table} to backend`);
    }
    
    return saved;
  };

  const addItem = async (table, item) => {
    // Validate item before adding
    if (!item || typeof item !== 'object') {
      console.error(`❌ Invalid item for ${table}:`, item);
      return false;
    }

    // Validate businessId for all tables that require it
    const tablesRequiringBusinessId = ['parties', 'items', 'sales', 'purchases', 'expenses', 'payments', 'opticals'];
    if (tablesRequiringBusinessId.includes(table) && !item.businessId) {
      console.error(`❌ Invalid ${table} entry - missing businessId:`, item);
      return false;
    }

    // For sales/purchases, validate required fields
    if (table === 'sales' || table === 'purchases') {
      if (!item.partyId || !item.items || !Array.isArray(item.items) || item.items.length === 0) {
        console.error(`❌ Invalid ${table} entry - missing required fields:`, {
          hasPartyId: !!item.partyId,
          hasItems: !!item.items,
          itemsLength: item.items?.length || 0
        });
        return false;
      }

      // Validate items array
      const validItems = item.items.filter(i => i.itemId && i.qty > 0);
      if (validItems.length === 0) {
        console.error(`❌ Invalid ${table} entry - no valid items:`, item);
        return false;
      }

      // Validate total amount
      if (!item.totalAmount || item.totalAmount <= 0) {
        console.error(`❌ Invalid ${table} entry - invalid total amount:`, item.totalAmount);
        return false;
      }
    }

    // For parties, validate required fields
    if (table === 'parties') {
      if (!item.name || item.name.trim() === '') {
        console.error(`❌ Invalid ${table} entry - missing name:`, item);
        return false;
      }
      if (!item.type || (item.type !== 'Customer' && item.type !== 'Vendor')) {
        console.error(`❌ Invalid ${table} entry - invalid type:`, item.type);
        return false;
      }
    }

    // For items, validate required fields
    if (table === 'items') {
      if (!item.name || item.name.trim() === '') {
        console.error(`❌ Invalid ${table} entry - missing name:`, item);
        return false;
      }
    }

    // For payments, validate required fields
    if (table === 'payments') {
      if (!item.partyId || !item.totalAmount || item.totalAmount <= 0) {
        console.error(`❌ Invalid ${table} entry - missing required fields:`, {
          hasPartyId: !!item.partyId,
          totalAmount: item.totalAmount
        });
        return false;
      }
    }

    // For expenses, validate required fields
    if (table === 'expenses') {
      if (!item.amount || item.amount <= 0 || !item.date || !item.category) {
        console.error(`❌ Invalid ${table} entry - missing required fields:`, {
          amount: item.amount,
          date: item.date,
          category: item.category
        });
        return false;
      }
    }

    console.log(`➕ Adding to ${table}:`, { 
      id: item.id, 
      invoiceNumber: item.invoiceNumber,
      totalAmount: item.totalAmount,
      partyId: item.partyId,
      itemsCount: item.items?.length || 0
    });
    
    // Get current items and add new item
    const currentItems = data[table] || [];
    const newItem = { ...item, id: item.id || Date.now() };
    const updatedItems = [...currentItems, newItem];
    
    // Save using updateData
    const saved = await updateData(table, updatedItems);
    
    if (saved) {
      console.log(`✅ Added to ${table}, new count:`, updatedItems.length);
    }
    
    return saved;
  };

  const updateItem = async (table, id, updates) => {
    console.log(`✏️ Updating ${table} item:`, { id, ...updates });
    const items = (data[table] || []).map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    const saved = await updateData(table, items);
    
    if (saved) {
      console.log(`✅ Updated ${table} item ${id}`);
    }
    
    return saved;
  };

  const deleteItem = async (table, id) => {
    console.log(`🗑️ Deleting from ${table}:`, { id });
    const items = (data[table] || []).filter(item => item.id !== id);
    const saved = await updateData(table, items);
    
    if (saved) {
      console.log(`✅ Deleted from ${table}, remaining:`, items.length);
    }
    
    return saved;
  };

  const getItems = useCallback((table) => data[table] || [], [data]);
  const getItem = useCallback((table, id) => (data[table] || []).find(item => item.id === id), [data]);

  // Business management methods
  const addBusiness = async (businessData) => {
    if (!currentUser || !isAuthorized) {
      console.error('❌ Cannot add business: No user logged in or not authorized');
      return false;
    }

    // Validate required fields
    if (!businessData.name || businessData.name.trim() === '') {
      console.error('❌ Invalid business - missing name');
      return false;
    }

    // Generate new business ID
    const existingIds = Object.values(allBusinessData).map(b => b.id);
    const newId = Math.max(...existingIds, 0) + 1;
    const businessKey = String(newId);

    const newBusiness = {
      id: newId,
      name: businessData.name.trim(),
      gstNumber: businessData.gstNumber || '',
      address: businessData.address || '',
      phone: businessData.phone || '',
      email: businessData.email || '',
      state: businessData.state || 'Unknown',
      data: {
        parties: [],
        items: [],
        sales: [],
        purchases: [],
        expenses: [],
        opticals: [],
        payments: [],
        settings: []
      }
    };

    const updatedBusinessData = {
      ...allBusinessData,
      [businessKey]: newBusiness
    };

    setAllBusinessData(updatedBusinessData);
    const saved = await saveAllData(updatedBusinessData);

    if (saved) {
      console.log(`✅ Business added: ${newBusiness.name} (ID: ${newId})`);
      return newId;
    }

    return false;
  };

  const updateBusiness = async (businessId, updates) => {
    if (!currentUser || !isAuthorized) {
      console.error('❌ Cannot update business: No user logged in or not authorized');
      return false;
    }

    const businessKey = String(businessId);
    if (!allBusinessData[businessKey]) {
      console.error(`❌ Business not found: ${businessId}`);
      return false;
    }

    const updatedBusiness = {
      ...allBusinessData[businessKey],
      ...updates,
      name: updates.name?.trim() || allBusinessData[businessKey].name
    };

    const updatedBusinessData = {
      ...allBusinessData,
      [businessKey]: updatedBusiness
    };

    setAllBusinessData(updatedBusinessData);
    const saved = await saveAllData(updatedBusinessData);

    if (saved) {
      console.log(`✅ Business updated: ${updatedBusiness.name} (ID: ${businessId})`);
    }

    return saved;
  };

  const deleteBusiness = async (businessId) => {
    if (!currentUser || !isAuthorized) {
      console.error('❌ Cannot delete business: No user logged in or not authorized');
      return false;
    }

    const businessKey = String(businessId);
    if (!allBusinessData[businessKey]) {
      console.error(`❌ Business not found: ${businessId}`);
      return false;
    }

    const updatedBusinessData = { ...allBusinessData };
    delete updatedBusinessData[businessKey];

    setAllBusinessData(updatedBusinessData);
    const saved = await saveAllData(updatedBusinessData);

    if (saved) {
      console.log(`✅ Business deleted: ID ${businessId}`);
    }

    return saved;
  };

  return (
    <DataContext.Provider value={{
      data,
      loading,
      saving,
      addItem,
      updateItem,
      deleteItem,
      getItems,
      getItem,
      reloadData: loadAllData,
      allBusinessData,
      updateCurrentBusinessId,
      currentBusinessId,
      addBusiness,
      updateBusiness,
      deleteBusiness
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
