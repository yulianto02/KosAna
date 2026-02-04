import { useState } from 'react';
import { Plus, Search, Shirt, CheckCircle, Clock, Scale, Download } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { properties, rooms, tenants, laundryOrders } from '@/data/mockData';
import type { LaundryOrder } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/format';

export function Laundry() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<LaundryOrder | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Filter orders
  const filteredOrders = laundryOrders.filter(order => {
    const tenant = tenants.find(t => t.id === order.tenantId);
    const matchesSearch = tenant?.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && order.status === 'pending';
    if (activeTab === 'in_progress') return matchesSearch && order.status === 'in_progress';
    if (activeTab === 'completed') return matchesSearch && order.status === 'completed';
    return matchesSearch;
  });

  // Calculate totals
  const totalRevenue = laundryOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalPrice, 0);
  const pendingOrders = laundryOrders.filter(o => o.status === 'pending' || o.status === 'in_progress').length;
  const completedToday = laundryOrders.filter(o => 
    o.status === 'completed' && 
    o.completionDate && 
    new Date(o.completionDate).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Laundry</h1>
          <p className="text-gray-500">Kelola pesanan laundry penghuni</p>
        </div>
        <Button className="bg-[#1A3D5C] hover:bg-[#0F2744]">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pesanan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Shirt className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Total Pendapatan</p>
                <p className="text-xl font-bold text-purple-800">{formatCurrency(totalRevenue)}</p>
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
                <p className="text-sm text-yellow-700">Pesanan Aktif</p>
                <p className="text-xl font-bold text-yellow-800">{pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">Selesai Hari Ini</p>
                <p className="text-xl font-bold text-green-800">{completedToday}</p>
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
            placeholder="Cari pesanan laundry..."
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
          <TabsTrigger value="pending">Menunggu</TabsTrigger>
          <TabsTrigger value="in_progress">Diproses</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Penghuni</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kamar</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tanggal</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Berat/Item</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Layanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders.map((order) => {
                    const tenant = tenants.find(t => t.id === order.tenantId);
                    const room = rooms.find(r => r.id === order.roomId);
                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{tenant?.fullName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{room?.roomNumber}</p>
                          <p className="text-xs text-gray-500">
                            {properties.find(p => p.id === order.propertyId)?.name}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p>{formatDate(order.orderDate)}</p>
                          {order.completionDate && (
                            <p className="text-xs text-green-600">
                              Selesai: {formatDate(order.completionDate)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {order.weightKg ? (
                            <div className="flex items-center gap-1">
                              <Scale className="w-4 h-4 text-gray-400" />
                              <span>{order.weightKg} kg</span>
                            </div>
                          ) : order.itemCount ? (
                            <span>{order.itemCount} item</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(order.totalPrice)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn(
                            order.status === 'completed' && "bg-green-100 text-green-700",
                            order.status === 'pending' && "bg-yellow-100 text-yellow-700",
                            order.status === 'in_progress' && "bg-blue-100 text-blue-700",
                            order.status === 'cancelled' && "bg-red-100 text-red-700",
                          )}>
                            {order.status === 'completed' ? 'Selesai' : 
                             order.status === 'pending' ? 'Menunggu' : 
                             order.status === 'in_progress' ? 'Diproses' : 'Dibatalkan'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm capitalize">
                            {order.serviceType === 'wash_only' ? 'Cuci Saja' :
                             order.serviceType === 'wash_and_dry' ? 'Cuci & Kering' : 'Cuci Kering Lipat'}
                          </span>
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

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Detail Pesanan Laundry</DialogTitle>
                <DialogDescription>
                  Informasi lengkap pesanan laundry
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {(() => {
                  const tenant = tenants.find(t => t.id === selectedOrder.tenantId);
                  const room = rooms.find(r => r.id === selectedOrder.roomId);
                  return (
                    <>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-500">Total Harga</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(selectedOrder.totalPrice)}
                          </p>
                        </div>
                        <Badge className={cn(
                          selectedOrder.status === 'completed' && "bg-green-100 text-green-700",
                          selectedOrder.status === 'pending' && "bg-yellow-100 text-yellow-700",
                          selectedOrder.status === 'in_progress' && "bg-blue-100 text-blue-700",
                        )}>
                          {selectedOrder.status === 'completed' ? 'Selesai' : 
                           selectedOrder.status === 'pending' ? 'Menunggu' : 'Diproses'}
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
                          <span className="text-gray-500">Tanggal Pesan</span>
                          <span>{formatDate(selectedOrder.orderDate)}</span>
                        </div>
                        {selectedOrder.completionDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tanggal Selesai</span>
                            <span>{formatDate(selectedOrder.completionDate)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500">Layanan</span>
                          <span className="capitalize">
                            {selectedOrder.serviceType === 'wash_only' ? 'Cuci Saja' :
                             selectedOrder.serviceType === 'wash_and_dry' ? 'Cuci & Kering' : 'Cuci Kering Lipat'}
                          </span>
                        </div>
                        {selectedOrder.weightKg && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Berat</span>
                            <span>{selectedOrder.weightKg} kg</span>
                          </div>
                        )}
                        {selectedOrder.itemCount && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Jumlah Item</span>
                            <span>{selectedOrder.itemCount} item</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500">Harga per kg</span>
                          <span>{formatCurrency(selectedOrder.pricePerKg)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total</span>
                          <span>{formatCurrency(selectedOrder.totalPrice)}</span>
                        </div>
                      </div>

                      {selectedOrder.notes && (
                        <div>
                          <Label className="text-gray-500">Catatan</Label>
                          <p className="mt-1 text-sm">{selectedOrder.notes}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Tutup
                </Button>
                {selectedOrder.status !== 'completed' && (
                  <Button className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Tandai Selesai
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
