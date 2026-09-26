// app/src/pages/Maintenance.tsx - Responsive Mobile Version
import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, CheckCircle, Clock, AlertCircle, Trash2, CalendarIcon } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { maintenanceAPI, propertiesAPI, roomsAPI } from '@/services/api';
import type { MaintenanceRequest, Property, Room } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, getIssueTypeLabel, getPriorityLabel, getPriorityColor } from '@/lib/format';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function Maintenance() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const [formData, setFormData] = useState({
    propertyId: '', roomId: '',
    issueType: 'ac' as 'ac' | 'plumbing' | 'electrical' | 'furniture' | 'painting' | 'other',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    description: '', technicianName: '', estimatedCost: 0, notes: '', requestDate: new Date(),
  });

  const monthOptions = useMemo(() => {
    const options = [{ label: 'Semua Bulan', value: 'all' }];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear(); const monthIndex = date.getMonth();
      const monthName = INDONESIAN_MONTHS[monthIndex];
      const value = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      options.push({ label: `${monthName} ${year}`, value });
    }
    return options;
  }, []);

  const propertyOptions = useMemo(() => {
    return [{ label: 'Semua Properti', value: 'all' },...properties.map(p => ({ label: p.name, value: p.id }))];
  }, [properties]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [requestsRes, propertiesRes, roomsRes] = await Promise.all([maintenanceAPI.getAll(), propertiesAPI.getAll(), roomsAPI.getAll()]);
      setMaintenanceRequests(requestsRes); setProperties(propertiesRes); setRooms(roomsRes);
    } catch (error) { toast.error('Gagal memuat data'); }
    finally { setIsLoading(false); }
  };

  const filteredRequests = useMemo(() => {
    return maintenanceRequests.filter(request => {
      if (selectedProperty!== 'all' && request.property_id!== selectedProperty) return false;
      if (selectedMonth!== 'all') { if (!request.request_date) return false; if (!request.request_date.startsWith(selectedMonth)) return false; }
      const room = rooms.find(r => r.id === request.room_id);
      const matchesSearch = (room?.room_number?.toLowerCase().includes(searchQuery.toLowerCase())?? false) || request.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeTab === 'all') return matchesSearch;
      if (activeTab === 'reported') return matchesSearch && request.status === 'reported';
      if (activeTab === 'in_progress') return matchesSearch && request.status === 'in_progress';
      if (activeTab === 'completed') return matchesSearch && request.status === 'completed';
      return matchesSearch;
    });
  }, [maintenanceRequests, selectedProperty, selectedMonth, searchQuery, activeTab, rooms]);

  const pendingRequests = maintenanceRequests.filter(r => r.status === 'reported' || r.status === 'in_progress').length;
  const urgentRequests = maintenanceRequests.filter(r => r.priority === 'urgent' && r.status!== 'completed').length;
  const completedThisMonth = maintenanceRequests.filter(r => r.status === 'completed' && r.actual_completion && new Date(r.actual_completion).getMonth() === new Date().getMonth() && new Date(r.actual_completion).getFullYear() === new Date().getFullYear()).length;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiData = {
        property_id: formData.propertyId, room_id: formData.roomId, issue_type: formData.issueType,
        priority: formData.priority, description: formData.description, technician_name: formData.technicianName || null,
        cost: formData.estimatedCost || 0, notes: formData.notes || null,
        request_date: formData.requestDate.toISOString().split('T')[0], status: 'reported',
      };
      await maintenanceAPI.create(apiData); toast.success('Request perawatan berhasil dibuat'); setIsAddDialogOpen(false);
      setFormData({ propertyId: '', roomId: '', issueType: 'plumbing', priority: 'medium', description: '', technicianName: '', estimatedCost: 0, notes: '', requestDate: new Date() }); fetchData();
    } catch (error) { toast.error('Gagal membuat request'); }
  };

  const handleComplete = async () => {
    if (!selectedRequest) return;
    try { const completeData = { actual_completion: new Date().toISOString().split('T')[0], cost: selectedRequest.cost || 0 }; await maintenanceAPI.complete(selectedRequest.id, completeData); toast.success('Request perawatan selesai'); setSelectedRequest(null); fetchData(); }
    catch (error) { toast.error('Gagal menyelesaikan request'); }
  };

  const handleDelete = async () => {
    if (!selectedRequest) return;
    try { await maintenanceAPI.delete(selectedRequest.id); toast.success('Request perawatan berhasil dihapus'); setIsDeleteDialogOpen(false); setSelectedRequest(null); fetchData(); }
    catch (error) { toast.error('Gagal menghapus request'); }
  };

  const FormContent = () => (
    <div className="space-y-4">
      <div className="space-y-2"><Label className="text-sm">Tanggal Request *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11 text-base sm:h-10 sm:text-sm",!formData.requestDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />{formData.requestDate? format(formData.requestDate, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={formData.requestDate} onSelect={(date) => date && setFormData({...formData, requestDate: date})} initialFocus className="p-3 [&_.rdp-cell]:w-10 [&_.rdp-cell]:h-10" /></PopoverContent>
        </Popover>
      </div>
      <div className="space-y-2"><Label className="text-sm">Properti *</Label>
        <select value={formData.propertyId} onChange={(e) => setFormData({...formData, propertyId: e.target.value, roomId: ''})} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" required>
          <option value="">Pilih Properti</option>{properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>
      </div>
      <div className="space-y-2"><Label className="text-sm">Kamar *</Label>
        <select value={formData.roomId} onChange={(e) => setFormData({...formData, roomId: e.target.value})} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" required disabled={!formData.propertyId}>
          <option value="">Pilih Kamar</option>{rooms.filter(r => r.property_id === formData.propertyId).map(r => (<option key={r.id} value={r.id}>{r.room_number}</option>))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2"><Label className="text-sm">Jenis Masalah *</Label>
          <select value={formData.issueType} onChange={(e) => setFormData({...formData, issueType: e.target.value as any})} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" required>
            <option value="ac">AC</option><option value="plumbing">Plumbing</option><option value="electrical">Kelistrikan</option><option value="furniture">Mebel</option><option value="painting">Cat</option><option value="other">Lainnya</option>
          </select>
        </div>
        <div className="space-y-2"><Label className="text-sm">Prioritas *</Label>
          <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value as any})} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" required>
            <option value="low">Rendah</option><option value="medium">Sedang</option><option value="high">Tinggi</option><option value="urgent">Mendesak</option>
          </select>
        </div>
      </div>
      <div className="space-y-2"><Label className="text-sm">Deskripsi Masalah *</Label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" rows={3} required placeholder="Jelaskan detail masalah..." /></div>
      <div className="space-y-2"><Label className="text-sm">Nama Teknisi</Label><Input value={formData.technicianName} onChange={(e) => setFormData({...formData, technicianName: e.target.value})} placeholder="Nama teknisi (opsional)" className="h-11 text-base sm:h-10 sm:text-sm" /></div>
      <div className="space-y-2"><Label className="text-sm">Estimasi Biaya (Rp)</Label><Input type="text" inputMode="numeric" value={formData.estimatedCost} onChange={(e) => setFormData({...formData, estimatedCost: parseInt(e.target.value) || 0})} placeholder="0" className="h-11 text-base sm:h-10 sm:text-sm" /></div>
      <div className="space-y-2"><Label className="text-sm">Catatan</Label><textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" rows={2} placeholder="Catatan tambahan (opsional)" /></div>
    </div>
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Perawatan & Perbaikan</h1><p className="text-sm sm:text-base text-gray-500">Kelola request perawatan dan perbaikan</p></div>
        <Button className="bg-[#1A3D5C] hover:bg-[#0F2744] w-full sm:w-auto h-11 sm:h-10 shrink-0" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Buat Request</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
        <Card className="bg-orange-50 border-orange-200 w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-white" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-orange-700">Request Aktif</p><p className="text-lg sm:text-xl font-bold text-orange-800">{pendingRequests}</p></div></div></CardContent></Card>
        <Card className="bg-red-50 border-red-200 w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shrink-0"><AlertCircle className="w-5 h-5 text-white" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-red-700">Prioritas Mendesak</p><p className="text-lg sm:text-xl font-bold text-red-800">{urgentRequests}</p></div></div></CardContent></Card>
        <Card className="bg-green-50 border-green-200 w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shrink-0"><CheckCircle className="w-5 h-5 text-white" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-green-700">Selesai Bulan Ini</p><p className="text-lg sm:text-xl font-bold text-green-800">{completedThisMonth}</p></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center bg-white p-3 sm:p-4 rounded-lg border border-gray-200 w-full">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3 w-full sm:w-auto">
          <select value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)} className="w-full sm:w-48 h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C] bg-white">
            {propertyOptions.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
          </select>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full sm:w-48 h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C] bg-white">
            {monthOptions.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
          </select>
        </div>
        <div className="relative w-full sm:flex-1 sm:min-w- sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input type="text" placeholder="Cari request perawatan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 text-base sm:h-10 sm:text-sm w-full" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex h-11 sm:h-10">
          <TabsTrigger value="all" className="h-9 text-xs sm:text-sm">Semua</TabsTrigger>
          <TabsTrigger value="reported" className="h-9 text-xs sm:text-sm">Dilaporkan</TabsTrigger>
          <TabsTrigger value="in_progress" className="h-9 text-xs sm:text-sm">Proses</TabsTrigger>
          <TabsTrigger value="completed" className="h-9 text-xs sm:text-sm">Selesai</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading && (<div className="text-center py-12"><div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" /><p className="text-gray-500">Memuat data...</p></div>)}

          {!isLoading && (
            <>
              <Card className="hidden sm:block w-full overflow-hidden">
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kamar</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Jenis Masalah</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Deskripsi</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Prioritas</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tanggal</th><th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Biaya</th></tr></thead>
                  <tbody className="divide-y">{filteredRequests.map((request) => {
                    const room = rooms.find(r => r.id === request.room_id);
                    return (<tr key={request.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedRequest(request)}><td className="px-4 py-3"><p className="font-medium">{room?.room_number}</p><p className="text-xs text-gray-500">{properties.find(p => p.id === request.property_id)?.name}</p></td><td className="px-4 py-3"><Badge variant="outline">{getIssueTypeLabel(request.issue_type)}</Badge></td><td className="px-4 py-3"><span className="text-sm text-gray-600 line-clamp-1">{request.description}</span></td><td className="px-4 py-3"><Badge className={cn("text-white", getPriorityColor(request.priority))}>{getPriorityLabel(request.priority)}</Badge></td><td className="px-4 py-3"><Badge className={cn(request.status === 'completed' && "bg-green-100 text-green-700", request.status === 'reported' && "bg-yellow-100 text-yellow-700", request.status === 'in_progress' && "bg-blue-100 text-blue-700", request.status === 'cancelled' && "bg-red-100 text-red-700")}>{request.status === 'completed'? 'Selesai' : request.status === 'reported'? 'Dilaporkan' : request.status === 'in_progress'? 'Diproses' : 'Dibatalkan'}</Badge></td><td className="px-4 py-3"><p>{formatDate(request.request_date)}</p>{request.actual_completion && (<p className="text-xs text-green-600">Selesai: {formatDate(request.actual_completion)}</p>)}</td><td className="px-4 py-3 text-right">{request.cost > 0? (<span className="font-medium">{formatCurrency(request.cost)}</span>) : (<span className="text-gray-400">-</span>)}</td></tr>);
                  })}</tbody>
                </table></div>
              </Card>

              <div className="grid grid-cols-1 gap-3 sm:hidden w-full">
                {filteredRequests.map((request) => {
                  const room = rooms.find(r => r.id === request.room_id);
                  return (
                    <Card key={request.id} className="w-full overflow-hidden cursor-pointer active:bg-gray-50" onClick={() => setSelectedRequest(request)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-2"><div className="min-w-0 flex-1"><p className="font-semibold text-gray-900 truncate text-">Kamar {room?.room_number} • {getIssueTypeLabel(request.issue_type)}</p><p className="text-xs text-gray-500 truncate mt-0.5">{properties.find(p => p.id === request.property_id)?.name} • {formatDate(request.request_date)}</p></div><Badge className={cn("text-white shrink-0 text-xs", getPriorityColor(request.priority))}>{getPriorityLabel(request.priority)}</Badge></div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2 break-words">{request.description}</p>
                        <div className="mt-3 flex justify-between items-center"><Badge className={cn("text-xs", request.status === 'completed' && "bg-green-100 text-green-700", request.status === 'reported' && "bg-yellow-100 text-yellow-700", request.status === 'in_progress' && "bg-blue-100 text-blue-700")}>{request.status === 'completed'? 'Selesai' : request.status === 'reported'? 'Dilaporkan' : 'Diproses'}</Badge><span className="text-sm font-medium">{request.cost > 0? formatCurrency(request.cost) : '-'}</span></div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {!isLoading && filteredRequests.length === 0 && (<div className="text-center py-12 bg-gray-50 rounded-lg px-4"><p className="text-gray-500">Tidak ada request perawatan</p><Button variant="outline" className="mt-4 h-11 w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Buat Request</Button></div>)}
        </TabsContent>
      </Tabs>

      {/* Add */}
      {isMobile? (
        <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col bg-white">
            <SheetHeader className="p-4 border-b shrink-0 text-left"><SheetTitle>Buat Request Perawatan</SheetTitle><SheetDescription>Laporkan masalah perawatan atau perbaikan</SheetDescription></SheetHeader>
            <form onSubmit={handleAdd} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)]"><FormContent /></div>
              <SheetFooter className="p-4 border-t flex-row gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setIsAddDialogOpen(false)}>Batal</Button><Button type="submit" className="flex-1 bg-[#1A3D5C] hover:bg-[#0F2744] h-11">Simpan</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg max-h- overflow-y-auto"><DialogHeader><DialogTitle>Buat Request Perawatan</DialogTitle><DialogDescription>Laporkan masalah perawatan atau perbaikan</DialogDescription></DialogHeader><form onSubmit={handleAdd} className="space-y-4"><FormContent /><DialogFooter><Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button><Button type="submit" className="bg-[#1A3D5C] hover:bg-[#0F2744]">Simpan</Button></DialogFooter></form></DialogContent>
        </Dialog>
      )}

      {/* Detail */}
      {isMobile? (
        <Sheet open={!!selectedRequest &&!isDeleteDialogOpen} onOpenChange={() => setSelectedRequest(null)}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col bg-white">
            {selectedRequest && (() => {
              const room = rooms.find(r => r.id === selectedRequest.room_id);
              return (
                <>
                  <SheetHeader className="p-4 border-b shrink-0 text-left"><SheetTitle>Detail Request Perawatan</SheetTitle><SheetDescription>Informasi lengkap request perawatan</SheetDescription></SheetHeader>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[env(safe-area-inset-bottom)]">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"><div><p className="text-xs text-gray-500">Status</p><Badge className={cn("text-xs mt-1", selectedRequest.status === 'completed' && "bg-green-100 text-green-700", selectedRequest.status === 'reported' && "bg-yellow-100 text-yellow-700", selectedRequest.status === 'in_progress' && "bg-blue-100 text-blue-700")}>{selectedRequest.status === 'completed'? 'Selesai' : selectedRequest.status === 'reported'? 'Dilaporkan' : 'Diproses'}</Badge></div><div className="text-right"><p className="text-xs text-gray-500">Prioritas</p><Badge className={cn("text-white text-xs mt-1", getPriorityColor(selectedRequest.priority))}>{getPriorityLabel(selectedRequest.priority)}</Badge></div></div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-2"><span className="text-gray-500">Kamar</span><span className="font-medium">{room?.room_number}</span></div>
                      <div className="flex justify-between gap-2"><span className="text-gray-500">Jenis</span><Badge variant="outline" className="text-xs">{getIssueTypeLabel(selectedRequest.issue_type)}</Badge></div>
                      <div className="flex justify-between gap-2"><span className="text-gray-500">Tanggal Lapor</span><span>{formatDate(selectedRequest.request_date)}</span></div>
                      {selectedRequest.actual_completion && (<div className="flex justify-between gap-2"><span className="text-gray-500">Selesai</span><span>{formatDate(selectedRequest.actual_completion)}</span></div>)}
                      {selectedRequest.technician_name && (<div className="flex justify-between gap-2"><span className="text-gray-500">Teknisi</span><span className="font-medium truncate">{selectedRequest.technician_name}</span></div>)}
                      {selectedRequest.cost > 0 && (<div className="flex justify-between gap-2"><span className="text-gray-500">Biaya</span><span className="font-medium">{formatCurrency(selectedRequest.cost)}</span></div>)}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg"><Label className="text-xs text-gray-500">Deskripsi Masalah</Label><p className="mt-1 text-sm break-words">{selectedRequest.description}</p></div>
                    {selectedRequest.notes && (<div><Label className="text-xs text-gray-500">Catatan</Label><p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg break-words">{selectedRequest.notes}</p></div>)}
                  </div>
                  <div className="p-4 border-t grid grid-cols-2 gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <Button variant="outline" className="h-11" onClick={() => setSelectedRequest(null)}>Tutup</Button>
                    {selectedRequest.status!== 'completed'? (<Button className="bg-green-600 hover:bg-green-700 h-11" onClick={handleComplete}><CheckCircle className="w-4 h-4 mr-2" />Selesai</Button>) : (<Button variant="outline" className="text-red-600 h-11" onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button>)}
                  </div>
                  {selectedRequest.status!== 'completed' && (<div className="px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"><Button variant="ghost" className="w-full text-red-600 h-10" onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className="w-4 h-4 mr-2" />Hapus Request</Button></div>)}
                </>
              );
            })()}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedRequest &&!isDeleteDialogOpen} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Detail Request Perawatan</DialogTitle><DialogDescription>Informasi lengkap request perawatan</DialogDescription></DialogHeader>
            {selectedRequest && (() => {
              const room = rooms.find(r => r.id === selectedRequest.room_id);
              return (<><div className="space-y-4"><div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"><div><p className="text-sm text-gray-500">Status</p><Badge className={cn("text-sm mt-1", selectedRequest.status === 'completed' && "bg-green-100 text-green-700", selectedRequest.status === 'reported' && "bg-yellow-100 text-yellow-700", selectedRequest.status === 'in_progress' && "bg-blue-100 text-blue-700")}>{selectedRequest.status === 'completed'? 'Selesai' : selectedRequest.status === 'reported'? 'Dilaporkan' : 'Diproses'}</Badge></div><div className="text-right"><p className="text-sm text-gray-500">Prioritas</p><Badge className={cn("text-white mt-1", getPriorityColor(selectedRequest.priority))}>{getPriorityLabel(selectedRequest.priority)}</Badge></div></div><div className="space-y-3"><div className="flex justify-between"><span className="text-gray-500">Kamar</span><span className="font-medium">{room?.room_number}</span></div><div className="flex justify-between"><span className="text-gray-500">Jenis Masalah</span><Badge variant="outline">{getIssueTypeLabel(selectedRequest.issue_type)}</Badge></div><div className="flex justify-between"><span className="text-gray-500">Tanggal Lapor</span><span>{formatDate(selectedRequest.request_date)}</span></div>{selectedRequest.actual_completion && (<div className="flex justify-between"><span className="text-gray-500">Tanggal Selesai</span><span>{formatDate(selectedRequest.actual_completion)}</span></div>)}{selectedRequest.technician_name && (<div className="flex justify-between"><span className="text-gray-500">Teknisi</span><span>{selectedRequest.technician_name}</span></div>)}{selectedRequest.cost > 0 && (<div className="flex justify-between"><span className="text-gray-500">Biaya</span><span className="font-medium">{formatCurrency(selectedRequest.cost)}</span></div>)}</div><div><Label className="text-gray-500">Deskripsi Masalah</Label><p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg">{selectedRequest.description}</p></div>{selectedRequest.notes && (<div><Label className="text-gray-500">Catatan</Label><p className="mt-1 text-sm">{selectedRequest.notes}</p></div>)}</div><DialogFooter className="gap-2"><Button variant="outline" onClick={() => setSelectedRequest(null)}>Tutup</Button><Button variant="outline" className="text-red-600" onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button>{selectedRequest.status!== 'completed' && (<Button className="bg-green-600 hover:bg-green-700" onClick={handleComplete}><CheckCircle className="w-4 h-4 mr-2" />Tandai Selesai</Button>)}</DialogFooter></>);
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete */}
      {isMobile? (
        <Sheet open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <SheetContent side="bottom" className="h-auto w-full p-0 flex flex-col bg-white rounded-t-xl">
            <SheetHeader className="p-5 text-left"><SheetTitle>Konfirmasi Hapus</SheetTitle><SheetDescription className="text-left">Apakah Anda yakin ingin menghapus request perawatan ini? Tindakan ini tidak dapat dibatalkan.</SheetDescription></SheetHeader>
            <div className="p-4 flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button variant="outline" className="flex-1 h-11" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button><Button variant="destructive" className="flex-1 h-11" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button></div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Konfirmasi Hapus</DialogTitle><DialogDescription>Apakah Anda yakin ingin menghapus request perawatan ini? Tindakan ini tidak dapat dibatalkan.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button><Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button></DialogFooter></DialogContent>
        </Dialog>
      )}
    </div>
  );
}