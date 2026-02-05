import { useState, useEffect } from 'react';
import { 
  Building2, Users, CreditCard, TrendingUp, 
  TrendingDown, AlertCircle, Plus, ArrowRight,
  Shirt, Wrench, Wind, DoorOpen, Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { dashboardAPI, reportsAPI, paymentsAPI, acCleaningAPI, maintenanceAPI } from '@/services/api';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage } from '@/lib/format';

const COLORS = ['#1A3D5C', '#4A6D8C', '#D4A84B', '#E8C878', '#0F2744', '#B08A3A'];

interface DashboardStats {
  totalProperties: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  totalTenants: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  pendingPayments: number;
  occupancyRate: number;
}

export function Dashboard() {
  const [timeRange, setTimeRange] = useState('month');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [upcomingAC, setUpcomingAC] = useState<any[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, revenueRes, occupancyRes, expenseRes, paymentsRes, acRes, maintRes] = await Promise.all([
          dashboardAPI.getStats(),
          reportsAPI.getRevenue(),
          reportsAPI.getOccupancy(),
          reportsAPI.getExpensesByCategory(),
          paymentsAPI.getAll({ status: 'pending' }),
          acCleaningAPI.getAll(),
          maintenanceAPI.getAll(),
        ]);
        
        setStats(statsRes);
        setRevenueData(revenueRes);
        setOccupancyData(occupancyRes);
        setExpenseData(expenseRes);
        setPendingPayments(paymentsRes.slice(0, 5));
        setUpcomingAC(acRes.filter((s: any) => s.status === 'pending').slice(0, 3));
        setMaintenanceRequests(maintRes.filter((r: any) => r.status === 'reported').slice(0, 3));
      } catch (error) {
        toast.error('Gagal memuat data dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Recent activities (mock for now)
  const recentActivities = [
    { type: 'payment', message: 'Pembayaran dari Ahmad Fauzi diterima', time: '2 jam yang lalu', icon: CreditCard, color: 'green' },
    { type: 'maintenance', message: 'AC kamar 102 selesai dibersihkan', time: '4 jam yang lalu', icon: Wind, color: 'blue' },
    { type: 'laundry', message: 'Pesanan laundry kamar 104 selesai', time: '6 jam yang lalu', icon: Shirt, color: 'purple' },
    { type: 'maintenance', message: 'Request perbaikan lampu kamar 201', time: '8 jam yang lalu', icon: Wrench, color: 'orange' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A3D5C]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Selamat datang kembali, berikut ringkasan hari ini</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
          >
            <option value="day">Hari Ini</option>
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
          <Button className="bg-[#1A3D5C] hover:bg-[#0F2744]" onClick={() => window.location.href = '#/tenants'}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Penghuni
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Properti"
          value={stats?.totalProperties?.toString() || '0'}
          subtitle={`${stats?.totalRooms || 0} Total Kamar`}
          icon={Building2}
          trend="up"
          trendValue="+1 bulan ini"
          color="blue"
        />
        <StatCard
          title="Okupansi"
          value={`${formatPercentage(stats?.occupancyRate || 0)}`}
          subtitle={`${stats?.occupiedRooms || 0} Terisi / ${stats?.vacantRooms || 0} Kosong`}
          icon={DoorOpen}
          trend="up"
          trendValue="+2.5%"
          color="green"
        />
        <StatCard
          title="Pendapatan Bulan Ini"
          value={formatCurrency(stats?.monthlyRevenue || 0)}
          subtitle={`${stats?.pendingPayments || 0} Pembayaran Tertunda`}
          icon={CreditCard}
          trend="up"
          trendValue="+5.2%"
          color="gold"
        />
        <StatCard
          title="Total Penghuni"
          value={stats?.totalTenants?.toString() || '0'}
          subtitle="Aktif"
          icon={Users}
          trend="neutral"
          trendValue="Stabil"
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Pendapatan 6 Bulan Terakhir</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8.5%
            </Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="roomRevenue" name="Sewa Kamar" fill="#1A3D5C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="laundryRevenue" name="Laundry" fill="#D4A84B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Occupancy Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Tingkat Okupansi</CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Rata-rata {formatPercentage(stats?.occupancyRate || 0)}
            </Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[70, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Line type="monotone" dataKey="rate" name="Okupansi" stroke="#1A3D5C" strokeWidth={3} dot={{ fill: '#1A3D5C', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#D4A84B' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={expenseData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="amount">
                  {expenseData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-xs">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Aktivitas Terbaru</CardTitle>
            <Button variant="ghost" size="sm" className="text-[#1A3D5C]">
              Lihat Semua
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", activity.color === 'green' && "bg-green-100", activity.color === 'blue' && "bg-blue-100", activity.color === 'purple' && "bg-purple-100", activity.color === 'orange' && "bg-orange-100")}>
                    <activity.icon className={cn("w-4 h-4", activity.color === 'green' && "text-green-600", activity.color === 'blue' && "text-blue-600", activity.color === 'purple' && "text-purple-600", activity.color === 'orange' && "text-orange-600")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Tugas Mendatang</CardTitle>
            <Button variant="ghost" size="sm" className="text-[#1A3D5C]">
              Lihat Semua
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Pending Payments */}
              {pendingPayments.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{pendingPayments.length} Pembayaran Tertunda</p>
                    <p className="text-xs text-gray-500">
                      Total: {formatCurrency(pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0))}
                    </p>
                  </div>
                </div>
              )}

              {/* Upcoming AC Cleaning */}
              {upcomingAC.map((ac) => (
                <div key={ac.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Wind className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">AC Cleaning Kamar {ac.roomId}</p>
                    <p className="text-xs text-gray-500">Jadwal: {new Date(ac.nextCleaningDate).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
              ))}

              {/* Maintenance Requests */}
              {maintenanceRequests.map((req) => (
                <div key={req.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Perbaikan: {req.issueType}</p>
                    <p className="text-xs text-gray-500">Kamar {req.roomId} - {req.priority}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-[#1A3D5C] to-[#4A6D8C]">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-white">
              <h3 className="text-lg font-semibold">Aksi Cepat</h3>
              <p className="text-white/70 text-sm">Akses fitur yang sering digunakan</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-0" onClick={() => window.location.href = '#/tenants'}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Penghuni
              </Button>
              <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-0" onClick={() => window.location.href = '#/payments'}>
                <CreditCard className="w-4 h-4 mr-2" />
                Catat Pembayaran
              </Button>
              <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-0" onClick={() => window.location.href = '#/expenses'}>
                <Receipt className="w-4 h-4 mr-2" />
                Catat Pengeluaran
              </Button>
              <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-0" onClick={() => window.location.href = '#/laundry'}>
                <Shirt className="w-4 h-4 mr-2" />
                Input Laundry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  color: 'blue' | 'green' | 'gold' | 'purple' | 'red';
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    gold: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : () => <span className="w-4 h-4">-</span>;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
          <div className={cn("flex items-center gap-1 text-xs font-medium", trendColors[trend])}>
            <TrendIcon className="w-3 h-3" />
            {trendValue}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}
