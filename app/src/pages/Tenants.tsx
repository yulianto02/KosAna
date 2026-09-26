// app/src/pages/Tenants.tsx - Responsive Mobile Version
import { useState, useEffect, useMemo } from 'react';
import { Search, Eye, Edit, Trash2, MoreHorizontal, Phone, Mail, UserPlus, Building2, Calendar, Users, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { tenantsAPI, propertiesAPI, roomsAPI, paymentsAPI } from '@/services/api';
import type { Tenant, Property, Room, Payment } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, getPaymentStatusColor, getPaymentStatusLabel } from '@/lib/format';
import { useIsMobile } from '@/hooks/use-mobile';

export function Tenants() {
  const isMobile = useIsMobile();
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
    full_name: '',
    phone: '',
    email: '',
    emergency_contact: '',
    emergency_phone: '',
    ktp_number: '',
    property_id: '',
    room_id: '',
    check_in_date: new Date().toISOString().split('T')[0],
    contract_duration_months: 12,
    base_monthly_rent: 0,
    additional_person_fee: 0,
    security_deposit: 0,
    late_fee_percentage: 5,
    payment_due_day: 1,
    is_shared_room: false,
    secondary_tenant_name: '',
    secondary_tenant_phone: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tenantsRes, propertiesRes, roomsRes, paymentsRes] = await Promise.all([
        tenantsAPI.getAll(), propertiesAPI.getAll(), roomsAPI.getAll(), paymentsAPI.getAll(),
      ]);
      setTenants(tenantsRes); setProperties(propertiesRes); setRooms(roomsRes); setPayments(paymentsRes);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally { setIsLoading(false); }
  };

  const summaryStats = useMemo(() => {
    const stats = properties.map(property => {
      const propertyTenants = tenants.filter(t => t.property_id === property.id && t.status === 'active');
      const activeTenantCount = propertyTenants.reduce((acc, tenant) => acc + (tenant.is_shared_room? 2 : 1), 0);
      return {
        propertyId: property.id, propertyName: property.name, totalRooms: property.total_rooms,
        activeTenants: activeTenantCount, occupancyRate: property.total_rooms > 0? (activeTenantCount / property.total_rooms) * 100 : 0
      };
    });
    const totalStats = {
      totalRooms: properties.reduce((acc, p) => acc + p.total_rooms, 0),
      totalActiveTenants: stats.reduce((acc, s) => acc + s.activeTenants, 0),
    };
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
  const getAvailableRooms = (propertyId: string) => rooms.filter(r => r.property_id === propertyId && (r.status === 'available' || r.status === 'occupied'));

  const resetForm = () => {
    setFormData({
      full_name: '', phone: '', email: '', emergency_contact: '', emergency_phone: '', ktp_number: '',
      property_id: properties[0]?.id || '', room_id: '', check_in_date: new Date().toISOString().split('T')[0],
      contract_duration_months: 12, base_monthly_rent: 0, additional_person_fee: 0, security_deposit: 0,
      late_fee_percentage: 5, payment_due_day: 1, is_shared_room: false, secondary_tenant_name: '', secondary_tenant_phone: '',
    });
    setIsEditMode(false);
  };

  const openAddDialog = () => { resetForm(); setIsAddDialogOpen(true); };
  const openEditDialog = (tenant: Tenant) => {
    setFormData({
      full_name: tenant.full_name, phone: tenant.phone, email: tenant.email || '', emergency_contact: tenant.emergency_contact,
      emergency_phone: tenant.emergency_phone, ktp_number: tenant.ktp_number, property_id: tenant.property_id, room_id: tenant.room_id,
      check_in_date: new Date(tenant.check_in_date).toISOString().split('T')[0], contract_duration_months: tenant.contract_duration_months,
      base_monthly_rent: tenant.base_monthly_rent, additional_person_fee: tenant.additional_person_fee, security_deposit: tenant.security_deposit,
      late_fee_percentage: tenant.late_fee_percentage, payment_due_day: tenant.payment_due_day, is_shared_room: tenant.is_shared_room,
      secondary_tenant_name: tenant.secondary_tenant_name || '', secondary_tenant_phone: tenant.secondary_tenant_phone || '',
    });
    setSelectedTenant(tenant); setIsEditMode(true); setIsAddDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total_monthly_rent = formData.base_monthly_rent + (formData.is_shared_room? formData.additional_person_fee : 0);
    const data = {...formData, total_monthly_rent };
    try {
      if (isEditMode && selectedTenant) { await tenantsAPI.update(selectedTenant.id, data); toast.success('Penghuni berhasil diperbarui'); }
      else { await tenantsAPI.create(data); toast.success('Penghuni berhasil ditambahkan'); }
      setIsAddDialogOpen(false); resetForm(); fetchData();
    } catch (error) { toast.error(isEditMode? 'Gagal memperbarui penghuni' : 'Gagal menambahkan penghuni'); }
  };

  const openCheckOutDialog = (tenant: Tenant) => { setSelectedTenant(tenant); setCheckOutReason(''); setIsCheckOutDialogOpen(true); };
  const handleCheckOut = async () => {
    if (!selectedTenant) return;
    try {
      await tenantsAPI.update(selectedTenant.id, { status: 'moved_out', check_out_date: new Date().toISOString(), move_out_reason: checkOutReason || 'Check out manual' });
      toast.success('Penghuni berhasil check out'); setIsCheckOutDialogOpen(false); setSelectedTenant(null); setCheckOutReason(''); fetchData();
    } catch (error) { toast.error('Gagal melakukan check out penghuni'); }
  };
  const handleDelete = async () => {
    if (!selectedTenant) return;
    try { await tenantsAPI.delete(selectedTenant.id); toast.success('Penghuni berhasil dihapus'); setIsDeleteDialogOpen(false); setSelectedTenant(null); fetchData(); }
    catch (error) { toast.error('Gagal menghapus penghuni'); }
  };
  const openDeleteDialog = (tenant: Tenant) => { setSelectedTenant(tenant); setIsDeleteDialogOpen(true); };

  const FormTabs = () => (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3 h-11 sm:h-10">
        <TabsTrigger value="basic" className="text-xs sm:text-sm h-9">Dasar</TabsTrigger>
        <TabsTrigger value="room" className="text-xs sm:text-sm h-9">Kamar</TabsTrigger>
        <TabsTrigger value="vehicle" className="text-xs sm:text-sm h-9">Kendaraan</TabsTrigger>
      </TabsList>
      <TabsContent value="basic" className="space-y-4 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-sm">Nama Lengkap *</Label><Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          <div className="space-y-2"><Label className="text-sm">No Telepon *</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required className="h-11 text-base sm:h-10 sm:text-sm" inputMode="tel" /></div>
          <div className="space-y-2"><Label className="text-sm">Email</Label><Input type="text" inputMode="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          <div className="space-y-2"><Label className="text-sm">Nomor KTP *</Label><Input value={formData.ktp_number} onChange={(e) => setFormData({...formData, ktp_number: e.target.value})} required className="h-11 text-base sm:h-10 sm:text-sm" inputMode="numeric" /></div>
          <div className="space-y-2"><Label className="text-sm">Kontak Darurat *</Label><Input value={formData.emergency_contact} onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          <div className="space-y-2"><Label className="text-sm">Telepon Darurat *</Label><Input value={formData.emergency_phone} onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})} required className="h-11 text-base sm:h-10 sm:text-sm" inputMode="tel" /></div>
        </div>
      </TabsContent>
      <TabsContent value="room" className="space-y-4 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-sm">Properti *</Label>
            <select className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg" value={formData.property_id} onChange={(e) => setFormData({...formData, property_id: e.target.value, room_id: ''})}>
              {properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div className="space-y-2"><Label className="text-sm">Kamar *</Label>
            <select className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg" value={formData.room_id} onChange={(e) => { const room = rooms.find(r => r.id === e.target.value); setFormData({...formData, room_id: e.target.value, base_monthly_rent: room?.base_monthly_rent || 0, security_deposit: room?.base_monthly_rent || 0,});}} required>
              <option value="">Pilih Kamar</option>{getAvailableRooms(formData.property_id).map(r => (<option key={r.id} value={r.id}>{r.room_number} - {formatCurrency(r.base_monthly_rent)}</option>))}
            </select>
          </div>
          <div className="space-y-2"><Label className="text-sm">Tanggal Masuk *</Label><Input type="date" value={formData.check_in_date} onChange={(e) => setFormData({...formData, check_in_date: e.target.value})} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          <div className="space-y-2"><Label className="text-sm">Durasi (bulan) *</Label><Input type="text" inputMode="numeric" value={formData.contract_duration_months} onChange={(e) => setFormData({...formData, contract_duration_months: parseInt(e.target.value) || 0})} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          <div className="space-y-2"><Label className="text-sm">Sewa Dasar *</Label><Input type="text" inputMode="numeric" value={formData.base_monthly_rent} onChange={(e) => setFormData({...formData, base_monthly_rent: parseInt(e.target.value) || 0})} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          <div className="space-y-2"><Label className="text-sm">Deposit *</Label><Input type="text" inputMode="numeric" value={formData.security_deposit} onChange={(e) => setFormData({...formData, security_deposit: parseInt(e.target.value) || 0})} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          <div className="space-y-2"><Label className="text-sm">Jatuh Tempo Tgl *</Label><Input type="text" inputMode="numeric" value={formData.payment_due_day} onChange={(e) => setFormData({...formData, payment_due_day: parseInt(e.target.value) || 1})} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          <div className="col-span-1 sm:col-span-2 flex items-center gap-2 min-h-"><Switch checked={formData.is_shared_room} onCheckedChange={(checked) => setFormData({...formData, is_shared_room: checked})} /><Label className="text-sm">Kamar Bersama (2 orang)</Label></div>
          {formData.is_shared_room && (<>
            <div className="space-y-2"><Label className="text-sm">Nama Penghuni Kedua</Label><Input value={formData.secondary_tenant_name} onChange={(e) => setFormData({...formData, secondary_tenant_name: e.target.value})} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
            <div className="space-y-2"><Label className="text-sm">Telepon Kedua</Label><Input value={formData.secondary_tenant_phone} onChange={(e) => setFormData({...formData, secondary_tenant_phone: e.target.value})} className="h-11 text-base sm:h-10 sm:text-sm" inputMode="tel" /></div>
            <div className="space-y-2"><Label className="text-sm">Biaya Tambahan</Label><Input type="text" inputMode="numeric" value={formData.additional_person_fee} onChange={(e) => setFormData({...formData, additional_person_fee: parseInt(e.target.value) || 0})} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
          </>)}
        </div>
      </TabsContent>
      <TabsContent value="vehicle" className="space-y-4 mt-4"><div className="text-center py-8 text-gray-500"><div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center"><span className="text-2xl">🚗</span></div><p className="text-sm">Fitur kendaraan akan segera hadir</p></div></TabsContent>
    </Tabs>
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Manajemen Penghuni</h1><p className="text-sm sm:text-base text-gray-500">Kelola data penghuni dan kontrak</p></div>
        <Button className="bg-[#1A3D5C] hover:bg-[#0F2744] w-full sm:w-auto h-11 sm:h-10 shrink-0" onClick={openAddDialog}><UserPlus className="w-4 h-4 mr-2" />Tambah Penghuni</Button>
      </div>

      {/* Summary Cards - 1 col mobile, 2 sm, 4 lg */}
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

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center bg-white p-3 sm:p-4 rounded-lg border border-gray-200 w-full">
        <div className="relative w-full sm:flex-1 sm:min-w- sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input type="text" placeholder="Cari nama, telepon, atau KTP..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 text-base sm:h-10 sm:text-sm w-full" />
        </div>
        <div className="hidden sm:block h-8 w-px bg-gray-300" />
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-full sm:w- h-11 sm:h-10 text-base sm:text-sm"><SelectValue placeholder="Pilih Properti" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Semua Properti</SelectItem>{properties.map((property) => (<SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
            <div className="relative w-full sm:w-"><Input type="date" value={selectedDate} disabled className="w-full h-11 sm:h-10 bg-gray-100 cursor-not-allowed text-base sm:text-sm" /><div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 rounded-md pointer-events-none"><span className="text-sm font-medium text-gray-600">Hari Ini</span></div></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-11 sm:h-10">
          <TabsTrigger value="all" className="h-9 text-sm">Semua</TabsTrigger>
          <TabsTrigger value="active" className="h-9 text-sm">Aktif</TabsTrigger>
          <TabsTrigger value="ex-tenant" className="h-9 text-sm">Ex-Penghuni</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && (<div className="text-center py-12"><div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" /><p className="text-gray-500">Memuat data...</p></div>)}

      {/* Tenants Table - Desktop, Cards on Mobile */}
      {!isLoading && (
        <>
          <Card className="hidden sm:block w-full overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Penghuni</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kamar</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kontak</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Sewa/Bulan</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th><th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Aksi</th></tr></thead>
              <tbody className="divide-y">{filteredTenants.map((tenant) => {
                const room = getRoomInfo(tenant.room_id); const property = getPropertyInfo(tenant.property_id);
                return (<tr key={tenant.id} className="hover:bg-gray-50"><td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar className="w-10 h-10"><AvatarFallback className="bg-[#1A3D5C] text-white">{tenant.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar><div><p className="font-medium text-gray-900">{tenant.full_name}</p>{tenant.is_shared_room && tenant.secondary_tenant_name && (<p className="text-xs text-gray-500">+ {tenant.secondary_tenant_name}</p>)}</div></div></td><td className="px-4 py-3"><p className="font-medium">{room?.room_number}</p><p className="text-xs text-gray-500">{property?.name}</p></td><td className="px-4 py-3"><div className="space-y-1"><div className="flex items-center gap-1 text-sm"><Phone className="w-3 h-3 text-gray-400" />{tenant.phone}</div>{tenant.email && (<div className="flex items-center gap-1 text-sm text-gray-500"><Mail className="w-3 h-3" /><span className="truncate max-w-">{tenant.email}</span></div>)}</div></td><td className="px-4 py-3"><p className="font-medium">{formatCurrency(tenant.total_monthly_rent)}</p><p className="text-xs text-gray-500">Jatuh tempo: tanggal {tenant.payment_due_day}</p></td><td className="px-4 py-3"><Badge className={cn(tenant.status === 'active' && "bg-green-100 text-green-700", tenant.status === 'archived' && "bg-gray-100 text-gray-700", tenant.status === 'moved_out' && "bg-orange-100 text-orange-700")}>{tenant.status === 'active'? 'Aktif' : tenant.status === 'archived'? 'Arsip' : 'Keluar'}</Badge></td><td className="px-4 py-3 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setSelectedTenant(tenant)}><Eye className="w-4 h-4 mr-2" />Lihat Detail</DropdownMenuItem><DropdownMenuItem onClick={() => openEditDialog(tenant)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>{tenant.status === 'active' && (<DropdownMenuItem className="text-orange-600" onClick={() => openCheckOutDialog(tenant)}><LogOut className="w-4 h-4 mr-2" />Check Out</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></td></tr>);
              })}</tbody>
            </table></div>
          </Card>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-3 sm:hidden w-full">
            {filteredTenants.map((tenant) => {
              const room = getRoomInfo(tenant.room_id); const property = getPropertyInfo(tenant.property_id);
              return (
                <Card key={tenant.id} className="w-full overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="w-11 h-11 shrink-0"><AvatarFallback className="bg-[#1A3D5C] text-white text-sm">{tenant.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><p className="font-semibold text-gray-900 truncate text-">{tenant.full_name}</p><p className="text-xs text-gray-500 truncate">{room?.room_number} • {property?.name}</p></div><Badge className={cn("shrink-0 text-xs", tenant.status === 'active' && "bg-green-100 text-green-700", tenant.status === 'archived' && "bg-gray-100 text-gray-700", tenant.status === 'moved_out' && "bg-orange-100 text-orange-700")}>{tenant.status === 'active'? 'Aktif' : tenant.status === 'archived'? 'Arsip' : 'Keluar'}</Badge></div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600"><span className="flex items-center gap-1"><Phone className="w-3 h-3" />{tenant.phone}</span><span className="font-medium">{formatCurrency(tenant.total_monthly_rent)}</span></div>
                      </div>
                      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 -mr-2"><MoreHorizontal className="w-5 h-5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setSelectedTenant(tenant)} className="h-11"><Eye className="w-4 h-4 mr-2" />Lihat Detail</DropdownMenuItem><DropdownMenuItem onClick={() => openEditDialog(tenant)} className="h-11"><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>{tenant.status === 'active' && (<DropdownMenuItem className="text-orange-600 h-11" onClick={() => openCheckOutDialog(tenant)}><LogOut className="w-4 h-4 mr-2" />Check Out</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {!isLoading && filteredTenants.length === 0 && (<div className="text-center py-12 bg-gray-50 rounded-lg px-4"><p className="text-gray-500">Tidak ada penghuni ditemukan</p><Button variant="outline" className="mt-4 h-11 w-full sm:w-auto" onClick={openAddDialog}><UserPlus className="w-4 h-4 mr-2" />Tambah Penghuni</Button></div>)}

      {/* Add/Edit */}
      {isMobile? (
        <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col bg-white">
            <SheetHeader className="p-4 border-b shrink-0 text-left"><SheetTitle>{isEditMode? 'Edit Penghuni' : 'Tambah Penghuni Baru'}</SheetTitle><SheetDescription>{isEditMode? 'Perbarui informasi penghuni' : 'Isi informasi penghuni baru'}</SheetDescription></SheetHeader>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)]"><FormTabs /></div>
              <SheetFooter className="p-4 border-t flex-row gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button type="button" variant="outline" className="flex-1 h-11" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Batal</Button><Button type="submit" className="flex-1 bg-[#1A3D5C] hover:bg-[#0F2744] h-11">{isEditMode? 'Simpan' : 'Simpan'}</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-3xl max-h- overflow-y-auto"><DialogHeader><DialogTitle>{isEditMode? 'Edit Penghuni' : 'Tambah Penghuni Baru'}</DialogTitle><DialogDescription>{isEditMode? 'Perbarui informasi penghuni' : 'Isi informasi penghuni baru'}</DialogDescription></DialogHeader><form onSubmit={handleSubmit}><FormTabs /><DialogFooter className="mt-6"><Button type="button" variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Batal</Button><Button type="submit" className="bg-[#1A3D5C] hover:bg-[#0F2744]">{isEditMode? 'Simpan Perubahan' : 'Simpan Penghuni'}</Button></DialogFooter></form></DialogContent>
        </Dialog>
      )}

      {/* Checkout */}
      {isMobile? (
        <Sheet open={isCheckOutDialogOpen} onOpenChange={setIsCheckOutDialogOpen}>
          <SheetContent side="bottom" className="h-auto w-full p-0 flex flex-col bg-white rounded-t-xl">
            <SheetHeader className="p-5 text-left"><SheetTitle className="flex items-center gap-2 text-orange-600"><LogOut className="w-5 h-5" />Check Out Penghuni</SheetTitle><SheetDescription className="text-left text-sm mt-1">Apakah Anda yakin ingin check out <strong>{selectedTenant?.full_name}</strong>?</SheetDescription></SheetHeader>
            <div className="px-5 pb-2 space-y-4"><div className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg"><p className="mb-2 font-medium">Tindakan ini akan:</p><ul className="list-disc list-inside space-y-1 ml-1 text-xs"><li>Mengubah status menjadi "Keluar"</li><li>Mencatat tanggal check out hari ini</li><li>Mengosongkan kamar</li></ul></div><div className="space-y-2"><Label htmlFor="checkOutReasonMobile" className="text-sm">Alasan Check Out (Opsional)</Label><Input id="checkOutReasonMobile" placeholder="Contoh: Kontrak habis, Pindah" value={checkOutReason} onChange={(e) => setCheckOutReason(e.target.value)} className="h-11 text-base" /></div></div>
            <div className="p-4 flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button variant="outline" className="flex-1 h-11" onClick={() => setIsCheckOutDialogOpen(false)}>Batal</Button><Button className="flex-1 bg-orange-600 hover:bg-orange-700 h-11" onClick={handleCheckOut}><LogOut className="w-4 h-4 mr-2" />Check Out</Button></div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isCheckOutDialogOpen} onOpenChange={setIsCheckOutDialogOpen}>
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2 text-orange-600"><LogOut className="w-5 h-5" />Check Out Penghuni</DialogTitle><DialogDescription>Apakah Anda yakin ingin check out penghuni <strong>{selectedTenant?.full_name}</strong>?</DialogDescription></DialogHeader>
            <div className="space-y-4"><div className="text-sm text-gray-600"><p className="mb-2">Tindakan ini akan:</p><ul className="list-disc list-inside space-y-1 ml-1"><li>Mengubah status menjadi "Keluar"</li><li>Mencatat tanggal check out hari ini</li><li>Mengosongkan kamar yang ditempati</li></ul></div><div className="space-y-2"><Label htmlFor="checkOutReason">Alasan Check Out (Opsional)</Label><Input id="checkOutReason" placeholder="Contoh: Kontrak habis, Pindah, dll" value={checkOutReason} onChange={(e) => setCheckOutReason(e.target.value)} /></div></div>
            <DialogFooter className="mt-4"><Button variant="outline" onClick={() => setIsCheckOutDialogOpen(false)}>Batal</Button><Button className="bg-orange-600 hover:bg-orange-700" onClick={handleCheckOut}><LogOut className="w-4 h-4 mr-2" />Check Out</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Detail - Sheet mobile */}
      {isMobile? (
        <Sheet open={!!selectedTenant &&!isAddDialogOpen &&!isDeleteDialogOpen &&!isCheckOutDialogOpen} onOpenChange={() => setSelectedTenant(null)}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col bg-white">
            {selectedTenant && (
              <>
                <SheetHeader className="p-4 border-b shrink-0 text-left">
                  <SheetTitle className="flex items-center gap-2">
                    <Avatar className="w-10 h-10"><AvatarFallback className="bg-[#1A3D5C] text-white">{selectedTenant.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                    <div className="min-w-0"><p className="truncate">{selectedTenant.full_name}</p><p className="text-xs font-normal text-gray-500 truncate">KTP: {selectedTenant.ktp_number}</p></div>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                  <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-11 rounded-none border-b sticky top-0 bg-white z-10"><TabsTrigger value="info" className="h-9 text-xs">Info</TabsTrigger><TabsTrigger value="room" className="h-9 text-xs">Kamar</TabsTrigger><TabsTrigger value="payment" className="h-9 text-xs">Bayar</TabsTrigger></TabsList>
                    <div className="p-4 pb-[env(safe-area-inset-bottom)]">
                      <TabsContent value="info" className="space-y-4 mt-0">
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div><Label className="text-xs text-gray-500">Nama Lengkap</Label><p className="font-medium break-words">{selectedTenant.full_name}</p></div>
                          <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs text-gray-500">Telepon</Label><p className="font-medium">{selectedTenant.phone}</p></div><div><Label className="text-xs text-gray-500">Email</Label><p className="font-medium truncate">{selectedTenant.email || '-'}</p></div></div>
                          <div><Label className="text-xs text-gray-500">KTP</Label><p className="font-medium">{selectedTenant.ktp_number}</p></div>
                          <div><Label className="text-xs text-gray-500">Kontak Darurat</Label><p className="font-medium">{selectedTenant.emergency_contact}</p><p className="text-xs text-gray-500">{selectedTenant.emergency_phone}</p></div>
                          <div><Label className="text-xs text-gray-500">Status</Label><div className="mt-1"><Badge className={cn(selectedTenant.status === 'active' && "bg-green-100 text-green-700", selectedTenant.status === 'archived' && "bg-gray-100 text-gray-700", selectedTenant.status === 'moved_out' && "bg-orange-100 text-orange-700")}>{selectedTenant.status === 'active'? 'Aktif' : selectedTenant.status === 'archived'? 'Arsip' : 'Keluar'}</Badge></div></div>
                          {selectedTenant.check_out_date && (<div><Label className="text-xs text-gray-500">Tanggal Check Out</Label><p className="font-medium text-orange-600">{formatDate(selectedTenant.check_out_date)}</p>{selectedTenant.move_out_reason && (<p className="text-xs text-gray-500 mt-1 break-words">Alasan: {selectedTenant.move_out_reason}</p>)}</div>)}
                        </div>
                      </TabsContent>
                      <TabsContent value="room" className="space-y-4 mt-0">
                        {(() => { const room = getRoomInfo(selectedTenant.room_id); const property = getPropertyInfo(selectedTenant.property_id); return (<><div className="grid grid-cols-2 gap-3 text-sm"><div><Label className="text-xs text-gray-500">Properti</Label><p className="font-medium truncate">{property?.name}</p></div><div><Label className="text-xs text-gray-500">Kamar</Label><p className="font-medium">{room?.room_number}</p></div><div><Label className="text-xs text-gray-500">Tipe</Label><p className="font-medium capitalize">{room?.room_type}</p></div><div><Label className="text-xs text-gray-500">Okupansi</Label><p className="font-medium">{selectedTenant.is_shared_room? 'Bersama' : 'Single'}</p></div><div><Label className="text-xs text-gray-500">Masuk</Label><p className="font-medium">{formatDate(selectedTenant.check_in_date)}</p></div><div><Label className="text-xs text-gray-500">Durasi</Label><p className="font-medium">{selectedTenant.contract_duration_months} bln</p></div><div><Label className="text-xs text-gray-500">Sewa</Label><p className="font-medium">{formatCurrency(selectedTenant.total_monthly_rent)}</p></div><div><Label className="text-xs text-gray-500">Deposit</Label><p className="font-medium">{formatCurrency(selectedTenant.security_deposit)}</p></div></div>{selectedTenant.is_shared_room && selectedTenant.secondary_tenant_name && (<div className="border-t pt-4"><h4 className="font-semibold mb-2 text-sm">Penghuni Tambahan</h4><div className="bg-gray-50 p-3 rounded-lg text-sm"><p className="font-medium">{selectedTenant.secondary_tenant_name}</p><p className="text-xs text-gray-500">{selectedTenant.secondary_tenant_phone}</p><p className="text-xs text-gray-500 mt-1">Tambahan: {formatCurrency(selectedTenant.additional_person_fee)}/bln</p></div></div>)}</>);})()}
                      </TabsContent>
                      <TabsContent value="payment" className="space-y-3 mt-0">
                        {getTenantPayments(selectedTenant.id).length === 0? <p className="text-sm text-gray-500 py-4 text-center">Belum ada pembayaran</p> : getTenantPayments(selectedTenant.id).map((payment) => (
                          <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"><div><p className="text-sm font-medium">{payment.payment_period}</p><p className="text-xs text-gray-500">{payment.payment_date? formatDate(payment.payment_date) : 'Belum bayar'}</p></div><div className="text-right"><p className="text-sm font-medium">{formatCurrency(payment.total_amount)}</p><Badge className={cn("text-white text-xs mt-1", getPaymentStatusColor(payment.payment_status))}>{getPaymentStatusLabel(payment.payment_status)}</Badge></div></div>
                        ))}
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
                <div className="p-4 border-t flex gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setSelectedTenant(null)}>Tutup</Button>
                  <Button className="flex-1 bg-[#1A3D5C] hover:bg-[#0F2744] h-11" onClick={() => { const t = selectedTenant; setSelectedTenant(null); setTimeout(() => t && openEditDialog(t), 100); }}><Edit className="w-4 h-4 mr-2" />Edit</Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedTenant &&!isAddDialogOpen &&!isDeleteDialogOpen &&!isCheckOutDialogOpen} onOpenChange={() => setSelectedTenant(null)}>
          <DialogContent className="max-w-4xl max-h- overflow-auto">
            {selectedTenant && (
              <>
                <DialogHeader><DialogTitle className="flex items-center gap-2"><Avatar className="w-10 h-10"><AvatarFallback className="bg-[#1A3D5C] text-white">{selectedTenant.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar><div><p>{selectedTenant.full_name}</p><p className="text-sm font-normal text-gray-500">KTP: {selectedTenant.ktp_number}</p></div></DialogTitle></DialogHeader>
                <Tabs defaultValue="info" className="w-full"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="info">Informasi</TabsTrigger><TabsTrigger value="room">Kamar</TabsTrigger><TabsTrigger value="payment">Pembayaran</TabsTrigger></TabsList>
                  <TabsContent value="info" className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><Label className="text-gray-500">Nama Lengkap</Label><p className="font-medium">{selectedTenant.full_name}</p></div><div><Label className="text-gray-500">Nomor Telepon</Label><p className="font-medium">{selectedTenant.phone}</p></div><div><Label className="text-gray-500">Email</Label><p className="font-medium">{selectedTenant.email || '-'}</p></div><div><Label className="text-gray-500">Nomor KTP</Label><p className="font-medium">{selectedTenant.ktp_number}</p></div><div><Label className="text-gray-500">Kontak Darurat</Label><p className="font-medium">{selectedTenant.emergency_contact}</p><p className="text-sm text-gray-500">{selectedTenant.emergency_phone}</p></div><div><Label className="text-gray-500">Status</Label><Badge className={cn(selectedTenant.status === 'active' && "bg-green-100 text-green-700", selectedTenant.status === 'archived' && "bg-gray-100 text-gray-700", selectedTenant.status === 'moved_out' && "bg-orange-100 text-orange-700")}>{selectedTenant.status === 'active'? 'Aktif' : selectedTenant.status === 'archived'? 'Arsip' : 'Keluar'}</Badge></div>{selectedTenant.check_out_date && (<div className="col-span-2"><Label className="text-gray-500">Tanggal Check Out</Label><p className="font-medium text-orange-600">{formatDate(selectedTenant.check_out_date)}</p>{selectedTenant.move_out_reason && (<p className="text-sm text-gray-500 mt-1">Alasan: {selectedTenant.move_out_reason}</p>)}</div>)}</div></TabsContent>
                  <TabsContent value="room" className="space-y-4">{(() => { const room = getRoomInfo(selectedTenant.room_id); const property = getPropertyInfo(selectedTenant.property_id); return (<><div className="grid grid-cols-2 gap-4"><div><Label className="text-gray-500">Properti</Label><p className="font-medium">{property?.name}</p></div><div><Label className="text-gray-500">Nomor Kamar</Label><p className="font-medium">{room?.room_number}</p></div><div><Label className="text-gray-500">Tipe Kamar</Label><p className="font-medium capitalize">{room?.room_type}</p></div><div><Label className="text-gray-500">Tipe Okupansi</Label><p className="font-medium">{selectedTenant.is_shared_room? 'Bersama (2 orang)' : 'Single'}</p></div><div><Label className="text-gray-500">Tanggal Masuk</Label><p className="font-medium">{formatDate(selectedTenant.check_in_date)}</p></div><div><Label className="text-gray-500">Durasi Kontrak</Label><p className="font-medium">{selectedTenant.contract_duration_months} bulan</p></div><div><Label className="text-gray-500">Sewa per Bulan</Label><p className="font-medium">{formatCurrency(selectedTenant.total_monthly_rent)}</p></div><div><Label className="text-gray-500">Deposit</Label><p className="font-medium">{formatCurrency(selectedTenant.security_deposit)}</p></div></div>{selectedTenant.is_shared_room && selectedTenant.secondary_tenant_name && (<div className="border-t pt-4"><h4 className="font-semibold mb-2">Penghuni Tambahan</h4><div className="bg-gray-50 p-4 rounded-lg"><p className="font-medium">{selectedTenant.secondary_tenant_name}</p><p className="text-sm text-gray-500">{selectedTenant.secondary_tenant_phone}</p><p className="text-sm text-gray-500 mt-1">Biaya Tambahan: {formatCurrency(selectedTenant.additional_person_fee)}/bulan</p></div></div>)}</>);})()}</TabsContent>
                  <TabsContent value="payment" className="space-y-4"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Periode</th><th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Jumlah</th><th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th><th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Tanggal Bayar</th></tr></thead><tbody className="divide-y">{getTenantPayments(selectedTenant.id).map((payment) => (<tr key={payment.id}><td className="px-4 py-2">{payment.payment_period}</td><td className="px-4 py-2 text-right font-medium">{formatCurrency(payment.total_amount)}</td><td className="px-4 py-2"><Badge className={cn("text-white", getPaymentStatusColor(payment.payment_status))}>{getPaymentStatusLabel(payment.payment_status)}</Badge></td><td className="px-4 py-2">{payment.payment_date? formatDate(payment.payment_date) : '-'}</td></tr>))}</tbody></table></div></TabsContent>
                </Tabs>
                <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setSelectedTenant(null)}>Tutup</Button>{selectedTenant.status === 'active' && (<Button variant="outline" className="text-orange-600 border-orange-600 hover:bg-orange-50" onClick={() => { setSelectedTenant(null); setTimeout(() => openCheckOutDialog(selectedTenant), 100); }}><LogOut className="w-4 h-4 mr-2" />Check Out</Button>)}<Button className="bg-[#1A3D5C] hover:bg-[#0F2744]" onClick={() => { setSelectedTenant(null); setTimeout(() => openEditDialog(selectedTenant), 100); }}><Edit className="w-4 h-4 mr-2" />Edit Penghuni</Button></DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete */}
      {isMobile? (
        <Sheet open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <SheetContent side="bottom" className="h-auto w-full p-0 flex flex-col bg-white rounded-t-xl">
            <SheetHeader className="p-5 text-left"><SheetTitle>Konfirmasi Hapus</SheetTitle><SheetDescription className="text-left">Apakah Anda yakin ingin menghapus penghuni <strong>{selectedTenant?.full_name}</strong>? Tindakan ini tidak dapat dibatalkan.</SheetDescription></SheetHeader>
            <div className="p-4 flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button variant="outline" className="flex-1 h-11" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button><Button variant="destructive" className="flex-1 h-11" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button></div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Konfirmasi Hapus</DialogTitle><DialogDescription>Apakah Anda yakin ingin menghapus penghuni <strong>{selectedTenant?.full_name}</strong>? Tindakan ini tidak dapat dibatalkan.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button><Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button></DialogFooter></DialogContent>
        </Dialog>
      )}
    </div>
  );
}