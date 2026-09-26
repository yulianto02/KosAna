import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { logout } from '@/services/auth';
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

// Page type for navigation
export type Page = 'dashboard' | 'properties' | 'rooms' | 'tenants' | 'payments' | 'expenses' | 'room-cleaning' | 'laundry' | 'maintenance' | 'ac-cleaning' | 'reports' | 'settings';

// Shared labels — also used by Layout for the mobile header title
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
  /** Called after a nav item is tapped — lets the mobile drawer auto-close */
  onNavigate?: () => void;
  /** 'sidebar' = fixed desktop rail; 'drawer' = rendered inside mobile Sheet */
  variant?: 'sidebar' | 'drawer';
}

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: PAGE_LABELS.dashboard, icon: LayoutDashboard },
  { id: 'properties', label: PAGE_LABELS.properties, icon: Building2 },
  { id: 'rooms', label: PAGE_LABELS.rooms, icon: DoorOpen },
  { id: 'tenants', label: PAGE_LABELS.tenants, icon: Users },
  { id: 'payments', label: PAGE_LABELS.payments, icon: CreditCard },
  { id: 'expenses', label: PAGE_LABELS.expenses, icon: Receipt },
  { id: 'room-cleaning', label: PAGE_LABELS['room-cleaning'], icon: Sparkles },
  { id: 'laundry', label: PAGE_LABELS.laundry, icon: Shirt },
  { id: 'maintenance', label: PAGE_LABELS.maintenance, icon: Wrench },
  { id: 'ac-cleaning', label: PAGE_LABELS['ac-cleaning'], icon: Wind },
  { id: 'reports', label: PAGE_LABELS.reports, icon: BarChart3 },
  { id: 'settings', label: PAGE_LABELS.settings, icon: Settings },
];

export function Sidebar({ currentPage, onPageChange, collapsed, onToggleCollapse, onNavigate, variant = 'sidebar' }: SidebarProps) {
  const navigate = useNavigate();
  const isDrawer = variant === 'drawer';

  const handleNavClick = (page: Page) => {
    onPageChange(page);
    onNavigate?.(); // auto-close drawer after navigation
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={cn(
      "bg-[#1A3D5C] text-white transition-all duration-300 flex flex-col",
      isDrawer
        ? "h-full w-full"
        : cn("fixed left-0 top-0 z-40 h-screen", collapsed ? "w-20" : "w-64")
    )}>
      {/* Logo */}
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
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigate}
            className="text-white/60 hover:text-white hover:bg-white/10 h-11 w-11"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 rounded-lg transition-all duration-200",
                  isDrawer ? "py-3 min-h-11" : "py-2.5",
                  isActive
                    ? "bg-[#D4A84B] text-white shadow-lg"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                  !isDrawer && collapsed && "justify-center px-2"
                )}
                title={!isDrawer && collapsed ? item.label : undefined}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "scale-110")} />
                {(!collapsed || isDrawer) && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer - Logout */}
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
          {(!collapsed || isDrawer) && (
            <span className="text-sm font-medium">Keluar</span>
          )}
        </button>
      </div>
    </div>
  );
}