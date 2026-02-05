import { useState, useEffect } from 'react';
import { Plus, Search, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
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
import { maintenanceAPI, propertiesAPI, roomsAPI } from '@/services/api';
import type { MaintenanceRequest, Property, Room } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, getIssueTypeLabel, getPriorityLabel, getPriorityColor } from '@/lib/format';

export function Maintenance() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    propertyId: '',
    roomId: '',
    issueType: 'plumbing' as 'plumbing' | 'electrical' | 'furniture' | 'appliance' | 'structural' | 'other',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    description: '',
    technicianName: '',
    estimatedCost: 0,
    notes: '',
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [requestsRes, propertiesRes, roomsRes] = await Promise.all([
        maintenanceAPI.getAll(),
        propertiesAPI.getAll(),
        roomsAPI.getAll(),
      ]);
      setMaintenanceRequests(requestsRes);
      setProperties(propertiesRes);
      setRooms(roomsRes);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter requests
  const filteredRequests = maintenanceRequests.filter(request => {
    const room = rooms.find(r => r.id === request.roomId);
    const matchesSearch = 
      room?.roomNumber.includes(searchQuery) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'reported') return matchesSearch && request.status === 'reported';
    if (activeTab === 'in_progress') return matchesSearch && request.status === 'in_progress';
    if (activeTab === 'completed') return matchesSearch && request.status === 'completed';
    return matchesSearch;
  });

  // Calculate stats
  const pendingRequests = maintenanceRequests.filter(r => r.status === 'reported' || r.status === 'in_progress').length;
  const urgentRequests = maintenanceRequests.filter(r => r.priority === 'urgent' && r.status !== 'completed').length;
  const completedThisMonth = maintenanceRequests.filter(r => 
    r.status === 'completed' && 
    r.actualCompletion && 
    new Date(r.actualCompletion).getMonth() === new Date().getMonth()
  ).length;

  // Handle add request
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await maintenanceAPI.create(formData);
      toast.success('Request perawatan berhasil dibuat');
      setIsAddDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Gagal membuat request');
    }
  };

  // Handle complete request
  const handleComplete = async () => {
    if (!selectedRequest) return;
    try {
      await maintenanceAPI.complete(selectedRequest.id);
      toast.success('Request perawatan selesai');
      setSelectedRequest(null);
      fetchData();
    } catch (error) {
      toast.error('Gagal menyelesaikan request');
    }
  };

  // Handle delete request
  const handleDelete = async () => {
    if (!selectedRequest) return;
    try {
      await maintenanceAPI.delete(selectedRequest.id);
      toast.success('Request perawatan berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setSelectedRequest(null);
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus request');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perawatan & Perbaikan</h1>
          <p className="text-gray-500">Kelola request perawatan dan perbaikan</p>
        </div>
        <Button 
          className="bg-[#1A3D5C] hover:bg-[#0F2744]"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Buat Request
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-700">Request Aktif</p>
                <p className="text-xl font-bold text-orange-800">{pendingRequests}</p>
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
                <p className="text-sm text-red-700">Prioritas Mendesak</p>
                <p className="text-xl font-bold text-red-800">{urgentRequests}</p>
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
            placeholder="Cari request perawatan..."
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
          <TabsTrigger value="reported">Dilaporkan</TabsTrigger>
          <TabsTrigger value="in_progress">Diproses</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
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
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Jenis Masalah</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Deskripsi</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Prioritas</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tanggal</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Biaya</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredRequests.map((request) => {
                      const room = rooms.find(r => r.id === request.roomId);
                      return (
                        <tr 
                          key={request.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium">{room?.roomNumber}</p>
                            <p className="text-xs text-gray-500">
                              {properties.find(p => p.id === request.propertyId)?.name}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{getIssueTypeLabel(request.issueType)}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600 line-clamp-1">{request.description}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn("text-white", getPriorityColor(request.priority))}>
                              {getPriorityLabel(request.priority)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn(
                              request.status === 'completed' && "bg-green-100 text-green-700",
                              request.status === 'reported' && "bg-yellow-100 text-yellow-700",
                              request.status === 'in_progress' && "bg-blue-100 text-blue-700",
                              request.status === 'cancelled' && "bg-red-100 text-red-700",
                            )}>
                              {request.status === 'completed' ? 'Selesai' : 
                               request.status === 'reported' ? 'Dilaporkan' : 
                               request.status === 'in_progress' ? 'Diproses' : 'Dibatalkan'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <p>{formatDate(request.requestDate)}</p>
                            {request.actualCompletion && (
                              <p className="text-xs text-green-600">
                                Selesai: {formatDate(request.actualCompletion)}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {request.cost > 0 ? (
                              <span className="font-medium">{formatCurrency(request.cost)}</span>
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
          {!isLoading && filteredRequests.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Tidak ada request perawatan</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Request
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Request Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Request Perawatan</DialogTitle>
            <DialogDescription>
              Laporkan masalah perawatan atau perbaikan
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
              <Label htmlFor="issueType">Jenis Masalah *</Label>
              <select
                id="issueType"
                value={formData.issueType}
                onChange={(e) => setFormData({ ...formData, issueType: e.target.value as 'plumbing' | 'electrical' | 'furniture' | 'appliance' | 'structural' | 'other' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                required
              >
                <option value="plumbing">Plumbing (Air)</option>
                <option value="electrical">Listrik</option>
                <option value="furniture">Furniture</option>
                <option value="appliance">Peralatan</option>
                <option value="structural">Struktural</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioritas *</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                required
              >
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
                <option value="urgent">Mendesak</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Masalah *</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                rows={3}
                required
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
              <Label htmlFor="estimatedCost">Estimasi Biaya (Rp)</Label>
              <Input
                id="estimatedCost"
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: parseInt(e.target.value) })}
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

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest && !isDeleteDialogOpen} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Detail Request Perawatan</DialogTitle>
                <DialogDescription>
                  Informasi lengkap request perawatan
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {(() => {
                  const room = rooms.find(r => r.id === selectedRequest.roomId);
                  return (
                    <>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <Badge className={cn(
                            "text-sm mt-1",
                            selectedRequest.status === 'completed' && "bg-green-100 text-green-700",
                            selectedRequest.status === 'reported' && "bg-yellow-100 text-yellow-700",
                            selectedRequest.status === 'in_progress' && "bg-blue-100 text-blue-700",
                          )}>
                            {selectedRequest.status === 'completed' ? 'Selesai' : 
                             selectedRequest.status === 'reported' ? 'Dilaporkan' : 'Diproses'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Prioritas</p>
                          <Badge className={cn("text-white mt-1", getPriorityColor(selectedRequest.priority))}>
                            {getPriorityLabel(selectedRequest.priority)}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Kamar</span>
                          <span className="font-medium">{room?.roomNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Jenis Masalah</span>
                          <Badge variant="outline">{getIssueTypeLabel(selectedRequest.issueType)}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tanggal Lapor</span>
                          <span>{formatDate(selectedRequest.requestDate)}</span>
                        </div>
                        {selectedRequest.actualCompletion && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tanggal Selesai</span>
                            <span>{formatDate(selectedRequest.actualCompletion)}</span>
                          </div>
                        )}
                        {selectedRequest.technicianName && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Teknisi</span>
                            <span>{selectedRequest.technicianName}</span>
                          </div>
                        )}
                        {selectedRequest.cost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Biaya</span>
                            <span className="font-medium">{formatCurrency(selectedRequest.cost)}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-500">Deskripsi Masalah</Label>
                        <p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg">{selectedRequest.description}</p>
                      </div>

                      {selectedRequest.notes && (
                        <div>
                          <Label className="text-gray-500">Catatan</Label>
                          <p className="mt-1 text-sm">{selectedRequest.notes}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
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
                {selectedRequest.status !== 'completed' && (
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
              Apakah Anda yakin ingin menghapus request perawatan ini? 
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
