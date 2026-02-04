import { useState } from 'react';
import { Plus, Search, CreditCard, CheckCircle, AlertCircle, Clock, QrCode, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { properties, rooms, tenants, payments } from '@/data/mockData';
import type { Payment } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, getPaymentStatusColor, getPaymentStatusLabel } from '@/lib/format';

export function Payments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [activeTab, setActiveTab] = useState('all');

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pembayaran</h1>
          <p className="text-gray-500">Kelola pembayaran sewa dan tagihan</p>
        </div>
        <Button className="bg-[#1A3D5C] hover:bg-[#0F2744]">
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
        </TabsContent>
      </Tabs>

      {/* Payment Detail Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
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

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                  Tutup
                </Button>
                {selectedPayment.paymentStatus === 'pending' && (
                  <Button className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Tandai Lunas
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
