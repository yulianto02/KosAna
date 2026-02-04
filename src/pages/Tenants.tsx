import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, MoreHorizontal, Phone, Mail, Car, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
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
import { properties, rooms, tenants, tenantVehicles, payments } from '@/data/mockData';
import type { Tenant } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, getPaymentStatusColor, getPaymentStatusLabel } from '@/lib/format';

export function Tenants() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

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
  const getRoomInfo = (roomId: string) => {
    return rooms.find(r => r.id === roomId);
  };

  // Get property info
  const getPropertyInfo = (propertyId: string) => {
    return properties.find(p => p.id === propertyId);
  };

  // Get tenant vehicles
  const getTenantVehiclesList = (tenantId: string) => {
    return tenantVehicles.filter(v => v.tenantId === tenantId && v.isActive);
  };

  // Get tenant payments
  const getTenantPayments = (tenantId: string) => {
    return payments.filter(p => p.tenantId === tenantId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Penghuni</h1>
          <p className="text-gray-500">Kelola data penghuni dan kontrak</p>
        </div>
        <Button className="bg-[#1A3D5C] hover:bg-[#0F2744]" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
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

      {/* Tenants Table */}
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
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Catat Pembayaran
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
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

      {/* Tenant Detail Dialog */}
      <Dialog open={!!selectedTenant} onOpenChange={() => setSelectedTenant(null)}>
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
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Informasi</TabsTrigger>
                  <TabsTrigger value="room">Kamar</TabsTrigger>
                  <TabsTrigger value="vehicle">Kendaraan</TabsTrigger>
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

                  {/* KTP Image */}
                  <div>
                    <Label className="text-gray-500">Foto KTP</Label>
                    <div className="mt-2 max-w-md">
                      <img 
                        src={selectedTenant.ktpImageUrl} 
                        alt="KTP"
                        className="w-full rounded-lg border"
                      />
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

                <TabsContent value="vehicle" className="space-y-4">
                  {getTenantVehiclesList(selectedTenant.id).length > 0 ? (
                    getTenantVehiclesList(selectedTenant.id).map((vehicle) => (
                      <Card key={vehicle.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Car className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {vehicle.vehicleType === 'car' ? 'Mobil' : 'Motor'}
                                {vehicle.vehicleBrand && ` - ${vehicle.vehicleBrand}`}
                              </p>
                              <p className="text-sm text-gray-500">
                                Plat: {vehicle.licensePlate}
                              </p>
                              {vehicle.parkingSpot && (
                                <p className="text-sm text-gray-500">
                                  Tempat Parkir: {vehicle.parkingSpot}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Tidak ada kendaraan terdaftar</p>
                    </div>
                  )}
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

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTenant(null)}>
                  Tutup
                </Button>
                <Button className="bg-[#1A3D5C] hover:bg-[#0F2744]">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Penghuni
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
