import { useState, useEffect } from 'react';
import { Plus, Search, Wind, CheckCircle, AlertCircle, Calendar, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { acCleaningAPI, propertiesAPI, roomsAPI } from '@/services/api';
import type { ACCleaningSchedule, Property, Room } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/format';

export function ACCleaning() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<ACCleaningSchedule | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [acCleaningSchedules, setAcCleaningSchedules] = useState<ACCleaningSchedule[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    propertyId: '',
    roomId: '',
    acUnitId: '',
    lastCleaningDate: '',
    nextCleaningDate: '',
    scheduleIntervalDays: 180,
    technicianName: '',
    cost: 0,
    notes: '',
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [schedulesRes, propertiesRes, roomsRes] = await Promise.all([
        acCleaningAPI.getAll(),
        propertiesAPI.getAll(),
        roomsAPI.getAll(),
      ]);
      setAcCleaningSchedules(schedulesRes);
      setProperties(propertiesRes);
      setRooms(roomsRes);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter schedules
  const filteredSchedules = acCleaningSchedules.filter(schedule => {
    const room = rooms.find(r => r.id === schedule.roomId);
    const matchesSearch = room?.roomNumber.includes(searchQuery);
    
    if (activeTab === 'upcoming') return matchesSearch && schedule.status === 'pending';
    if (activeTab === 'completed') return matchesSearch && schedule.status === 'completed';
    if (activeTab === 'overdue') return matchesSearch && schedule.status === 'overdue';
    return matchesSearch;
  });

  // Calculate stats
  const upcomingCount = acCleaningSchedules.filter(s => s.status === 'pending').length;
  const overdueCount = acCleaningSchedules.filter(s => s.status === 'overdue').length;
  const completedThisMonth = acCleaningSchedules.filter(s => 
    s.status === 'completed' && 
    s.completedDate && 
    new Date(s.completedDate).getMonth() === new Date().getMonth()
  ).length;

  // Handle add schedule
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await acCleaningAPI.create(formData);
      toast.success('Jadwal AC berhasil ditambahkan');
      setIsAddDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Gagal menambahkan jadwal');
    }
  };

  // Handle complete schedule
  const handleComplete = async () => {
    if (!selectedSchedule) return;
    try {
      await acCleaningAPI.complete(selectedSchedule.id);
      toast.success('Jadwal AC selesai');
      setSelectedSchedule(null);
      fetchData();
    } catch (error) {
      toast.error('Gagal menyelesaikan jadwal');
    }
  };

  // Handle delete schedule
  const handleDelete = async () => {
    if (!selectedSchedule) return;
    try {
      await acCleaningAPI.delete(selectedSchedule.id);
      toast.success('Jadwal AC berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setSelectedSchedule(null);
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus jadwal');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Pembersihan AC</h1>
          <p className="text-gray-500">Kelola jadwal perawatan AC rutin (6 bulan)</p>
        </div>
        <Button 
          className="bg-[#1A3D5C] hover:bg-[#0F2744]"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Jadwal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Jadwal Mendatang</p>
                <p className="text-xl font-bold text-blue-800">{upcomingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-red-700">Terlambat</p>
                <p className="text-xl font-bold text-red-800">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">Selesai Bulan Ini</p>
                <p className="text-xl font-bold text-green-800">{completedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari berdasarkan nomor kamar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Mendatang</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
          <TabsTrigger value="overdue">Terlambat</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Memuat data...</p>
            </div>
          )}

          {!isLoading && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kamar</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Unit AC</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Pembersihan Terakhir</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Jadwal Berikutnya</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Teknisi</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Biaya</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredSchedules.map((schedule) => {
                      const room = rooms.find(r => r.id === schedule.roomId);
                      return (
                        <tr 
                          key={schedule.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedSchedule(schedule)}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium">{room?.roomNumber}</p>
                            <p className="text-xs text-gray-500">
                              {properties.find(p => p.id === schedule.propertyId)?.name}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm">{schedule.acUnitId || '-'}</span>
                          </td>
                          <td className="px-4 py-3">
                            {schedule.lastCleaningDate ? (
                              <span>{formatDate(schedule.lastCleaningDate)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "font-medium",
                              schedule.status === 'overdue' && "text-red-600"
                            )}>
                              {formatDate(schedule.nextCleaningDate)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn(
                              schedule.status === 'completed' && "bg-green-100 text-green-700",
                              schedule.status === 'pending' && "bg-blue-100 text-blue-700",
                              schedule.status === 'overdue' && "bg-red-100 text-red-700",
                            )}>
                              {schedule.status === 'completed' ? 'Selesai' : 
                               schedule.status === 'pending' ? 'Mendatang' : 'Terlambat'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {schedule.technicianName || (
                              <span className="text-gray-400">Belum ditugaskan</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {schedule.cost > 0 ? (
                              <span className="font-medium">{formatCurrency(schedule.cost)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
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
          {!isLoading && filteredSchedules.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Tidak ada jadwal AC</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Jadwal
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Schedule Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Jadwal AC</DialogTitle>
            <DialogDescription>
              Buat jadwal pembersihan AC baru
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="property">Properti *</Label>
              <select
                id="property"
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value, roomId: '' })}
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
              <Label htmlFor="room">Kamar *</Label>
              <select
                id="room"
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                required
              >
                <option value="">Pilih Kamar</option>
                {rooms.filter(r => r.propertyId === formData.propertyId).map(r => (
                  <option key={r.id} value={r.id}>{r.roomNumber}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="acUnitId">ID Unit AC</Label>
              <Input
                id="acUnitId"
                value={formData.acUnitId}
                onChange={(e) => setFormData({ ...formData, acUnitId: e.target.value })}
                placeholder="Contoh: AC-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastCleaningDate">Pembersihan Terakhir</Label>
              <Input
                id="lastCleaningDate"
                type="date"
                value={formData.lastCleaningDate}
                onChange={(e) => setFormData({ ...formData, lastCleaningDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextCleaningDate">Jadwal Berikutnya *</Label>
              <Input
                id="nextCleaningDate"
                type="date"
                value={formData.nextCleaningDate}
                onChange={(e) => setFormData({ ...formData, nextCleaningDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleIntervalDays">Interval (hari)</Label>
              <Input
                id="scheduleIntervalDays"
                type="number"
                value={formData.scheduleIntervalDays}
                onChange={(e) => setFormData({ ...formData, scheduleIntervalDays: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technicianName">Nama Teknisi</Label>
              <Input
                id="technicianName"
                value={formData.technicianName}
                onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Biaya (Rp)</Label>
              <Input
                id="cost"
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                rows={2}
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

      {/* Schedule Detail Dialog */}
      <Dialog open={!!selectedSchedule && !isDeleteDialogOpen} onOpenChange={() => setSelectedSchedule(null)}>
        <DialogContent className="max-w-lg">
          {selectedSchedule && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wind className="w-5 h-5" />
                  Detail Jadwal AC Cleaning
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {(() => {
                  const room = rooms.find(r => r.id === selectedSchedule.roomId);
                  return (
                    <>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <Badge className={cn(
                            "text-sm mt-1",
                            selectedSchedule.status === 'completed' && "bg-green-100 text-green-700",
                            selectedSchedule.status === 'pending' && "bg-blue-100 text-blue-700",
                            selectedSchedule.status === 'overdue' && "bg-red-100 text-red-700",
                          )}>
                            {selectedSchedule.status === 'completed' ? 'Selesai' : 
                             selectedSchedule.status === 'pending' ? 'Mendatang' : 'Terlambat'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Interval</p>
                          <p className="font-medium">{selectedSchedule.scheduleIntervalDays} hari</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Kamar</span>
                          <span className="font-medium">{room?.roomNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Unit AC</span>
                          <span className="font-mono">{selectedSchedule.acUnitId || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Properti</span>
                          <span>{properties.find(p => p.id === selectedSchedule.propertyId)?.name}</span>
                        </div>
                        {selectedSchedule.lastCleaningDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Pembersihan Terakhir</span>
                            <span>{formatDate(selectedSchedule.lastCleaningDate)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500">Jadwal Berikutnya</span>
                          <span className={cn(
                            "font-medium",
                            selectedSchedule.status === 'overdue' && "text-red-600"
                          )}>
                            {formatDate(selectedSchedule.nextCleaningDate)}
                          </span>
                        </div>
                        {selectedSchedule.completedDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tanggal Selesai</span>
                            <span>{formatDate(selectedSchedule.completedDate)}</span>
                          </div>
                        )}
                        {selectedSchedule.technicianName && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Teknisi</span>
                            <span>{selectedSchedule.technicianName}</span>
                          </div>
                        )}
                        {selectedSchedule.cost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Biaya</span>
                            <span className="font-medium">{formatCurrency(selectedSchedule.cost)}</span>
                          </div>
                        )}
                      </div>

                      {selectedSchedule.notes && (
                        <div>
                          <Label className="text-gray-500">Catatan</Label>
                          <p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg">{selectedSchedule.notes}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedSchedule(null)}>
                  Tutup
                </Button>
                <Button 
                  variant="outline"
                  className="text-red-600"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
                {selectedSchedule.status !== 'completed' && (
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleComplete}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Tandai Selesai
                  </Button>
                )}
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
              Apakah Anda yakin ingin menghapus jadwal AC ini? 
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
