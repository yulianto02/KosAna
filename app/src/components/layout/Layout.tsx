import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar, PAGE_LABELS, type Page } from './Sidebar';
import { authService } from '@/services/auth';
import type { AuthUser } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  '/users': 'users',
  '/roles': 'roles',
};

function getPageFromPath(pathname: string): Page {
  const first = '/' + (pathname.split('/').filter(Boolean)[0] || 'dashboard');
  return (routeToPage[first] || routeToPage[pathname] || 'dashboard') as Page;
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  let authCtx: any = null;
  try { authCtx = useAuth(); } catch { authCtx = null; }

  const [localUser, setLocalUser] = useState<AuthUser | any>(null);
  const [localLoading, setLocalLoading] = useState(true);

  const currentUser = authCtx?.user || localUser;
  const isLoading = authCtx ? authCtx.loading : localLoading;
  const currentPage = getPageFromPath(location.pathname);
  const pageTitle = PAGE_LABELS[currentPage] || currentPage;

  useEffect(() => {
    if (authCtx?.user) {
      setLocalUser(authCtx.user);
      setLocalLoading(false);
      return;
    }
    const load = async () => {
      setLocalLoading(true);
      try {
        const user = await authService.getCurrentUser();
        setLocalUser(user);
      } catch (e) {
        console.error('[Layout] getCurrentUser failed', e);
        const token = localStorage.getItem('kosana_token') || localStorage.getItem('kosana_access_token');
        if (!token) navigate('/login');
      } finally {
        setLocalLoading(false);
      }
    };
    load();
  }, [authCtx?.user]);

  const handlePageChange = (page: Page) => {
    // FIX: penjaga has no dashboard.view permission, ProtectedRoute redirects to /dashboard
    // So we must allow navigation even if permission check fails in ProtectedRoute
    // Force navigation with window.location for now to bypass ProtectedRoute loop
    const target = `/${page}`;
    console.log('[Layout] Navigating', location.pathname, '->', target, 'user:', currentUser?.username);
    // Use navigate, not window.location, but ensure we close drawer first
    setMobileNavOpen(false);
    setTimeout(() => navigate(target), 10);
  };

  const handleLogout = async () => {
    try {
      if (authCtx) await authCtx.logout();
      else await authService.logout();
    } catch {}
    toast.success('Berhasil keluar');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Allow rendering even if currentUser is null after loading, to prevent black screen
  // The token check above will redirect if truly not logged in
  const displayUser = currentUser || { username: 'Loading...', fullName: 'User' };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden md:block">
        <Sidebar currentPage={currentPage} onPageChange={handlePageChange} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      </div>
      {isMobile && (
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-72 p-0 bg-[#1A3D5C] border-r-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] [&>button]:hidden">
            <Sidebar variant="drawer" currentPage={currentPage} onPageChange={handlePageChange} collapsed={false} onToggleCollapse={() => {}} onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
      <div className={cn('transition-all duration-300', collapsed ? 'md:ml-20' : 'md:ml-64')}>
        <Header currentUser={displayUser} onLogout={handleLogout} pageTitle={pageTitle} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
