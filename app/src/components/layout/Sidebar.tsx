// app/src/components/layout/Sidebar.tsx - Step 6 + Access Control section (users.manage)
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { logout } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  ShieldCheck,
  CreditCard,
  Receipt,
  Sparkles,
  Shirt,
  Wrench,
  Wind,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
  X
} from 'lucide-react';

export type Page = 'dashboard' | 'properties' | 'rooms' | 'tenants' | 'payments' | 'expenses' | 'room-cleaning' | 'laundry' | 'maintenance' | 'ac-cleaning' | 'reports' | 'settings' | 'users' | 'roles';

export const PAGE_LABELS: Record<Page, string> = {
  dashboard: 'Dashboard',
  properties: 'Properti',
  rooms: 'Kamar',
  tenants: 'Penghuni',
  payments: 'Pembayaran',
  expenses: 'Pengeluaran',
  'room-cleaning': 'Pembersihan Kamar',
  laundry: 'Laundry',
  maintenance: 'Perawatan',
  'ac-cleaning': 'Jadwal AC',
  reports: 'Laporan',
  settings: 'Pengaturan',
  users: 'Pengguna',
  roles: 'Peran & Izin',
};

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  variant?: 'sidebar' | 'drawer';
}

interface NavConfig {
  id: Page;
  label: string;
  icon: React.ElementType;
  permissions: string[];
  section?: 'main' | 'access';
}

const navConfig: NavConfig[] = [
  { id: 'dashboard', label: PAGE_LABELS.dashboard, icon: LayoutDashboard, permissions: ['dashboard.view','dashboard.read'], section: 'main' },
  { id: 'properties', label: PAGE_LABELS.properties, icon: Building2, permissions: ['properties.view','properties.read'], section: 'main' },
  { id: 'rooms', label: PAGE_LABELS.rooms, icon: DoorOpen, permissions: ['rooms.view','rooms.read'], section: 'main' },
  { id: 'tenants', label: PAGE_LABELS.tenants, icon: Users, permissions: ['tenants.view','tenants.read'], section: 'main' },
  { id: 'payments', label: PAGE_LABELS.payments, icon: CreditCard, permissions: ['payments.view','payments.read'], section: 'main' },
  { id: 'expenses', label: PAGE_LABELS.expenses, icon: Receipt, permissions: ['expenses.view','expenses.read'], section: 'main' },
  { id: 'room-cleaning', label: PAGE_LABELS['room-cleaning'], icon: Sparkles, permissions: ['room_cleaning.view','room_cleaning.read'], section: 'main' },
  { id: 'laundry', label: PAGE_LABELS.laundry, icon: Shirt, permissions: ['laundry.view','laundry.read'], section: 'main' },
  { id: 'maintenance', label: PAGE_LABELS.maintenance, icon: Wrench, permissions: ['maintenance.view','maintenance.read'], section: 'main' },
  { id: 'ac-cleaning', label: PAGE_LABELS['ac-cleaning'], icon: Wind, permissions: ['ac_cleaning.view','ac_cleaning.read'], section: 'main' },
  { id: 'reports', label: PAGE_LABELS.reports, icon: BarChart3, permissions: ['reports.view','reports.read'], section: 'main' },
  { id: 'settings', label: PAGE_LABELS.settings, icon: Settings, permissions: ['settings.view','settings.read'], section: 'main' },
  // Step 6 - Access Control (only users.manage)
  { id: 'users', label: PAGE_LABELS.users, icon: Users, permissions: ['users.manage'], section: 'access' },
  { id: 'roles', label: PAGE_LABELS.roles, icon: ShieldCheck, permissions: ['users.manage'], section: 'access' },
];

export function Sidebar({ currentPage, onPageChange, collapsed, onToggleCollapse, onNavigate, variant = 'sidebar' }: SidebarProps) {
  const navigate = useNavigate();
  const isDrawer = variant === 'drawer';
  const { hasPermission, isAdmin } = useAuth();

  const handleNavClick = (page: Page) => {
    onPageChange(page);
    onNavigate?.();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navConfig.filter(item => {
    if (isAdmin) return true;
    return item.permissions.some(p => hasPermission(p));
  });

  const mainItems = visibleItems.filter(i => (i.section || 'main') === 'main');
  const accessItems = visibleItems.filter(i => i.section === 'access');

  const NavButton = ({ item }: { item: NavConfig }) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;
    return (
      <button
        key={item.id}
        onClick={() => handleNavClick(item.id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 rounded-lg transition-all duration-200",
          isDrawer ? "py-3 min-h-11" : "py-2.5",
          isActive ? "bg-[#D4A84B] text-white shadow-lg" : "text-white/70 hover:bg-white/10 hover:text-white",
          !isDrawer && collapsed && "justify-center px-2"
        )}
        title={!isDrawer && collapsed ? item.label : undefined}
      >
        <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "scale-110")} />
        {(!collapsed || isDrawer) && <span className="text-sm font-medium">{item.label}</span>}
      </button>
    );
  };

  return (
    <div className={cn(
      "bg-[#1A3D5C] text-white transition-all duration-300 flex flex-col",
      isDrawer ? "h-full w-full" : cn("fixed left-0 top-0 z-40 h-screen", collapsed ? "w-20" : "w-64")
    )}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-[#D4A84B] rounded-lg flex items-center justify-center flex-shrink-0">
            <Home className="w-5 h-5 text-white" />
          </div>
          {(!collapsed || isDrawer) && (
            <div>
              <h1 className="font-bold text-lg leading-tight">Kos Ana</h1>
              <p className="text-xs text-white/60">Management System</p>
            </div>
          )}
        </div>
        {isDrawer ? (
          <Button variant="ghost" size="icon" onClick={onNavigate} className="text-white/60 hover:text-white hover:bg-white/10 h-11 w-11" aria-label="Tutup menu">
            <X className="w-5 h-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="text-white/60 hover:text-white hover:bg-white/10">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-1">
          {mainItems.map((item) => <NavButton key={item.id} item={item} />)}
          
          {accessItems.length > 0 && (
            <>
              <div className={cn("pt-4 mt-4 border-t border-white/10", !isDrawer && collapsed && "px-2")}>
                {(!collapsed || isDrawer) && (
                  <p className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-white/40 uppercase">Access Control</p>
                )}
                {collapsed && !isDrawer && (
                  <div className="h-px bg-white/10 mb-3" />
                )}
              </div>
              <div className="space-y-1">
                {accessItems.map((item) => <NavButton key={item.id} item={item} />)}
              </div>
            </>
          )}

          {visibleItems.length === 0 && (
            <div className="px-3 py-4 text-xs text-white/40 text-center">
              Tidak ada akses menu
            </div>
          )}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200",
            isDrawer ? "py-3 min-h-11" : "py-2.5",
            !isDrawer && collapsed && "justify-center px-2"
          )}
          title={!isDrawer && collapsed ? "Keluar" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(!collapsed || isDrawer) && <span className="text-sm font-medium">Keluar</span>}
        </button>
      </div>
    </div>
  );
}
