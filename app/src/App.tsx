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
import { Users } from '@/pages/Users';
import { Roles } from '@/pages/Roles';
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
        <Route path="dashboard" element={<ProtectedRoute permission="dashboard.view"><Dashboard /></ProtectedRoute>} />
        <Route path="properties" element={<ProtectedRoute permission="properties.view"><Properties /></ProtectedRoute>} />
        <Route path="rooms" element={<ProtectedRoute permission="rooms.view"><Rooms /></ProtectedRoute>} />
        <Route path="tenants" element={<ProtectedRoute permission="tenants.view"><Tenants /></ProtectedRoute>} />
        <Route path="payments" element={<ProtectedRoute permission="payments.view"><Payments /></ProtectedRoute>} />
        <Route path="expenses" element={<ProtectedRoute permission="expenses.view"><Expenses /></ProtectedRoute>} />
        <Route path="room-cleaning" element={<ProtectedRoute permission="room_cleaning.view"><RoomCleaning /></ProtectedRoute>} />
        <Route path="laundry" element={<ProtectedRoute permission="laundry.view"><Laundry /></ProtectedRoute>} />
        <Route path="maintenance" element={<ProtectedRoute permission="maintenance.view"><Maintenance /></ProtectedRoute>} />
        <Route path="ac-cleaning" element={<ProtectedRoute permission="ac_cleaning.view"><ACCleaning /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute permission="reports.view"><Reports /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute permission="settings.view"><Settings /></ProtectedRoute>} />
        {/* Step 6 - Admin Access Control */}
        <Route path="users" element={<ProtectedRoute permission="users.manage"><Users /></ProtectedRoute>} />
        <Route path="roles" element={<ProtectedRoute permission="users.manage"><Roles /></ProtectedRoute>} />
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
