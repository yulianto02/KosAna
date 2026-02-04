import { useState } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { properties, rooms } from '@/data/mockData';
import type { Property } from '@/types';

export function Properties() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Filter properties based on search
  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get room stats for a property
  const getRoomStats = (propertyId: string) => {
    const propertyRooms = rooms.filter(r => r.propertyId === propertyId);
    const occupied = propertyRooms.filter(r => r.status === 'occupied').length;
    const vacant = propertyRooms.filter(r => r.status === 'available').length;
    const maintenance = propertyRooms.filter(r => r.status === 'maintenance').length;
    return { total: propertyRooms.length, occupied, vacant, maintenance };
  };

  // Get property type badge
  const getPropertyTypeBadge = (type: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      male: { label: 'Putra', color: 'bg-blue-100 text-blue-700' },
      female: { label: 'Putri', color: 'bg-pink-100 text-pink-700' },
      mixed: { label: 'Campur', color: 'bg-purple-100 text-purple-700' },
    };
    const config = configs[type] || { label: type, color: 'bg-gray-100' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Properti</h1>
          <p className="text-gray-500">Kelola semua properti kos Anda</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1A3D5C] hover:bg-[#0F2744]">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Properti
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Properti Baru</DialogTitle>
              <DialogDescription>
                Isi informasi properti kos baru Anda
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Properti</Label>
                <Input id="name" placeholder="Contoh: Kos Kebayoran" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipe Kos</Label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                  <option value="male">Putra</option>
                  <option value="female">Putri</option>
                  <option value="mixed">Campur</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Alamat Lengkap</Label>
                <Input id="address" placeholder="Jl. ..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Kota</Label>
                <Input id="city" placeholder="Jakarta" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telepon</Label>
                <Input id="phone" placeholder="081234567890" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Batal
              </Button>
              <Button className="bg-[#1A3D5C] hover:bg-[#0F2744]">
                Simpan Properti
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Cari properti..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => {
          const stats = getRoomStats(property.id);
          return (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Property Image */}
              <div className="h-48 bg-gray-200 relative">
                <img
                  src={property.propertyPhotos?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  {getPropertyTypeBadge(property.propertyType)}
                </div>
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="bg-white/90 hover:bg-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedProperty(property)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Lihat Detail
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <CardContent className="p-5">
                {/* Property Info */}
                <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{property.address}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <Phone className="w-4 h-4" />
                  <span>{property.contactPhone}</span>
                </div>

                {/* Room Stats */}
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

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {property.amenities.wifi && (
                    <Badge variant="outline" className="text-xs">WiFi</Badge>
                  )}
                  {property.amenities.ac && (
                    <Badge variant="outline" className="text-xs">AC</Badge>
                  )}
                  {property.amenities.hotWater && (
                    <Badge variant="outline" className="text-xs">Air Panas</Badge>
                  )}
                  {property.amenities.parking && (
                    <Badge variant="outline" className="text-xs">Parkir</Badge>
                  )}
                  {property.amenities.cctv && (
                    <Badge variant="outline" className="text-xs">CCTV</Badge>
                  )}
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full mt-4 bg-[#1A3D5C] hover:bg-[#0F2744]"
                  onClick={() => setSelectedProperty(property)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat Detail
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Property Detail Dialog */}
      <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {selectedProperty && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {selectedProperty.name}
                </DialogTitle>
                <DialogDescription>
                  Detail lengkap properti kos
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Property Images */}
                <div className="grid grid-cols-4 gap-2">
                  {(selectedProperty.propertyPhotos || ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400']).map((photo, idx) => (
                    <div key={idx} className={`${idx === 0 ? 'col-span-2 row-span-2' : ''} rounded-lg overflow-hidden`}>
                      <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                {/* Property Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Informasi Properti</h4>
                    <div className="mt-2 space-y-2 text-sm">
                      <p><span className="text-gray-500">Alamat:</span> {selectedProperty.address}</p>
                      <p><span className="text-gray-500">Kota:</span> {selectedProperty.city}</p>
                      <p><span className="text-gray-500">Kecamatan:</span> {selectedProperty.district}</p>
                      <p><span className="text-gray-500">Kode Pos:</span> {selectedProperty.postalCode}</p>
                      <p><span className="text-gray-500">Telepon:</span> {selectedProperty.contactPhone}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Fasilitas</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(selectedProperty.amenities)
                        .filter(([_, value]) => value)
                        .map(([key]) => (
                          <Badge key={key} variant="secondary">
                            {key === 'wifi' ? 'WiFi' :
                             key === 'ac' ? 'AC' :
                             key === 'hotWater' ? 'Air Panas' :
                             key === 'parking' ? 'Parkir' :
                             key === 'cctv' ? 'CCTV' : key}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Rules */}
                {selectedProperty.rules && (
                  <div>
                    <h4 className="font-semibold text-gray-900">Peraturan Kos</h4>
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedProperty.rules}
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div>
                  <h4 className="font-semibold text-gray-900">Statistik Kamar</h4>
                  {(() => {
                    const stats = getRoomStats(selectedProperty.id);
                    return (
                      <div className="grid grid-cols-4 gap-4 mt-2">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                          <p className="text-sm text-gray-600">Total Kamar</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{stats.occupied}</p>
                          <p className="text-sm text-gray-600">Terisi</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-600">{stats.vacant}</p>
                          <p className="text-sm text-gray-600">Kosong</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <p className="text-2xl font-bold text-red-600">{stats.maintenance}</p>
                          <p className="text-sm text-gray-600">Perawatan</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedProperty(null)}>
                  Tutup
                </Button>
                <Button className="bg-[#1A3D5C] hover:bg-[#0F2744]">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Properti
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
