import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { logout, getCurrentUser } from '@/services/auth';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Map routes to page IDs for sidebar highlighting
const routeToPage: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/properties': 'properties',
  '/rooms': 'rooms',
  '/tenants': 'tenants',
  '/payments': 'payments',
  '/expenses': 'expenses',
  '/laundry': 'laundry',
  '/maintenance': 'maintenance',
  '/ac-cleaning': 'ac-cleaning',
  '/reports': 'reports',
  '/settings': 'settings',
};

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get current page from URL
  const currentPage = routeToPage[location.pathname] || 'dashboard';

  useEffect(() => {
    // Load current user on mount
    const loadUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }
    };
    loadUser();
  }, []);

  const handlePageChange = (pageId: string) => {
    const route = Object.keys(routeToPage).find(key => routeToPage[key] === pageId);
    if (route) {
      navigate(route);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Berhasil keluar');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage as any}
        onPageChange={handlePageChange}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main Content */}
      <div className={`
        transition-all duration-300
        ${collapsed ? 'ml-20' : 'ml-64'}
      `}>
        {/* Header with logout handler */}
        <Header 
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        
        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
}