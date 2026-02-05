import { useState, useEffect } from 'react';
import { Download, FileText, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { reportsAPI, paymentsAPI, expensesAPI, laundryAPI } from '@/services/api';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage, getExpenseTypeLabel } from '@/lib/format';

const COLORS = ['#1A3D5C', '#4A6D8C', '#D4A84B', '#E8C878', '#0F2744', '#B08A3A', '#6B8BA4', '#C9A227'];

export function Reports() {
  const [period, setPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(false);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalLaundry, setTotalLaundry] = useState(0);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [revenueRes, occupancyRes, expenseRes, paymentsRes, expensesRes, laundryRes] = await Promise.all([
        reportsAPI.getRevenue(),
        reportsAPI.getOccupancy(),
        reportsAPI.getExpensesByCategory(),
        paymentsAPI.getAll(),
        expensesAPI.getAll(),
        laundryAPI.getAll(),
      ]);
      
      setRevenueData(revenueRes || []);
      setOccupancyData(occupancyRes || []);
      setExpenseByCategory(expenseRes || []);
      
      // Calculate totals
      const paidPayments = paymentsRes.filter((p: any) => p.paymentStatus === 'paid');
      setTotalRevenue(paidPayments.reduce((sum: number, p: any) => sum + p.totalAmount, 0));
      setTotalExpenses(expensesRes.reduce((sum: number, e: any) => sum + e.amount, 0));
      const completedLaundry = laundryRes.filter((l: any) => l.status === 'completed');
      setTotalLaundry(completedLaundry.reduce((sum: number, l: any) => sum + l.totalPrice, 0));
    } catch (error) {
      toast.error('Gagal memuat data laporan');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary data
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan & Analitik</h1>
          <p className="text-gray-500">Lihat laporan keuangan dan analitik properti</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
          >
            <option value="month">Bulan Ini</option>
            <option value="quarter">Kuartal Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Memuat data...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Pendapatan</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Pengeluaran</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Laba Bersih</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(netProfit)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Margin Laba</p>
                    <p className="text-xl font-bold text-gray-900">{formatPercentage(profitMargin)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="financial">
            <TabsList>
              <TabsTrigger value="financial">Laporan Keuangan</TabsTrigger>
              <TabsTrigger value="occupancy">Okupansi</TabsTrigger>
              <TabsTrigger value="expenses">Pengeluaran</TabsTrigger>
              <TabsTrigger value="pl">P&L Statement</TabsTrigger>
            </TabsList>

            {/* Financial Report */}
            <TabsContent value="financial" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Pendapatan 6 Bulan Terakhir</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData.length > 0 ? revenueData : [{ month: 'Tidak ada data', totalRevenue: 0 }]}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1A3D5C" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#1A3D5C" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        tickFormatter={(value) => `${value / 1000000}M`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="totalRevenue" 
                        name="Total Pendapatan"
                        stroke="#1A3D5C" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Breakdown Pendapatan</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={revenueData.length > 0 ? revenueData : [{ month: 'Tidak ada data', roomRevenue: 0, laundryRevenue: 0 }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis 
                          tick={{ fontSize: 12 }} 
                          tickFormatter={(value) => `${value / 1000000}M`}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="roomRevenue" name="Sewa Kamar" fill="#1A3D5C" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="laundryRevenue" name="Laundry" fill="#D4A84B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Ringkasan Pendapatan</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Sewa Kamar</span>
                        <span className="font-semibold">{formatCurrency(totalRevenue - totalLaundry)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Laundry</span>
                        <span className="font-semibold">{formatCurrency(totalLaundry)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-700 font-medium">Total Pendapatan</span>
                        <span className="font-bold text-blue-700">{formatCurrency(totalRevenue)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Occupancy Report */}
            <TabsContent value="occupancy">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Tingkat Okupansi 6 Bulan Terakhir</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={occupancyData.length > 0 ? occupancyData : [{ month: 'Tidak ada data', rate: 0, occupied: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value: number) => `${value}%`}
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="rate" 
                        name="Tingkat Okupansi" 
                        stroke="#1A3D5C" 
                        strokeWidth={3}
                        dot={{ fill: '#1A3D5C', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, fill: '#D4A84B' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="occupied" 
                        name="Kamar Terisi" 
                        stroke="#4A6D8C" 
                        strokeWidth={2}
                        dot={{ fill: '#4A6D8C', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expenses Report */}
            <TabsContent value="expenses">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Pengeluaran per Kategori</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={expenseByCategory.length > 0 ? expenseByCategory : [{ category: 'Tidak ada data', amount: 1 }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="amount"
                        >
                          {expenseByCategory.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend verticalAlign="bottom" height={36} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Detail Pengeluaran</h3>
                    <div className="space-y-3">
                      {expenseByCategory.map((cat, idx) => (
                        <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span className="text-gray-700">{getExpenseTypeLabel(cat.category) || cat.category}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold block">{formatCurrency(cat.amount)}</span>
                            <span className="text-xs text-gray-500">{cat.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* P&L Statement */}
            <TabsContent value="pl">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Laporan Laba Rugi</h3>
                      <p className="text-gray-500">Periode: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {/* Revenue Section */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">PENDAPATAN</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sewa Kamar</span>
                          <span>{formatCurrency(totalRevenue - totalLaundry)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Laundry</span>
                          <span>{formatCurrency(totalLaundry)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                          <span>Total Pendapatan</span>
                          <span className="text-green-600">{formatCurrency(totalRevenue)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expenses Section */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">PENGELUARAN</h4>
                      <div className="space-y-2">
                        {expenseByCategory.map((cat) => (
                          <div key={cat.category} className="flex justify-between">
                            <span className="text-gray-600">{getExpenseTypeLabel(cat.category) || cat.category}</span>
                            <span>{formatCurrency(cat.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                          <span>Total Pengeluaran</span>
                          <span className="text-red-600">{formatCurrency(totalExpenses)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Net Profit */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">LABA BERSIH</span>
                        <span className={cn(
                          "text-2xl font-bold",
                          netProfit >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(netProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-sm">
                        <span className="text-gray-500">Margin Laba</span>
                        <span className={cn(
                          "font-medium",
                          profitMargin >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatPercentage(profitMargin)}
                        </span>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Okupansi</p>
                        <p className="text-xl font-bold text-[#1A3D5C]">
                          {occupancyData.length > 0 ? `${occupancyData[occupancyData.length - 1]?.rate || 0}%` : '0%'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Rata-rata Sewa/Kamar</p>
                        <p className="text-xl font-bold text-[#1A3D5C]">{formatCurrency(2200000)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Rasio Pengeluaran</p>
                        <p className="text-xl font-bold text-[#1A3D5C]">{formatPercentage(totalRevenue > 0 ? (totalExpenses/totalRevenue)*100 : 0)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
