import { useState } from 'react';
import { Plus, Search, Grid3X3, List, Image as ImageIcon, Users, Edit, Trash2, MoreHorizontal } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { properties, rooms, roomMedia, tenants } from '@/data/mockData';
import type { Room } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, getRoomStatusColor, getRoomStatusLabel } from '@/lib/format';

export function Rooms() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string>(properties[0]?.id || '');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [, setIsAddDialogOpen] = useState(false);

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const matchesProperty = room.propertyId === selectedProperty;
    const matchesFloor = room.floor === selectedFloor;
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProperty && matchesFloor && matchesSearch;
  });

  // Get property floors
  const propertyFloors = Array.from(
    new Set(rooms.filter(r => r.propertyId === selectedProperty).map(r => r.floor))
  ).sort();

  // Get room tenant
  const getRoomTenant = (roomId: string) => {
    return tenants.find(t => t.roomId === roomId && t.status === 'active');
  };

  // Get room photos
  const getRoomPhotos = (roomId: string) => {
    return roomMedia.filter(m => m.roomId === roomId);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Kamar</h1>
          <p className="text-gray-500">Kelola kamar dan okupansi properti</p>
        </div>
        <Button className="bg-[#1A3D5C] hover:bg-[#0F2744]" onClick={() => setIsAddDialogOpen(true)}>
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
            {propertyFloors.map(floor => (
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
            ))}
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

      {/* Rooms Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredRooms.map((room) => {
            const tenant = getRoomTenant(room.id);
            const photos = getRoomPhotos(room.id);
            
            return (
              <Card 
                key={room.id} 
                className={cn(
                  "cursor-pointer hover:shadow-lg transition-all",
                  "border-2",
                  room.status === 'occupied' && "border-blue-200",
                  room.status === 'available' && "border-green-200",
                  room.status === 'reserved' && "border-yellow-200",
                  room.status === 'maintenance' && "border-red-200",
                )}
                onClick={() => setSelectedRoom(room)}
              >
                <CardContent className="p-4">
                  {/* Room Number & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gray-900">{room.roomNumber}</span>
                    <div className={cn("w-3 h-3 rounded-full", getRoomStatusColor(room.status))} />
                  </div>

                  {/* Room Photo */}
                  <div className="h-24 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    {photos.length > 0 ? (
                      <img 
                        src={photos[0].imageUrl} 
                        alt={room.roomNumber}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Room Info */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(room.baseMonthlyRent)}/bulan
                    </p>
                    <p className="text-xs text-gray-500">
                      {room.roomType === 'standard' ? 'Standar' : room.roomType === 'deluxe' ? 'Deluxe' : 'Premium'}
                      {room.occupancyType === 'double' && ' (Bersama)'}
                    </p>
                    {tenant ? (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Users className="w-3 h-3" />
                        <span className="truncate">{tenant.fullName}</span>
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

      {/* Rooms List View */}
      {viewMode === 'list' && (
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
                {filteredRooms.map((room) => {
                  const tenant = getRoomTenant(room.id);
                  return (
                    <tr key={room.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{room.roomNumber}</span>
                        <p className="text-xs text-gray-500">Lantai {room.floor}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize">{room.roomType}</span>
                        {room.occupancyType === 'double' && (
                          <Badge variant="outline" className="ml-2 text-xs">Bersama</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {formatCurrency(room.baseMonthlyRent)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-white", getRoomStatusColor(room.status))}>
                          {getRoomStatusLabel(room.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {tenant ? (
                          <div>
                            <p className="text-sm">{tenant.fullName}</p>
                            <p className="text-xs text-gray-500">{tenant.phone}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {room.amenities.ac && <Badge variant="outline" className="text-xs">AC</Badge>}
                          {room.amenities.privateBathroom && <Badge variant="outline" className="text-xs">KM</Badge>}
                          {room.amenities.balcony && <Badge variant="outline" className="text-xs">Balkon</Badge>}
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
                            <DropdownMenuItem onClick={() => setSelectedRoom(room)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
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

      {/* Room Detail Dialog */}
      <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
        <DialogContent className="max-w-2xl">
          {selectedRoom && (
            <>
              <DialogHeader>
                <DialogTitle>Kamar {selectedRoom.roomNumber}</DialogTitle>
                <DialogDescription>
                  Detail informasi kamar
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-6">
                {/* Room Photos */}
                <div>
                  <h4 className="font-semibold mb-2">Foto Kamar</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {getRoomPhotos(selectedRoom.id).length > 0 ? (
                      getRoomPhotos(selectedRoom.id).map((photo, idx) => (
                        <img 
                          key={idx} 
                          src={photo.imageUrl} 
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))
                    ) : (
                      <div className="col-span-2 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Room Info */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-500">Status</Label>
                    <Badge className={cn("text-white mt-1", getRoomStatusColor(selectedRoom.status))}>
                      {getRoomStatusLabel(selectedRoom.status)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-gray-500">Tipe Kamar</Label>
                    <p className="font-medium capitalize">{selectedRoom.roomType}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Harga per Bulan</Label>
                    <p className="font-medium">{formatCurrency(selectedRoom.baseMonthlyRent)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Tipe Okupansi</Label>
                    <p className="font-medium">
                      {selectedRoom.occupancyType === 'single' ? 'Single' : 'Bersama (2 orang)'}
                    </p>
                  </div>
                  {selectedRoom.sizeSqm && (
                    <div>
                      <Label className="text-gray-500">Ukuran</Label>
                      <p className="font-medium">{selectedRoom.sizeSqm} m²</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Tenant */}
              {getRoomTenant(selectedRoom.id) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Penghuni Saat Ini</h4>
                  {(() => {
                    const tenant = getRoomTenant(selectedRoom.id)!;
                    return (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium">{tenant.fullName}</p>
                        <p className="text-sm text-gray-500">{tenant.phone}</p>
                        <p className="text-sm text-gray-500">
                          Check-in: {new Date(tenant.checkInDate).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedRoom(null)}>
                  Tutup
                </Button>
                <Button className="bg-[#1A3D5C] hover:bg-[#0F2744]">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Kamar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
