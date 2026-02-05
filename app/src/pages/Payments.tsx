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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    tenantId: '',
    propertyId: '',
    roomId: '',
    paymentPeriod: '',
    baseAmount: 0,
    additionalPersonFee: 0,
    laundryAmount: 0,
    lateFee: 0,
    totalAmount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    paymentStatus: 'pending' as 'pending' | 'paid' | 'overdue',
    paymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'qris',
    notes: '',
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [paymentsRes, tenantsRes, roomsRes, propertiesRes] = await Promise.all([
        paymentsAPI.getAll(),
        tenantsAPI.getAll(),
        roomsAPI.getAll(),
        propertiesAPI.getAll(),
      ]);
      setPayments(paymentsRes);
      setTenants(tenantsRes);
      setRooms(roomsRes);
      setProperties(propertiesRes);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const tenant = tenants.find(t => t.id === payment.tenantId);
    const matchesSearch = 
      tenant?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.paymentPeriod.includes(searchQuery);
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'paid') return matchesSearch && payment.paymentStatus === 'paid';
    if (activeTab === 'pending') return matchesSearch && payment.paymentStatus === 'pending';
    if (activeTab === 'overdue') return matchesSearch && payment.paymentStatus === 'overdue';
    return matchesSearch;
  });

  // Calculate totals
  const totalPaid = payments.filter(p => p.paymentStatus === 'paid').reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPending = payments.filter(p => p.paymentStatus === 'pending').reduce((sum, p) => sum + p.totalAmount, 0);
  const totalOverdue = payments.filter(p => p.paymentStatus === 'overdue').reduce((sum, p) => sum + p.totalAmount, 0);

  // Reset form
  const resetForm = () => {
    setFormData({
      tenantId: '',
      propertyId: '',
      roomId: '',
      paymentPeriod: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      baseAmount: 0,
      additionalPersonFee: 0,
      laundryAmount: 0,
      lateFee: 0,
      totalAmount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      notes: '',
    });
  };

  // Handle tenant selection
  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setFormData({
        ...formData,
        tenantId,
        propertyId: tenant.propertyId,
        roomId: tenant.roomId,
        baseAmount: tenant.baseMonthlyRent,
        additionalPersonFee: tenant.isSharedRoom ? tenant.additionalPersonFee : 0,
        totalAmount: tenant.totalMonthlyRent,
      });
    }
  };

  // Handle add payment
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentsAPI.create(formData);
      toast.success('Tagihan berhasil dibuat');
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Gagal membuat tagihan');
    }
  };

  // Handle mark as paid
  const handleMarkPaid = async () => {
    if (!selectedPayment) return;
    try {
      await paymentsAPI.markPaid(selectedPayment.id);
      toast.success('Pembayaran berhasil ditandai lunas');
      setSelectedPayment(null);
      fetchData();
    } catch (error) {
      toast.error('Gagal menandai pembayaran');
    }
  };

  // Handle delete payment
  const handleDelete = async () => {
    if (!selectedPayment) return;
    try {
      await paymentsAPI.delete(selectedPayment.id);
      toast.success('Tagihan berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setSelectedPayment(null);
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus tagihan');
    }
  };

  // Open delete dialog
  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
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
        >
          <Plus className="w-4 h-4 mr-2" />
          Buat Tagihan
        </Button>
      </div>

      {/* Stats Cards */}
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari pembayaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
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
          {/* Loading State */}
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
                      const tenant = tenants.find(t => t.id === payment.tenantId);
                      const room = rooms.find(r => r.id === payment.roomId);
                      return (
                        <tr 
                          key={payment.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{tenant?.fullName}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{room?.roomNumber}</p>
                            <p className="text-xs text-gray-500">
                              {properties.find(p => p.id === payment.propertyId)?.name}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            {payment.paymentPeriod}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="font-medium">{formatCurrency(payment.totalAmount)}</p>
                            {payment.lateFee > 0 && (
                              <p className="text-xs text-red-500">
                                +Denda: {formatCurrency(payment.lateFee)}
                              </p>
                            )}
                            {payment.laundryAmount > 0 && (
                              <p className="text-xs text-blue-500">
                                +Laundry: {formatCurrency(payment.laundryAmount)}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn("text-white", getPaymentStatusColor(payment.paymentStatus))}>
                              {getPaymentStatusLabel(payment.paymentStatus)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {formatDate(payment.dueDate)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {payment.paymentMethod === 'qris' && <QrCode className="w-4 h-4" />}
                              {payment.paymentMethod === 'bank_transfer' && <CreditCard className="w-4 h-4" />}
                              <span className="capitalize">
                                {payment.paymentMethod === 'qris' ? 'QRIS' : 
                                 payment.paymentMethod === 'bank_transfer' ? 'Transfer' : 'Tunai'}
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

          {/* Empty State */}
          {!isLoading && filteredPayments.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Tidak ada pembayaran ditemukan</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Tagihan
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Payment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Tagihan Baru</DialogTitle>
            <DialogDescription>
              Buat tagihan pembayaran untuk penghuni
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant">Penghuni *</Label>
              <select
                id="tenant"
                value={formData.tenantId}
                onChange={(e) => handleTenantChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                required
              >
                <option value="">Pilih Penghuni</option>
                {tenants.filter(t => t.status === 'active').map(t => (
                  <option key={t.id} value={t.id}>{t.fullName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentPeriod">Periode Pembayaran *</Label>
              <Input
                id="paymentPeriod"
                value={formData.paymentPeriod}
                onChange={(e) => setFormData({ ...formData, paymentPeriod: e.target.value })}
                placeholder="Contoh: Januari 2026"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseAmount">Sewa Dasar (Rp)</Label>
                <Input
                  id="baseAmount"
                  type="number"
                  value={formData.baseAmount}
                  onChange={(e) => {
                    const baseAmount = parseInt(e.target.value) || 0;
                    setFormData({ 
                      ...formData, 
                      baseAmount,
                      totalAmount: baseAmount + formData.additionalPersonFee + formData.laundryAmount + formData.lateFee
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additionalPersonFee">Tambahan Orang (Rp)</Label>
                <Input
                  id="additionalPersonFee"
                  type="number"
                  value={formData.additionalPersonFee}
                  onChange={(e) => {
                    const additionalPersonFee = parseInt(e.target.value) || 0;
                    setFormData({ 
                      ...formData, 
                      additionalPersonFee,
                      totalAmount: formData.baseAmount + additionalPersonFee + formData.laundryAmount + formData.lateFee
                    });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="laundryAmount">Laundry (Rp)</Label>
                <Input
                  id="laundryAmount"
                  type="number"
                  value={formData.laundryAmount}
                  onChange={(e) => {
                    const laundryAmount = parseInt(e.target.value) || 0;
                    setFormData({ 
                      ...formData, 
                      laundryAmount,
                      totalAmount: formData.baseAmount + formData.additionalPersonFee + laundryAmount + formData.lateFee
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lateFee">Denda (Rp)</Label>
                <Input
                  id="lateFee"
                  type="number"
                  value={formData.lateFee}
                  onChange={(e) => {
                    const lateFee = parseInt(e.target.value) || 0;
                    setFormData({ 
                      ...formData, 
                      lateFee,
                      totalAmount: formData.baseAmount + formData.additionalPersonFee + formData.laundryAmount + lateFee
                    });
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Tagihan (Rp)</Label>
              <Input
                id="totalAmount"
                type="number"
                value={formData.totalAmount}
                readOnly
                className="bg-gray-50 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Jatuh Tempo *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
              <select
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'cash' | 'bank_transfer' | 'qris' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
              >
                <option value="cash">Tunai</option>
                <option value="bank_transfer">Transfer Bank</option>
                <option value="qris">QRIS</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

      {/* Payment Detail Dialog */}
      <Dialog open={!!selectedPayment && !isDeleteDialogOpen} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-lg">
          {selectedPayment && (
            <>
              <DialogHeader>
                <DialogTitle>Detail Pembayaran</DialogTitle>
                <DialogDescription>
                  Informasi lengkap pembayaran
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {(() => {
                  const tenant = tenants.find(t => t.id === selectedPayment.tenantId);
                  const room = rooms.find(r => r.id === selectedPayment.roomId);
                  return (
                    <>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-500">Total Tagihan</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(selectedPayment.totalAmount)}
                          </p>
                        </div>
                        <Badge className={cn("text-white text-sm px-3 py-1", getPaymentStatusColor(selectedPayment.paymentStatus))}>
                          {getPaymentStatusLabel(selectedPayment.paymentStatus)}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Penghuni</span>
                          <span className="font-medium">{tenant?.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Kamar</span>
                          <span className="font-medium">{room?.roomNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Periode</span>
                          <span className="font-medium">{selectedPayment.paymentPeriod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Sewa Kamar</span>
                          <span>{formatCurrency(selectedPayment.baseAmount)}</span>
                        </div>
                        {selectedPayment.additionalPersonFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tambahan Orang</span>
                            <span>{formatCurrency(selectedPayment.additionalPersonFee)}</span>
                          </div>
                        )}
                        {selectedPayment.laundryAmount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Laundry</span>
                            <span>{formatCurrency(selectedPayment.laundryAmount)}</span>
                          </div>
                        )}
                        {selectedPayment.lateFee > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Denda Keterlambatan</span>
                            <span>{formatCurrency(selectedPayment.lateFee)}</span>
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total</span>
                          <span>{formatCurrency(selectedPayment.totalAmount)}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Jatuh Tempo</span>
                          <span>{formatDate(selectedPayment.dueDate)}</span>
                        </div>
                        {selectedPayment.paymentDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tanggal Bayar</span>
                            <span>{formatDate(selectedPayment.paymentDate)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500">Metode Pembayaran</span>
                          <span className="capitalize">
                            {selectedPayment.paymentMethod === 'qris' ? 'QRIS' : 
                             selectedPayment.paymentMethod === 'bank_transfer' ? 'Transfer Bank' : 'Tunai'}
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
                {selectedPayment.paymentStatus === 'pending' && (
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus tagihan untuk periode <strong>{selectedPayment?.paymentPeriod}</strong>? 
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
