// Standard IndexedDB Wrapper
const DB_NAME = 'FixMasterProDB';
const DB_VERSION = 1;
const STORES = [
  'jobs', 'inventory', 'staff', 'sales', 'customers', 
  'settings', 'expenses', 'quotations', 'suppliers', 'purchaseOrders'
];

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      STORES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          // Settings is a singleton object, others are collections with IDs
          if (storeName === 'settings') {
             db.createObjectStore(storeName);
          } else {
             db.createObjectStore(storeName, { keyPath: 'id' });
          }
        }
      });
    };
  });
};

export const getStoreData = async <T>(storeName: string): Promise<T[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveStoreData = async <T>(storeName: string, data: T[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    // Clear and Rewrite Strategy for simplicity in keeping sync.
    // For datasets < 10,000 items, this is performant enough for local IDB.
    const clearReq = store.clear();
    
    clearReq.onsuccess = () => {
        data.forEach(item => store.put(item));
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getSettings = async (): Promise<any | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const req = store.get('config');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};

export const saveSettings = async (settings: any): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');
        store.put(settings, 'config');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};