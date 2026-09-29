import { useEffect } from 'react';
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
import { RoomCleaning } from './pages/RoomCleaning';
import { Laundry } from '@/pages/Laundry';
import { Maintenance } from '@/pages/Maintenance';
import { ACCleaning } from '@/pages/ACCleaning';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';
import { getToken, syncUserFromToken } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
        <Route path="room-cleaning" element={<RoomCleaning />} />
        <Route path="laundry" element={<Laundry />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="ac-cleaning" element={<ACCleaning />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    if (getToken()) {
      syncUserFromToken();
    }
  }, []);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
