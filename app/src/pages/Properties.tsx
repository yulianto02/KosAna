// app/src/pages/Properties.tsx - Responsive Mobile Version
import { useState, useEffect } from 'react';
import { Plus, Search, Building2, MapPin, Phone, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { propertiesAPI, roomsAPI } from '@/services/api';
import { getCurrentUser } from '@/services/auth';
import type { Property, Room } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';

export function Properties() {
  const isMobile = useIsMobile();
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    property_type: 'male' as 'male' | 'female' | 'mixed',
    address: '',
    city: '',
    district: '',
    postal_code: '',
    contact_phone: '',
    property_manager_id: '',
    total_floors: 0,
    total_rooms: 0,
    amenities: {
      wifi: true,
      ac: true,
      hot_water: true,
      parking: true,
      cctv: false
    },
    rules: '',
    status: 'active',
  });

  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setFormData(prev => ({...prev, property_manager_id: user.id }));
      }
    };
    loadUser();
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [propertiesData, roomsData] = await Promise.all([
        propertiesAPI.getAll(),
        roomsAPI.getAll(),
      ]);
      setProperties(propertiesData);
      setRooms(roomsData);
    } catch (error) {
      toast.error('Gagal memuat data properti');
    } finally {
      setLoading(false);
    }
  };

  const getRoomStats = (propertyId: string) => {
    const propertyRooms = rooms.filter(r => r.property_id === propertyId);
    const normalize = (s: string) => (s || '').toLowerCase().trim();
    const occupied = propertyRooms.filter(r =>
      ['occupied', 'terisi'].includes(normalize(r.status))
    ).length;
    const vacant = propertyRooms.filter(r =>
      ['vacant', 'available', 'kosong'].includes(normalize(r.status))
    ).length;
    const maintenance = propertyRooms.filter(r =>
      ['maintenance', 'perawatan', 'under_maintenance'].includes(normalize(r.status))
    ).length;
    return { total: propertyRooms.length, occupied, vacant, maintenance };
  };

  const filteredProperties = properties.filter(property =>
    property.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPropertyTypeBadge = (type: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      male: { label: 'Putra', color: 'bg-blue-100 text-blue-700' },
      female: { label: 'Putri', color: 'bg-pink-100 text-pink-700' },
      mixed: { label: 'Campur', color: 'bg-purple-100 text-purple-700' },
    };
    const config = configs[type] || { label: type, color: 'bg-gray-100' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      property_type: 'male',
      address: '',
      city: '',
      district: '',
      postal_code: '',
      contact_phone: '',
      property_manager_id: currentUser?.id || '',
      total_floors: 0,
      total_rooms: 0,
      amenities: { wifi: true, ac: true, hot_water: true, parking: true, cctv: false },
      rules: '',
      status: 'active',
    });
    setIsEditMode(false);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (property: Property) => {
    setFormData({
      name: property.name,
      property_type: property.property_type,
      address: property.address,
      city: property.city,
      district: property.district,
      postal_code: property.postal_code,
      contact_phone: property.contact_phone,
      property_manager_id: property.property_manager_id,
      total_floors: property.total_floors || 0,
      total_rooms: property.total_rooms || 0,
      amenities: {
        wifi: property.amenities?.wifi?? true,
        ac: property.amenities?.ac?? true,
        hot_water: property.amenities?.hot_water?? true,
        parking: property.amenities?.parking?? true,
        cctv: property.amenities?.cctv?? false
      },
      rules: property.rules || '',
      status: property.status || 'active',
    });
    setSelectedProperty(property);
    setIsEditMode(true);
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.property_manager_id) {
      toast.error('Property Manager ID tidak ditemukan. Silakan login ulang.');
      return;
    }
    try {
      if (isEditMode && selectedProperty) {
        await propertiesAPI.update(selectedProperty.id, formData);
        toast.success('Properti berhasil diperbarui');
      } else {
        await propertiesAPI.create(formData);
        toast.success('Properti berhasil ditambahkan');
      }
      await fetchData();
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error('Gagal menyimpan properti');
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus properti ini?')) {
      try {
        await propertiesAPI.delete(propertyId);
        toast.success('Properti berhasil dihapus');
        await fetchData();
      } catch (error) {
        toast.error('Gagal menghapus properti');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A3D5C]"></div>
      </div>
    );
  }

  // Shared Form Content
  const FormContent = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
      <div className="space-y-2 sm:col-span-1 col-span-1">
        <Label htmlFor="name" className="text-sm">Nama Properti *</Label>
        <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="h-11 text-base sm:h-10 sm:text-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="property_type" className="text-sm">Tipe Kos *</Label>
        <select
          id="property_type"
          className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
          value={formData.property_type}
          onChange={(e) => setFormData({...formData, property_type: e.target.value as any})}
        >
          <option value="male">Putra</option>
          <option value="female">Putri</option>
          <option value="mixed">Campur</option>
        </select>
      </div>
      <div className="col-span-1 sm:col-span-2 space-y-2">
        <Label htmlFor="address" className="text-sm">Alamat Lengkap *</Label>
        <Input id="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required className="h-11 text-base sm:h-10 sm:text-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city" className="text-sm">Kota *</Label>
        <Input id="city" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required className="h-11 text-base sm:h-10 sm:text-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="district" className="text-sm">Kecamatan</Label>
        <Input id="district" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} className="h-11 text-base sm:h-10 sm:text-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="postal_code" className="text-sm">Kode Pos</Label>
        <Input id="postal_code" value={formData.postal_code} onChange={(e) => setFormData({...formData, postal_code: e.target.value})} inputMode="numeric" className="h-11 text-base sm:h-10 sm:text-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_phone" className="text-sm">Telepon *</Label>
        <Input id="contact_phone" value={formData.contact_phone} onChange={(e) => setFormData({...formData, contact_phone: e.target.value})} required inputMode="tel" className="h-11 text-base sm:h-10 sm:text-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="total_floors" className="text-sm">Total Lantai</Label>
        <Input id="total_floors" type="text" inputMode="numeric" value={formData.total_floors} onChange={(e) => setFormData({...formData, total_floors: parseInt(e.target.value) || 0})} className="h-11 text-base sm:h-10 sm:text-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="total_rooms" className="text-sm">Total Kamar</Label>
        <Input id="total_rooms" type="text" inputMode="numeric" value={formData.total_rooms} onChange={(e) => setFormData({...formData, total_rooms: parseInt(e.target.value) || 0})} className="h-11 text-base sm:h-10 sm:text-sm" />
      </div>
      <div className="col-span-1 sm:col-span-2 space-y-3">
        <Label className="text-sm">Fasilitas</Label>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
          {Object.entries(formData.amenities).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 min-h-">
              <Switch
                checked={value}
                onCheckedChange={(checked) => setFormData({
                 ...formData,
                  amenities: {...formData.amenities, [key]: checked}
                })}
              />
              <span className="text-sm capitalize">
                {key === 'wifi'? 'WiFi' : key === 'ac'? 'AC' : key === 'hot_water'? 'Air Panas' : key === 'parking'? 'Parkir' : 'CCTV'}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-1 sm:col-span-2 space-y-2">
        <Label htmlFor="rules" className="text-sm">Peraturan Kos</Label>
        <textarea
          id="rules"
          className="w-full px-3 py-3 text-base sm:text-sm border border-gray-200 rounded-lg h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
          placeholder="Dilarang merokok, jam malam, dll..."
          value={formData.rules}
          onChange={(e) => setFormData({...formData, rules: e.target.value})}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Page Header - Responsive like Dashboard */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Manajemen Properti</h1>
          <p className="text-sm sm:text-base text-gray-500">Kelola semua properti kos Anda</p>
        </div>
        <Button className="bg-[#1A3D5C] hover:bg-[#0F2744] w-full sm:w-auto h-11 sm:h-10 shrink-0" onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Properti
        </Button>
      </div>

      {/* Search - Full width on mobile, 44px height */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Cari properti..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 text-base sm:h-10 sm:text-sm w-full"
        />
      </div>

      {/* Properties Grid - 1 col mobile, no overflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
        {filteredProperties.map((property) => {
          const stats = getRoomStats(property.id);
          return (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow w-full max-w-full">
              <div className="h-44 sm:h-48 bg-gray-200 relative w-full">
                <img src={property.property_photos?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'} alt={property.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3">{getPropertyTypeBadge(property.property_type)}</div>
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="bg-white/90 hover:bg-white h-11 w-11 sm:h-9 sm:w-9"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedProperty(property)} className="h-11 sm:h-9"><Eye className="w-4 h-4 mr-2" />Lihat Detail</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(property)} className="h-11 sm:h-9"><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 h-11 sm:h-9" onClick={() => handleDelete(property.id)}><Trash2 className="w-4 h-4 mr-2" />Hapus</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="p-4 sm:p-5">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{property.name}</h3>
                <div className="flex items-start gap-1 text-sm text-gray-500 mt-1 min-w-0">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="truncate">{property.address}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span className="truncate">{property.contact_phone}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">{stats.total}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">{stats.occupied}</p>
                    <p className="text-xs text-gray-600">Terisi</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-600">{stats.vacant}</p>
                    <p className="text-xs text-gray-600">Kosong</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {property.amenities?.wifi && <Badge variant="outline" className="text-xs">WiFi</Badge>}
                  {property.amenities?.ac && <Badge variant="outline" className="text-xs">AC</Badge>}
                  {property.amenities?.hot_water && <Badge variant="outline" className="text-xs">Air Panas</Badge>}
                  {property.amenities?.parking && <Badge variant="outline" className="text-xs">Parkir</Badge>}
                  {property.amenities?.cctv && <Badge variant="outline" className="text-xs">CCTV</Badge>}
                </div>
                <Button className="w-full mt-4 bg-[#1A3D5C] hover:bg-[#0F2744] h-11 sm:h-10" onClick={() => setSelectedProperty(property)}>
                  <Eye className="w-4 h-4 mr-2" />Lihat Detail
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit - Desktop: Dialog, Mobile: Full-screen Sheet */}
      {isMobile? (
        <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col rounded-t-none bg-white">
            <SheetHeader className="p-4 border-b shrink-0 text-left">
              <SheetTitle className="text-lg">{isEditMode? 'Edit Properti' : 'Tambah Properti Baru'}</SheetTitle>
              <SheetDescription className="text-sm">{isEditMode? 'Ubah informasi properti' : 'Isi informasi properti kos baru Anda'}</SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)]">
                <FormContent />
              </div>
              <SheetFooter className="p-4 border-t flex-row gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Batal</Button>
                <Button type="submit" className="flex-1 bg-[#1A3D5C] hover:bg-[#0F2744] h-11">{isEditMode? 'Simpan' : 'Simpan Properti'}</Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h- overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditMode? 'Edit Properti' : 'Tambah Properti Baru'}</DialogTitle>
              <DialogDescription>{isEditMode? 'Ubah informasi properti' : 'Isi informasi properti kos baru Anda'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FormContent />
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Batal</Button>
                <Button type="submit" className="bg-[#1A3D5C] hover:bg-[#0F2744]">{isEditMode? 'Simpan Perubahan' : 'Simpan Properti'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Detail - Desktop: Dialog, Mobile: Full-screen Sheet */}
      {isMobile? (
        <Sheet open={!!selectedProperty &&!isAddDialogOpen} onOpenChange={() => setSelectedProperty(null)}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col bg-white">
            {selectedProperty && (
              <>
                <SheetHeader className="p-4 border-b shrink-0 text-left">
                  <SheetTitle className="flex items-center gap-2 text-base"><Building2 className="w-5 h-5 shrink-0" /><span className="truncate">{selectedProperty.name}</span></SheetTitle>
                  <SheetDescription>Detail lengkap properti kos</SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-[env(safe-area-inset-bottom)]">
                  <div className="grid grid-cols-2 gap-2">
                    {(selectedProperty.property_photos || ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400']).slice(0,4).map((photo, idx) => (
                      <div key={idx} className={`${idx === 0? 'col-span-2' : ''} rounded-lg overflow-hidden aspect-video sm:aspect-auto`}>
                        <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Informasi Properti</h4>
                      <div className="mt-2 space-y-2 text-sm break-words">
                        <p><span className="text-gray-500">Alamat:</span> {selectedProperty.address}</p>
                        <p><span className="text-gray-500">Kota:</span> {selectedProperty.city}</p>
                        <p><span className="text-gray-500">Telepon:</span> {selectedProperty.contact_phone}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Fasilitas</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(selectedProperty.amenities || {}).filter(([_, value]) => value).map(([key]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key === 'wifi'? 'WiFi' : key === 'ac'? 'AC' : key === 'hot_water'? 'Air Panas' : key === 'parking'? 'Parkir' : 'CCTV'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  {selectedProperty.rules && (
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Peraturan Kos</h4>
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg break-words">{selectedProperty.rules}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Statistik Kamar</h4>
                    {(() => {
                      const stats = getRoomStats(selectedProperty.id);
                      return (
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div className="text-center p-3 bg-blue-50 rounded-lg"><p className="text-xl font-bold text-blue-600">{stats.total}</p><p className="text-xs text-gray-600">Total Kamar</p></div>
                          <div className="text-center p-3 bg-green-50 rounded-lg"><p className="text-xl font-bold text-green-600">{stats.occupied}</p><p className="text-xs text-gray-600">Terisi</p></div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xl font-bold text-gray-600">{stats.vacant}</p><p className="text-xs text-gray-600">Kosong</p></div>
                          <div className="text-center p-3 bg-red-50 rounded-lg"><p className="text-xl font-bold text-red-600">{stats.maintenance}</p><p className="text-xs text-gray-600">Perawatan</p></div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="p-4 border-t flex gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setSelectedProperty(null)}>Tutup</Button>
                  <Button className="flex-1 bg-[#1A3D5C] hover:bg-[#0F2744] h-11" onClick={() => { const p = selectedProperty; setSelectedProperty(null); setTimeout(() => p && openEditDialog(p), 100); }}><Edit className="w-4 h-4 mr-2" />Edit</Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedProperty &&!isAddDialogOpen} onOpenChange={() => setSelectedProperty(null)}>
          <DialogContent className="max-w-4xl max-h- overflow-auto">
            {selectedProperty && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />{selectedProperty.name}</DialogTitle>
                  <DialogDescription>Detail lengkap properti kos</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-2">
                    {(selectedProperty.property_photos || ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400']).map((photo, idx) => (
                      <div key={idx} className={`${idx === 0? 'col-span-2 row-span-2' : ''} rounded-lg overflow-hidden`}>
                        <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">Informasi Properti</h4>
                      <div className="mt-2 space-y-2 text-sm">
                        <p><span className="text-gray-500">Alamat:</span> {selectedProperty.address}</p>
                        <p><span className="text-gray-500">Kota:</span> {selectedProperty.city}</p>
                        <p><span className="text-gray-500">Telepon:</span> {selectedProperty.contact_phone}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Fasilitas</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(selectedProperty.amenities || {}).filter(([_, value]) => value).map(([key]) => (
                          <Badge key={key} variant="secondary">
                            {key === 'wifi'? 'WiFi' : key === 'ac'? 'AC' : key === 'hot_water'? 'Air Panas' : key === 'parking'? 'Parkir' : 'CCTV'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  {selectedProperty.rules && (
                    <div>
                      <h4 className="font-semibold text-gray-900">Peraturan Kos</h4>
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedProperty.rules}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900">Statistik Kamar</h4>
                    {(() => {
                      const stats = getRoomStats(selectedProperty.id);
                      return (
                        <div className="grid grid-cols-4 gap-4 mt-2">
                          <div className="text-center p-4 bg-blue-50 rounded-lg"><p className="text-2xl font-bold text-blue-600">{stats.total}</p><p className="text-sm text-gray-600">Total Kamar</p></div>
                          <div className="text-center p-4 bg-green-50 rounded-lg"><p className="text-2xl font-bold text-green-600">{stats.occupied}</p><p className="text-sm text-gray-600">Terisi</p></div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-gray-600">{stats.vacant}</p><p className="text-sm text-gray-600">Kosong</p></div>
                          <div className="text-center p-4 bg-red-50 rounded-lg"><p className="text-2xl font-bold text-red-600">{stats.maintenance}</p><p className="text-sm text-gray-600">Perawatan</p></div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedProperty(null)}>Tutup</Button>
                  <Button className="bg-[#1A3D5C] hover:bg-[#0F2744]" onClick={() => { setSelectedProperty(null); setTimeout(() => openEditDialog(selectedProperty), 100); }}><Edit className="w-4 h-4 mr-2" />Edit Properti</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}