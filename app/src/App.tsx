import { useEffect } from 'react';  // ← Tambahkan ini
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/components/ui/login';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Properties } from '@/pages/Properties';
import { Rooms } from '@/pages/Rooms';
import { Tenants } from '@/pages/Tenants';
import { Payments } from '@/pages/Payments';
import { Expenses } from '@/pages/Expenses';
import { Laundry } from '@/pages/Laundry';
import { Maintenance } from '@/pages/Maintenance';
import { ACCleaning } from '@/pages/ACCleaning';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';
import { getToken, syncUserFromToken } from '@/services/auth';  // ← Tambahkan ini

function App() {
  // Sync user dari token saat app mount (termasuk refresh halaman)
  useEffect(() => {
    if (getToken()) {
      syncUserFromToken();
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="properties" element={<Properties />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="payments" element={<Payments />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="laundry" element={<Laundry />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="ac-cleaning" element={<ACCleaning />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;