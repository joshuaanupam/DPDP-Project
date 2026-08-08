import React from 'react';
import { PrivacyProvider } from './context/PrivacyContext';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  return (
    <PrivacyProvider>
      <DashboardPage />
    </PrivacyProvider>
  );
}

export default App;
