// app/src/pages/ACCleaning.tsx - Responsive Mobile Version
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { acCleaningAPI, propertiesAPI, roomsAPI } from '@/services/api';
import type { ACCleaningSchedule, Property, Room } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/format';
import { useIsMobile } from '@/hooks/use-mobile';

const MONTH_OPTIONS = [
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
  { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];

export function ACCleaning() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<ACCleaningSchedule | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [acCleaningSchedules, setAcCleaningSchedules] = useState<ACCleaningSchedule[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('');

  const [formData, setFormData] = useState({
    property_id: '', room_id: '', ac_unit_id: '',
    last_cleaning_date: '', next_cleaning_date: '',
    schedule_interval_days: 180, technician_name: '',
    cost: null as number | null, notes: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [schedulesRes, propertiesRes, roomsRes] = await Promise.all([
        acCleaningAPI.getAll(), propertiesAPI.getAll(), roomsAPI.getAll(),
      ]);
      setAcCleaningSchedules(schedulesRes); setProperties(propertiesRes); setRooms(roomsRes);
    } catch (error) { toast.error('Gagal memuat data'); }
    finally { setIsLoading(false); }
  };

  const filteredSchedules = acCleaningSchedules.filter(schedule => {
    if (selectedPropertyFilter && schedule.property_id!== selectedPropertyFilter) return false;
    if (selectedMonthFilter && schedule.next_cleaning_date) {
      const scheduleDate = new Date(schedule.next_cleaning_date);
      if (!isNaN(scheduleDate.getTime())) {
        const scheduleMonth = scheduleDate.getMonth() + 1;
        if (scheduleMonth.toString()!== selectedMonthFilter) return false;
      }
    }
    const room = rooms.find(r => r.id === schedule.room_id);
    const matchesSearch = room?.room_number.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'upcoming') return matchesSearch && schedule.status === 'pending';
    if (activeTab === 'completed') return matchesSearch && schedule.status === 'completed';
    if (activeTab === 'overdue') return matchesSearch && schedule.status === 'overdue';
    return matchesSearch;
  });

  const upcomingCount = acCleaningSchedules.filter(s => s.status === 'pending').length;
  const overdueCount = acCleaningSchedules.filter(s => s.status === 'overdue').length;
  const completedThisMonth = acCleaningSchedules.filter(s => s.status === 'completed' && s.completed_date && new Date(s.completed_date).getMonth() === new Date().getMonth()).length;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await acCleaningAPI.create(formData); toast.success('Jadwal AC berhasil ditambahkan'); setIsAddDialogOpen(false);
      setFormData({ property_id: '', room_id: '', ac_unit_id: '', last_cleaning_date: '', next_cleaning_date: '', schedule_interval_days: 180, technician_name: '', cost: 0, notes: '' }); fetchData();
    } catch (error) { toast.error('Gagal menambahkan jadwal'); }
  };

  const handleComplete = async () => {
    if (!selectedSchedule) return;
    try { await acCleaningAPI.complete(selectedSchedule.id, { completed_date: new Date().toISOString().split('T')[0] }); toast.success('Jadwal AC selesai'); setSelectedSchedule(null); fetchData(); }
    catch (error) { toast.error('Gagal menyelesaikan jadwal'); }
  };

  const handleDelete = async () => {
    if (!selectedSchedule) return;
    try { await acCleaningAPI.delete(selectedSchedule.id); toast.success('Jadwal AC berhasil dihapus'); setIsDeleteDialogOpen(false); setSelectedSchedule(null); fetchData(); }
    catch (error) { toast.error('Gagal menghapus jadwal'); }
  };

  const FormContent = () => (
    <div className="space-y-4">
      <div className="space-y-2"><Label className="text-sm">Properti *</Label>
        <select value={formData.property_id} onChange={(e) => setFormData({...formData, property_id: e.target.value, room_id: ''})} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" required>
          <option value="">Pilih Properti</option>{properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>
      </div>
      <div className="space-y-2"><Label className="text-sm">Kamar *</Label>
        <select value={formData.room_id} onChange={(e) => setFormData({...formData, room_id: e.target.value})} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" required>
          <option value="">Pilih Kamar</option>{rooms.filter(r => r.property_id === formData.property_id).map(r => (<option key={r.id} value={r.id}>{r.room_number}</option>))}
        </select>
      </div>
      <div className="space-y-2"><Label className="text-sm">ID Unit AC</Label><Input value={formData.ac_unit_id} onChange={(e) => setFormData({...formData, ac_unit_id: e.target.value})} placeholder="Contoh: AC-001" className="h-11 text-base sm:h-10 sm:text-sm" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2"><Label className="text-sm">Pembersihan Terakhir</Label><Input type="date" value={formData.last_cleaning_date} onChange={(e) => setFormData({...formData, last_cleaning_date: e.target.value})} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
        <div className="space-y-2"><Label className="text-sm">Jadwal Berikutnya *</Label><Input type="date" value={formData.next_cleaning_date} onChange={(e) => setFormData({...formData, next_cleaning_date: e.target.value})} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
      </div>
      <div className="space-y-2"><Label className="text-sm">Interval (hari)</Label><Input type="text" inputMode="numeric" value={formData.schedule_interval_days} onChange={(e) => setFormData({...formData, schedule_interval_days: parseInt(e.target.value) || 0})} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
      <div className="space-y-2"><Label className="text-sm">Nama Teknisi</Label><Input value={formData.technician_name} onChange={(e) => setFormData({...formData, technician_name: e.target.value})} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
      <div className="space-y-2"><Label className="text-sm">Biaya (Rp)</Label><Input type="text" inputMode="numeric" value={formData.cost?? ''} onChange={(e) => setFormData({...formData, cost: e.target.value === ''? null : parseInt(e.target.value)})} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
      <div className="space-y-2"><Label className="text-sm">Catatan</Label><textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" rows={2} /></div>
    </div>
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Jadwal Pembersihan AC</h1><p className="text-sm sm:text-base text-gray-500">Kelola jadwal perawatan AC rutin (6 bulan)</p></div>
        <Button className="bg-[#1A3D5C] hover:bg-[#0F2744] w-full sm:w-auto h-11 sm:h-10 shrink-0" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Tambah Jadwal</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
        <Card className="bg-blue-50 border-blue-200 w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shrink-0"><Calendar className="w-5 h-5 text-white" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-blue-700">Jadwal Mendatang</p><p className="text-lg sm:text-xl font-bold text-blue-800">{upcomingCount}</p></div></div></CardContent></Card>
        <Card className="bg-red-50 border-red-200 w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shrink-0"><AlertCircle className="w-5 h-5 text-white" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-red-700">Terlambat</p><p className="text-lg sm:text-xl font-bold text-red-800">{overdueCount}</p></div></div></CardContent></Card>
        <Card className="bg-green-50 border-green-200 w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shrink-0"><CheckCircle className="w-5 h-5 text-white" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-green-700">Selesai Bulan Ini</p><p className="text-lg sm:text-xl font-bold text-green-800">{completedThisMonth}</p></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center bg-white p-3 sm:p-4 rounded-lg border border-gray-200 w-full">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3 w-full sm:w-auto">
          <select value={selectedPropertyFilter} onChange={(e) => setSelectedPropertyFilter(e.target.value)} className="w-full sm:w-48 h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C] bg-white">
            <option value="">Semua Properti</option>{properties.map(property => (<option key={property.id} value={property.id}>{property.name}</option>))}
          </select>
          <select value={selectedMonthFilter} onChange={(e) => setSelectedMonthFilter(e.target.value)} className="w-full sm:w-40 h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C] bg-white">
            <option value="">Semua Bulan</option>{MONTH_OPTIONS.map(month => (<option key={month.value} value={month.value}>{month.label}</option>))}
          </select>
        </div>
        <div className="relative w-full sm:flex-1 sm:min-w- sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input type="text" placeholder="Cari berdasarkan nomor kamar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 text-base sm:h-10 sm:text-sm w-full" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-11 sm:h-10">
          <TabsTrigger value="upcoming" className="h-9 text-xs sm:text-sm">Mendatang</TabsTrigger>
          <TabsTrigger value="completed" className="h-9 text-xs sm:text-sm">Selesai</TabsTrigger>
          <TabsTrigger value="overdue" className="h-9 text-xs sm:text-sm">Terlambat</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading && (<div className="text-center py-12"><div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" /><p className="text-gray-500">Memuat data...</p></div>)}

          {!isLoading && (
            <>
              <Card className="hidden sm:block w-full overflow-hidden">
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kamar</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Unit AC</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Pembersihan Terakhir</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Jadwal Berikutnya</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Teknisi</th><th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Biaya</th></tr></thead>
                  <tbody className="divide-y">{filteredSchedules.map((schedule) => {
                    const room = rooms.find(r => r.id === schedule.room_id);
                    return (<tr key={schedule.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedSchedule(schedule)}><td className="px-4 py-3"><p className="font-medium">{room?.room_number}</p><p className="text-xs text-gray-500">{properties.find(p => p.id === schedule.property_id)?.name}</p></td><td className="px-4 py-3"><span className="font-mono text-sm">{schedule.ac_unit_id || '-'}</span></td><td className="px-4 py-3">{schedule.last_cleaning_date? (<span>{formatDate(schedule.last_cleaning_date)}</span>) : (<span className="text-gray-400">-</span>)}</td><td className="px-4 py-3"><span className={cn("font-medium", schedule.status === 'overdue' && "text-red-600")}>{formatDate(schedule.next_cleaning_date)}</span></td><td className="px-4 py-3"><Badge className={cn(schedule.status === 'completed' && "bg-green-100 text-green-700", schedule.status === 'pending' && "bg-blue-100 text-blue-700", schedule.status === 'overdue' && "bg-red-100 text-red-700")}>{schedule.status === 'completed'? 'Selesai' : schedule.status === 'pending'? 'Mendatang' : 'Terlambat'}</Badge></td><td className="px-4 py-3">{schedule.technician_name || (<span className="text-gray-400">Belum ditugaskan</span>)}</td><td className="px-4 py-3 text-right">{schedule.cost > 0? (<span className="font-medium">{formatCurrency(schedule.cost)}</span>) : (<span className="text-gray-400">-</span>)}</td></tr>);
                  })}</tbody>
                </table></div>
              </Card>

              <div className="grid grid-cols-1 gap-3 sm:hidden w-full">
                {filteredSchedules.map((schedule) => {
                  const room = rooms.find(r => r.id === schedule.room_id);
                  return (
                    <Card key={schedule.id} className="w-full overflow-hidden cursor-pointer active:bg-gray-50" onClick={() => setSelectedSchedule(schedule)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-2"><div className="min-w-0 flex-1"><p className="font-semibold text-gray-900 truncate text- flex items-center gap-2"><Wind className="w-4 h-4 text-blue-500 shrink-0" />Kamar {room?.room_number} • {schedule.ac_unit_id || 'AC'}</p><p className="text-xs text-gray-500 truncate mt-0.5">{properties.find(p => p.id === schedule.property_id)?.name}</p></div><Badge className={cn("shrink-0 text-xs", schedule.status === 'completed' && "bg-green-100 text-green-700", schedule.status === 'pending' && "bg-blue-100 text-blue-700", schedule.status === 'overdue' && "bg-red-100 text-red-700")}>{schedule.status === 'completed'? 'Selesai' : schedule.status === 'pending'? 'Mendatang' : 'Terlambat'}</Badge></div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><p className="text-gray-500">Terakhir</p><p className="font-medium">{schedule.last_cleaning_date? formatDate(schedule.last_cleaning_date) : '-'}</p></div><div><p className="text-gray-500">Berikutnya</p><p className={cn("font-medium", schedule.status === 'overdue' && "text-red-600")}>{formatDate(schedule.next_cleaning_date)}</p></div></div>
                        <div className="mt-3 flex justify-between items-center text-xs"><span className="text-gray-500 truncate">{schedule.technician_name || 'Belum ditugaskan'}</span><span className="font-medium">{schedule.cost > 0? formatCurrency(schedule.cost) : '-'}</span></div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {!isLoading && filteredSchedules.length === 0 && (<div className="text-center py-12 bg-gray-50 rounded-lg px-4"><p className="text-gray-500">Tidak ada jadwal AC</p><Button variant="outline" className="mt-4 h-11 w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Tambah Jadwal</Button></div>)}
        </TabsContent>
      </Tabs>

      {/* Add */}
      {isMobile? (
        <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col bg-white">
            <SheetHeader className="p-4 border-b shrink-0 text-left"><SheetTitle>Tambah Jadwal AC</SheetTitle><SheetDescription>Buat jadwal pembersihan AC baru</SheetDescription></SheetHeader>
            <form onSubmit={handleAdd} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)]"><FormContent /></div>
              <SheetFooter className="p-4 border-t flex-row gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setIsAddDialogOpen(false)}>Batal</Button><Button type="submit" className="flex-1 bg-[#1A3D5C] hover:bg-[#0F2744] h-11">Simpan</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg max-h- overflow-y-auto"><DialogHeader><DialogTitle>Tambah Jadwal AC</DialogTitle><DialogDescription>Buat jadwal pembersihan AC baru</DialogDescription></DialogHeader><form onSubmit={handleAdd} className="space-y-4"><FormContent /><DialogFooter><Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button><Button type="submit" className="bg-[#1A3D5C] hover:bg-[#0F2744]">Simpan</Button></DialogFooter></form></DialogContent>
        </Dialog>
      )}

      {/* Detail */}
      {isMobile? (
        <Sheet open={!!selectedSchedule &&!isDeleteDialogOpen} onOpenChange={() => setSelectedSchedule(null)}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col bg-white">
            {selectedSchedule && (() => {
              const room = rooms.find(r => r.id === selectedSchedule.room_id);
              return (
                <>
                  <SheetHeader className="p-4 border-b shrink-0 text-left"><SheetTitle className="flex items-center gap-2"><Wind className="w-5 h-5" />Detail AC Cleaning</SheetTitle><SheetDescription>Informasi detail jadwal pembersihan AC</SheetDescription></SheetHeader>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[env(safe-area-inset-bottom)]">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"><div><p className="text-xs text-gray-500">Status</p><Badge className={cn("text-xs mt-1", selectedSchedule.status === 'completed' && "bg-green-100 text-green-700", selectedSchedule.status === 'pending' && "bg-blue-100 text-blue-700", selectedSchedule.status === 'overdue' && "bg-red-100 text-red-700")}>{selectedSchedule.status === 'completed'? 'Selesai' : selectedSchedule.status === 'pending'? 'Mendatang' : 'Terlambat'}</Badge></div><div className="text-right"><p className="text-xs text-gray-500">Interval</p><p className="font-medium text-sm">{selectedSchedule.schedule_interval_days} hari</p></div></div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-2"><span className="text-gray-500">Kamar</span><span className="font-medium">{room?.room_number}</span></div>
                      <div className="flex justify-between gap-2"><span className="text-gray-500">Unit AC</span><span className="font-mono">{selectedSchedule.ac_unit_id || '-'}</span></div>
                      <div className="flex justify-between gap-2"><span className="text-gray-500">Properti</span><span className="truncate">{properties.find(p => p.id === selectedSchedule.property_id)?.name}</span></div>
                      {selectedSchedule.last_cleaning_date && (<div className="flex justify-between gap-2"><span className="text-gray-500">Terakhir</span><span>{formatDate(selectedSchedule.last_cleaning_date)}</span></div>)}
                      <div className="flex justify-between gap-2"><span className="text-gray-500">Berikutnya</span><span className={cn("font-medium", selectedSchedule.status === 'overdue' && "text-red-600")}>{formatDate(selectedSchedule.next_cleaning_date)}</span></div>
                      {selectedSchedule.completed_date && (<div className="flex justify-between gap-2"><span className="text-gray-500">Selesai</span><span>{formatDate(selectedSchedule.completed_date)}</span></div>)}
                      {selectedSchedule.technician_name && (<div className="flex justify-between gap-2"><span className="text-gray-500">Teknisi</span><span className="font-medium truncate">{selectedSchedule.technician_name}</span></div>)}
                      {selectedSchedule.cost > 0 && (<div className="flex justify-between gap-2"><span className="text-gray-500">Biaya</span><span className="font-medium">{formatCurrency(selectedSchedule.cost)}</span></div>)}
                    </div>
                    {selectedSchedule.notes && (<div className="bg-gray-50 p-3 rounded-lg"><Label className="text-xs text-gray-500">Catatan</Label><p className="mt-1 text-sm break-words">{selectedSchedule.notes}</p></div>)}
                  </div>
                  <div className="p-4 border-t grid grid-cols-2 gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <Button variant="outline" className="h-11" onClick={() => setSelectedSchedule(null)}>Tutup</Button>
                    {selectedSchedule.status!== 'completed'? (<Button className="bg-green-600 hover:bg-green-700 h-11" onClick={handleComplete}><CheckCircle className="w-4 h-4 mr-2" />Selesai</Button>) : (<Button variant="outline" className="text-red-600 h-11" onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button>)}
                  </div>
                  {selectedSchedule.status!== 'completed' && (<div className="px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"><Button variant="ghost" className="w-full text-red-600 h-10" onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className="w-4 h-4 mr-2" />Hapus Jadwal</Button></div>)}
                </>
              );
            })()}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedSchedule &&!isDeleteDialogOpen} onOpenChange={() => setSelectedSchedule(null)}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><Wind className="w-5 h-5" />Detail Jadwal AC Cleaning</DialogTitle><DialogDescription>Informasi detail jadwal pembersihan AC</DialogDescription></DialogHeader>
            {selectedSchedule && (() => {
              const room = rooms.find(r => r.id === selectedSchedule.room_id);
              return (<><div className="space-y-4"><div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"><div><p className="text-sm text-gray-500">Status</p><Badge className={cn("text-sm mt-1", selectedSchedule.status === 'completed' && "bg-green-100 text-green-700", selectedSchedule.status === 'pending' && "bg-blue-100 text-blue-700", selectedSchedule.status === 'overdue' && "bg-red-100 text-red-700")}>{selectedSchedule.status === 'completed'? 'Selesai' : selectedSchedule.status === 'pending'? 'Mendatang' : 'Terlambat'}</Badge></div><div className="text-right"><p className="text-sm text-gray-500">Interval</p><p className="font-medium">{selectedSchedule.schedule_interval_days} hari</p></div></div><div className="space-y-3"><div className="flex justify-between"><span className="text-gray-500">Kamar</span><span className="font-medium">{room?.room_number}</span></div><div className="flex justify-between"><span className="text-gray-500">Unit AC</span><span className="font-mono">{selectedSchedule.ac_unit_id || '-'}</span></div><div className="flex justify-between"><span className="text-gray-500">Properti</span><span>{properties.find(p => p.id === selectedSchedule.property_id)?.name}</span></div>{selectedSchedule.last_cleaning_date && (<div className="flex justify-between"><span className="text-gray-500">Pembersihan Terakhir</span><span>{formatDate(selectedSchedule.last_cleaning_date)}</span></div>)}<div className="flex justify-between"><span className="text-gray-500">Jadwal Berikutnya</span><span className={cn("font-medium", selectedSchedule.status === 'overdue' && "text-red-600")}>{formatDate(selectedSchedule.next_cleaning_date)}</span></div>{selectedSchedule.completed_date && (<div className="flex justify-between"><span className="text-gray-500">Tanggal Selesai</span><span>{formatDate(selectedSchedule.completed_date)}</span></div>)}{selectedSchedule.technician_name && (<div className="flex justify-between"><span className="text-gray-500">Teknisi</span><span>{selectedSchedule.technician_name}</span></div>)}{selectedSchedule.cost > 0 && (<div className="flex justify-between"><span className="text-gray-500">Biaya</span><span className="font-medium">{formatCurrency(selectedSchedule.cost)}</span></div>)}</div>{selectedSchedule.notes && (<div><Label className="text-gray-500">Catatan</Label><p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg">{selectedSchedule.notes}</p></div>)}</div><DialogFooter className="gap-2"><Button variant="outline" onClick={() => setSelectedSchedule(null)}>Tutup</Button><Button variant="outline" className="text-red-600" onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button>{selectedSchedule.status!== 'completed' && (<Button className="bg-green-600 hover:bg-green-700" onClick={handleComplete}><CheckCircle className="w-4 h-4 mr-2" />Tandai Selesai</Button>)}</DialogFooter></>);
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete */}
      {isMobile? (
        <Sheet open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <SheetContent side="bottom" className="h-auto w-full p-0 flex flex-col bg-white rounded-t-xl">
            <SheetHeader className="p-5 text-left"><SheetTitle>Konfirmasi Hapus</SheetTitle><SheetDescription className="text-left">Apakah Anda yakin ingin menghapus jadwal AC ini? Tindakan ini tidak dapat dibatalkan.</SheetDescription></SheetHeader>
            <div className="p-4 flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button variant="outline" className="flex-1 h-11" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button><Button variant="destructive" className="flex-1 h-11" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button></div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Konfirmasi Hapus</DialogTitle><DialogDescription>Apakah Anda yakin ingin menghapus jadwal AC ini? Tindakan ini tidak dapat dibatalkan.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button><Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button></DialogFooter></DialogContent>
        </Dialog>
      )}
    </div>
  );
}