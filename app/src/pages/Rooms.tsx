// app/src/pages/Rooms.tsx - Responsive Mobile Version
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { roomsAPI, propertiesAPI, tenantsAPI } from '@/services/api';
import type { Room, Property, Tenant } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, getRoomStatusColor, getRoomStatusLabel } from '@/lib/format';
import { useIsMobile } from '@/hooks/use-mobile';

export function Rooms() {
  const isMobile = useIsMobile();
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
      if (propertiesRes.length > 0 &&!selectedProperty) {
        setSelectedProperty(propertiesRes[0].id);
      }
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoomTenant = (roomId: string) => {
    return tenants.find(t => t.room_id === roomId && t.status === 'active');
  };

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
      if (!isNaN(numA) &&!isNaN(numB)) return numA - numB;
      return (a.room_number || '').localeCompare(b.room_number || '');
    });

  const propertyFloors = Array.from(
    new Set(rooms.filter(r => r.property_id === selectedProperty).map(r => r.floor))
  ).sort((a, b) => a - b);

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
        ac: false, private_bathroom: false, balcony: false, tv: false,
        refrigerator: false, wardrobe: false, desk: false, wifi: false,
      },
      description: '',
      status: 'available',
    });
  };

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

  const openDeleteDialog = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteDialogOpen(true);
  };

  // Shared Form Fields - reused for add/edit
  const FormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="property" className="text-sm">Properti</Label>
          <select
            id="property"
            value={formData.property_id}
            onChange={(e) => setFormData({...formData, property_id: e.target.value })}
            className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
            required
          >
            <option value="">Pilih Properti</option>
            {properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="room_number" className="text-sm">Nomor Kamar</Label>
          <Input id="room_number" value={formData.room_number} onChange={(e) => setFormData({...formData, room_number: e.target.value })} placeholder="Contoh: 101" required className="h-11 text-base sm:h-10 sm:text-sm" inputMode="numeric" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="floor" className="text-sm">Lantai</Label>
          <Input id="floor" type="text" inputMode="numeric" value={formData.floor} onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value) || 1 })} required className="h-11 text-base sm:h-10 sm:text-sm" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="size_sqm" className="text-sm">Ukuran (m²)</Label>
          <Input id="size_sqm" type="text" inputMode="numeric" value={formData.size_sqm} onChange={(e) => setFormData({...formData, size_sqm: parseInt(e.target.value) || 0 })} className="h-11 text-base sm:h-10 sm:text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="room_type" className="text-sm">Tipe Kamar</Label>
          <select id="room_type" value={formData.room_type} onChange={(e) => setFormData({...formData, room_type: e.target.value })} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" required>
            <option value="standard">Standar</option><option value="deluxe">Deluxe</option><option value="premium">Premium</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="occupancy_type" className="text-sm">Tipe Okupansi</Label>
          <select id="occupancy_type" value={formData.occupancy_type} onChange={(e) => setFormData({...formData, occupancy_type: e.target.value })} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" required>
            <option value="single">Single</option><option value="double">Bersama (2 orang)</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="base_monthly_rent" className="text-sm">Harga per Bulan (Rp)</Label>
        <Input id="base_monthly_rent" type="text" inputMode="numeric" value={formData.base_monthly_rent} onChange={(e) => setFormData({...formData, base_monthly_rent: parseInt(e.target.value) || 0 })} required className="h-11 text-base sm:h-10 sm:text-sm" />
      </div>

      {formData.status!== 'available' || isEditDialogOpen? (
        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm">Status</Label>
          <select id="status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value })} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" required>
            <option value="available">Tersedia</option><option value="occupied">Terisi</option><option value="reserved">Dipesan</option><option value="maintenance">Perawatan</option>
          </select>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label className="text-sm">Fasilitas</Label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(formData.amenities).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2 min-h-">
              <Checkbox id={`amenity-${key}`} checked={value} onCheckedChange={(checked) => setFormData({...formData, amenities: {...formData.amenities, [key]: checked as boolean } })} />
              <Label htmlFor={`amenity-${key}`} className="text-sm cursor-pointer leading-tight">
                {key === 'ac' && 'AC'}{key === 'private_bathroom' && 'KM Dalam'}{key === 'balcony' && 'Balkon'}{key === 'tv' && 'TV'}{key === 'refrigerator' && 'Kulkas'}{key === 'wardrobe' && 'Lemari'}{key === 'desk' && 'Meja'}{key === 'wifi' && 'WiFi'}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm">Deskripsi</Label>
        <textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value })} className="w-full px-3 py-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" rows={3} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Page Header - Stack on mobile like Dashboard */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Manajemen Kamar</h1>
          <p className="text-sm sm:text-base text-gray-500">Kelola kamar dan okupansi properti</p>
        </div>
        <Button
          className="bg-[#1A3D5C] hover:bg-[#0F2744] w-full sm:w-auto h-11 sm:h-10 shrink-0"
          onClick={() => {
            resetForm();
            setFormData(prev => ({...prev, property_id: selectedProperty }));
            setIsAddDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kamar
        </Button>
      </div>

      {/* Filters - Full responsive stack */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 w-full">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={selectedProperty}
            onChange={(e) => { setSelectedProperty(e.target.value); setSelectedFloor(1); }}
            className="w-full sm:w-auto h-11 sm:h-10 px-4 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
          >
            {properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-sm text-gray-500 shrink-0">Lantai:</span>
            <div className="flex gap-1.5 shrink-0">
              {propertyFloors.length > 0? propertyFloors.map(floor => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className={cn(
                    "h-11 min-w- sm:h-9 sm:min-w- px-3 rounded-lg text-sm font-medium transition-colors shrink-0",
                    selectedFloor === floor? "bg-[#1A3D5C] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {floor}
                </button>
              )) : (<span className="text-sm text-gray-400">Tidak ada lantai</span>)}
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input type="text" placeholder="Cari nomor kamar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 sm:h-10 text-base sm:text-sm w-full" inputMode="numeric" />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 h-11 sm:h-10 shrink-0">
            <button onClick={() => setViewMode('grid')} className={cn("h-9 w-11 sm:w-9 rounded-md transition-colors flex items-center justify-center", viewMode === 'grid'? "bg-white shadow-sm text-[#1A3D5C]" : "text-gray-500")}><Grid3X3 className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={cn("h-9 w-11 sm:w-9 rounded-md transition-colors flex items-center justify-center", viewMode === 'list'? "bg-white shadow-sm text-[#1A3D5C]" : "text-gray-500")}><List className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Status Legend - Scrollable on mobile */}
      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm overflow-x-auto pb-1 scrollbar-none w-full">
        <span className="text-gray-500 shrink-0">Status:</span>
        <div className="flex items-center gap-1.5 shrink-0"><div className="w-3 h-3 rounded-full bg-blue-500" /><span>Terisi</span></div>
        <div className="flex items-center gap-1.5 shrink-0"><div className="w-3 h-3 rounded-full bg-green-500" /><span>Tersedia</span></div>
        <div className="flex items-center gap-1.5 shrink-0"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span>Dipesan</span></div>
        <div className="flex items-center gap-1.5 shrink-0"><div className="w-3 h-3 rounded-full bg-red-500" /><span>Perawatan</span></div>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Memuat data...</p>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 w-full">
          {filteredAndSortedRooms.map((room) => {
            const tenant = getRoomTenant(room.id);
            const effectiveStatus = tenant? 'occupied' : room.status;
            return (
              <Card key={room.id} className={cn("cursor-pointer hover:shadow-lg transition-all border-2 w-full", effectiveStatus === 'occupied' && "border-blue-200", effectiveStatus === 'available' && "border-green-200", effectiveStatus === 'reserved' && "border-yellow-200", effectiveStatus === 'maintenance' && "border-red-200")} onClick={() => setSelectedRoom(room)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3"><span className="text-lg font-bold text-gray-900">{room.room_number}</span><div className={cn("w-3 h-3 rounded-full", getRoomStatusColor(effectiveStatus))} /></div>
                  <div className="h-24 bg-gray-100 rounded-lg mb-3 overflow-hidden"><div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-8 h-8" /></div></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{formatCurrency(room.base_monthly_rent)}/bulan</p>
                    <p className="text-xs text-gray-500 truncate">{room.room_type === 'standard'? 'Standar' : room.room_type === 'deluxe'? 'Deluxe' : 'Premium'}{room.occupancy_type === 'double' && ' (Bersama)'}</p>
                    {tenant? (<div className="flex items-center gap-1 text-xs text-blue-600"><Users className="w-3 h-3 shrink-0" /><span className="truncate">{tenant.full_name}</span></div>) : (<p className="text-xs text-green-600">Tersedia</p>)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* List View - Table on desktop, Cards on mobile to avoid horizontal scroll */}
      {!isLoading && viewMode === 'list' && (
        <>
          {/* Desktop Table */}
          <Card className="hidden sm:block w-full max-w-full overflow-hidden">
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
                    const effectiveStatus = tenant? 'occupied' : room.status;
                    return (
                      <tr key={room.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><span className="font-medium text-gray-900">{room.room_number}</span><p className="text-xs text-gray-500">Lantai {room.floor}</p></td>
                        <td className="px-4 py-3"><span className="capitalize">{room.room_type}</span>{room.occupancy_type === 'double' && (<Badge variant="outline" className="ml-2 text-xs">Bersama</Badge>)}</td>
                        <td className="px-4 py-3">{formatCurrency(room.base_monthly_rent)}</td>
                        <td className="px-4 py-3"><Badge className={cn("text-white", getRoomStatusColor(effectiveStatus))}>{getRoomStatusLabel(effectiveStatus)}</Badge></td>
                        <td className="px-4 py-3">{tenant? (<div><p className="text-sm">{tenant.full_name}</p><p className="text-xs text-gray-500">{tenant.phone}</p></div>) : (<span className="text-gray-400">-</span>)}</td>
                        <td className="px-4 py-3"><div className="flex gap-1 flex-wrap">{room.amenities.ac && <Badge variant="outline" className="text-xs">AC</Badge>}{room.amenities.private_bathroom && <Badge variant="outline" className="text-xs">KM</Badge>}{room.amenities.balcony && <Badge variant="outline" className="text-xs">Balkon</Badge>}{room.amenities.tv && <Badge variant="outline" className="text-xs">TV</Badge>}{room.amenities.wifi && <Badge variant="outline" className="text-xs">WiFi</Badge>}</div></td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(room)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => openDeleteDialog(room)}><Trash2 className="w-4 h-4 mr-2" />Hapus</DropdownMenuItem>
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
          {/* Mobile Cards for List mode */}
          <div className="grid grid-cols-1 gap-3 sm:hidden w-full">
            {filteredAndSortedRooms.map((room) => {
              const tenant = getRoomTenant(room.id);
              const effectiveStatus = tenant? 'occupied' : room.status;
              return (
                <Card key={room.id} className="w-full overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2"><span className="font-bold text-gray-900">{room.room_number}</span><Badge className={cn("text-white text-xs", getRoomStatusColor(effectiveStatus))}>{getRoomStatusLabel(effectiveStatus)}</Badge></div>
                        <p className="text-xs text-gray-500 mt-1">Lantai {room.floor} • {room.room_type}</p>
                        <p className="text-sm font-medium mt-1">{formatCurrency(room.base_monthly_rent)}</p>
                        {tenant? <p className="text-xs text-blue-600 mt-1 truncate flex items-center gap-1"><Users className="w-3 h-3" />{tenant.full_name}</p> : <p className="text-xs text-green-600 mt-1">Tersedia</p>}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-11 w-11 shrink-0"><MoreHorizontal className="w-5 h-5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openEditDialog(room)} className="h-11"><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem><DropdownMenuItem className="text-red-600 h-11" onClick={() => openDeleteDialog(room)}><Trash2 className="w-4 h-4 mr-2" />Hapus</DropdownMenuItem></DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {!isLoading && filteredAndSortedRooms.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg px-4"><p className="text-gray-500">Tidak ada kamar ditemukan</p><Button variant="outline" className="mt-4 h-11 w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Tambah Kamar</Button></div>
      )}

      {/* Detail Dialog / Sheet */}
      {isMobile? (
        <Sheet open={!!selectedRoom &&!isEditDialogOpen &&!isDeleteDialogOpen} onOpenChange={() => setSelectedRoom(null)}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col bg-white">
            {selectedRoom && (
              <>
                <SheetHeader className="p-4 border-b shrink-0 text-left"><SheetTitle>Kamar {selectedRoom.room_number}</SheetTitle><SheetDescription>Detail informasi kamar</SheetDescription></SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-[env(safe-area-inset-bottom)]">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div><Label className="text-xs text-gray-500">Status</Label>{(() => { const tenant = getRoomTenant(selectedRoom.id); const effectiveStatus = tenant? 'occupied' : selectedRoom.status; return (<div className="mt-1"><Badge className={cn("text-white", getRoomStatusColor(effectiveStatus))}>{getRoomStatusLabel(effectiveStatus)}</Badge></div>);})()}</div>
                      <div><Label className="text-xs text-gray-500">Tipe Kamar</Label><p className="font-medium capitalize text-sm">{selectedRoom.room_type}</p></div>
                      <div><Label className="text-xs text-gray-500">Harga</Label><p className="font-medium text-sm">{formatCurrency(selectedRoom.base_monthly_rent)}</p></div>
                      <div><Label className="text-xs text-gray-500">Okupansi</Label><p className="font-medium text-sm">{selectedRoom.occupancy_type === 'single'? 'Single' : 'Bersama'}</p></div>
                      {selectedRoom.size_sqm? (<div><Label className="text-xs text-gray-500">Ukuran</Label><p className="font-medium text-sm">{selectedRoom.size_sqm} m²</p></div>) : null}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">Fasilitas</h4>
                      <div className="flex flex-wrap gap-2">{Object.entries(selectedRoom.amenities).map(([key, value]) => (value && (<Badge key={key} variant="outline" className="text-xs">{key === 'ac' && 'AC'}{key === 'private_bathroom' && 'KM Dalam'}{key === 'balcony' && 'Balkon'}{key === 'tv' && 'TV'}{key === 'refrigerator' && 'Kulkas'}{key === 'wardrobe' && 'Lemari'}{key === 'desk' && 'Meja'}{key === 'wifi' && 'WiFi'}</Badge>)))}</div>
                      {selectedRoom.description && (<div className="mt-4"><Label className="text-xs text-gray-500">Deskripsi</Label><p className="text-sm mt-1 break-words">{selectedRoom.description}</p></div>)}
                    </div>
                  </div>
                  {getRoomTenant(selectedRoom.id) && (<div className="border-t pt-4"><h4 className="font-semibold mb-2 text-sm">Penghuni Saat Ini</h4>{(() => { const tenant = getRoomTenant(selectedRoom.id)!; return (<div className="bg-gray-50 p-4 rounded-lg"><p className="font-medium text-sm">{tenant.full_name}</p><p className="text-sm text-gray-500">{tenant.phone}</p><p className="text-xs text-gray-500">Check-in: {new Date(tenant.check_in_date).toLocaleDateString('id-ID')}</p></div>);})()}</div>)}
                </div>
                <div className="p-4 border-t grid grid-cols-2 gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  <Button variant="outline" className="h-11" onClick={() => setSelectedRoom(null)}>Tutup</Button>
                  <Button className="bg-[#1A3D5C] hover:bg-[#0F2744] h-11" onClick={() => openEditDialog(selectedRoom)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedRoom &&!isEditDialogOpen &&!isDeleteDialogOpen} onOpenChange={() => setSelectedRoom(null)}>
          <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Kamar {selectedRoom?.room_number}</DialogTitle><DialogDescription>Detail informasi kamar</DialogDescription></DialogHeader>
            {selectedRoom && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div><Label className="text-gray-500">Status</Label>{(() => { const tenant = getRoomTenant(selectedRoom.id); const effectiveStatus = tenant? 'occupied' : selectedRoom.status; return (<Badge className={cn("text-white mt-1", getRoomStatusColor(effectiveStatus))}>{getRoomStatusLabel(effectiveStatus)}</Badge>);})()}</div>
                    <div><Label className="text-gray-500">Tipe Kamar</Label><p className="font-medium capitalize">{selectedRoom.room_type}</p></div>
                    <div><Label className="text-gray-500">Harga per Bulan</Label><p className="font-medium">{formatCurrency(selectedRoom.base_monthly_rent)}</p></div>
                    <div><Label className="text-gray-500">Tipe Okupansi</Label><p className="font-medium">{selectedRoom.occupancy_type === 'single'? 'Single' : 'Bersama (2 orang)'}</p></div>
                    {selectedRoom.size_sqm? (<div><Label className="text-gray-500">Ukuran</Label><p className="font-medium">{selectedRoom.size_sqm} m²</p></div>) : null}
                  </div>
                  <div><h4 className="font-semibold mb-2">Fasilitas</h4><div className="flex flex-wrap gap-2">{Object.entries(selectedRoom.amenities).map(([key, value]) => (value && (<Badge key={key} variant="outline">{key === 'ac' && 'AC'}{key === 'private_bathroom' && 'Kamar Mandi Dalam'}{key === 'balcony' && 'Balkon'}{key === 'tv' && 'TV'}{key === 'refrigerator' && 'Kulkas'}{key === 'wardrobe' && 'Lemari'}{key === 'desk' && 'Meja'}{key === 'wifi' && 'WiFi'}</Badge>)))}</div>{selectedRoom.description && (<div className="mt-4"><Label className="text-gray-500">Deskripsi</Label><p className="text-sm mt-1">{selectedRoom.description}</p></div>)}</div>
                </div>
                {getRoomTenant(selectedRoom.id) && (<div className="border-t pt-4"><h4 className="font-semibold mb-2">Penghuni Saat Ini</h4>{(() => { const tenant = getRoomTenant(selectedRoom.id)!; return (<div className="bg-gray-50 p-4 rounded-lg"><p className="font-medium">{tenant.full_name}</p><p className="text-sm text-gray-500">{tenant.phone}</p><p className="text-sm text-gray-500">Check-in: {new Date(tenant.check_in_date).toLocaleDateString('id-ID')}</p></div>);})()}</div>)}
                <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setSelectedRoom(null)}>Tutup</Button><Button variant="outline" className="text-red-600" onClick={() => openDeleteDialog(selectedRoom)}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button><Button className="bg-[#1A3D5C] hover:bg-[#0F2744]" onClick={() => openEditDialog(selectedRoom)}><Edit className="w-4 h-4 mr-2" />Edit Kamar</Button></DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Add Dialog / Sheet */}
      {isMobile? (
        <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col bg-white">
            <SheetHeader className="p-4 border-b shrink-0 text-left"><SheetTitle>Tambah Kamar Baru</SheetTitle><SheetDescription>Isi informasi kamar baru</SheetDescription></SheetHeader>
            <form onSubmit={handleAdd} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)]"><FormFields /></div>
              <SheetFooter className="p-4 border-t flex-row gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setIsAddDialogOpen(false)}>Batal</Button><Button type="submit" className="flex-1 bg-[#1A3D5C] hover:bg-[#0F2744] h-11">Simpan</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h- overflow-y-auto"><DialogHeader><DialogTitle>Tambah Kamar Baru</DialogTitle><DialogDescription>Isi informasi kamar baru di bawah ini</DialogDescription></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4"><FormFields /><DialogFooter><Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button><Button type="submit" className="bg-[#1A3D5C] hover:bg-[#0F2744]">Simpan</Button></DialogFooter></form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog / Sheet */}
      {isMobile? (
        <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col bg-white">
            <SheetHeader className="p-4 border-b shrink-0 text-left"><SheetTitle>Edit Kamar</SheetTitle><SheetDescription>Perbarui informasi kamar</SheetDescription></SheetHeader>
            <form onSubmit={handleEdit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)]">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2"><Label className="text-sm">Properti</Label><select value={formData.property_id} onChange={(e) => setFormData({...formData, property_id: e.target.value })} className="w-full h-11 px-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" required>{properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}</select></div>
                    <div className="space-y-2"><Label className="text-sm">Nomor Kamar</Label><Input value={formData.room_number} onChange={(e) => setFormData({...formData, room_number: e.target.value })} required className="h-11 text-base" inputMode="numeric" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-sm">Lantai</Label><Input type="text" inputMode="numeric" value={formData.floor} onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value) || 1 })} required className="h-11 text-base" /></div>
                    <div className="space-y-2"><Label className="text-sm">Ukuran (m²)</Label><Input type="text" inputMode="numeric" value={formData.size_sqm} onChange={(e) => setFormData({...formData, size_sqm: parseInt(e.target.value) || 0 })} className="h-11 text-base" /></div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2"><Label className="text-sm">Tipe Kamar</Label><select value={formData.room_type} onChange={(e) => setFormData({...formData, room_type: e.target.value })} className="w-full h-11 px-3 text-base border border-gray-200 rounded-lg"><option value="standard">Standar</option><option value="deluxe">Deluxe</option><option value="premium">Premium</option></select></div>
                    <div className="space-y-2"><Label className="text-sm">Tipe Okupansi</Label><select value={formData.occupancy_type} onChange={(e) => setFormData({...formData, occupancy_type: e.target.value })} className="w-full h-11 px-3 text-base border border-gray-200 rounded-lg"><option value="single">Single</option><option value="double">Bersama</option></select></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-sm">Harga/Bulan</Label><Input type="text" inputMode="numeric" value={formData.base_monthly_rent} onChange={(e) => setFormData({...formData, base_monthly_rent: parseInt(e.target.value) || 0 })} required className="h-11 text-base" /></div>
                    <div className="space-y-2"><Label className="text-sm">Status</Label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value })} className="w-full h-11 px-3 text-base border border-gray-200 rounded-lg"><option value="available">Tersedia</option><option value="occupied">Terisi</option><option value="reserved">Dipesan</option><option value="maintenance">Perawatan</option></select></div>
                  </div>
                  <div className="space-y-2"><Label className="text-sm">Fasilitas</Label><div className="grid grid-cols-2 gap-2">{Object.entries(formData.amenities).map(([key, value]) => (<div key={key} className="flex items-center space-x-2 min-h-"><Checkbox checked={value} onCheckedChange={(checked) => setFormData({...formData, amenities: {...formData.amenities, [key]: checked as boolean } })} /><Label className="text-sm cursor-pointer">{key === 'ac' && 'AC'}{key === 'private_bathroom' && 'KM Dalam'}{key === 'balcony' && 'Balkon'}{key === 'tv' && 'TV'}{key === 'refrigerator' && 'Kulkas'}{key === 'wardrobe' && 'Lemari'}{key === 'desk' && 'Meja'}{key === 'wifi' && 'WiFi'}</Label></div>))}</div></div>
                  <div className="space-y-2"><Label className="text-sm">Deskripsi</Label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value })} className="w-full px-3 py-3 text-base border border-gray-200 rounded-lg" rows={3} /></div>
                </div>
              </div>
              <SheetFooter className="p-4 border-t flex-row gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setIsEditDialogOpen(false)}>Batal</Button><Button type="submit" className="flex-1 bg-[#1A3D5C] hover:bg-[#0F2744] h-11">Simpan Perubahan</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h- overflow-y-auto"><DialogHeader><DialogTitle>Edit Kamar</DialogTitle><DialogDescription>Perbarui informasi kamar</DialogDescription></DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4"><FormFields /><div className="space-y-2"><Label>Status</Label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value })} className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg"><option value="available">Tersedia</option><option value="occupied">Terisi</option><option value="reserved">Dipesan</option><option value="maintenance">Perawatan</option></select></div><DialogFooter><Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button><Button type="submit" className="bg-[#1A3D5C] hover:bg-[#0F2744]">Simpan Perubahan</Button></DialogFooter></form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete - Sheet on mobile, Dialog on desktop */}
      {isMobile? (
        <Sheet open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <SheetContent side="bottom" className="h-auto w-full p-0 flex flex-col bg-white rounded-t-xl">
            <SheetHeader className="p-5 text-left"><SheetTitle>Konfirmasi Hapus</SheetTitle><SheetDescription className="text-base mt-2">Apakah Anda yakin ingin menghapus kamar <strong>{selectedRoom?.room_number}</strong>? Tindakan ini tidak dapat dibatalkan.</SheetDescription></SheetHeader>
            <div className="p-4 flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button variant="outline" className="flex-1 h-11" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button><Button variant="destructive" className="flex-1 h-11" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button></div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Konfirmasi Hapus</DialogTitle><DialogDescription>Apakah Anda yakin ingin menghapus kamar <strong>{selectedRoom?.room_number}</strong>? Tindakan ini tidak dapat dibatalkan.</DialogDescription></DialogHeader>
            <DialogFooter><Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button><Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}