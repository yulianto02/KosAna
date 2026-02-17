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

export function Tenants() {
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
  
  // New filter states
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Form state - using snake_case to match PostgreSQL/types
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

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tenantsRes, propertiesRes, roomsRes, paymentsRes] = await Promise.all([
        tenantsAPI.getAll(),
        propertiesAPI.getAll(),
        roomsAPI.getAll(),
        paymentsAPI.getAll(),
      ]);
      setTenants(tenantsRes);
      setProperties(propertiesRes);
      setRooms(roomsRes);
      setPayments(paymentsRes);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const stats = properties.map(property => {
      // Count active tenants for this property
      const propertyTenants = tenants.filter(t => 
        t.property_id === property.id && t.status === 'active'
      );
      
      // Count shared rooms as 2 tenants capacity if occupied by shared room tenant
      const activeTenantCount = propertyTenants.reduce((acc, tenant) => {
        return acc + (tenant.is_shared_room ? 2 : 1);
      }, 0);
      
      return {
        propertyId: property.id,
        propertyName: property.name,
        totalRooms: property.total_rooms,
        activeTenants: activeTenantCount,
        occupancyRate: property.total_rooms > 0 ? (activeTenantCount / property.total_rooms) * 100 : 0
      };
    });

    const totalStats = {
      totalRooms: properties.reduce((acc, p) => acc + p.total_rooms, 0),
      totalActiveTenants: stats.reduce((acc, s) => acc + s.activeTenants, 0),
    };

    return { propertyStats: stats, totalStats };
  }, [tenants, properties]);

  // Filter tenants - using snake_case
  const filteredTenants = tenants.filter(tenant => {
    // Property filter
    if (selectedProperty !== 'all' && tenant.property_id !== selectedProperty) {
      return false;
    }
    
    // Search filter
    const matchesSearch = 
      tenant.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.phone?.includes(searchQuery) ||
      tenant.ktp_number?.includes(searchQuery);
    
    // Tab filter
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && tenant.status === 'active';
    if (activeTab === 'ex-tenant') return matchesSearch && (tenant.status === 'moved_out' || tenant.status === 'archived');
    return matchesSearch;
  });

  // Get room info - using snake_case
  const getRoomInfo = (roomId: string) => rooms.find(r => r.id === roomId);
  const getPropertyInfo = (propertyId: string) => properties.find(p => p.id === propertyId);
  const getTenantPayments = (tenantId: string) => payments.filter(p => p.tenant_id === tenantId).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Get available rooms for selected property - using snake_case
  const getAvailableRooms = (propertyId: string) => {
    return rooms.filter(r => r.property_id === propertyId && (r.status === 'available' || r.status === 'occupied'));
  };

  // Reset form - using snake_case
  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      emergency_contact: '',
      emergency_phone: '',
      ktp_number: '',
      property_id: properties[0]?.id || '',
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
    setIsEditMode(false);
  };

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // Open edit dialog - using snake_case
  const openEditDialog = (tenant: Tenant) => {
    setFormData({
      full_name: tenant.full_name,
      phone: tenant.phone,
      email: tenant.email || '',
      emergency_contact: tenant.emergency_contact,
      emergency_phone: tenant.emergency_phone,
      ktp_number: tenant.ktp_number,
      property_id: tenant.property_id,
      room_id: tenant.room_id,
      check_in_date: new Date(tenant.check_in_date).toISOString().split('T')[0],
      contract_duration_months: tenant.contract_duration_months,
      base_monthly_rent: tenant.base_monthly_rent,
      additional_person_fee: tenant.additional_person_fee,
      security_deposit: tenant.security_deposit,
      late_fee_percentage: tenant.late_fee_percentage,
      payment_due_day: tenant.payment_due_day,
      is_shared_room: tenant.is_shared_room,
      secondary_tenant_name: tenant.secondary_tenant_name || '',
      secondary_tenant_phone: tenant.secondary_tenant_phone || '',
    });
    setSelectedTenant(tenant);
    setIsEditMode(true);
    setIsAddDialogOpen(true);
  };

  // Handle form submit - using snake_case
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const total_monthly_rent = formData.base_monthly_rent + (formData.is_shared_room ? formData.additional_person_fee : 0);
    const data = { ...formData, total_monthly_rent };

    console.log('Data being sent to API:', JSON.stringify(data, null, 2));

    
    try {
      if (isEditMode && selectedTenant) {
        await tenantsAPI.update(selectedTenant.id, data);
        toast.success('Penghuni berhasil diperbarui');
      } else {
        await tenantsAPI.create(data);
        toast.success('Penghuni berhasil ditambahkan');
      }
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(isEditMode ? 'Gagal memperbarui penghuni' : 'Gagal menambahkan penghuni');
    }
  };

  // Open check out dialog
  const openCheckOutDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setCheckOutReason('');
    setIsCheckOutDialogOpen(true);
  };

  // Handle check out
  const handleCheckOut = async () => {
    if (!selectedTenant) return;
    
    try {
      const checkOutData = {
        status: 'moved_out',
        check_out_date: new Date().toISOString(),
        move_out_reason: checkOutReason || 'Check out manual',
      };
      
      await tenantsAPI.update(selectedTenant.id, checkOutData);
      toast.success('Penghuni berhasil check out');
      setIsCheckOutDialogOpen(false);
      setSelectedTenant(null);
      setCheckOutReason('');
      fetchData();
    } catch (error) {
      toast.error('Gagal melakukan check out penghuni');
      console.error('Check out error:', error);
    }
  };

  // Delete tenant
  const handleDelete = async () => {
    if (!selectedTenant) return;
    try {
      await tenantsAPI.delete(selectedTenant.id);
      toast.success('Penghuni berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setSelectedTenant(null);
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus penghuni');
    }
  };

  // Open delete dialog
  const openDeleteDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Penghuni</h1>
          <p className="text-gray-500">Kelola data penghuni dan kontrak</p>
        </div>
        <Button 
          className="bg-[#1A3D5C] hover:bg-[#0F2744]"
          onClick={openAddDialog}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Tambah Penghuni
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.propertyStats.map((stat) => (
          <Card key={stat.propertyId} className="border-l-4 border-l-[#1A3D5C]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">{stat.propertyName}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {stat.activeTenants}/{stat.totalRooms}
                    </span>
                    <span className="text-sm text-gray-500">penghuni</span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#1A3D5C] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(stat.occupancyRate, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.occupancyRate.toFixed(1)}% terisi
                    </p>
                  </div>
                </div>
                <Building2 className="w-8 h-8 text-[#1A3D5C] opacity-20" />
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Total Summary Card */}
        <Card className="bg-[#1A3D5C] text-white border-l-4 border-l-[#0F2744]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100 mb-1">Total Semua Properti</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {summaryStats.totalStats.totalActiveTenants}/{summaryStats.totalStats.totalRooms}
                  </span>
                  <span className="text-sm text-blue-200">penghuni</span>
                </div>
                <p className="text-xs text-blue-200 mt-2">
                  {summaryStats.totalStats.totalRooms > 0 
                    ? ((summaryStats.totalStats.totalActiveTenants / summaryStats.totalStats.totalRooms) * 100).toFixed(1)
                    : 0}% okupansi total
                </p>
              </div>
              <Users className="w-8 h-8 text-white opacity-30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        {/* Search */}
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari penghuni berdasarkan nama, telepon, atau KTP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="h-8 w-px bg-gray-300 hidden md:block" />

        {/* Property Dropdown */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Properti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Properti</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Picker Placeholder */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <div className="relative">
            <Input
              type="date"
              value={selectedDate}
              disabled
              className="w-[150px] bg-gray-100 cursor-not-allowed"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 rounded-md pointer-events-none">
              <span className="text-sm font-medium text-gray-600">Hari Ini</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="active">Aktif</TabsTrigger>
          <TabsTrigger value="ex-tenant">Ex-Penghuni</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Memuat data...</p>
        </div>
      )}

      {/* Tenants Table - using snake_case */}
      {!isLoading && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Penghuni</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kamar</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kontak</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Sewa/Bulan</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTenants.map((tenant) => {
                  const room = getRoomInfo(tenant.room_id);
                  const property = getPropertyInfo(tenant.property_id);
                  return (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-[#1A3D5C] text-white">
                              {tenant.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{tenant.full_name}</p>
                            {tenant.is_shared_room && tenant.secondary_tenant_name && (
                              <p className="text-xs text-gray-500">+ {tenant.secondary_tenant_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{room?.room_number}</p>
                        <p className="text-xs text-gray-500">{property?.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {tenant.phone}
                          </div>
                          {tenant.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{tenant.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{formatCurrency(tenant.total_monthly_rent)}</p>
                        <p className="text-xs text-gray-500">
                          Jatuh tempo: tanggal {tenant.payment_due_day}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn(
                          tenant.status === 'active' && "bg-green-100 text-green-700",
                          tenant.status === 'archived' && "bg-gray-100 text-gray-700",
                          tenant.status === 'moved_out' && "bg-orange-100 text-orange-700",
                        )}>
                          {tenant.status === 'active' ? 'Aktif' : 
                           tenant.status === 'archived' ? 'Arsip' : 'Keluar'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedTenant(tenant)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(tenant)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {tenant.status === 'active' && (
                              <DropdownMenuItem 
                                className="text-orange-600"
                                onClick={() => openCheckOutDialog(tenant)}
                              >
                                <LogOut className="w-4 h-4 mr-2" />
                                Check Out
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
      {!isLoading && filteredTenants.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Tidak ada penghuni ditemukan</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={openAddDialog}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah Penghuni
          </Button>
        </div>
      )}

      {/* Add/Edit Tenant Dialog - using snake_case in form */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Penghuni' : 'Tambah Penghuni Baru'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Perbarui informasi penghuni' : 'Isi informasi penghuni baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
                <TabsTrigger value="room">Kamar & Kontrak</TabsTrigger>
                <TabsTrigger value="vehicle">Kendaraan</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nama Lengkap *</Label>
                    <Input 
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon *</Label>
                    <Input 
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ktp_number">Nomor KTP *</Label>
                    <Input 
                      id="ktp_number"
                      value={formData.ktp_number}
                      onChange={(e) => setFormData({...formData, ktp_number: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact">Kontak Darurat *</Label>
                    <Input 
                      id="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_phone">Telepon Darurat *</Label>
                    <Input 
                      id="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="room" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="property">Properti *</Label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      value={formData.property_id}
                      onChange={(e) => setFormData({...formData, property_id: e.target.value, room_id: ''})}
                    >
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room">Kamar *</Label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      value={formData.room_id}
                      onChange={(e) => {
                        const room = rooms.find(r => r.id === e.target.value);
                        setFormData({
                          ...formData, 
                          room_id: e.target.value,
                          base_monthly_rent: room?.base_monthly_rent || 0,
                          security_deposit: room?.base_monthly_rent || 0,
                        });
                      }}
                      required
                    >
                      <option value="">Pilih Kamar</option>
                      {getAvailableRooms(formData.property_id).map(r => (
                        <option key={r.id} value={r.id}>{r.room_number} - {formatCurrency(r.base_monthly_rent)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="check_in_date">Tanggal Masuk *</Label>
                    <Input 
                      id="check_in_date"
                      type="date"
                      value={formData.check_in_date}
                      onChange={(e) => setFormData({...formData, check_in_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contract_duration_months">Durasi Kontrak (bulan) *</Label>
                    <Input 
                      id="contract_duration_months"
                      type="number"
                      min={1}
                      value={formData.contract_duration_months}
                      onChange={(e) => setFormData({...formData, contract_duration_months: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base_monthly_rent">Sewa Dasar *</Label>
                    <Input 
                      id="base_monthly_rent"
                      type="number"
                      value={formData.base_monthly_rent}
                      onChange={(e) => setFormData({...formData, base_monthly_rent: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="security_deposit">Deposit *</Label>
                    <Input 
                      id="security_deposit"
                      type="number"
                      value={formData.security_deposit}
                      onChange={(e) => setFormData({...formData, security_deposit: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_due_day">Tanggal Jatuh Tempo *</Label>
                    <Input 
                      id="payment_due_day"
                      type="number"
                      min={1}
                      max={31}
                      value={formData.payment_due_day}
                      onChange={(e) => setFormData({...formData, payment_due_day: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Switch 
                      checked={formData.is_shared_room}
                      onCheckedChange={(checked) => setFormData({...formData, is_shared_room: checked})}
                    />
                    <Label>Kamar Bersama (2 orang)</Label>
                  </div>
                  {formData.is_shared_room && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="secondary_tenant_name">Nama Penghuni Kedua</Label>
                        <Input 
                          id="secondary_tenant_name"
                          value={formData.secondary_tenant_name}
                          onChange={(e) => setFormData({...formData, secondary_tenant_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondary_tenant_phone">Telepon Penghuni Kedua</Label>
                        <Input 
                          id="secondary_tenant_phone"
                          value={formData.secondary_tenant_phone}
                          onChange={(e) => setFormData({...formData, secondary_tenant_phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="additional_person_fee">Biaya Tambahan</Label>
                        <Input 
                          id="additional_person_fee"
                          type="number"
                          value={formData.additional_person_fee}
                          onChange={(e) => setFormData({...formData, additional_person_fee: parseInt(e.target.value)})}
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="vehicle" className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🚗</span>
                  </div>
                  <p>Fitur kendaraan akan segera hadir</p>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Batal
              </Button>
              <Button 
                type="submit"
                className="bg-[#1A3D5C] hover:bg-[#0F2744]"
              >
                {isEditMode ? 'Simpan Perubahan' : 'Simpan Penghuni'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Check Out Confirmation Dialog */}
      <Dialog open={isCheckOutDialogOpen} onOpenChange={setIsCheckOutDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <LogOut className="w-5 h-5" />
              Check Out Penghuni
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin check out penghuni <strong>{selectedTenant?.full_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">Tindakan ini akan:</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>Mengubah status menjadi "Keluar"</li>
                <li>Mencatat tanggal check out hari ini</li>
                <li>Mengosongkan kamar yang ditempati</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkOutReason">Alasan Check Out (Opsional)</Label>
              <Input
                id="checkOutReason"
                placeholder="Contoh: Kontrak habis, Pindah, dll"
                value={checkOutReason}
                onChange={(e) => setCheckOutReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCheckOutDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              variant="default"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleCheckOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Check Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tenant Detail Dialog - using snake_case */}
      <Dialog open={!!selectedTenant && !isAddDialogOpen && !isDeleteDialogOpen && !isCheckOutDialogOpen} onOpenChange={() => setSelectedTenant(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {selectedTenant && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-[#1A3D5C] text-white">
                      {selectedTenant.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedTenant.full_name}</p>
                    <p className="text-sm font-normal text-gray-500">
                      KTP: {selectedTenant.ktp_number}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informasi</TabsTrigger>
                  <TabsTrigger value="room">Kamar</TabsTrigger>
                  <TabsTrigger value="payment">Pembayaran</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500">Nama Lengkap</Label>
                      <p className="font-medium">{selectedTenant.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Nomor Telepon</Label>
                      <p className="font-medium">{selectedTenant.phone}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Email</Label>
                      <p className="font-medium">{selectedTenant.email || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Nomor KTP</Label>
                      <p className="font-medium">{selectedTenant.ktp_number}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Kontak Darurat</Label>
                      <p className="font-medium">{selectedTenant.emergency_contact}</p>
                      <p className="text-sm text-gray-500">{selectedTenant.emergency_phone}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Status</Label>
                      <Badge className={cn(
                        selectedTenant.status === 'active' && "bg-green-100 text-green-700",
                        selectedTenant.status === 'archived' && "bg-gray-100 text-gray-700",
                        selectedTenant.status === 'moved_out' && "bg-orange-100 text-orange-700",
                      )}>
                        {selectedTenant.status === 'active' ? 'Aktif' : 
                         selectedTenant.status === 'archived' ? 'Arsip' : 'Keluar'}
                      </Badge>
                    </div>
                    {selectedTenant.check_out_date && (
                      <div className="col-span-2">
                        <Label className="text-gray-500">Tanggal Check Out</Label>
                        <p className="font-medium text-orange-600">
                          {formatDate(selectedTenant.check_out_date)}
                        </p>
                        {selectedTenant.move_out_reason && (
                          <p className="text-sm text-gray-500 mt-1">
                            Alasan: {selectedTenant.move_out_reason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="room" className="space-y-4">
                  {(() => {
                    const room = getRoomInfo(selectedTenant.room_id);
                    const property = getPropertyInfo(selectedTenant.property_id);
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-500">Properti</Label>
                            <p className="font-medium">{property?.name}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Nomor Kamar</Label>
                            <p className="font-medium">{room?.room_number}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Tipe Kamar</Label>
                            <p className="font-medium capitalize">{room?.room_type}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Tipe Okupansi</Label>
                            <p className="font-medium">
                              {selectedTenant.is_shared_room ? 'Bersama (2 orang)' : 'Single'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Tanggal Masuk</Label>
                            <p className="font-medium">{formatDate(selectedTenant.check_in_date)}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Durasi Kontrak</Label>
                            <p className="font-medium">{selectedTenant.contract_duration_months} bulan</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Sewa per Bulan</Label>
                            <p className="font-medium">{formatCurrency(selectedTenant.total_monthly_rent)}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Deposit</Label>
                            <p className="font-medium">{formatCurrency(selectedTenant.security_deposit)}</p>
                          </div>
                        </div>

                        {selectedTenant.is_shared_room && selectedTenant.secondary_tenant_name && (
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Penghuni Tambahan</h4>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="font-medium">{selectedTenant.secondary_tenant_name}</p>
                              <p className="text-sm text-gray-500">{selectedTenant.secondary_tenant_phone}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                Biaya Tambahan: {formatCurrency(selectedTenant.additional_person_fee)}/bulan
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </TabsContent>

                <TabsContent value="payment" className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Periode</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Jumlah</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Tanggal Bayar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {getTenantPayments(selectedTenant.id).map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-4 py-2">{payment.payment_period}</td>
                            <td className="px-4 py-2 text-right font-medium">
                              {formatCurrency(payment.total_amount)}
                            </td>
                            <td className="px-4 py-2">
                              <Badge className={cn("text-white", getPaymentStatusColor(payment.payment_status))}>
                                {getPaymentStatusLabel(payment.payment_status)}
                              </Badge>
                            </td>
                            <td className="px-4 py-2">
                              {payment.payment_date ? formatDate(payment.payment_date) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedTenant(null)}>
                  Tutup
                </Button>
                {selectedTenant.status === 'active' && (
                  <Button 
                    variant="outline"
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                    onClick={() => {
                      setSelectedTenant(null);
                      setTimeout(() => openCheckOutDialog(selectedTenant), 100);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Check Out
                  </Button>
                )}
                <Button 
                  className="bg-[#1A3D5C] hover:bg-[#0F2744]"
                  onClick={() => {
                    setSelectedTenant(null);
                    setTimeout(() => openEditDialog(selectedTenant), 100);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Penghuni
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - using snake_case */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus penghuni <strong>{selectedTenant?.full_name}</strong>? 
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