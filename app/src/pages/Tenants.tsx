// app/src/pages/Tenants.tsx - FOCUS FIX + FULL FIELDS
import { useState, useEffect, useMemo } from 'react';
import { Search, Eye, Edit, Trash2, MoreHorizontal, Phone, Mail, UserPlus, Building2, Calendar, Users, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { tenantsAPI, propertiesAPI, roomsAPI, paymentsAPI } from '@/services/api';
import type { Tenant, Property, Room, Payment } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, getPaymentStatusColor, getPaymentStatusLabel } from '@/lib/format';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePermissions } from '@/hooks/usePermissions';

// FIX: Stable form outside component - full fields matching \d tenants
function TenantFormContent({ formData, setFormData, properties, rooms }: { formData: any; setFormData: React.Dispatch<React.SetStateAction<any>>; properties: Property[]; rooms: Room[] }) {
  const getAvailableRooms = (propertyId: string) => {
    if (!propertyId) return rooms;
    return rooms.filter(r => r.property_id === propertyId && (r.status === 'available' || r.status === 'occupied'));
  };

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3 h-11 sm:h-10">
        <TabsTrigger value="basic" className="text-xs sm:text-sm h-9">Dasar</TabsTrigger>
        <TabsTrigger value="room" className="text-xs sm:text-sm h-9">Kamar & Sewa</TabsTrigger>
        <TabsTrigger value="emergency" className="text-xs sm:text-sm h-9">Darurat & Lain</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-sm">Nama Lengkap *</Label><Input value={formData.full_name} onChange={(e) => setFormData((p:any)=>({...p, full_name: e.target.value}))} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          <div className="space-y-2"><Label className="text-sm">No Telepon *</Label><Input value={formData.phone} onChange={(e) => setFormData((p:any)=>({...p, phone: e.target.value}))} required className="h-11 text-base sm:h-10 sm:text-sm" inputMode="tel" /></div>
          <div className="space-y-2"><Label className="text-sm">Email</Label><Input type="text" inputMode="email" value={formData.email} onChange={(e) => setFormData((p:any)=>({...p, email: e.target.value}))} className="h-11 text-base sm:h-10 sm:text-sm" placeholder="opsional" /></div>
          <div className="space-y-2"><Label className="text-sm">Nomor KTP *</Label><Input value={formData.ktp_number} onChange={(e) => setFormData((p:any)=>({...p, ktp_number: e.target.value}))} required className="h-11 text-base sm:h-10 sm:text-sm" inputMode="numeric" /></div>
          <div className="space-y-2"><Label className="text-sm">Kontak Darurat *</Label><Input value={formData.emergency_contact} onChange={(e) => setFormData((p:any)=>({...p, emergency_contact: e.target.value}))} required className="h-11 text-base sm:h-10 sm:text-sm" placeholder="Nama kontak darurat" /></div>
          <div className="space-y-2"><Label className="text-sm">Telepon Darurat *</Label><Input value={formData.emergency_phone} onChange={(e) => setFormData((p:any)=>({...p, emergency_phone: e.target.value}))} required className="h-11 text-base sm:h-10 sm:text-sm" inputMode="tel" /></div>
        </div>
      </TabsContent>

      <TabsContent value="room" className="space-y-4 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-sm">Properti *</Label>
            <select className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" value={formData.property_id} onChange={(e) => setFormData((p:any)=>({...p, property_id: e.target.value, room_id: ''}))} required>
              <option value="">Pilih Properti</option>{properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div className="space-y-2"><Label className="text-sm">Kamar *</Label>
            <select className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" value={formData.room_id} onChange={(e) => { const room = rooms.find(r => r.id === e.target.value); setFormData((p:any)=>({...p, room_id: e.target.value, base_monthly_rent: room?.base_monthly_rent || p.base_monthly_rent, security_deposit: room?.base_monthly_rent || p.security_deposit}));}} required>
              <option value="">Pilih Kamar</option>{getAvailableRooms(formData.property_id).map(r => (<option key={r.id} value={r.id}>{r.room_number} - {new Intl.NumberFormat('id-ID').format(r.base_monthly_rent)}</option>))}
            </select>
          </div>
          <div className="space-y-2"><Label className="text-sm">Tanggal Masuk *</Label><Input type="date" value={formData.check_in_date} onChange={(e) => setFormData((p:any)=>({...p, check_in_date: e.target.value}))} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          <div className="space-y-2"><Label className="text-sm">Durasi (bulan) *</Label><Input type="text" inputMode="numeric" value={formData.contract_duration_months} onChange={(e) => setFormData((p:any)=>({...p, contract_duration_months: parseInt(e.target.value) || 0}))} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          <div className="space-y-2"><Label className="text-sm">Sewa Dasar (Rp) *</Label><Input type="text" inputMode="numeric" value={formData.base_monthly_rent} onChange={(e) => setFormData((p:any)=>({...p, base_monthly_rent: parseInt(e.target.value) || 0}))} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          <div className="space-y-2"><Label className="text-sm">Deposit (Rp) *</Label><Input type="text" inputMode="numeric" value={formData.security_deposit} onChange={(e) => setFormData((p:any)=>({...p, security_deposit: parseInt(e.target.value) || 0}))} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          <div className="space-y-2"><Label className="text-sm">Jatuh Tempo Tgl *</Label><Input type="text" inputMode="numeric" value={formData.payment_due_day} onChange={(e) => setFormData((p:any)=>({...p, payment_due_day: parseInt(e.target.value) || 1}))} required className="h-11 text-base sm:h-10 sm:text-sm" min={1} max={28} /></div>
          <div className="space-y-2"><Label className="text-sm">Denda Telat (%)</Label><Input type="text" inputMode="decimal" value={formData.late_fee_percentage} onChange={(e) => setFormData((p:any)=>({...p, late_fee_percentage: parseFloat(e.target.value) || 0}))} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          <div className="col-span-1 sm:col-span-2 flex items-center gap-2 min-h-[44px]"><Switch checked={formData.is_shared_room} onCheckedChange={(checked) => setFormData((p:any)=>({...p, is_shared_room: checked}))} /><Label className="text-sm">Kamar Bersama (2 orang)</Label></div>
          {formData.is_shared_room && (<>
            <div className="space-y-2"><Label className="text-sm">Nama Penghuni Kedua</Label><Input value={formData.secondary_tenant_name} onChange={(e) => setFormData((p:any)=>({...p, secondary_tenant_name: e.target.value}))} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
            <div className="space-y-2"><Label className="text-sm">Telepon Kedua</Label><Input value={formData.secondary_tenant_phone} onChange={(e) => setFormData((p:any)=>({...p, secondary_tenant_phone: e.target.value}))} className="h-11 text-base sm:h-10 sm:text-sm" inputMode="tel" /></div>
            <div className="space-y-2"><Label className="text-sm">Biaya Tambahan (Rp)</Label><Input type="text" inputMode="numeric" value={formData.additional_person_fee} onChange={(e) => setFormData((p:any)=>({...p, additional_person_fee: parseInt(e.target.value) || 0}))} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          </>)}
        </div>
      </TabsContent>

      <TabsContent value="emergency" className="space-y-4 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2"><Label className="text-sm">Ringkasan Sewa</Label><div className="p-3 bg-gray-50 rounded-lg text-sm"><p>Total Bulanan: <strong>Rp {(formData.base_monthly_rent + (formData.is_shared_room? formData.additional_person_fee : 0)).toLocaleString('id-ID')}</strong></p><p className="text-xs text-gray-500 mt-1">base + additional jika shared</p></div></div>
          <div className="space-y-2"><Label className="text-sm">Email Kontak (opsional)</Label><Input value={formData.email} onChange={(e) => setFormData((p:any)=>({...p, email: e.target.value}))} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          <div className="space-y-2"><Label className="text-sm">Catatan</Label><Input value={formData.notes || ''} onChange={(e) => setFormData((p:any)=>({...p, notes: e.target.value}))} placeholder="Catatan tambahan" className="h-11 text-base sm:h-10 sm:text-sm" /></div>
        </div>
        <p className="text-xs text-gray-400">Fields KTP image, contract file, signature akan di-handle di step upload terpisah.</p>
      </TabsContent>
    </Tabs>
  );
}

