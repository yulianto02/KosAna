import { useState, useEffect } from 'react';
import { Plus, Search, CreditCard, CheckCircle, AlertCircle, Clock, QrCode, Download, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { paymentsAPI, tenantsAPI, roomsAPI, propertiesAPI } from '@/services/api';
import type { Payment, Tenant, Room, Property } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, getPaymentStatusColor, getPaymentStatusLabel } from '@/lib/format';

export function Payments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(''); // '' = all properties
  const [selectedPeriod, setSelectedPeriod] = useState<string>(''); // '' = all periods (YYYY-MM format)
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to format stored "YYYY-MM" → "Februari 2026"
  const formatPaymentPeriod = (period: string | undefined): string => {
    if (!period) return '-';
    const match = period.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]);
      const date = new Date(year, month - 1, 1);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      }
    }
    return period; // fallback for any unexpected format
  };

  // Form state (snake_case to match DB)
  const [formData, setFormData] = useState({
    tenant_id: '',
    property_id: '',
    room_id: '',
    payment_period: '',
    base_amount: 0,
    additional_person_fee: 0,
    laundry_amount: 0,
    late_fee: 0,
    total_amount: 0,
    due_date: new Date().toISOString().split('T')[0],
    payment_status: 'pending' as 'pending' | 'paid' | 'overdue',
    payment_method: 'qris' as 'cash' | 'bank_transfer' | 'qris',
    notes: '',
  });

  // Set default payment_period to current month in YYYY-MM format
  const resetForm = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setFormData({
      tenant_id: '',
      property_id: '',
      room_id: '',
      payment_period: `${year}-${month}`,
      base_amount: 0,
      additional_person_fee: 0,
      laundry_amount: 0,
      late_fee: 0,
      total_amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      payment_status: 'pending',
      payment_method: 'qris',
      notes: '',
    });
  };

  // Filter tenants based on selected property (for add dialog)
  const filteredTenants = tenants.filter(t => 
    t && t.status === 'active' && 
    (formData.property_id ? t.property_id === formData.property_id : true)
  );

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [paymentsRes, tenantsRes, roomsRes, propertiesRes] = await Promise.all([
        paymentsAPI.getAll(),
        tenantsAPI.getAll(),
        roomsAPI.getAll(),
        propertiesAPI.getAll(),
      ]);
      
      if (!Array.isArray(paymentsRes) || !Array.isArray(tenantsRes) || 
          !Array.isArray(roomsRes) || !Array.isArray(propertiesRes)) {
        throw new Error('Invalid data format');
      }
      
      setPayments(paymentsRes);
      setTenants(tenantsRes);
      setRooms(roomsRes);
      setProperties(propertiesRes);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Gagal memuat data');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered payments with property, period, search, and tab filters
  const filteredPayments = payments.filter(payment => {
    if (!payment || !payment.tenant_id) return false;
    
    // Property filter
    if (selectedPropertyId && payment.property_id !== selectedPropertyId) {
      return false;
    }
    
    // Period filter (exact YYYY-MM match)
    if (selectedPeriod && payment.payment_period !== selectedPeriod) {
      return false;
    }
    
    // Search filter (tenant name, displayed period, stored period)
    const tenant = tenants.find(t => t && t.id === payment.tenant_id);
    const searchLower = searchQuery.toLowerCase();
    const tenantName = tenant?.full_name?.toLowerCase() || '';
    const periodDisplay = formatPaymentPeriod(payment.payment_period);
    const periodLower = periodDisplay.toLowerCase();
    const periodStoredLower = (payment.payment_period || '').toLowerCase();
    
    const matchesSearch = 
      tenantName.includes(searchLower) ||
      periodLower.includes(searchLower) ||
      periodStoredLower.includes(searchLower);
    
    if (!matchesSearch) return false;
    
    // Tab filter
    if (activeTab === 'all') return true;
    if (activeTab === 'paid') return payment.payment_status === 'paid';
    if (activeTab === 'pending') return payment.payment_status === 'pending';
    if (activeTab === 'overdue') return payment.payment_status === 'overdue';
    return false;
  });

  // Totals based on CURRENT FILTERS (more accurate for user context)
  const totalPaid = filteredPayments
    .filter(p => p.payment_status === 'paid')
    .reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
  const totalPending = filteredPayments
    .filter(p => p.payment_status === 'pending')
    .reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
  const totalOverdue = filteredPayments
    .filter(p => p.payment_status === 'overdue')
    .reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);

  // Handle property change IN ADD DIALOG FORM (not filter)
  const handlePropertyChange = (propertyId: string) => {
    setFormData(prev => ({
      ...prev,
      property_id: propertyId,
      tenant_id: '',
      room_id: '',
      base_amount: 0,
      additional_person_fee: 0,
      total_amount: 0,
    }));
  };

  // Handle tenant change IN ADD DIALOG FORM
  const handleTenantChange = (tenantId: string) => {
    if (!tenantId) {
      setFormData(prev => ({
        ...prev,
        tenant_id: '',
        room_id: '',
        base_amount: 0,
        additional_person_fee: 0,
        total_amount: 0,
      }));
      return;
    }
    
    const tenant = tenants.find(t => t && t.id === tenantId);
    if (tenant) {
      setFormData(prev => ({
        ...prev,
        tenant_id: tenantId,
        property_id: tenant.property_id || prev.property_id,
        room_id: tenant.room_id || '',
        base_amount: Number(tenant.base_monthly_rent) || 0,
        additional_person_fee: tenant.is_shared_room ? (Number(tenant.additional_person_fee) || 0) : 0,
        total_amount: Number(tenant.total_monthly_rent) || 0,
      }));
    }
  };

  // Handle add payment
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tenant_id) {
      toast.error('Pilih penghuni terlebih dahulu');
      return;
    }
    if (!formData.property_id) {
      toast.error('Pilih properti terlebih dahulu');
      return;
    }
    if (!formData.room_id) {
      toast.error('Kamar tidak ditemukan untuk penghuni ini');
      return;
    }
    if (!formData.payment_period) {
      toast.error('Periode pembayaran wajib diisi');
      return;
    }
    if (!formData.due_date) {
      toast.error('Tanggal jatuh tempo wajib diisi');
      return;
    }
    
    try {
      await paymentsAPI.create(formData);
      toast.success('Tagihan berhasil dibuat');
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Gagal membuat tagihan');
    }
  };

  // Mark as paid
  const handleMarkPaid = async () => {
    if (!selectedPayment?.id) return;
    try {
      await paymentsAPI.markPaid(selectedPayment.id);
      toast.success('Pembayaran berhasil ditandai lunas');
      setSelectedPayment(null);
      fetchData();
    } catch (error) {
      console.error('Error marking paid:', error);
      toast.error('Gagal menandai pembayaran');
    }
  };

  // Delete payment
  const handleDelete = async () => {
    if (!selectedPayment?.id) return;
    try {
      await paymentsAPI.delete(selectedPayment.id);
      toast.success('Tagihan berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setSelectedPayment(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Gagal menghapus tagihan');
    }
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  // Error state
  if (error && !isLoading && payments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pembayaran</h1>
            <p className="text-gray-500">Kelola pembayaran sewa dan tagihan</p>
          </div>
        </div>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchData} className="bg-[#1A3D5C] hover:bg-[#0F2744]">
                Coba Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pembayaran</h1>
          <p className="text-gray-500">Kelola pembayaran sewa dan tagihan</p>
        </div>
        <Button 
          className="bg-[#1A3D5C] hover:bg-[#0F2744]"
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
          disabled={isLoading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Buat Tagihan
        </Button>
      </div>

      {/* Stats - NOW FILTER-AWARE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">Total Lunas</p>
                <p className="text-xl font-bold text-green-800">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-yellow-700">Total Tertunda</p>
                <p className="text-xl font-bold text-yellow-800">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-red-700">Total Terlambat</p>
                <p className="text-xl font-bold text-red-800">{formatCurrency(totalOverdue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTERS BAR - NEW SECTION */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari nama penghuni atau periode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>

        {/* Property Filter */}
        <div className="min-w-[220px]">
          <Label htmlFor="property-filter" className="text-sm mb-1 block">Properti</Label>
          <select
            id="property-filter"
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
            disabled={isLoading}
          >
            <option value="">Semua Properti</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Period Filter */}
        <div className="min-w-[180px]">
          <Label htmlFor="period-filter" className="text-sm mb-1 block">Bulan & Tahun</Label>
          <Input
            id="period-filter"
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        {/* Export Button */}
        <Button variant="outline" disabled={isLoading} className="h-[38px]">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="paid">Lunas</TabsTrigger>
          <TabsTrigger value="pending">Tertunda</TabsTrigger>
          <TabsTrigger value="overdue">Terlambat</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Memuat data...</p>
            </div>
          )}

          {!isLoading && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Penghuni</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kamar</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Periode</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Jumlah</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Jatuh Tempo</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Metode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPayments.map((payment) => {
                      if (!payment) return null;
                      
                      const tenant = tenants.find(t => t && t.id === payment.tenant_id);
                      const room = rooms.find(r => r && r.id === payment.room_id);
                      const property = properties.find(p => p && p.id === payment.property_id);
                      
                      return (
                        <tr 
                          key={payment.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">
                              {tenant?.full_name || 'Unknown'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{room?.room_number || '-'}</p>
                            <p className="text-xs text-gray-500">
                              {property?.name || '-'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            {formatPaymentPeriod(payment.payment_period)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="font-medium">{formatCurrency(Number(payment.total_amount) || 0)}</p>
                            {Number(payment.late_fee) > 0 && (
                              <p className="text-xs text-red-500">
                                +Denda: {formatCurrency(Number(payment.late_fee))}
                              </p>
                            )}
                            {Number(payment.laundry_amount) > 0 && (
                              <p className="text-xs text-blue-500">
                                +Laundry: {formatCurrency(Number(payment.laundry_amount))}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn("text-white", getPaymentStatusColor(payment.payment_status))}>
                              {getPaymentStatusLabel(payment.payment_status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {formatDate(payment.due_date)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {payment.payment_method === 'qris' && <QrCode className="w-4 h-4" />}
                              {payment.payment_method === 'bank_transfer' && <CreditCard className="w-4 h-4" />}
                              <span className="capitalize">
                                {payment.payment_method === 'qris' ? 'QRIS' : 
                                 payment.payment_method === 'bank_transfer' ? 'Transfer' : 'Tunai'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {!isLoading && filteredPayments.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Tidak ada pembayaran ditemukan sesuai filter</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Tagihan
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Dialog - PRESERVED FROM ORIGINAL */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Tagihan Baru</DialogTitle>
            <DialogDescription>
              Buat tagihan pembayaran untuk penghuni
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            {/* Property */}
            <div className="space-y-2">
              <Label htmlFor="property">Properti *</Label>
              <select
                id="property"
                value={formData.property_id}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                required
              >
                <option value="">Pilih Properti</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Tenant */}
            <div className="space-y-2">
              <Label htmlFor="tenant">Penghuni *</Label>
              <select
                id="tenant"
                value={formData.tenant_id}
                onChange={(e) => handleTenantChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                required
                disabled={!formData.property_id}
              >
                <option value="">
                  {formData.property_id ? 'Pilih Penghuni' : 'Pilih Properti Dulu'}
                </option>
                {filteredTenants.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || 'Unknown'} - Kamar {t.room_id ? (rooms.find(r => r.id === t.room_id)?.room_number || '-') : '-'}
                  </option>
                ))}
              </select>
              {formData.property_id && filteredTenants.length === 0 && (
                <p className="text-xs text-orange-600">Tidak ada penghuni aktif di properti ini</p>
              )}
            </div>

            {/* Period - month picker */}
            <div className="space-y-2">
              <Label htmlFor="payment_period">Periode Pembayaran *</Label>
              <Input
                id="payment_period"
                type="month"
                value={formData.payment_period}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_period: e.target.value }))}
                required
              />
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_amount">Sewa Dasar (Rp)</Label>
                <Input
                  id="base_amount"
                  type="number"
                  value={formData.base_amount}
                  onChange={(e) => {
                    const base_amount = parseInt(e.target.value) || 0;
                    setFormData(prev => ({ 
                      ...prev, 
                      base_amount,
                      total_amount: base_amount + prev.additional_person_fee + prev.laundry_amount + prev.late_fee
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additional_person_fee">Tambahan Orang (Rp)</Label>
                <Input
                  id="additional_person_fee"
                  type="number"
                  value={formData.additional_person_fee}
                  onChange={(e) => {
                    const additional_person_fee = parseInt(e.target.value) || 0;
                    setFormData(prev => ({ 
                      ...prev, 
                      additional_person_fee,
                      total_amount: prev.base_amount + additional_person_fee + prev.laundry_amount + prev.late_fee
                    }));
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="laundry_amount">Laundry (Rp)</Label>
                <Input
                  id="laundry_amount"
                  type="number"
                  value={formData.laundry_amount}
                  onChange={(e) => {
                    const laundry_amount = parseInt(e.target.value) || 0;
                    setFormData(prev => ({ 
                      ...prev, 
                      laundry_amount,
                      total_amount: prev.base_amount + prev.additional_person_fee + laundry_amount + prev.late_fee
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="late_fee">Denda (Rp)</Label>
                <Input
                  id="late_fee"
                  type="number"
                  value={formData.late_fee}
                  onChange={(e) => {
                    const late_fee = parseInt(e.target.value) || 0;
                    setFormData(prev => ({ 
                      ...prev, 
                      late_fee,
                      total_amount: prev.base_amount + prev.additional_person_fee + prev.laundry_amount + late_fee
                    }));
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Tagihan (Rp)</Label>
              <Input
                id="total_amount"
                type="number"
                value={formData.total_amount}
                readOnly
                className="bg-gray-50 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Jatuh Tempo *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Metode Pembayaran</Label>
              <select
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as 'cash' | 'bank_transfer' | 'qris' }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
              >
                <option value="qris">QRIS</option>
                <option value="bank_transfer">Transfer Bank</option>
                <option value="cash">Tunai</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#1A3D5C] hover:bg-[#0F2744]">
                Buat Tagihan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog - PRESERVED FROM ORIGINAL */}
      <Dialog open={!!selectedPayment && !isDeleteDialogOpen} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-lg">
          {selectedPayment && (
            <>
              <DialogHeader>
                <DialogTitle>Detail Pembayaran</DialogTitle>
                <DialogDescription>Informasi lengkap pembayaran</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {(() => {
                  const tenant = tenants.find(t => t && t.id === selectedPayment.tenant_id);
                  const room = rooms.find(r => r && r.id === selectedPayment.room_id);
                  return (
                    <>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-500">Total Tagihan</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(Number(selectedPayment.total_amount) || 0)}
                          </p>
                        </div>
                        <Badge className={cn("text-white text-sm px-3 py-1", getPaymentStatusColor(selectedPayment.payment_status))}>
                          {getPaymentStatusLabel(selectedPayment.payment_status)}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Penghuni</span>
                          <span className="font-medium">{tenant?.full_name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Kamar</span>
                          <span className="font-medium">{room?.room_number || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Periode</span>
                          <span className="font-medium">{formatPaymentPeriod(selectedPayment.payment_period)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Sewa Kamar</span>
                          <span>{formatCurrency(Number(selectedPayment.base_amount) || 0)}</span>
                        </div>
                        {Number(selectedPayment.additional_person_fee) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tambahan Orang</span>
                            <span>{formatCurrency(Number(selectedPayment.additional_person_fee))}</span>
                          </div>
                        )}
                        {Number(selectedPayment.laundry_amount) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Laundry</span>
                            <span>{formatCurrency(Number(selectedPayment.laundry_amount))}</span>
                          </div>
                        )}
                        {Number(selectedPayment.late_fee) > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Denda Keterlambatan</span>
                            <span>{formatCurrency(Number(selectedPayment.late_fee))}</span>
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total</span>
                          <span>{formatCurrency(Number(selectedPayment.total_amount) || 0)}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Jatuh Tempo</span>
                          <span>{formatDate(selectedPayment.due_date)}</span>
                        </div>
                        {selectedPayment.payment_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tanggal Bayar</span>
                            <span>{formatDate(selectedPayment.payment_date)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500">Metode Pembayaran</span>
                          <span className="capitalize">
                            {selectedPayment.payment_method === 'qris' ? 'QRIS' : 
                             selectedPayment.payment_method === 'bank_transfer' ? 'Transfer Bank' : 'Tunai'}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                  Tutup
                </Button>
                <Button 
                  variant="outline"
                  className="text-red-600"
                  onClick={openDeleteDialog}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
                {selectedPayment.payment_status === 'pending' && (
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleMarkPaid}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Tandai Lunas
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation - PRESERVED FROM ORIGINAL */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus tagihan untuk periode <strong>{formatPaymentPeriod(selectedPayment?.payment_period)}</strong>? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}