import { useState, useEffect } from 'react';
import { Plus, Search, Shirt, CheckCircle, Clock, Scale, Download, Trash2 } from 'lucide-react';
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
import { laundryAPI, tenantsAPI, roomsAPI, propertiesAPI } from '@/services/api';
import type { LaundryOrder, Tenant, Room, Property } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/format';

export function Laundry() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<LaundryOrder | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [laundryOrders, setLaundryOrders] = useState<LaundryOrder[]>([]);
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
    serviceType: 'wash_and_dry' as 'wash_only' | 'wash_and_dry' | 'dry_cleaning',
    weightKg: 0,
    itemCount: 0,
    pricePerKg: 8000,
    totalPrice: 0,
    notes: '',
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, tenantsRes, roomsRes, propertiesRes] = await Promise.all([
        laundryAPI.getAll(),
        tenantsAPI.getAll(),
        roomsAPI.getAll(),
        propertiesAPI.getAll(),
      ]);
      setLaundryOrders(ordersRes);
      setTenants(tenantsRes);
      setRooms(roomsRes);
      setProperties(propertiesRes);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Handle tenant selection
  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setFormData({
        ...formData,
        tenantId,
        propertyId: tenant.propertyId,
        roomId: tenant.roomId,
      });
    }
  };

  // Handle add order
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalPrice = formData.weightKg > 0 
      ? formData.weightKg * formData.pricePerKg 
      : formData.itemCount * 5000;
    
    try {
      await laundryAPI.create({ ...formData, totalPrice });
      toast.success('Pesanan laundry berhasil ditambahkan');
      setIsAddDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Gagal menambahkan pesanan');
    }
  };

  // Handle complete order
  const handleComplete = async () => {
    if (!selectedOrder) return;
    try {
      await laundryAPI.complete(selectedOrder.id);
      toast.success('Pesanan laundry selesai');
      setSelectedOrder(null);
      fetchData();
    } catch (error) {
      toast.error('Gagal menyelesaikan pesanan');
    }
  };

  // Handle delete order
  const handleDelete = async () => {
    if (!selectedOrder) return;
    try {
      await laundryAPI.delete(selectedOrder.id);
      toast.success('Pesanan laundry berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setSelectedOrder(null);
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus pesanan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Laundry</h1>
          <p className="text-gray-500">Kelola pesanan laundry penghuni</p>
        </div>
        <Button 
          className="bg-[#1A3D5C] hover:bg-[#0F2744]"
          onClick={() => setIsAddDialogOpen(true)}
        >
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
          )}

          {/* Empty State */}
          {!isLoading && filteredOrders.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Tidak ada pesanan laundry</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pesanan
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Order Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Pesanan Laundry</DialogTitle>
            <DialogDescription>
              Buat pesanan laundry baru
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
              <Label htmlFor="serviceType">Layanan *</Label>
              <select
                id="serviceType"
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as 'wash_only' | 'wash_and_dry' | 'dry_cleaning' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                required
              >
                <option value="wash_only">Cuci Saja</option>
                <option value="wash_and_dry">Cuci & Kering</option>
                <option value="dry_cleaning">Cuci Kering Lipat</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weightKg">Berat (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  step="0.1"
                  value={formData.weightKg}
                  onChange={(e) => setFormData({ ...formData, weightKg: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemCount">Jumlah Item</Label>
                <Input
                  id="itemCount"
                  type="number"
                  value={formData.itemCount}
                  onChange={(e) => setFormData({ ...formData, itemCount: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerKg">Harga per kg (Rp)</Label>
              <Input
                id="pricePerKg"
                type="number"
                value={formData.pricePerKg}
                onChange={(e) => setFormData({ ...formData, pricePerKg: parseInt(e.target.value) })}
              />
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
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder && !isDeleteDialogOpen} onOpenChange={() => setSelectedOrder(null)}>
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
                        {selectedOrder.weightKg && selectedOrder.weightKg > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Berat</span>
                            <span>{selectedOrder.weightKg} kg</span>
                          </div>
                        )}
                        {selectedOrder.itemCount && selectedOrder.itemCount > 0 && (
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

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Tutup
                </Button>
                <Button 
                  variant="outline"
                  className="text-red-600"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
                {selectedOrder.status !== 'completed' && (
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleComplete}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Tandai Selesai
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
              Apakah Anda yakin ingin menghapus pesanan laundry ini? 
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
