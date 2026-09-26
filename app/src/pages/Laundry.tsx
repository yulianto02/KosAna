// app/src/pages/Laundry.tsx - Responsive Mobile Version
import { useState, useEffect } from 'react';
import { Plus, Search, Shirt, CheckCircle, Clock, Scale, Download, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getUserFromToken } from '@/services/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { laundryAPI, tenantsAPI, roomsAPI, propertiesAPI } from '@/services/api';
import type { LaundryOrder, Tenant, Room, Property } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/format';
import { useIsMobile } from '@/hooks/use-mobile';

export function Laundry() {
  const isMobile = useIsMobile();
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
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>((currentDate.getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(currentDate.getFullYear().toString());

  const [formData, setFormData] = useState({
    tenant_id: '', property_id: '', room_id: '',
    service_type: 'wash_and_iron' as 'wash_fold' | 'wash_and_iron' | 'iron_only' | 'other',
    weight_kg: 0, item_count: 0, price_per_kg: 8000, total_price: 0, notes: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, tenantsRes, roomsRes, propertiesRes] = await Promise.all([
        laundryAPI.getAll(), tenantsAPI.getAll(), roomsAPI.getAll(), propertiesAPI.getAll(),
      ]);
      setLaundryOrders(ordersRes); setTenants(tenantsRes); setRooms(roomsRes); setProperties(propertiesRes);
    } catch (error) { toast.error('Gagal memuat data'); }
    finally { setIsLoading(false); }
  };

  const filteredOrders = laundryOrders.filter(order => {
    const tenant = tenants.find(t => t.id === order.tenant_id);
    const matchesSearch = tenant?.full_name.toLowerCase().includes(searchQuery.toLowerCase())?? true;
    let matchesTab = true;
    if (activeTab === 'pending') matchesTab = order.status === 'pending';
    if (activeTab === 'in_progress') matchesTab = order.status === 'in_progress';
    if (activeTab === 'completed') matchesTab = order.status === 'completed';
    const matchesProperty = selectedProperty === 'all' || order.property_id === selectedProperty;
    if (!order.order_date) return false;
    const orderDate = new Date(order.order_date);
    const orderMonth = (orderDate.getMonth() + 1).toString().padStart(2, '0');
    const orderYear = orderDate.getFullYear().toString();
    const matchesDate = orderMonth === selectedMonth && orderYear === selectedYear;
    return matchesSearch && matchesTab && matchesProperty && matchesDate;
  });

  const totalRevenue = laundryOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
  const pendingOrders = laundryOrders.filter(o => o.status === 'pending' || o.status === 'in_progress').length;
  const completedToday = laundryOrders.filter(o => o.status === 'completed' && o.completion_date && new Date(o.completion_date).toDateString() === new Date().toDateString()).length;

  const getStatusLabel = (status: string) => {
    switch (status) { case 'pending': return 'Dalam Antrian'; case 'in_progress': return 'Diproses'; case 'completed': return 'Selesai'; default: return status; }
  };
  const getServiceTypeLabel = (serviceType: string) => {
    switch (serviceType) { case 'wash_fold': return 'Cuci & Lipat'; case 'wash_and_iron': return 'Cuci & Setrika'; case 'iron_only': return 'Setrika Saja'; case 'other': return 'Lain-lain'; default: return serviceType; }
  };

  const handleStartProcessing = async (id: string) => { try { await laundryAPI.update(id, { status: 'in_progress' }); toast.success('Pesanan mulai diproses'); fetchData(); } catch (error) { toast.error('Gagal memulai proses'); } };
  const handleComplete = async () => {
    if (!selectedOrder) return; const user_id = getCurrentUserId();
    if (!user_id) { toast.error('Sesi login tidak valid. Silakan login ulang.'); return; }
    try { await laundryAPI.complete(selectedOrder.id, user_id); toast.success('Pesanan laundry selesai'); setSelectedOrder(null); fetchData(); } catch (error) { toast.error('Gagal menyelesaikan pesanan'); }
  };
  const handleDelete = async () => { if (!selectedOrder) return; try { await laundryAPI.delete(selectedOrder.id); toast.success('Pesanan laundry berhasil dihapus'); setIsDeleteDialogOpen(false); setSelectedOrder(null); fetchData(); } catch (error) { toast.error('Gagal menghapus pesanan'); } };
  const handlePropertyChange = (property_id: string) => { setFormData({...formData, property_id, tenant_id: '', room_id: ''}); };
  const handleTenantChange = (tenant_id: string) => { const tenant = tenants.find(t => t.id === tenant_id); if (tenant) { setFormData({...formData, tenant_id, property_id: tenant.property_id, room_id: tenant.room_id}); } };

  useEffect(() => { const total_price = formData.weight_kg > 0? formData.weight_kg * formData.price_per_kg : 0; setFormData(prev => ({...prev, total_price})); }, [formData.weight_kg, formData.price_per_kg]);
  const getCurrentUserId = (): string | null => { const user = getUserFromToken(); return user?.id || null; };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const recorded_by = getCurrentUserId();
    if (!recorded_by) { toast.error('Sesi login tidak valid atau Anda belum login. Silakan login ulang.'); return; }
    if (formData.weight_kg <= 0) { toast.error('Berat harus lebih dari 0 kg'); return; }
    if (!formData.tenant_id) { toast.error('Silakan pilih penghuni'); return; }
    const total_price = formData.weight_kg * formData.price_per_kg; const order_date = new Date().toISOString().split('T')[0];
    try {
      await laundryAPI.create({...formData, total_price, order_date, recorded_by});
      toast.success('Pesanan laundry berhasil ditambahkan'); setIsAddDialogOpen(false);
      setFormData({ tenant_id: '', property_id: '', room_id: '', service_type: 'wash_and_iron', weight_kg: 0, item_count: 0, price_per_kg: 8000, total_price: 0, notes: '' }); fetchData();
    } catch (error) { console.error('Error creating laundry order:', error); toast.error('Gagal menambahkan pesanan'); }
  };

  const filteredTenants = formData.property_id? tenants.filter(t => t.property_id === formData.property_id && t.status === 'active') : tenants.filter(t => t.status === 'active');

  const FormContent = () => (
    <div className="space-y-4">
      <div className="space-y-2"><Label className="text-sm">Properti *</Label>
        <select value={formData.property_id} onChange={(e) => handlePropertyChange(e.target.value)} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" required>
          <option value="">Pilih Properti</option>{properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>
      </div>
      <div className="space-y-2"><Label className="text-sm">Penghuni *</Label>
        <select value={formData.tenant_id} onChange={(e) => handleTenantChange(e.target.value)} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" required disabled={!formData.property_id}>
          <option value="">{formData.property_id? 'Pilih Penghuni' : 'Pilih Properti Terlebih Dahulu'}</option>{filteredTenants.map(t => (<option key={t.id} value={t.id}>{t.full_name}</option>))}
        </select>
      </div>
      <div className="space-y-2"><Label className="text-sm">Layanan *</Label>
        <select value={formData.service_type} onChange={(e) => setFormData({...formData, service_type: e.target.value as any})} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" required>
          <option value="wash_fold">Cuci & Lipat</option><option value="wash_and_iron">Cuci & Setrika</option><option value="iron_only">Setrika Saja</option><option value="other">Lain-lain</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label className="text-sm">Berat (kg) *</Label><Input type="text" inputMode="decimal" value={formData.weight_kg || ''} onChange={(e) => setFormData({...formData, weight_kg: parseFloat(e.target.value) || 0})} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
        <div className="space-y-2"><Label className="text-sm">Item (Opsional)</Label><Input type="text" inputMode="numeric" value={formData.item_count || ''} onChange={(e) => setFormData({...formData, item_count: parseInt(e.target.value) || 0})} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
      </div>
      <div className="space-y-2"><Label className="text-sm">Harga per kg (Rp)</Label><Input type="text" inputMode="numeric" value={formData.price_per_kg} onChange={(e) => setFormData({...formData, price_per_kg: parseInt(e.target.value) || 0})} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
      <div className="p-3 bg-gray-50 rounded-lg"><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Total Harga:</span><span className="text-lg font-bold text-[#1A3D5C]">{formatCurrency(formData.weight_kg * formData.price_per_kg)}</span></div><p className="text-xs text-gray-500 mt-1">{formData.weight_kg} kg × {formatCurrency(formData.price_per_kg)}/kg</p></div>
      <div className="space-y-2"><Label className="text-sm">Catatan</Label><textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" rows={2} placeholder="Catatan tambahan..." /></div>
    </div>
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Manajemen Laundry</h1><p className="text-sm sm:text-base text-gray-500">Kelola pesanan laundry penghuni</p></div>
        <Button className="bg-[#1A3D5C] hover:bg-[#0F2744] w-full sm:w-auto h-11 sm:h-10 shrink-0" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Tambah Pesanan</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
        <Card className="bg-purple-50 border-purple-200 w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shrink-0"><Shirt className="w-5 h-5 text-white" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-purple-700">Total Pendapatan</p><p className="text-lg sm:text-xl font-bold text-purple-800 truncate">{formatCurrency(totalRevenue)}</p></div></div></CardContent></Card>
        <Card className="bg-yellow-50 border-yellow-200 w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-white" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-yellow-700">Pesanan Aktif</p><p className="text-lg sm:text-xl font-bold text-yellow-800">{pendingOrders}</p></div></div></CardContent></Card>
        <Card className="bg-green-50 border-green-200 w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shrink-0"><CheckCircle className="w-5 h-5 text-white" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-green-700">Selesai Hari Ini</p><p className="text-lg sm:text-xl font-bold text-green-800">{completedToday}</p></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center bg-white p-3 sm:p-4 rounded-lg border border-gray-200 w-full">
        <div className="relative w-full sm:flex-1 sm:min-w- sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input type="text" placeholder="Cari pesanan laundry..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 text-base sm:h-10 sm:text-sm w-full" />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-full sm:w-48 h-11 sm:h-10 text-base sm:text-sm"><SelectValue placeholder="Semua Properti" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Semua Properti</SelectItem>{properties.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-36 h-11 sm:h-10 text-base sm:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="01">Januari</SelectItem><SelectItem value="02">Februari</SelectItem><SelectItem value="03">Maret</SelectItem><SelectItem value="04">April</SelectItem><SelectItem value="05">Mei</SelectItem><SelectItem value="06">Juni</SelectItem><SelectItem value="07">Juli</SelectItem><SelectItem value="08">Agustus</SelectItem><SelectItem value="09">September</SelectItem><SelectItem value="10">Oktober</SelectItem><SelectItem value="11">November</SelectItem><SelectItem value="12">Desember</SelectItem></SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-28 h-11 sm:h-10 text-base sm:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{Array.from({ length: 6 }, (_, i) => currentDate.getFullYear() - i).map(year => (<SelectItem key={year} value={year.toString()}>{year}</SelectItem>))}</SelectContent>
          </Select>
          <Button variant="outline" className="h-11 sm:h-10 w-full sm:w-auto col-span-2 sm:col-span-1"><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex h-11 sm:h-10">
          <TabsTrigger value="all" className="h-9 text-xs sm:text-sm">Semua</TabsTrigger>
          <TabsTrigger value="pending" className="h-9 text-xs sm:text-sm">Antrian</TabsTrigger>
          <TabsTrigger value="in_progress" className="h-9 text-xs sm:text-sm">Proses</TabsTrigger>
          <TabsTrigger value="completed" className="h-9 text-xs sm:text-sm">Selesai</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading && (<div className="text-center py-12"><div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" /><p className="text-gray-500">Memuat data...</p></div>)}

          {!isLoading && (
            <>
              <Card className="hidden sm:block w-full overflow-hidden">
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Penghuni</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kamar</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tanggal</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Berat/Item</th><th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Total</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Layanan</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Aksi</th></tr></thead>
                  <tbody className="divide-y">{filteredOrders.map((order) => {
                    const tenant = tenants.find(t => t.id === order.tenant_id); const room = rooms.find(r => r.id === order.room_id);
                    return (<tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrder(order)}><td className="px-4 py-3"><p className="font-medium text-gray-900">{tenant?.full_name}</p></td><td className="px-4 py-3"><p className="font-medium">{room?.room_number}</p><p className="text-xs text-gray-500">{properties.find(p => p.id === order.property_id)?.name}</p></td><td className="px-4 py-3"><p>{formatDate(order.order_date)}</p>{order.completion_date && (<p className="text-xs text-green-600">Selesai: {formatDate(order.completion_date)}</p>)}</td><td className="px-4 py-3">{order.weight_kg? (<div className="flex items-center gap-1"><Scale className="w-4 h-4 text-gray-400" /><span>{order.weight_kg} kg</span></div>) : order.item_count? (<span>{order.item_count} item</span>) : (<span className="text-gray-400">-</span>)}</td><td className="px-4 py-3 text-right font-medium">{formatCurrency(order.total_price)}</td><td className="px-4 py-3"><Badge className={cn(order.status === 'completed' && "bg-green-100 text-green-700", order.status === 'pending' && "bg-yellow-100 text-yellow-700", order.status === 'in_progress' && "bg-blue-100 text-blue-700", order.status === 'cancelled' && "bg-red-100 text-red-700")}>{getStatusLabel(order.status)}</Badge></td><td className="px-4 py-3"><span className="text-sm">{getServiceTypeLabel(order.service_type)}</span></td><td className="px-4 py-3"><div className="flex gap-2">{order.status === 'pending' && (<Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50 h-9" onClick={(e) => { e.stopPropagation(); handleStartProcessing(order.id); }}>Mulai</Button>)}{order.status === 'in_progress' && (<Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50 h-9" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>Selesai</Button>)}</div></td></tr>);
                  })}</tbody>
                </table></div>
              </Card>

              <div className="grid grid-cols-1 gap-3 sm:hidden w-full">
                {filteredOrders.map((order) => {
                  const tenant = tenants.find(t => t.id === order.tenant_id); const room = rooms.find(r => r.id === order.room_id);
                  return (
                    <Card key={order.id} className="w-full overflow-hidden cursor-pointer active:bg-gray-50" onClick={() => setSelectedOrder(order)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-2"><div className="min-w-0 flex-1"><p className="font-semibold text-gray-900 truncate text-">{tenant?.full_name}</p><p className="text-xs text-gray-500 truncate mt-0.5">{room?.room_number} • {properties.find(p => p.id === order.property_id)?.name} • {formatDate(order.order_date)}</p></div><Badge className={cn("shrink-0 text-xs", order.status === 'completed' && "bg-green-100 text-green-700", order.status === 'pending' && "bg-yellow-100 text-yellow-700", order.status === 'in_progress' && "bg-blue-100 text-blue-700")}>{getStatusLabel(order.status)}</Badge></div>
                        <div className="mt-3 flex justify-between items-end"><div><p className="text-xs text-gray-500">Total</p><p className="font-bold text-gray-900">{formatCurrency(order.total_price)}</p><p className="text-xs text-gray-500 mt-1 flex items-center gap-1">{order.weight_kg? <><Scale className="w-3 h-3" />{order.weight_kg} kg</> : `${order.item_count || 0} item`} • {getServiceTypeLabel(order.service_type)}</p></div>
                          {order.status === 'pending' && (<Button variant="outline" size="sm" className="text-blue-600 border-blue-600 h-9 shrink-0" onClick={(e) => { e.stopPropagation(); handleStartProcessing(order.id); }}>Mulai</Button>)}{order.status === 'in_progress' && (<Button variant="outline" size="sm" className="text-green-600 border-green-600 h-9 shrink-0" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>Selesai</Button>)}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {!isLoading && filteredOrders.length === 0 && (<div className="text-center py-12 bg-gray-50 rounded-lg px-4"><p className="text-gray-500">Tidak ada pesanan laundry</p><Button variant="outline" className="mt-4 h-11 w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Tambah Pesanan</Button></div>)}
        </TabsContent>
      </Tabs>

      {/* Add */}
      {isMobile? (
        <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col bg-white">
            <SheetHeader className="p-4 border-b shrink-0 text-left"><SheetTitle>Tambah Pesanan Laundry</SheetTitle><SheetDescription>Buat pesanan laundry baru</SheetDescription></SheetHeader>
            <form onSubmit={handleAdd} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)]"><FormContent /></div>
              <SheetFooter className="p-4 border-t flex-row gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setIsAddDialogOpen(false)}>Batal</Button><Button type="submit" className="flex-1 bg-[#1A3D5C] hover:bg-[#0F2744] h-11">Simpan</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg max-h- overflow-y-auto"><DialogHeader><DialogTitle>Tambah Pesanan Laundry</DialogTitle><DialogDescription>Buat pesanan laundry baru</DialogDescription></DialogHeader><form onSubmit={handleAdd} className="space-y-4"><FormContent /><DialogFooter><Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button><Button type="submit" className="bg-[#1A3D5C] hover:bg-[#0F2744]">Simpan</Button></DialogFooter></form></DialogContent>
        </Dialog>
      )}

      {/* Detail */}
      {isMobile? (
        <Sheet open={!!selectedOrder &&!isDeleteDialogOpen} onOpenChange={() => setSelectedOrder(null)}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col bg-white">
            {selectedOrder && (() => {
              const tenant = tenants.find(t => t.id === selectedOrder.tenant_id); const room = rooms.find(r => r.id === selectedOrder.room_id);
              return (
                <>
                  <SheetHeader className="p-4 border-b shrink-0 text-left"><SheetTitle>Detail Pesanan Laundry</SheetTitle><SheetDescription>Informasi lengkap pesanan laundry</SheetDescription></SheetHeader>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[env(safe-area-inset-bottom)]">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"><div className="min-w-0 flex-1"><p className="text-xs text-gray-500">Total Harga</p><p className="text-xl font-bold text-gray-900 truncate">{formatCurrency(selectedOrder.total_price)}</p></div><Badge className={cn("shrink-0 ml-2 text-xs", selectedOrder.status === 'completed' && "bg-green-100 text-green-700", selectedOrder.status === 'pending' && "bg-yellow-100 text-yellow-700", selectedOrder.status === 'in_progress' && "bg-blue-100 text-blue-700")}>{getStatusLabel(selectedOrder.status)}</Badge></div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-2"><span className="text-gray-500">Penghuni</span><span className="font-medium truncate">{tenant?.full_name}</span></div>
                      <div className="flex justify-between gap-2"><span className="text-gray-500">Kamar</span><span className="font-medium">{room?.room_number}</span></div>
                      <div className="flex justify-between gap-2"><span className="text-gray-500">Tanggal Pesan</span><span>{formatDate(selectedOrder.order_date)}</span></div>
                      {selectedOrder.completion_date && (<div className="flex justify-between gap-2"><span className="text-gray-500">Tanggal Selesai</span><span>{formatDate(selectedOrder.completion_date)}</span></div>)}
                      <div className="flex justify-between gap-2"><span className="text-gray-500">Layanan</span><span>{getServiceTypeLabel(selectedOrder.service_type)}</span></div>
                      {selectedOrder.weight_kg && selectedOrder.weight_kg > 0 && (<div className="flex justify-between"><span className="text-gray-500">Berat</span><span>{selectedOrder.weight_kg} kg</span></div>)}
                      {selectedOrder.item_count && selectedOrder.item_count > 0 && (<div className="flex justify-between"><span className="text-gray-500">Jumlah Item</span><span>{selectedOrder.item_count} item</span></div>)}
                      <div className="flex justify-between"><span className="text-gray-500">Harga per kg</span><span>{formatCurrency(selectedOrder.price_per_kg)}</span></div>
                      <div className="border-t pt-3 flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(selectedOrder.total_price)}</span></div>
                    </div>
                    {selectedOrder.notes && (<div className="bg-gray-50 p-3 rounded-lg"><Label className="text-xs text-gray-500">Catatan</Label><p className="mt-1 text-sm break-words">{selectedOrder.notes}</p></div>)}
                  </div>
                  <div className="p-4 border-t grid grid-cols-2 gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <Button variant="outline" className="h-11" onClick={() => setSelectedOrder(null)}>Tutup</Button>
                    {selectedOrder.status!== 'completed'? (<Button className="bg-green-600 hover:bg-green-700 h-11" onClick={handleComplete}><CheckCircle className="w-4 h-4 mr-2" />Selesai</Button>) : (<Button variant="outline" className="text-red-600 h-11" onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button>)}
                  </div>
                  {selectedOrder.status!== 'completed' && (<div className="px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"><Button variant="ghost" className="w-full text-red-600 h-10" onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className="w-4 h-4 mr-2" />Hapus Pesanan</Button></div>)}
                </>
              );
            })()}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedOrder &&!isDeleteDialogOpen} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Detail Pesanan Laundry</DialogTitle><DialogDescription>Informasi lengkap pesanan laundry</DialogDescription></DialogHeader>
            {selectedOrder && (() => {
              const tenant = tenants.find(t => t.id === selectedOrder.tenant_id); const room = rooms.find(r => r.id === selectedOrder.room_id);
              return (<><div className="space-y-4"><div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"><div><p className="text-sm text-gray-500">Total Harga</p><p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedOrder.total_price)}</p></div><Badge className={cn(selectedOrder.status === 'completed' && "bg-green-100 text-green-700", selectedOrder.status === 'pending' && "bg-yellow-100 text-yellow-700", selectedOrder.status === 'in_progress' && "bg-blue-100 text-blue-700")}>{getStatusLabel(selectedOrder.status)}</Badge></div><div className="space-y-3"><div className="flex justify-between"><span className="text-gray-500">Penghuni</span><span className="font-medium">{tenant?.full_name}</span></div><div className="flex justify-between"><span className="text-gray-500">Kamar</span><span className="font-medium">{room?.room_number}</span></div><div className="flex justify-between"><span className="text-gray-500">Tanggal Pesan</span><span>{formatDate(selectedOrder.order_date)}</span></div>{selectedOrder.completion_date && (<div className="flex justify-between"><span className="text-gray-500">Tanggal Selesai</span><span>{formatDate(selectedOrder.completion_date)}</span></div>)}<div className="flex justify-between"><span className="text-gray-500">Layanan</span><span>{getServiceTypeLabel(selectedOrder.service_type)}</span></div>{selectedOrder.weight_kg && selectedOrder.weight_kg > 0 && (<div className="flex justify-between"><span className="text-gray-500">Berat</span><span>{selectedOrder.weight_kg} kg</span></div>)}{selectedOrder.item_count && selectedOrder.item_count > 0 && (<div className="flex justify-between"><span className="text-gray-500">Jumlah Item</span><span>{selectedOrder.item_count} item</span></div>)}<div className="flex justify-between"><span className="text-gray-500">Harga per kg</span><span>{formatCurrency(selectedOrder.price_per_kg)}</span></div><div className="border-t pt-2 flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(selectedOrder.total_price)}</span></div></div>{selectedOrder.notes && (<div><Label className="text-gray-500">Catatan</Label><p className="mt-1 text-sm">{selectedOrder.notes}</p></div>)}</div><DialogFooter className="gap-2"><Button variant="outline" onClick={() => setSelectedOrder(null)}>Tutup</Button><Button variant="outline" className="text-red-600" onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button>{selectedOrder.status!== 'completed' && (<Button className="bg-green-600 hover:bg-green-700" onClick={handleComplete}><CheckCircle className="w-4 h-4 mr-2" />Tandai Selesai</Button>)}</DialogFooter></>);
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete */}
      {isMobile? (
        <Sheet open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <SheetContent side="bottom" className="h-auto w-full p-0 flex flex-col bg-white rounded-t-xl">
            <SheetHeader className="p-5 text-left"><SheetTitle>Konfirmasi Hapus</SheetTitle><SheetDescription className="text-left">Apakah Anda yakin ingin menghapus pesanan laundry ini? Tindakan ini tidak dapat dibatalkan.</SheetDescription></SheetHeader>
            <div className="p-4 flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button variant="outline" className="flex-1 h-11" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button><Button variant="destructive" className="flex-1 h-11" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button></div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Konfirmasi Hapus</DialogTitle><DialogDescription>Apakah Anda yakin ingin menghapus pesanan laundry ini? Tindakan ini tidak dapat dibatalkan.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button><Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button></DialogFooter></DialogContent>
        </Dialog>
      )}
    </div>
  );
}