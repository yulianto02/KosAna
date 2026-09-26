// app/src/pages/Reports.tsx - Responsive Mobile Version
import { useState, useEffect } from 'react';
import { Download, FileText, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart as RePieChart, Pie, Cell, Legend, AreaChart, Area
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

  useEffect(() => { fetchData(); }, []);

  const safeParseFloat = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isNaN(num)? 0 : num;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [revenueRes, occupancyRes, expenseRes, paymentsRes, expensesRes, laundryRes] = await Promise.all([
        reportsAPI.getRevenue(), reportsAPI.getOccupancy(), reportsAPI.getExpensesByCategory(),
        paymentsAPI.getAll(), expensesAPI.getAll(), laundryAPI.getAll(),
      ]);
      setRevenueData(revenueRes || []);
      setOccupancyData(occupancyRes || []);
      setExpenseByCategory(expenseRes || []);
      const paidPayments = (paymentsRes || []).filter((p: any) => p.payment_status === 'paid');
      const revenueAmount = paidPayments.reduce((sum: number, p: any) => sum + safeParseFloat(p.total_amount), 0);
      setTotalRevenue(revenueAmount);
      const expenseAmount = (expensesRes || []).reduce((sum: number, e: any) => sum + safeParseFloat(e.amount), 0);
      setTotalExpenses(expenseAmount);
      const completedLaundry = (laundryRes || []).filter((l: any) => l.status === 'completed');
      const laundryAmount = completedLaundry.reduce((sum: number, l: any) => sum + safeParseFloat(l.total_price), 0);
      setTotalLaundry(laundryAmount);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Gagal memuat data laporan');
    } finally { setIsLoading(false); }
  };

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0? (netProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Laporan & Analitik</h1>
          <p className="text-sm sm:text-base text-gray-500">Lihat laporan keuangan dan analitik properti</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full sm:w-auto h-11 sm:h-10 px-4 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C] bg-white"
          >
            <option value="month">Bulan Ini</option>
            <option value="quarter">Kuartal Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
          <Button variant="outline" className="h-11 sm:h-10 w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />Export PDF
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Memuat data...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
            <Card className="w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0"><TrendingUp className="w-5 h-5 text-green-600" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-gray-500 truncate">Total Pendapatan</p><p className="text-base sm:text-xl font-bold text-gray-900 truncate">{formatCurrency(totalRevenue)}</p></div></div></CardContent></Card>
            <Card className="w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-red-600" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-gray-500 truncate">Total Pengeluaran</p><p className="text-base sm:text-xl font-bold text-gray-900 truncate">{formatCurrency(totalExpenses)}</p></div></div></CardContent></Card>
            <Card className="w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0"><BarChart3 className="w-5 h-5 text-blue-600" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-gray-500 truncate">Laba Bersih</p><p className="text-base sm:text-xl font-bold text-gray-900 truncate">{formatCurrency(netProfit)}</p></div></div></CardContent></Card>
            <Card className="w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0"><PieChart className="w-5 h-5 text-purple-600" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-gray-500 truncate">Margin Laba</p><p className="text-base sm:text-xl font-bold text-gray-900">{formatPercentage(profitMargin)}</p></div></div></CardContent></Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="financial" className="w-full">
            <div className="w-full overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
              <TabsList className="w-full sm:w-auto inline-flex h-11 sm:h-10">
                <TabsTrigger value="financial" className="h-9 text-xs sm:text-sm whitespace-nowrap">Keuangan</TabsTrigger>
                <TabsTrigger value="occupancy" className="h-9 text-xs sm:text-sm whitespace-nowrap">Okupansi</TabsTrigger>
                <TabsTrigger value="expenses" className="h-9 text-xs sm:text-sm whitespace-nowrap">Pengeluaran</TabsTrigger>
                <TabsTrigger value="pl" className="h-9 text-xs sm:text-sm whitespace-nowrap">P&L</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="financial" className="space-y-4 sm:space-y-6 mt-4">
              <Card className="w-full overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Pendapatan 6 Bulan Terakhir</h3>
                  <div className="w-full h- sm:h-">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData.length > 0? revenueData : [{ month: 'Tidak ada data', total_revenue: 0 }]}>
                        <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1A3D5C" stopOpacity={0.8}/><stop offset="95%" stopColor="#1A3D5C" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `${value / 1000000}M`} width={35} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="total_revenue" name="Total Pendapatan" stroke="#1A3D5C" fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="w-full overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold mb-4">Breakdown Pendapatan</h3>
                    <div className="w-full h-">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData.length > 0? revenueData : [{ month: 'Tidak ada data', room_revenue: 0, laundry_revenue: 0 }]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `${value / 1000000}M`} width={35} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Bar dataKey="room_revenue" name="Sewa Kamar" fill="#1A3D5C" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="laundry_revenue" name="Laundry" fill="#D4A84B" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="w-full overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold mb-4">Ringkasan Pendapatan</h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg gap-2"><span className="text-sm text-gray-600 truncate">Sewa Kamar</span><span className="font-semibold text-sm sm:text-base shrink-0">{formatCurrency(Math.max(0, totalRevenue - totalLaundry))}</span></div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg gap-2"><span className="text-sm text-gray-600">Laundry</span><span className="font-semibold text-sm sm:text-base shrink-0">{formatCurrency(totalLaundry)}</span></div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg gap-2"><span className="text-sm text-blue-700 font-medium">Total Pendapatan</span><span className="font-bold text-blue-700 text-sm sm:text-base shrink-0">{formatCurrency(totalRevenue)}</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="occupancy" className="mt-4">
              <Card className="w-full overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Tingkat Okupansi 6 Bulan Terakhir</h3>
                  <div className="w-full h- sm:h-">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={occupancyData.length > 0? occupancyData : [{ month: 'Tidak ada data', rate: 0, occupied: 0 }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} width={35} />
                        <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="rate" name="Tingkat Okupansi" stroke="#1A3D5C" strokeWidth={3} dot={{ fill: '#1A3D5C', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, fill: '#D4A84B' }} />
                        <Line type="monotone" dataKey="occupied" name="Kamar Terisi" stroke="#4A6D8C" strokeWidth={2} dot={{ fill: '#4A6D8C', strokeWidth: 2, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expenses" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="w-full overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold mb-4">Pengeluaran per Kategori</h3>
                    <div className="w-full h-">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie data={expenseByCategory.length > 0? expenseByCategory : [{ category: 'Tidak ada data', amount: 1 }]} cx="50%" cy="45%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="amount">
                            {expenseByCategory.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ fontSize: '12px' }} />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="w-full overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold mb-4">Detail Pengeluaran</h3>
                    <div className="space-y-2 sm:space-y-3 max-h- overflow-y-auto pr-1">
                      {expenseByCategory.length > 0? (
                        expenseByCategory.map((cat, idx) => (
                          <div key={cat.category || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1"><div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} /><span className="text-sm text-gray-700 truncate">{getExpenseTypeLabel(cat.category) || cat.category || 'Lainnya'}</span></div>
                            <div className="text-right shrink-0"><span className="font-semibold block text-sm">{formatCurrency(safeParseFloat(cat.amount))}</span><span className="text-xs text-gray-500">{cat.percentage? `${cat.percentage.toFixed(1)}%` : ''}</span></div>
                          </div>
                        ))
                      ) : (<div className="text-center text-gray-500 py-4 text-sm">Tidak ada data pengeluaran</div>)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pl" className="mt-4">
              <Card className="w-full overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div className="min-w-0"><h3 className="text-lg sm:text-xl font-bold text-gray-900">Laporan Laba Rugi</h3><p className="text-xs sm:text-sm text-gray-500">Periode: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p></div>
                    <Button variant="outline" className="h-11 sm:h-10 w-full sm:w-auto"><Download className="w-4 h-4 mr-2" />Download PDF</Button>
                  </div>

                  <div className="space-y-6">
                    <div><h4 className="font-semibold text-gray-900 mb-3 border-b pb-2 text-sm sm:text-base">PENDAPATAN</h4><div className="space-y-2 text-sm"><div className="flex justify-between gap-2"><span className="text-gray-600">Sewa Kamar</span><span className="font-medium shrink-0">{formatCurrency(Math.max(0, totalRevenue - totalLaundry))}</span></div><div className="flex justify-between gap-2"><span className="text-gray-600">Laundry</span><span className="font-medium shrink-0">{formatCurrency(totalLaundry)}</span></div><div className="flex justify-between font-semibold text-base pt-2 border-t gap-2"><span>Total Pendapatan</span><span className="text-green-600 shrink-0">{formatCurrency(totalRevenue)}</span></div></div></div>

                    <div><h4 className="font-semibold text-gray-900 mb-3 border-b pb-2 text-sm sm:text-base">PENGELUARAN</h4><div className="space-y-2 text-sm">{expenseByCategory.length > 0? (expenseByCategory.map((cat) => (<div key={cat.category || cat.id} className="flex justify-between gap-2"><span className="text-gray-600 truncate flex-1">{getExpenseTypeLabel(cat.category) || cat.category || 'Lainnya'}</span><span className="shrink-0">{formatCurrency(safeParseFloat(cat.amount))}</span></div>))) : (<div className="text-gray-500">Tidak ada data pengeluaran</div>)}<div className="flex justify-between font-semibold text-base pt-2 border-t gap-2"><span>Total Pengeluaran</span><span className="text-red-600 shrink-0">{formatCurrency(totalExpenses)}</span></div></div></div>

                    <div className="bg-gray-50 p-4 rounded-lg"><div className="flex justify-between items-center gap-2"><span className="text-base sm:text-lg font-bold text-gray-900">LABA BERSIH</span><span className={cn("text-xl sm:text-2xl font-bold truncate", netProfit >= 0? "text-green-600" : "text-red-600")}>{formatCurrency(netProfit)}</span></div><div className="flex justify-between items-center mt-2 text-sm"><span className="text-gray-500">Margin Laba</span><span className={cn("font-medium", profitMargin >= 0? "text-green-600" : "text-red-600")}>{formatPercentage(profitMargin)}</span></div></div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t">
                      <div className="text-center min-w-0"><p className="text-xs text-gray-500">Okupansi</p><p className="text-sm sm:text-xl font-bold text-[#1A3D5C] truncate">{occupancyData.length > 0? `${(occupancyData[occupancyData.length - 1]?.rate || 0).toFixed(1)}%` : '0.0%'}</p></div>
                      <div className="text-center min-w-0"><p className="text-xs text-gray-500">Rata-rata/Kamar</p><p className="text-sm sm:text-xl font-bold text-[#1A3D5C] truncate">{formatCurrency(2200000)}</p></div>
                      <div className="text-center min-w-0"><p className="text-xs text-gray-500">Rasio Biaya</p><p className="text-sm sm:text-xl font-bold text-[#1A3D5C] truncate">{formatPercentage(totalRevenue > 0? (totalExpenses/totalRevenue)*100 : 0)}</p></div>
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