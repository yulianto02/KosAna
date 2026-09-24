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
  '/room-cleaning': 'room-cleaning',
  '/laundry': 'laundry',
  '/maintenance': 'maintenance',
  '/ac-cleaning': 'ac-cleaning',
  '/reports': 'reports',
  '/settings': 'settings',
};

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  const navigate = useNavigate();
  const location = useLocation();

  // Get current page from URL
  const currentPage = routeToPage[location.pathname] || 'dashboard';

  useEffect(() => {

    const loadUser = async () => {
      setIsLoading(true);
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error: any) {
        // Check for 401 (no token or expired) or 403 (invalid token)
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Session expired or not authenticated, redirecting to login...');
          setCurrentUser(null);
          navigate('/login');
        } else {
          console.error('Failed to load user:', error);
          // For other errors, you might want to show an error message or still redirect
          setCurrentUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, [navigate]); // Added navigate to dependency array

  const handlePageChange = (pageId: string) => {
    const route = Object.keys(routeToPage).find(key => routeToPage[key] === pageId);
    if (route) {
      navigate(route);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Berhasil keluar');
    navigate('/login'); // Also navigate to login on logout
  };

  // Optional: Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full" />
      </div>
    );
  }

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