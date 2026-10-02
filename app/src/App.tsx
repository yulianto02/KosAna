// app/src/App.tsx - Step 8 FIX: Penjaga 8 menus, Expenses + AC Cleaning allow view OR create
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
  const { loading, user } = useAuth() as any;

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const role = (user?.role || user?.globalRole || '').toLowerCase();
  const isPenjaga = role.includes('penjaga');

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        {/* Penjaga has no dashboard - redirect to properties, admin to dashboard */}
        <Route index element={<Navigate to={isPenjaga ? "/properties" : "/dashboard"} replace />} />
        
        <Route path="dashboard" element={<ProtectedRoute permission="dashboard.view"><Dashboard /></ProtectedRoute>} />
        <Route path="properties" element={<ProtectedRoute permission={["properties.view","properties.read"]}><Properties /></ProtectedRoute>} />
        <Route path="rooms" element={<ProtectedRoute permission={["rooms.view","rooms.read"]}><Rooms /></ProtectedRoute>} />
        <Route path="tenants" element={<ProtectedRoute permission={["tenants.view","tenants.read"]}><Tenants /></ProtectedRoute>} />
        <Route path="payments" element={<ProtectedRoute permission={["payments.view","payments.read"]}><Payments /></ProtectedRoute>} />
        
        {/* Step 8 FIX: Expenses allow view OR create - so penjaga with only create can access */}
        <Route path="expenses" element={<ProtectedRoute permission={["expenses.view","expenses.read","expenses.create"]}><Expenses /></ProtectedRoute>} />
        
        {/* Step 8 FIX: Room Cleaning allow view OR schedule */}
        <Route path="room-cleaning" element={<ProtectedRoute permission={["room_cleaning.view","room_cleaning.read","room_cleaning.schedule"]}><RoomCleaning /></ProtectedRoute>} />
        
        {/* Step 8 FIX: Laundry allow view OR create */}
        <Route path="laundry" element={<ProtectedRoute permission={["laundry.view","laundry.read","laundry.create"]}><Laundry /></ProtectedRoute>} />
        
        {/* Step 8 FIX: Maintenance allow view OR create */}
        <Route path="maintenance" element={<ProtectedRoute permission={["maintenance.view","maintenance.read","maintenance.create"]}><Maintenance /></ProtectedRoute>} />
        
        {/* Step 8 FIX: AC Cleaning allow view OR schedule/create - FIXES 403 for penjaga */}
        <Route path="ac-cleaning" element={<ProtectedRoute permission={["ac_cleaning.view","ac_cleaning.read","ac_cleaning.schedule","ac_cleaning.create","ac_cleaning.complete"]}><ACCleaning /></ProtectedRoute>} />
        
        <Route path="reports" element={<ProtectedRoute permission={["reports.view","reports.read"]}><Reports /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute permission={["settings.view","users.manage"]}><Settings /></ProtectedRoute>} />
        {/* Admin Access Control */}
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
