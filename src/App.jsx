import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import Layout from './Layout';
import { BusinessProvider, useBusiness } from './BusinessContext';
import { db } from './db';

import Dashboard from './Dashboard';
import Parties from './Parties';
import Items from './Items';
import Sales from './Sales';
import Reports from './Reports';
import Backup from './Backup';
import Settings from './Settings';
import PaymentEntry from './PaymentEntry';
const AppContent = () => {
  const { currentBusiness } = useBusiness();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const bcount = await db.businesses.count();
      if (bcount === 0) {
        await db.businesses.add({
          name: 'My Accounting Business',
          gstNumber: '',
          address: '',
          phone: '',
          email: '',
          state: 'Unknown'
        });
      }
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/parties" element={<Layout><Parties /></Layout>} />
      <Route path="/items" element={<Layout><Items /></Layout>} />
      <Route path="/sales" element={<Layout><Sales /></Layout>} />
      <Route path="/purchases" element={<Layout><Sales mode="purchase" /></Layout>} />
      <Route path="/reports" element={<Layout><Reports /></Layout>} />
      <Route path="/backup" element={<Layout><Backup /></Layout>} />
      <Route path="/payment-in" element={<Layout><PaymentEntry mode="payment-in" /></Layout>} />
      <Route path="/payment-out" element={<Layout><PaymentEntry mode="payment-out" /></Layout>} />
      <Route path="/settings" element={<Layout><Settings /></Layout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BusinessProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </BusinessProvider>
    </ThemeProvider>
  );
}

export default App;
