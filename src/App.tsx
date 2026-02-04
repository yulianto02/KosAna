import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
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
import { Login } from '@/pages/Login';
import { Toaster } from '@/components/ui/sonner';

export type Page = 
  | 'dashboard' 
  | 'properties' 
  | 'rooms' 
  | 'tenants' 
  | 'payments' 
  | 'expenses' 
  | 'laundry' 
  | 'maintenance' 
  | 'ac-cleaning' 
  | 'reports' 
  | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Set to true for demo
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'properties':
        return <Properties />;
      case 'rooms':
        return <Rooms />;
      case 'tenants':
        return <Tenants />;
      case 'payments':
        return <Payments />;
      case 'expenses':
        return <Expenses />;
      case 'laundry':
        return <Laundry />;
      case 'maintenance':
        return <Maintenance />;
      case 'ac-cleaning':
        return <ACCleaning />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {renderPage()}
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