export function Tenants() {
  const isMobile = useIsMobile();
  const { can } = usePermissions();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCheckOutDialogOpen, setIsCheckOutDialogOpen] = useState(false);
  const [checkOutReason, setCheckOutReason] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    full_name: '', phone: '', email: '', emergency_contact: '', emergency_phone: '', ktp_number: '',
    property_id: '', room_id: '', check_in_date: new Date().toISOString().split('T')[0],
    contract_duration_months: 12, base_monthly_rent: 0, additional_person_fee: 0, security_deposit: 0,
    late_fee_percentage: 5, payment_due_day: 1, is_shared_room: false, secondary_tenant_name: '', secondary_tenant_phone: '', notes: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled([
        tenantsAPI.getAll(),
        can('properties.view') || can('properties.read') ? propertiesAPI.getAll() : Promise.resolve([]),
        can('rooms.view') || can('rooms.read') ? roomsAPI.getAll() : Promise.resolve([]),
        can('payments.view') || can('payments.read') ? paymentsAPI.getAll() : Promise.resolve([]),
      ]);
      const tenantsRes = results[0].status === 'fulfilled' ? results[0].value : [];
      const propertiesRes = results[1].status === 'fulfilled' ? results[1].value : [];
      const roomsRes = results[2].status === 'fulfilled' ? results[2].value : [];
      const paymentsRes = results[3].status === 'fulfilled' ? results[3].value : [];
      results.forEach((r, i) => { if (r.status === 'rejected') { console.warn(`Tenants fetch ${['tenants','properties','rooms','payments'][i]} failed:`, r.reason); } });
      setTenants(tenantsRes as any); setProperties(propertiesRes as any); setRooms(roomsRes as any); setPayments(paymentsRes as any);
    } catch (error) { toast.error('Gagal memuat data'); } finally { setIsLoading(false); }
  };

  const summaryStats = useMemo(() => {
    const stats = properties.map(property => {
      const propertyTenants = tenants.filter(t => t.property_id === property.id && t.status === 'active');
      const activeTenantCount = propertyTenants.reduce((acc, tenant) => acc + (tenant.is_shared_room? 2 : 1), 0);
      return { propertyId: property.id, propertyName: property.name, totalRooms: property.total_rooms, activeTenants: activeTenantCount, occupancyRate: property.total_rooms > 0? (activeTenantCount / property.total_rooms) * 100 : 0 };
    });
    const totalStats = { totalRooms: properties.reduce((acc, p) => acc + p.total_rooms, 0), totalActiveTenants: stats.reduce((acc, s) => acc + s.activeTenants, 0), };
    return { propertyStats: stats, totalStats };
  }, [tenants, properties]);

  const filteredTenants = tenants.filter(tenant => {
    if (selectedProperty!== 'all' && tenant.property_id!== selectedProperty) return false;
    const matchesSearch = tenant.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || tenant.phone?.includes(searchQuery) || tenant.ktp_number?.includes(searchQuery);
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && tenant.status === 'active';
    if (activeTab === 'ex-tenant') return matchesSearch && (tenant.status === 'moved_out' || tenant.status === 'archived');
    return matchesSearch;
  });

  const getRoomInfo = (roomId: string) => rooms.find(r => r.id === roomId);
  const getPropertyInfo = (propertyId: string) => properties.find(p => p.id === propertyId);
  const getTenantPayments = (tenantId: string) => payments.filter(p => p.tenant_id === tenantId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const resetForm = () => {
    setFormData({
      full_name: '', phone: '', email: '', emergency_contact: '', emergency_phone: '', ktp_number: '',
      property_id: properties[0]?.id || '', room_id: '', check_in_date: new Date().toISOString().split('T')[0],
      contract_duration_months: 12, base_monthly_rent: 0, additional_person_fee: 0, security_deposit: 0,
      late_fee_percentage: 5, payment_due_day: 1, is_shared_room: false, secondary_tenant_name: '', secondary_tenant_phone: '', notes: '',
    }); setIsEditMode(false);
  };

  const openAddDialog = () => { resetForm(); setIsAddDialogOpen(true); };
  const openEditDialog = (tenant: Tenant) => {
    setFormData({
      full_name: tenant.full_name, phone: tenant.phone, email: tenant.email || '', emergency_contact: tenant.emergency_contact,
      emergency_phone: tenant.emergency_phone, ktp_number: tenant.ktp_number, property_id: tenant.property_id, room_id: tenant.room_id,
      check_in_date: new Date(tenant.check_in_date).toISOString().split('T')[0], contract_duration_months: tenant.contract_duration_months,
      base_monthly_rent: tenant.base_monthly_rent, additional_person_fee: tenant.additional_person_fee, security_deposit: tenant.security_deposit,
      late_fee_percentage: tenant.late_fee_percentage, payment_due_day: tenant.payment_due_day, is_shared_room: tenant.is_shared_room,
      secondary_tenant_name: tenant.secondary_tenant_name || '', secondary_tenant_phone: tenant.secondary_tenant_phone || '', notes: (tenant as any).notes || '',
    }); setSelectedTenant(tenant); setIsEditMode(true); setIsAddDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total_monthly_rent = Number(formData.base_monthly_rent) + (formData.is_shared_room? Number(formData.additional_person_fee) : 0);
    const data = {...formData, total_monthly_rent };
    try {
      if (isEditMode && selectedTenant) { await tenantsAPI.update(selectedTenant.id, data); toast.success('Penghuni berhasil diperbarui'); }
      else { await tenantsAPI.create(data); toast.success('Penghuni berhasil ditambahkan'); }
      setIsAddDialogOpen(false); resetForm(); fetchData();
    } catch (error:any) { console.error(error); toast.error(error?.response?.data?.message || error?.message || (isEditMode? 'Gagal memperbarui penghuni' : 'Gagal menambahkan penghuni')); }
  };

  const openCheckOutDialog = (tenant: Tenant) => { setSelectedTenant(tenant); setCheckOutReason(''); setIsCheckOutDialogOpen(true); };
  const handleCheckOut = async () => {
    if (!selectedTenant) return;
    try { await tenantsAPI.update(selectedTenant.id, { status: 'moved_out', check_out_date: new Date().toISOString(), move_out_reason: checkOutReason || 'Check out manual' }); toast.success('Penghuni berhasil check out'); setIsCheckOutDialogOpen(false); setSelectedTenant(null); setCheckOutReason(''); fetchData(); }
    catch (error) { toast.error('Gagal melakukan check out penghuni'); }
  };
  const handleDelete = async () => {
    if (!selectedTenant) return;
    try { await tenantsAPI.delete(selectedTenant.id); toast.success('Penghuni berhasil dihapus'); setIsDeleteDialogOpen(false); setSelectedTenant(null); fetchData(); }
    catch (error) { toast.error('Gagal menghapus penghuni'); }
  };
  const openDeleteDialog = (tenant: Tenant) => { setSelectedTenant(tenant); setIsDeleteDialogOpen(true); };

  const canCreate = can('tenants.create');
  const canUpdate = can('tenants.update');

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Manajemen Penghuni</h1><p className="text-sm sm:text-base text-gray-500">Kelola data penghuni dan kontrak</p></div>
        {canCreate && <Button className="bg-[#1A3D5C] hover:bg-[#0F2744] w-full sm:w-auto h-11 sm:h-10 shrink-0" onClick={openAddDialog}><UserPlus className="w-4 h-4 mr-2" />Tambah Penghuni</Button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {summaryStats.propertyStats.map((stat) => (
          <Card key={stat.propertyId} className="border-l-4 border-l-[#1A3D5C] w-full overflow-hidden">
            <CardContent className="p-4"><div className="flex items-center justify-between gap-2"><div className="min-w-0 flex-1"><p className="text-sm font-medium text-gray-500 mb-1 truncate">{stat.propertyName}</p><div className="flex items-baseline gap-2"><span className="text-xl sm:text-2xl font-bold text-gray-900">{stat.activeTenants}/{stat.totalRooms}</span><span className="text-xs sm:text-sm text-gray-500">penghuni</span></div><div className="mt-2"><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-[#1A3D5C] h-2 rounded-full" style={{ width: `${Math.min(stat.occupancyRate, 100)}%` }} /></div><p className="text-xs text-gray-500 mt-1">{stat.occupancyRate.toFixed(1)}% terisi</p></div></div><Building2 className="w-8 h-8 text-[#1A3D5C] opacity-20 shrink-0" /></div></CardContent>
          </Card>
        ))}
        <Card className="bg-[#1A3D5C] text-white border-l-4 border-l-[#0F2744] w-full overflow-hidden">
          <CardContent className="p-4"><div className="flex items-center justify-between gap-2"><div className="min-w-0 flex-1"><p className="text-sm font-medium text-blue-100 mb-1 truncate">Total Semua Properti</p><div className="flex items-baseline gap-2"><span className="text-xl sm:text-2xl font-bold">{summaryStats.totalStats.totalActiveTenants}/{summaryStats.totalStats.totalRooms}</span><span className="text-xs sm:text-sm text-blue-200">penghuni</span></div><p className="text-xs text-blue-200 mt-2">{summaryStats.totalStats.totalRooms > 0? ((summaryStats.totalStats.totalActiveTenants / summaryStats.totalStats.totalRooms) * 100).toFixed(1) : 0}% okupansi total</p></div><Users className="w-8 h-8 text-white opacity-30 shrink-0" /></div></CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center bg-white p-3 sm:p-4 rounded-lg border border-gray-200 w-full">
        <div className="relative w-full sm:flex-1 sm:max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input type="text" placeholder="Cari nama, telepon, atau KTP..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 text-base sm:h-10 sm:text-sm w-full" /></div>
        <div className="hidden sm:block h-8 w-px bg-gray-300" />
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto"><Building2 className="w-4 h-4 text-gray-500 shrink-0" /><Select value={selectedProperty} onValueChange={setSelectedProperty}><SelectTrigger className="w-full h-11 sm:h-10 text-base sm:text-sm"><SelectValue placeholder="Pilih Properti" /></SelectTrigger><SelectContent><SelectItem value="all">Semua Properti</SelectItem>{properties.map((property) => (<SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>))}</SelectContent></Select></div>
          <div className="flex items-center gap-2 w-full sm:w-auto"><Calendar className="w-4 h-4 text-gray-500 shrink-0" /><div className="relative w-full"><Input type="date" value={selectedDate} disabled className="w-full h-11 sm:h-10 bg-gray-100 cursor-not-allowed text-base sm:text-sm" /><div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 rounded-md pointer-events-none"><span className="text-sm font-medium text-gray-600">Hari Ini</span></div></div></div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-11 sm:h-10"><TabsTrigger value="all" className="h-9 text-sm">Semua</TabsTrigger><TabsTrigger value="active" className="h-9 text-sm">Aktif</TabsTrigger><TabsTrigger value="ex-tenant" className="h-9 text-sm">Ex-Penghuni</TabsTrigger></TabsList>
      </Tabs>

      {isLoading && (<div className="text-center py-12"><div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" /><p className="text-gray-500">Memuat data...</p></div>)}

      {!isLoading && (
        <>
          <Card className="hidden sm:block w-full overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Penghuni</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kamar</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kontak</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Sewa/Bulan</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th><th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Aksi</th></tr></thead>
              <tbody className="divide-y">{filteredTenants.map((tenant) => {
                const room = getRoomInfo(tenant.room_id); const property = getPropertyInfo(tenant.property_id);
                return (<tr key={tenant.id} className="hover:bg-gray-50"><td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar className="w-10 h-10"><AvatarFallback className="bg-[#1A3D5C] text-white">{tenant.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar><div><p className="font-medium text-gray-900">{tenant.full_name}</p>{tenant.is_shared_room && tenant.secondary_tenant_name && (<p className="text-xs text-gray-500">+ {tenant.secondary_tenant_name}</p>)}</div></div></td><td className="px-4 py-3"><p className="font-medium">{room?.room_number || tenant.room_id?.slice(0,8) || '-'}</p><p className="text-xs text-gray-500">{property?.name || tenant.property_id?.slice(0,8) || '-'}</p></td><td className="px-4 py-3"><div className="space-y-1"><div className="flex items-center gap-1 text-sm"><Phone className="w-3 h-3 text-gray-400" />{tenant.phone}</div></div></td><td className="px-4 py-3"><p className="font-medium">{formatCurrency(tenant.total_monthly_rent)}</p><p className="text-xs text-gray-500">Jatuh tempo: tgl {tenant.payment_due_day}</p></td><td className="px-4 py-3"><Badge className={cn(tenant.status === 'active' && "bg-green-100 text-green-700", tenant.status === 'archived' && "bg-gray-100 text-gray-700", tenant.status === 'moved_out' && "bg-orange-100 text-orange-700")}>{tenant.status === 'active'? 'Aktif' : tenant.status === 'archived'? 'Arsip' : 'Keluar'}</Badge></td><td className="px-4 py-3 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setSelectedTenant(tenant)}><Eye className="w-4 h-4 mr-2" />Lihat Detail</DropdownMenuItem>{canUpdate && <DropdownMenuItem onClick={() => openEditDialog(tenant)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>}{tenant.status === 'active' && canUpdate && (<DropdownMenuItem className="text-orange-600" onClick={() => openCheckOutDialog(tenant)}><LogOut className="w-4 h-4 mr-2" />Check Out</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></td></tr>);
              })}</tbody>
            </table></div>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:hidden w-full">
            {filteredTenants.map((tenant) => {
              const room = getRoomInfo(tenant.room_id); const property = getPropertyInfo(tenant.property_id);
              return (
                <Card key={tenant.id} className="w-full overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="w-11 h-11 shrink-0"><AvatarFallback className="bg-[#1A3D5C] text-white text-sm">{tenant.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><p className="font-semibold text-gray-900 truncate">{tenant.full_name}</p><p className="text-xs text-gray-500 truncate">{room?.room_number || '-'} • {property?.name || '-'}</p></div><Badge className={cn("shrink-0 text-xs", tenant.status === 'active' && "bg-green-100 text-green-700", tenant.status === 'archived' && "bg-gray-100 text-gray-700", tenant.status === 'moved_out' && "bg-orange-100 text-orange-700")}>{tenant.status === 'active'? 'Aktif' : 'Arsip'}</Badge></div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600"><span className="flex items-center gap-1"><Phone className="w-3 h-3" />{tenant.phone}</span><span className="font-medium">{formatCurrency(tenant.total_monthly_rent)}</span></div>
                      </div>
                      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 -mr-2"><MoreHorizontal className="w-5 h-5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setSelectedTenant(tenant)} className="h-11"><Eye className="w-4 h-4 mr-2" />Lihat Detail</DropdownMenuItem>{canUpdate && <DropdownMenuItem onClick={() => openEditDialog(tenant)} className="h-11"><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>}{tenant.status === 'active' && canUpdate && (<DropdownMenuItem className="text-orange-600 h-11" onClick={() => openCheckOutDialog(tenant)}><LogOut className="w-4 h-4 mr-2" />Check Out</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {!isLoading && filteredTenants.length === 0 && (<div className="text-center py-12 bg-gray-50 rounded-lg px-4"><p className="text-gray-500">Tidak ada penghuni ditemukan (properti: {properties.length}, kamar: {rooms.length})</p>{canCreate && <Button variant="outline" className="mt-4 h-11 w-full sm:w-auto" onClick={openAddDialog}><UserPlus className="w-4 h-4 mr-2" />Tambah Penghuni</Button>}</div>)}

      {/* Add/Edit - both mobile and desktop use same full form */}
      {isMobile? (
        <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <SheetContent side="bottom" className="h-[92vh] w-full p-0 flex flex-col bg-white">
            <SheetHeader className="p-4 border-b shrink-0 text-left"><SheetTitle>{isEditMode? 'Edit Penghuni' : 'Tambah Penghuni Baru'}</SheetTitle><SheetDescription>{isEditMode? 'Perbarui informasi penghuni' : 'Isi informasi lengkap penghuni'}</SheetDescription></SheetHeader>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)]"><TenantFormContent formData={formData} setFormData={setFormData} properties={properties} rooms={rooms} /></div>
              <SheetFooter className="p-4 border-t flex-row gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button type="button" variant="outline" className="flex-1 h-11" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Batal</Button><Button type="submit" className="flex-1 bg-[#1A3D5C] hover:bg-[#0F2744] h-11">{isEditMode? 'Simpan Perubahan' : 'Simpan'}</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{isEditMode? 'Edit Penghuni' : 'Tambah Penghuni Baru'}</DialogTitle><DialogDescription>Isi informasi lengkap penghuni sesuai tabel tenants</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4"><TenantFormContent formData={formData} setFormData={setFormData} properties={properties} rooms={rooms} /><DialogFooter className="mt-6"><Button type="button" variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Batal</Button><Button type="submit" className="bg-[#1A3D5C] hover:bg-[#0F2744]">{isEditMode? 'Simpan Perubahan' : 'Simpan Penghuni'}</Button></DialogFooter></form>
          </DialogContent>
        </Dialog>
      )}

      {/* Detail Dialog */}
      {isMobile? (
        <Sheet open={!!selectedTenant && !isAddDialogOpen && !isDeleteDialogOpen && !isCheckOutDialogOpen} onOpenChange={() => setSelectedTenant(null)}>
          <SheetContent side="bottom" className="h-[85vh] w-full p-0 flex flex-col bg-white">
            {selectedTenant && (
              <>
                <SheetHeader className="p-4 border-b shrink-0 text-left"><SheetTitle>{selectedTenant.full_name}</SheetTitle><SheetDescription>Detail penghuni</SheetDescription></SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex items-center gap-3"><Avatar className="w-14 h-14"><AvatarFallback className="bg-[#1A3D5C] text-white">{selectedTenant.full_name.split(' ').map(n=>n[0]).join('').slice(0,2)}</AvatarFallback></Avatar><div><p className="font-semibold">{selectedTenant.full_name}</p><p className="text-sm text-gray-500">{getRoomInfo(selectedTenant.room_id)?.room_number} • {getPropertyInfo(selectedTenant.property_id)?.name}</p></div></div>
                  <div className="space-y-2 text-sm"><p><span className="text-gray-500">Telepon:</span> {selectedTenant.phone}</p><p><span className="text-gray-500">KTP:</span> {selectedTenant.ktp_number}</p><p><span className="text-gray-500">Darurat:</span> {selectedTenant.emergency_contact} - {selectedTenant.emergency_phone}</p><p><span className="text-gray-500">Check-in:</span> {formatDate(selectedTenant.check_in_date)}</p><p><span className="text-gray-500">Sewa:</span> {formatCurrency(selectedTenant.total_monthly_rent)} / bulan</p></div>
                </div>
                <div className="p-4 border-t flex gap-3"><Button variant="outline" className="flex-1" onClick={()=>setSelectedTenant(null)}>Tutup</Button>{canUpdate && <Button className="flex-1 bg-[#1A3D5C]" onClick={()=>openEditDialog(selectedTenant)}><Edit className="w-4 h-4 mr-2" />Edit</Button>}</div>
              </>
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedTenant && !isAddDialogOpen && !isDeleteDialogOpen && !isCheckOutDialogOpen} onOpenChange={() => setSelectedTenant(null)}>
          <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{selectedTenant?.full_name}</DialogTitle><DialogDescription>Detail lengkap penghuni</DialogDescription></DialogHeader>
            {selectedTenant && (<div className="space-y-4"><div className="space-y-2 text-sm"><p><span className="text-gray-500">Telepon:</span> {selectedTenant.phone}</p><p><span className="text-gray-500">KTP:</span> {selectedTenant.ktp_number}</p><p><span className="text-gray-500">Sewa:</span> {formatCurrency(selectedTenant.total_monthly_rent)}</p></div><DialogFooter><Button variant="outline" onClick={()=>setSelectedTenant(null)}>Tutup</Button>{canUpdate && <Button className="bg-[#1A3D5C]" onClick={()=>openEditDialog(selectedTenant)}><Edit className="w-4 h-4 mr-2" />Edit</Button>}</DialogFooter></div>)}
          </DialogContent>
        </Dialog>
      )}

      {/* CheckOut */}
      <Dialog open={isCheckOutDialogOpen} onOpenChange={setIsCheckOutDialogOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Check Out Penghuni</DialogTitle><DialogDescription>Masukkan alasan check out untuk {selectedTenant?.full_name}</DialogDescription></DialogHeader><div className="space-y-4"><Label>Alasan Check Out</Label><textarea value={checkOutReason} onChange={(e)=>setCheckOutReason(e.target.value)} className="w-full border rounded-lg p-3 h-24" placeholder="Alasan keluar..." /></div><DialogFooter><Button variant="outline" onClick={()=>setIsCheckOutDialogOpen(false)}>Batal</Button><Button variant="destructive" onClick={handleCheckOut}>Check Out</Button></DialogFooter></DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Konfirmasi Hapus</DialogTitle><DialogDescription>Yakin hapus penghuni {selectedTenant?.full_name}?</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={()=>setIsDeleteDialogOpen(false)}>Batal</Button><Button variant="destructive" onClick={handleDelete}>Hapus</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
