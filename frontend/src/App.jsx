import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import POSScreen from './pages/POSScreen';
import GPReports from './pages/GPReports';
import SalesReports from './pages/SalesReports';
import InventoryValuation from './pages/InventoryValuation';
import AccountsLedger from './pages/AccountsLedger';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/pos" replace />} />
          <Route path="pos" element={<POSScreen />} />
          <Route path="reports/gp" element={<GPReports />} />
          <Route path="reports/sales" element={<SalesReports />} />
          <Route path="inventory" element={<InventoryValuation />} />
          <Route path="accounts" element={<AccountsLedger />} />
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
