import Dexie from 'dexie';

export const db = new Dexie('AccountingSoftwareDB');

db.version(1).stores({
  businesses: '++id, name, gstNumber',
  parties: '++id, businessId, name, type, phone',
  items: '++id, businessId, name, taxRate',
  transactions: '++id, businessId, partyId, type, date, invoiceNumber',
  settings: '++id, key'
});

export default db;
