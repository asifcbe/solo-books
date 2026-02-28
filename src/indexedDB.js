/**
 * IndexedDB layer for Solo Books - primary local storage.
 * No Firestore/backend calls except login. Backup to online is explicit (Backup page).
 */
const DB_NAME = 'SoloBooksDB';
const DB_VERSION = 1;
const STORE_NAME = 'businessData';

let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };
  });
}

/**
 * Get stored data for a user (all businesses). Returns null if not found.
 * @param {string} userId - Firebase Auth UID
 */
export async function getLocalData(userId) {
  if (!userId) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(userId);
    req.onsuccess = () => resolve(req.result?.data ?? null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Save all business data for a user to IndexedDB.
 * @param {string} userId - Firebase Auth UID
 * @param {Object} businessData - { [businessId]: { id, name, ..., data: { parties, items, ... } } }
 */
export async function setLocalData(userId, businessData) {
  if (!userId) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ userId, data: businessData, updatedAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Clear local data for a user (e.g. on logout).
 */
export async function clearLocalData(userId) {
  if (!userId) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(userId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export default { getLocalData, setLocalData, clearLocalData, openDB };
