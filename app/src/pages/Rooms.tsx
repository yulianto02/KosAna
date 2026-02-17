import { useState, useEffect } from 'react';
import { Plus, Search, Grid3X3, List, Image as ImageIcon, Users, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { roomsAPI, propertiesAPI, tenantsAPI } from '@/services/api';
import type { Room, Property, Tenant } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, getRoomStatusColor, getRoomStatusLabel } from '@/lib/format';

export function Rooms() {
  const [searchQuery, setSearchQuery] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state - using snake_case to match PostgreSQL/types
  const [formData, setFormData] = useState({
    property_id: '',
    room_number: '',
    floor: 1,
    room_type: 'standard',
    base_monthly_rent: 0,
    occupancy_type: 'single',
    size_sqm: 0,
    amenities: {
      ac: false,
      private_bathroom: false,
      balcony: false,
      tv: false,
      refrigerator: false,
      wardrobe: false,
      desk: false,
      wifi: false,
    },
    description: '',
    status: 'available',
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [propertiesRes, roomsRes, tenantsRes] = await Promise.all([
        propertiesAPI.getAll(),
        roomsAPI.getAll(),
        tenantsAPI.getAll(),
      ]);
      setProperties(propertiesRes);
      setRooms(roomsRes);
      setTenants(tenantsRes);
      if (propertiesRes.length > 0 && !selectedProperty) {
        setSelectedProperty(propertiesRes[0].id);
      }
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Get active tenant for a room
  const getRoomTenant = (roomId: string) => {
    return tenants.find(t => t.room_id === roomId && t.status === 'active');
  };

  // ✅ FIXED: Filter + Sort + Effective Status Logic
  const filteredAndSortedRooms = rooms
    .filter(room => {
      const matchesProperty = room.property_id === selectedProperty;
      const matchesFloor = room.floor === selectedFloor;
      const roomNumberStr = (room.room_number || '').toLowerCase();
      const matchesSearch = roomNumberStr.includes(searchQuery.toLowerCase());
      return matchesProperty && matchesFloor && matchesSearch;
    })
    .sort((a, b) => {
      const numA = parseInt(a.room_number);
      const numB = parseInt(b.room_number);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return (a.room_number || '').localeCompare(b.room_number || '');
    });

  // Get property floors
  const propertyFloors = Array.from(
    new Set(rooms.filter(r => r.property_id === selectedProperty).map(r => r.floor))
  ).sort((a, b) => a - b);

  // Reset form
  const resetForm = () => {
    setFormData({
      property_id: selectedProperty,
      room_number: '',
      floor: selectedFloor,
      room_type: 'standard',
      base_monthly_rent: 0,
      occupancy_type: 'single',
      size_sqm: 0,
      amenities: {
        ac: false,
        private_bathroom: false,
        balcony: false,
        tv: false,
        refrigerator: false,
        wardrobe: false,
        desk: false,
        wifi: false,
      },
      description: '',
      status: 'available',
    });
  };

  // Handle add room
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await roomsAPI.create(formData);
      toast.success('Kamar berhasil ditambahkan');
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Gagal menambahkan kamar');
    }
  };

  // Handle edit room
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    try {
      await roomsAPI.update(selectedRoom.id, formData);
      toast.success('Kamar berhasil diperbarui');
      setIsEditDialogOpen(false);
      setSelectedRoom(null);
      fetchData();
    } catch (error) {
      toast.error('Gagal memperbarui kamar');
    }
  };

  // Handle delete room
  const handleDelete = async () => {
    if (!selectedRoom) return;
    try {
      await roomsAPI.delete(selectedRoom.id);
      toast.success('Kamar berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setSelectedRoom(null);
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus kamar');
    }
  };

  // Open edit dialog
  const openEditDialog = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      property_id: room.property_id,
      room_number: room.room_number,
      floor: room.floor,
      room_type: room.room_type,
      base_monthly_rent: room.base_monthly_rent,
      occupancy_type: room.occupancy_type,
      size_sqm: room.size_sqm || 0,
      amenities: {
        ac: room.amenities?.ac || false,
        private_bathroom: room.amenities?.private_bathroom || false,
        balcony: room.amenities?.balcony || false,
        tv: room.amenities?.tv || false,
        refrigerator: room.amenities?.refrigerator || false,
        wardrobe: room.amenities?.wardrobe || false,
        desk: room.amenities?.desk || false,
        wifi: room.amenities?.wifi || false,
      },
      description: room.description || '',
      status: room.status,
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Kamar</h1>
          <p className="text-gray-500">Kelola kamar dan okupansi properti</p>
        </div>
        <Button 
          className="bg-[#1A3D5C] hover:bg-[#0F2744]" 
          onClick={() => {
            resetForm();
            setFormData(prev => ({ ...prev, property_id: selectedProperty }));
            setIsAddDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kamar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Property Select */}
        <select
          value={selectedProperty}
          onChange={(e) => {
            setSelectedProperty(e.target.value);
            setSelectedFloor(1);
          }}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
        >
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Floor Select */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Lantai:</span>
          <div className="flex gap-1">
            {propertyFloors.length > 0 ? propertyFloors.map(floor => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  selectedFloor === floor
                    ? "bg-[#1A3D5C] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {floor}
              </button>
            )) : (
              <span className="text-sm text-gray-400">Tidak ada lantai</span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari nomor kamar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === 'grid' ? "bg-white shadow-sm text-[#1A3D5C]" : "text-gray-500"
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === 'list' ? "bg-white shadow-sm text-[#1A3D5C]" : "text-gray-500"
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-gray-500">Status:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Terisi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Dipesan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Perawatan</span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Memuat data...</p>
        </div>
      )}

      {/* ✅ Grid View with effectiveStatus */}
      {!isLoading && viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAndSortedRooms.map((room) => {
            const tenant = getRoomTenant(room.id);
            const effectiveStatus = tenant ? 'occupied' : room.status;

            return (
              <Card 
                key={room.id} 
                className={cn(
                  "cursor-pointer hover:shadow-lg transition-all border-2",
                  effectiveStatus === 'occupied' && "border-blue-200",
                  effectiveStatus === 'available' && "border-green-200",
                  effectiveStatus === 'reserved' && "border-yellow-200",
                  effectiveStatus === 'maintenance' && "border-red-200",
                )}
                onClick={() => setSelectedRoom(room)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gray-900">{room.room_number}</span>
                    <div className={cn("w-3 h-3 rounded-full", getRoomStatusColor(effectiveStatus))} />
                  </div>

                  <div className="h-24 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(room.base_monthly_rent)}/bulan
                    </p>
                    <p className="text-xs text-gray-500">
                      {room.room_type === 'standard' ? 'Standar' : room.room_type === 'deluxe' ? 'Deluxe' : 'Premium'}
                      {room.occupancy_type === 'double' && ' (Bersama)'}
                    </p>
                    {tenant ? (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Users className="w-3 h-3" />
                        <span className="truncate">{tenant.full_name}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-green-600">Tersedia</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ✅ List View with effectiveStatus */}
      {!isLoading && viewMode === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kamar</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tipe</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Harga</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Penghuni</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fasilitas</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAndSortedRooms.map((room) => {
                  const tenant = getRoomTenant(room.id);
                  const effectiveStatus = tenant ? 'occupied' : room.status;

                  return (
                    <tr key={room.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{room.room_number}</span>
                        <p className="text-xs text-gray-500">Lantai {room.floor}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize">{room.room_type}</span>
                        {room.occupancy_type === 'double' && (
                          <Badge variant="outline" className="ml-2 text-xs">Bersama</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {formatCurrency(room.base_monthly_rent)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-white", getRoomStatusColor(effectiveStatus))}>
                          {getRoomStatusLabel(effectiveStatus)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {tenant ? (
                          <div>
                            <p className="text-sm">{tenant.full_name}</p>
                            <p className="text-xs text-gray-500">{tenant.phone}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {room.amenities.ac && <Badge variant="outline" className="text-xs">AC</Badge>}
                          {room.amenities.private_bathroom && <Badge variant="outline" className="text-xs">KM</Badge>}
                          {room.amenities.balcony && <Badge variant="outline" className="text-xs">Balkon</Badge>}
                          {room.amenities.tv && <Badge variant="outline" className="text-xs">TV</Badge>}
                          {room.amenities.wifi && <Badge variant="outline" className="text-xs">WiFi</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(room)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => openDeleteDialog(room)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus
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
      {!isLoading && filteredAndSortedRooms.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Tidak ada kamar ditemukan</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kamar
          </Button>
        </div>
      )}

      {/* Room Detail Dialog */}
      <Dialog open={!!selectedRoom && !isEditDialogOpen && !isDeleteDialogOpen} onOpenChange={() => setSelectedRoom(null)}>
        <DialogContent className="max-w-2xl">
          {selectedRoom && (
            <>
              <DialogHeader>
                <DialogTitle>Kamar {selectedRoom.room_number}</DialogTitle>
                <DialogDescription>
                  Detail informasi kamar
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-500">Status</Label>
                    {/* ✅ Use effectiveStatus in detail dialog too */}
                    {(() => {
                      const tenant = getRoomTenant(selectedRoom.id);
                      const effectiveStatus = tenant ? 'occupied' : selectedRoom.status;
                      return (
                        <Badge className={cn("text-white mt-1", getRoomStatusColor(effectiveStatus))}>
                          {getRoomStatusLabel(effectiveStatus)}
                        </Badge>
                      );
                    })()}
                  </div>
                  <div>
                    <Label className="text-gray-500">Tipe Kamar</Label>
                    <p className="font-medium capitalize">{selectedRoom.room_type}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Harga per Bulan</Label>
                    <p className="font-medium">{formatCurrency(selectedRoom.base_monthly_rent)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Tipe Okupansi</Label>
                    <p className="font-medium">
                      {selectedRoom.occupancy_type === 'single' ? 'Single' : 'Bersama (2 orang)'}
                    </p>
                  </div>
                  {selectedRoom.size_sqm ? (
                    <div>
                      <Label className="text-gray-500">Ukuran</Label>
                      <p className="font-medium">{selectedRoom.size_sqm} m²</p>
                    </div>
                  ) : null}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Fasilitas</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedRoom.amenities).map(([key, value]) => (
                      value && (
                        <Badge key={key} variant="outline">
                          {key === 'ac' && 'AC'}
                          {key === 'private_bathroom' && 'Kamar Mandi Dalam'}
                          {key === 'balcony' && 'Balkon'}
                          {key === 'tv' && 'TV'}
                          {key === 'refrigerator' && 'Kulkas'}
                          {key === 'wardrobe' && 'Lemari'}
                          {key === 'desk' && 'Meja'}
                          {key === 'wifi' && 'WiFi'}
                        </Badge>
                      )
                    ))}
                  </div>
                  {selectedRoom.description && (
                    <div className="mt-4">
                      <Label className="text-gray-500">Deskripsi</Label>
                      <p className="text-sm mt-1">{selectedRoom.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {getRoomTenant(selectedRoom.id) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Penghuni Saat Ini</h4>
                  {(() => {
                    const tenant = getRoomTenant(selectedRoom.id)!;
                    return (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium">{tenant.full_name}</p>
                        <p className="text-sm text-gray-500">{tenant.phone}</p>
                        <p className="text-sm text-gray-500">
                          Check-in: {new Date(tenant.check_in_date).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedRoom(null)}>
                  Tutup
                </Button>
                <Button 
                  variant="outline"
                  className="text-red-600"
                  onClick={() => openDeleteDialog(selectedRoom)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
                <Button 
                  className="bg-[#1A3D5C] hover:bg-[#0F2744]"
                  onClick={() => openEditDialog(selectedRoom)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Kamar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Kamar Baru</DialogTitle>
            <DialogDescription>
              Isi informasi kamar baru di bawah ini
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property">Properti</Label>
                <select
                  id="property"
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                  required
                >
                  <option value="">Pilih Properti</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room_number">Nomor Kamar</Label>
                <Input
                  id="room_number"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  placeholder="Contoh: 101"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Lantai</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size_sqm">Ukuran (m²)</Label>
                <Input
                  id="size_sqm"
                  type="number"
                  value={formData.size_sqm}
                  onChange={(e) => setFormData({ ...formData, size_sqm: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room_type">Tipe Kamar</Label>
                <select
                  id="room_type"
                  value={formData.room_type}
                  onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                  required
                >
                  <option value="standard">Standar</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupancy_type">Tipe Okupansi</Label>
                <select
                  id="occupancy_type"
                  value={formData.occupancy_type}
                  onChange={(e) => setFormData({ ...formData, occupancy_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                  required
                >
                  <option value="single">Single</option>
                  <option value="double">Bersama (2 orang)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_monthly_rent">Harga per Bulan (Rp)</Label>
              <Input
                id="base_monthly_rent"
                type="number"
                value={formData.base_monthly_rent}
                onChange={(e) => setFormData({ ...formData, base_monthly_rent: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Fasilitas</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(formData.amenities).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`amenity-${key}`}
                      checked={value}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          amenities: { ...formData.amenities, [key]: checked as boolean }
                        })
                      }
                    />
                    <Label htmlFor={`amenity-${key}`} className="text-sm cursor-pointer">
                      {key === 'ac' && 'AC'}
                      {key === 'private_bathroom' && 'Kamar Mandi Dalam'}
                      {key === 'balcony' && 'Balkon'}
                      {key === 'tv' && 'TV'}
                      {key === 'refrigerator' && 'Kulkas'}
                      {key === 'wardrobe' && 'Lemari'}
                      {key === 'desk' && 'Meja'}
                      {key === 'wifi' && 'WiFi'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                rows={3}
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

      {/* Edit Room Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Kamar</DialogTitle>
            <DialogDescription>
              Perbarui informasi kamar
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-property">Properti</Label>
                <select
                  id="edit-property"
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                  required
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-room_number">Nomor Kamar</Label>
                <Input
                  id="edit-room_number"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-floor">Lantai</Label>
                <Input
                  id="edit-floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-size_sqm">Ukuran (m²)</Label>
                <Input
                  id="edit-size_sqm"
                  type="number"
                  value={formData.size_sqm}
                  onChange={(e) => setFormData({ ...formData, size_sqm: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-room_type">Tipe Kamar</Label>
                <select
                  id="edit-room_type"
                  value={formData.room_type}
                  onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                  required
                >
                  <option value="standard">Standar</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-occupancy_type">Tipe Okupansi</Label>
                <select
                  id="edit-occupancy_type"
                  value={formData.occupancy_type}
                  onChange={(e) => setFormData({ ...formData, occupancy_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                  required
                >
                  <option value="single">Single</option>
                  <option value="double">Bersama (2 orang)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-base_monthly_rent">Harga per Bulan (Rp)</Label>
                <Input
                  id="edit-base_monthly_rent"
                  type="number"
                  value={formData.base_monthly_rent}
                  onChange={(e) => setFormData({ ...formData, base_monthly_rent: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                  required
                >
                  <option value="available">Tersedia</option>
                  <option value="occupied">Terisi</option>
                  <option value="reserved">Dipesan</option>
                  <option value="maintenance">Perawatan</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fasilitas</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(formData.amenities).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-amenity-${key}`}
                      checked={value}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          amenities: { ...formData.amenities, [key]: checked as boolean }
                        })
                      }
                    />
                    <Label htmlFor={`edit-amenity-${key}`} className="text-sm cursor-pointer">
                      {key === 'ac' && 'AC'}
                      {key === 'private_bathroom' && 'Kamar Mandi Dalam'}
                      {key === 'balcony' && 'Balkon'}
                      {key === 'tv' && 'TV'}
                      {key === 'refrigerator' && 'Kulkas'}
                      {key === 'wardrobe' && 'Lemari'}
                      {key === 'desk' && 'Meja'}
                      {key === 'wifi' && 'WiFi'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Deskripsi</Label>
              <textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#1A3D5C] hover:bg-[#0F2744]">
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kamar <strong>{selectedRoom?.room_number}</strong>? 
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