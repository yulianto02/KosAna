import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar, PAGE_LABELS, type Page } from './Sidebar';
import { logout, getCurrentUser } from '@/services/auth';
import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Map routes to page IDs for sidebar highlighting
const routeToPage: Record<string, Page> = {
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Get current page from URL
  const currentPage = routeToPage[location.pathname] || 'dashboard';
  const pageTitle = PAGE_LABELS[currentPage];

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

  const handlePageChange = (page: Page) => {
    const route = Object.keys(routeToPage).find(key => routeToPage[key] === page);
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
      {/* Desktop sidebar — hidden below md */}
      <div className="hidden md:block">
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile navigation drawer — full-height Sheet with backdrop */}
      {isMobile && (
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent
            side="left"
            className="w-72 p-0 bg-[#1A3D5C] border-r-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] [&>button]:hidden"
          >
            <Sidebar
              variant="drawer"
              currentPage={currentPage}
              onPageChange={handlePageChange}
              collapsed={false}
              onToggleCollapse={() => {}}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className={cn(
        'transition-all duration-300',
        collapsed ? 'md:ml-20' : 'md:ml-64'
      )}>
        {/* Header with logout handler */}
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          pageTitle={pageTitle}
          onMenuClick={() => setMobileNavOpen(true)}
        />

        {/* Page Content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
}