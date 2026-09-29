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

export type Page = 'dashboard' | 'properties' | 'rooms' | 'tenants' | 'payments' | 'expenses' | 'room-cleaning' | 'laundry' | 'maintenance' | 'ac-cleaning' | 'reports' | 'settings';

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
  permissions: string[]; // allow multiple: view OR read
}

const navConfig: NavConfig[] = [
  { id: 'dashboard', label: PAGE_LABELS.dashboard, icon: LayoutDashboard, permissions: ['dashboard.view','dashboard.read'] },
  { id: 'properties', label: PAGE_LABELS.properties, icon: Building2, permissions: ['properties.view','properties.read'] },
  { id: 'rooms', label: PAGE_LABELS.rooms, icon: DoorOpen, permissions: ['rooms.view','rooms.read'] },
  { id: 'tenants', label: PAGE_LABELS.tenants, icon: Users, permissions: ['tenants.view','tenants.read'] },
  { id: 'payments', label: PAGE_LABELS.payments, icon: CreditCard, permissions: ['payments.view','payments.read'] },
  { id: 'expenses', label: PAGE_LABELS.expenses, icon: Receipt, permissions: ['expenses.view','expenses.read'] },
  { id: 'room-cleaning', label: PAGE_LABELS['room-cleaning'], icon: Sparkles, permissions: ['room_cleaning.view','room_cleaning.read'] },
  { id: 'laundry', label: PAGE_LABELS.laundry, icon: Shirt, permissions: ['laundry.view','laundry.read'] },
  { id: 'maintenance', label: PAGE_LABELS.maintenance, icon: Wrench, permissions: ['maintenance.view','maintenance.read'] },
  { id: 'ac-cleaning', label: PAGE_LABELS['ac-cleaning'], icon: Wind, permissions: ['ac_cleaning.view','ac_cleaning.read'] },
  { id: 'reports', label: PAGE_LABELS.reports, icon: BarChart3, permissions: ['reports.view','reports.read'] },
  { id: 'settings', label: PAGE_LABELS.settings, icon: Settings, permissions: ['settings.view','settings.read'] },
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
          {visibleItems.map((item) => {
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
          })}
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
