import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProviderWrapper } from './ThemeContext';
import { ConfigProvider, useConfig } from './ConfigContext';
import { DataProvider } from './DataContext';
import Layout from './Layout';
import { BusinessProvider, useBusiness } from './BusinessContext';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';

import Dashboard from './Dashboard';
import Parties from './Parties';
import Items from './Items';
import Sales from './Sales';
import Reports from './Reports';
import Backup from './Backup';
import Settings from './Settings';
import PaymentEntry from './PaymentEntry';
import Expenses from './Expenses';
import Opticals from './Opticals';
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const { currentBusiness } = useBusiness();
  const { config } = useConfig();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
      {config.features?.dashboard && <Route path="/" element={<Layout><Dashboard /></Layout>} />}
      {config.features?.parties && <Route path="/parties" element={<Layout><Parties /></Layout>} />}
      {config.features?.items && <Route path="/items" element={<Layout><Items /></Layout>} />}
      {config.features?.sales && <Route path="/sales" element={<Layout><Sales /></Layout>} />}
      {config.features?.purchases && <Route path="/purchases" element={<Layout><Sales mode="purchase" /></Layout>} />}
      {config.features?.expenses && <Route path="/expenses" element={<Layout><Expenses /></Layout>} />}
      {config.features?.opticals && config.businessType === 'opticals' && <Route path="/opticals" element={<Layout><Opticals /></Layout>} />}
      {config.features?.payments && <Route path="/payment-in" element={<Layout><PaymentEntry mode="payment-in" /></Layout>} />}
      {config.features?.payments && <Route path="/payment-out" element={<Layout><PaymentEntry mode="payment-out" /></Layout>} />}
      {config.features?.reports && <Route path="/reports" element={<Layout><Reports /></Layout>} />}
      {config.features?.backup && <Route path="/backup" element={<Layout><Backup /></Layout>} />}
      {config.features?.settings && <Route path="/settings" element={<Layout><Settings /></Layout>} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ConfigProvider>
      <ThemeProviderWrapper>
        <CssBaseline />
        <AuthProvider>
          <DataProvider>
            <BusinessProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </BusinessProvider>
          </DataProvider>
        </AuthProvider>
      </ThemeProviderWrapper>
    </ConfigProvider>
  );
}

export default App;
