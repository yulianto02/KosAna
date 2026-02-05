import { useState, useEffect } from 'react';
import { Search, Eye, Edit, Trash2, MoreHorizontal, Phone, Mail, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
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

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    emergencyContact: '',
    emergencyPhone: '',
    ktpNumber: '',
    propertyId: '',
    roomId: '',
    checkInDate: new Date().toISOString().split('T')[0],
    contractDurationMonths: 12,
    baseMonthlyRent: 0,
    additionalPersonFee: 0,
    securityDeposit: 0,
    lateFeePercentage: 5,
    paymentDueDay: 1,
    isSharedRoom: false,
    secondaryTenantName: '',
    secondaryTenantPhone: '',
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

  // Filter tenants
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.phone.includes(searchQuery) ||
      tenant.ktpNumber.includes(searchQuery);
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && tenant.status === 'active';
    if (activeTab === 'archived') return matchesSearch && tenant.status === 'archived';
    return matchesSearch;
  });

  // Get room info
  const getRoomInfo = (roomId: string) => rooms.find(r => r.id === roomId);
  const getPropertyInfo = (propertyId: string) => properties.find(p => p.id === propertyId);
  const getTenantPayments = (tenantId: string) => payments.filter(p => p.tenantId === tenantId).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Get available rooms for selected property
  const getAvailableRooms = (propertyId: string) => {
    return rooms.filter(r => r.propertyId === propertyId && (r.status === 'available' || r.status === 'occupied'));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      emergencyContact: '',
      emergencyPhone: '',
      ktpNumber: '',
      propertyId: properties[0]?.id || '',
      roomId: '',
      checkInDate: new Date().toISOString().split('T')[0],
      contractDurationMonths: 12,
      baseMonthlyRent: 0,
      additionalPersonFee: 0,
      securityDeposit: 0,
      lateFeePercentage: 5,
      paymentDueDay: 1,
      isSharedRoom: false,
      secondaryTenantName: '',
      secondaryTenantPhone: '',
    });
    setIsEditMode(false);
  };

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (tenant: Tenant) => {
    setFormData({
      fullName: tenant.fullName,
      phone: tenant.phone,
      email: tenant.email || '',
      emergencyContact: tenant.emergencyContact,
      emergencyPhone: tenant.emergencyPhone,
      ktpNumber: tenant.ktpNumber,
      propertyId: tenant.propertyId,
      roomId: tenant.roomId,
      checkInDate: new Date(tenant.checkInDate).toISOString().split('T')[0],
      contractDurationMonths: tenant.contractDurationMonths,
      baseMonthlyRent: tenant.baseMonthlyRent,
      additionalPersonFee: tenant.additionalPersonFee,
      securityDeposit: tenant.securityDeposit,
      lateFeePercentage: tenant.lateFeePercentage,
      paymentDueDay: tenant.paymentDueDay,
      isSharedRoom: tenant.isSharedRoom,
      secondaryTenantName: tenant.secondaryTenantName || '',
      secondaryTenantPhone: tenant.secondaryTenantPhone || '',
    });
    setSelectedTenant(tenant);
    setIsEditMode(true);
    setIsAddDialogOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalMonthlyRent = formData.baseMonthlyRent + (formData.isSharedRoom ? formData.additionalPersonFee : 0);
    const data = { ...formData, totalMonthlyRent };
    
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

  // Archive tenant
  const handleArchive = async (tenantId: string) => {
    try {
      await tenantsAPI.update(tenantId, { status: 'archived' });
      toast.success('Penghuni berhasil diarsipkan');
      fetchData();
    } catch (error) {
      toast.error('Gagal mengarsipkan penghuni');
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari penghuni berdasarkan nama, telepon, atau KTP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="active">Aktif</TabsTrigger>
          <TabsTrigger value="archived">Arsip</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Memuat data...</p>
        </div>
      )}

      {/* Tenants Table */}
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
                  const room = getRoomInfo(tenant.roomId);
                  const property = getPropertyInfo(tenant.propertyId);
                  return (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-[#1A3D5C] text-white">
                              {tenant.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{tenant.fullName}</p>
                            {tenant.isSharedRoom && tenant.secondaryTenantName && (
                              <p className="text-xs text-gray-500">+ {tenant.secondaryTenantName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{room?.roomNumber}</p>
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
                        <p className="font-medium">{formatCurrency(tenant.totalMonthlyRent)}</p>
                        <p className="text-xs text-gray-500">
                          Jatuh tempo: tanggal {tenant.paymentDueDay}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn(
                          tenant.status === 'active' && "bg-green-100 text-green-700",
                          tenant.status === 'archived' && "bg-gray-100 text-gray-700",
                          tenant.status === 'moved_out' && "bg-red-100 text-red-700",
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
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleArchive(tenant.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Arsipkan
                            </DropdownMenuItem>
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

      {/* Add/Edit Tenant Dialog */}
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
                    <Label htmlFor="fullName">Nama Lengkap *</Label>
                    <Input 
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
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
                    <Label htmlFor="ktpNumber">Nomor KTP *</Label>
                    <Input 
                      id="ktpNumber"
                      value={formData.ktpNumber}
                      onChange={(e) => setFormData({...formData, ktpNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Kontak Darurat *</Label>
                    <Input 
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Telepon Darurat *</Label>
                    <Input 
                      id="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
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
                      value={formData.propertyId}
                      onChange={(e) => setFormData({...formData, propertyId: e.target.value, roomId: ''})}
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
                      value={formData.roomId}
                      onChange={(e) => {
                        const room = rooms.find(r => r.id === e.target.value);
                        setFormData({
                          ...formData, 
                          roomId: e.target.value,
                          baseMonthlyRent: room?.baseMonthlyRent || 0,
                          securityDeposit: room?.baseMonthlyRent || 0,
                        });
                      }}
                      required
                    >
                      <option value="">Pilih Kamar</option>
                      {getAvailableRooms(formData.propertyId).map(r => (
                        <option key={r.id} value={r.id}>{r.roomNumber} - {formatCurrency(r.baseMonthlyRent)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkInDate">Tanggal Masuk *</Label>
                    <Input 
                      id="checkInDate"
                      type="date"
                      value={formData.checkInDate}
                      onChange={(e) => setFormData({...formData, checkInDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractDuration">Durasi Kontrak (bulan) *</Label>
                    <Input 
                      id="contractDuration"
                      type="number"
                      min={1}
                      value={formData.contractDurationMonths}
                      onChange={(e) => setFormData({...formData, contractDurationMonths: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baseRent">Sewa Dasar *</Label>
                    <Input 
                      id="baseRent"
                      type="number"
                      value={formData.baseMonthlyRent}
                      onChange={(e) => setFormData({...formData, baseMonthlyRent: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deposit">Deposit *</Label>
                    <Input 
                      id="deposit"
                      type="number"
                      value={formData.securityDeposit}
                      onChange={(e) => setFormData({...formData, securityDeposit: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentDueDay">Tanggal Jatuh Tempo *</Label>
                    <Input 
                      id="paymentDueDay"
                      type="number"
                      min={1}
                      max={31}
                      value={formData.paymentDueDay}
                      onChange={(e) => setFormData({...formData, paymentDueDay: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Switch 
                      checked={formData.isSharedRoom}
                      onCheckedChange={(checked) => setFormData({...formData, isSharedRoom: checked})}
                    />
                    <Label>Kamar Bersama (2 orang)</Label>
                  </div>
                  {formData.isSharedRoom && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="secondaryName">Nama Penghuni Kedua</Label>
                        <Input 
                          id="secondaryName"
                          value={formData.secondaryTenantName}
                          onChange={(e) => setFormData({...formData, secondaryTenantName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondaryPhone">Telepon Penghuni Kedua</Label>
                        <Input 
                          id="secondaryPhone"
                          value={formData.secondaryTenantPhone}
                          onChange={(e) => setFormData({...formData, secondaryTenantPhone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="additionalFee">Biaya Tambahan</Label>
                        <Input 
                          id="additionalFee"
                          type="number"
                          value={formData.additionalPersonFee}
                          onChange={(e) => setFormData({...formData, additionalPersonFee: parseInt(e.target.value)})}
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

      {/* Tenant Detail Dialog */}
      <Dialog open={!!selectedTenant && !isAddDialogOpen && !isDeleteDialogOpen} onOpenChange={() => setSelectedTenant(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {selectedTenant && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-[#1A3D5C] text-white">
                      {selectedTenant.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedTenant.fullName}</p>
                    <p className="text-sm font-normal text-gray-500">
                      KTP: {selectedTenant.ktpNumber}
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
                      <p className="font-medium">{selectedTenant.fullName}</p>
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
                      <p className="font-medium">{selectedTenant.ktpNumber}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Kontak Darurat</Label>
                      <p className="font-medium">{selectedTenant.emergencyContact}</p>
                      <p className="text-sm text-gray-500">{selectedTenant.emergencyPhone}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Status</Label>
                      <Badge className={cn(
                        selectedTenant.status === 'active' && "bg-green-100 text-green-700",
                        selectedTenant.status === 'archived' && "bg-gray-100 text-gray-700",
                      )}>
                        {selectedTenant.status === 'active' ? 'Aktif' : 'Arsip'}
                      </Badge>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="room" className="space-y-4">
                  {(() => {
                    const room = getRoomInfo(selectedTenant.roomId);
                    const property = getPropertyInfo(selectedTenant.propertyId);
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-500">Properti</Label>
                            <p className="font-medium">{property?.name}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Nomor Kamar</Label>
                            <p className="font-medium">{room?.roomNumber}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Tipe Kamar</Label>
                            <p className="font-medium capitalize">{room?.roomType}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Tipe Okupansi</Label>
                            <p className="font-medium">
                              {selectedTenant.isSharedRoom ? 'Bersama (2 orang)' : 'Single'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Tanggal Masuk</Label>
                            <p className="font-medium">{formatDate(selectedTenant.checkInDate)}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Durasi Kontrak</Label>
                            <p className="font-medium">{selectedTenant.contractDurationMonths} bulan</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Sewa per Bulan</Label>
                            <p className="font-medium">{formatCurrency(selectedTenant.totalMonthlyRent)}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Deposit</Label>
                            <p className="font-medium">{formatCurrency(selectedTenant.securityDeposit)}</p>
                          </div>
                        </div>

                        {selectedTenant.isSharedRoom && selectedTenant.secondaryTenantName && (
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Penghuni Tambahan</h4>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="font-medium">{selectedTenant.secondaryTenantName}</p>
                              <p className="text-sm text-gray-500">{selectedTenant.secondaryTenantPhone}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                Biaya Tambahan: {formatCurrency(selectedTenant.additionalPersonFee)}/bulan
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
                            <td className="px-4 py-2">{payment.paymentPeriod}</td>
                            <td className="px-4 py-2 text-right font-medium">
                              {formatCurrency(payment.totalAmount)}
                            </td>
                            <td className="px-4 py-2">
                              <Badge className={cn("text-white", getPaymentStatusColor(payment.paymentStatus))}>
                                {getPaymentStatusLabel(payment.paymentStatus)}
                              </Badge>
                            </td>
                            <td className="px-4 py-2">
                              {payment.paymentDate ? formatDate(payment.paymentDate) : '-'}
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
                <Button 
                  variant="outline"
                  className="text-red-600"
                  onClick={() => openDeleteDialog(selectedTenant)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus penghuni <strong>{selectedTenant?.fullName}</strong>? 
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
