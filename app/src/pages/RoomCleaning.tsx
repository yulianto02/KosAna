import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RotateCcw,
  User,
  MoreHorizontal,
  Sparkles,
  Trash2,
  PlayCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getUserFromToken } from '@/services/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { roomCleaningAPI, propertiesAPI, roomsAPI, usersAPI } from '@/services/api';
import type { RoomCleaningSchedule, Property, Room, User as UserType, CleaningStats } from '@/types';
import { cn } from '@/lib/utils';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { id } from 'date-fns/locale';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const SLOTS = [
  { slot: 1, time: '09:00', label: '09:00 - 09:45' },
  { slot: 2, time: '10:00', label: '10:00 - 10:45' },
  { slot: 3, time: '11:00', label: '11:00 - 11:45' },
  { slot: 4, time: '13:00', label: '13:00 - 13:45' },
  { slot: 5, time: '14:00', label: '14:00 - 14:45' },
  { slot: 6, time: '15:00', label: '15:00 - 15:45' },
];

const STATUS_CONFIG = {
  scheduled: { 
    label: 'Terjadwal', 
    color: 'bg-[#7A9EB8]/20 text-[#5D4037] border-[#7A9EB8]',
    icon: Clock,
    bgColor: 'bg-[#7A9EB8]/10'
  },
  in_progress: { 
    label: 'Dikerjakan', 
    color: 'bg-[#D4A373]/20 text-[#5D4037] border-[#D4A373]',
    icon: PlayCircle,
    bgColor: 'bg-[#D4A373]/10'
  },
  completed: { 
    label: 'Selesai', 
    color: 'bg-[#7A9E7E]/20 text-[#5D4037] border-[#7A9E7E]',
    icon: CheckCircle2,
    bgColor: 'bg-[#7A9E7E]/10'
  },
  skipped: { 
    label: 'Dilewati', 
    color: 'bg-[#C17C53]/20 text-[#5D4037] border-[#C17C53] line-through',
    icon: AlertCircle,
    bgColor: 'bg-[#C17C53]/10'
  },
  rescheduled: { 
    label: 'Diubah', 
    color: 'bg-[#C9A227]/20 text-[#5D4037] border-[#C9A227]',
    icon: RotateCcw,
    bgColor: 'bg-[#C9A227]/10'
  }
};

export function RoomCleaning() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [schedules, setSchedules] = useState<RoomCleaningSchedule[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [cleaners, setCleaners] = useState<UserType[]>([]);
  const [stats, setStats] = useState<CleaningStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isSkipDialogOpen, setIsSkipDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<RoomCleaningSchedule | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<{
    room_id: string;
    day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    time_slot: 1 | 2 | 3 | 4 | 5 | 6;
    assigned_to: string;
    notes: string;
  }>({
    room_id: '',
    day_of_week: 0,
    time_slot: 1,
    assigned_to: '',
    notes: ''
  });  


  const [completionNotes, setCompletionNotes] = useState('');
  const [actualDuration, setActualDuration] = useState(45);
  const [skipReason, setSkipReason] = useState('');

  const weekStart = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    return format(start, 'yyyy-MM-dd');
  }, [currentDate]);

  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchSchedules();
      fetchRooms();
    }
  }, [selectedProperty, weekStart]);

  const fetchInitialData = async () => {
    try {
      const [propertiesRes, usersRes] = await Promise.all([
        propertiesAPI.getAll(),
        usersAPI.getAll()
      ]);
      setProperties(propertiesRes);
      setCleaners(usersRes.filter((u: UserType) => u.role === 'penjaga' || u.role === 'admin'));
      if (propertiesRes.length > 0) {
        setSelectedProperty(propertiesRes[0].id);
      }
    } catch (error) {
      toast.error('Gagal memuat data awal');
    }
  };

  const fetchSchedules = async () => {
    if (!selectedProperty) return;
    setIsLoading(true);
    try {
      const [schedulesRes, statsRes] = await Promise.all([
        roomCleaningAPI.getAll(selectedProperty, weekStart),
        roomCleaningAPI.getStats(selectedProperty, weekStart)
      ]);
      setSchedules(schedulesRes);
      setStats(statsRes);
    } catch (error) {
      toast.error('Gagal memuat jadwal pembersihan');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const roomsRes = await roomsAPI.getAll();
      setRooms(roomsRes.filter((r: Room) => r.property_id === selectedProperty));
    } catch (error) {
      toast.error('Gagal memuat data kamar');
    }
  };

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleCurrentWeek = () => setCurrentDate(new Date());

  const handleGenerateSchedule = async () => {
    try {
      const result = await roomCleaningAPI.generate(selectedProperty, weekStart);
      toast.success(`${result.count} kamar berhasil dijadwalkan`);
      fetchSchedules();
    } catch (error) {
      toast.error('Gagal generate jadwal');
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await roomCleaningAPI.create({
        room_id: formData.room_id,
        property_id: selectedProperty,
        week_start_date: weekStart,
        day_of_week: formData.day_of_week as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        time_slot: formData.time_slot as 1 | 2 | 3 | 4 | 5 | 6,
        assigned_to: formData.assigned_to || undefined,
        notes: formData.notes
      });
      toast.success('Jadwal pembersihan berhasil ditambahkan');
      setIsAddDialogOpen(false);
      setFormData({ room_id: '', day_of_week: 0, time_slot: 1, assigned_to: '', notes: '' });
      fetchSchedules();
    } catch (error) {
      toast.error('Gagal menambahkan jadwal');
    }
  };

  const handleStartCleaning = async (schedule: RoomCleaningSchedule) => {
    try {
      await roomCleaningAPI.start(schedule.id);
      toast.success('Pembersihan dimulai');
      fetchSchedules();
    } catch (error) {
      toast.error('Gagal memulai pembersihan');
    }
  };

  const handleCompleteCleaning = async () => {
    if (!selectedSchedule) return;
    try {
      await roomCleaningAPI.complete(selectedSchedule.id, completionNotes, actualDuration);
      toast.success('Pembersihan selesai dicatat');
      setIsCompleteDialogOpen(false);
      setSelectedSchedule(null);
      setCompletionNotes('');
      setActualDuration(45);
      fetchSchedules();
    } catch (error) {
      toast.error('Gagal menyelesaikan pembersihan');
    }
  };

  const handleSkipCleaning = async () => {
    if (!selectedSchedule) return;
    try {
      await roomCleaningAPI.skip(selectedSchedule.id, skipReason);
      toast.success('Jadwal dilewati');
      setIsSkipDialogOpen(false);
      setSelectedSchedule(null);
      setSkipReason('');
      fetchSchedules();
    } catch (error) {
      toast.error('Gagal melewati jadwal');
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;
    try {
      await roomCleaningAPI.delete(selectedSchedule.id);
      toast.success('Jadwal berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setSelectedSchedule(null);
      fetchSchedules();
    } catch (error) {
      toast.error('Gagal menghapus jadwal');
    }
  };

  const getScheduleForSlot = (dayIndex: number, slotNumber: number) => {
    return schedules.find(s => s.day_of_week === dayIndex && s.time_slot === slotNumber);
  };

  const getAvailableRooms = () => {
    const scheduledRoomIds = schedules.map(s => s.room_id);
    return rooms.filter(r => !scheduledRoomIds.includes(r.id) && r.status !== 'maintenance');
  };

  const canModifySchedule = (schedule: RoomCleaningSchedule) => {
    return schedule.status === 'scheduled' || schedule.status === 'rescheduled';
  };

  return (
    <div className="space-y-6 bg-[#FAF9F6] min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#3E2723]">Jadwal Pembersihan Kamar</h1>
          <p className="text-[#5D4037] mt-1">Kelola jadwal cleaning mingguan untuk setiap kamar</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleGenerateSchedule}
            className="bg-gradient-to-r from-[#7A9E7E] to-[#5D8A61] hover:from-[#5D8A61] hover:to-[#4A6B4E] text-white shadow-lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Jadwal
          </Button>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gradient-to-r from-[#5D4037] to-[#3E2723] hover:from-[#3E2723] hover:to-[#2C1810] text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Manual
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#7A9EB8]/10 border-[#7A9EB8]/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#7A9EB8] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[#5D4037]">Terjadwal</p>
                  <p className="text-xl font-bold text-[#3E2723]">{stats.scheduled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#D4A373]/10 border-[#D4A373]/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4A373] flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[#5D4037]">Dikerjakan</p>
                  <p className="text-xl font-bold text-[#3E2723]">{stats.in_progress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#7A9E7E]/10 border-[#7A9E7E]/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#7A9E7E] flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[#5D4037]">Selesai</p>
                  <p className="text-xl font-bold text-[#3E2723]">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#C17C53]/10 border-[#C17C53]/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#C17C53] flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[#5D4037]">Dilewati</p>
                  <p className="text-xl font-bold text-[#3E2723]">{stats.skipped}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card className="bg-white border-[#D7CCC8]">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="w-64 border-[#8D6E63] focus:ring-[#5D4037]">
                  <SelectValue placeholder="Pilih Properti" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePrevWeek} className="border-[#8D6E63] text-[#5D4037] hover:bg-[#F5F5DC]">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={handleCurrentWeek} className="border-[#8D6E63] text-[#5D4037] hover:bg-[#F5F5DC]">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Minggu Ini
              </Button>
              <div className="px-4 py-2 bg-[#F5F5DC] rounded-lg border border-[#D7CCC8]">
                <span className="font-semibold text-[#3E2723]">
                  {format(weekDates[0], 'd MMM', { locale: id })} - {format(weekDates[6], 'd MMM yyyy', { locale: id })}
                </span>
              </div>
              <Button variant="outline" onClick={handleNextWeek} className="border-[#8D6E63] text-[#5D4037] hover:bg-[#F5F5DC]">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="bg-white border-[#D7CCC8] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header Row */}
            <div className="grid grid-cols-8 bg-[#5D4037] text-white">
              <div className="p-4 font-semibold text-center border-r border-[#8D6E63]">Slot Waktu</div>
              {DAYS.map((day, idx) => (
                <div key={day} className="p-4 text-center border-r border-[#8D6E63] last:border-r-0">
                  <div className="font-semibold">{day}</div>
                  <div className="text-xs text-[#D7CCC8]">
                    {format(weekDates[idx], 'd MMM', { locale: id })}
                  </div>
                </div>
              ))}
            </div>

            {/* Slots Rows */}
            {SLOTS.map((slot) => (
              <div key={slot.slot} className="grid grid-cols-8 border-b border-[#D7CCC8] last:border-b-0">
                {/* Time Slot Label */}
                <div className="p-4 bg-[#F5F5DC] border-r border-[#D7CCC8] flex flex-col justify-center items-center">
                  <span className="font-semibold text-[#3E2723]">{slot.time}</span>
                  <span className="text-xs text-[#5D4037]">Slot {slot.slot}</span>
                </div>
                
                {/* Days */}
                {Array.from({ length: 7 }, (_, dayIdx) => {
                  const schedule = getScheduleForSlot(dayIdx, slot.slot);
                  return (
                    <div 
                      key={`${slot.slot}-${dayIdx}`} 
                      className="p-2 border-r border-[#D7CCC8] last:border-r-0 min-h-[100px] bg-[#FAF9F6]"
                    >
                      {schedule ? (
                        <div 
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setIsDetailDialogOpen(true);
                          }}
                          className={cn(
                            "h-full p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
                            STATUS_CONFIG[schedule.status].bgColor,
                            STATUS_CONFIG[schedule.status].color.split(' ')[2],
                            "border-current"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[#3E2723] text-sm">
                              {schedule.room_number}
                            </span>
                            {(() => {
                              const StatusIcon = STATUS_CONFIG[schedule.status].icon;
                              return <StatusIcon className="w-4 h-4 text-[#5D4037]" />;
                            })()}
                          </div>
                          {schedule.assigned_name && (
                            <div className="flex items-center gap-1 text-xs text-[#5D4037] mt-1">
                              <User className="w-3 h-3" />
                              <span className="truncate">{schedule.assigned_name}</span>
                            </div>
                          )}
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "mt-2 text-xs border-current",
                              STATUS_CONFIG[schedule.status].color
                            )}
                          >
                            {STATUS_CONFIG[schedule.status].label}
                          </Badge>
                        </div>
                      ) : (
                        <div 
                          onClick={() => {
                            setFormData({ ...formData, day_of_week: dayIdx, time_slot: slot.slot });
                            setIsAddDialogOpen(true);
                          }}
                          className="h-full flex items-center justify-center border-2 border-dashed border-[#D7CCC8] rounded-lg cursor-pointer hover:border-[#8D6E63] hover:bg-[#F5F5DC] transition-colors"
                        >
                          <Plus className="w-5 h-5 text-[#8D6E63]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Add Schedule Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-[#FAF9F6] border-[#D7CCC8]">
          <DialogHeader>
            <DialogTitle className="text-[#3E2723]">Tambah Jadwal Pembersihan</DialogTitle>
            <DialogDescription className="text-[#5D4037]">
              Jadwalkan pembersihan untuk kamar tertentu
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSchedule} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#3E2723]">Kamar *</Label>
              <Select 
                value={formData.room_id} 
                onValueChange={(v) => setFormData({ ...formData, room_id: v })}
              >
                <SelectTrigger className="border-[#8D6E63]">
                  <SelectValue placeholder="Pilih kamar" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRooms().map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      Kamar {r.room_number} (Lantai {r.floor})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#3E2723]">Hari *</Label>
                <Select 
                  value={formData.day_of_week.toString()} 
                  onValueChange={(v) => setFormData({ ...formData, day_of_week: parseInt(v) as 0 | 1 | 2 | 3 | 4 | 5 | 6 })}
                >
                  <SelectTrigger className="border-[#8D6E63]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#3E2723]">Slot Waktu *</Label>
                <Select 
                  value={formData.time_slot.toString()} 
                  onValueChange={(v) => setFormData({ ...formData, time_slot: parseInt(v) as 1 | 2 | 3 | 4 | 5 | 6})}
                >
                  <SelectTrigger className="border-[#8D6E63]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SLOTS.map(s => (
                      <SelectItem key={s.slot} value={s.slot.toString()}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#3E2723]">Penanggung Jawab</Label>
              <Select 
                value={formData.assigned_to} 
                onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}
              >
                <SelectTrigger className="border-[#8D6E63]">
                  <SelectValue placeholder="Pilih penjaga" />
                </SelectTrigger>
                <SelectContent>
                  {cleaners.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name || c.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[#3E2723]">Catatan</Label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-[#8D6E63] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4037] bg-white"
                rows={2}
                placeholder="Catatan khusus untuk jadwal ini..."
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
                className="border-[#8D6E63] text-[#5D4037]"
              >
                Batal
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-[#5D4037] to-[#3E2723] text-white"
              >
                Simpan Jadwal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="bg-[#FAF9F6] border-[#D7CCC8]">
          {selectedSchedule && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#3E2723] flex items-center gap-2">
                  Detail Pembersihan {selectedSchedule.room_number}
                  <Badge className={STATUS_CONFIG[selectedSchedule.status].color}>
                    {STATUS_CONFIG[selectedSchedule.status].label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#5D4037]">Properti</p>
                    <p className="font-semibold text-[#3E2723]">{selectedSchedule.property_name}</p>
                  </div>
                  <div>
                    <p className="text-[#5D4037]">Jadwal</p>
                    <p className="font-semibold text-[#3E2723]">
                      {DAYS[selectedSchedule.day_of_week]}, {SLOTS.find(s => s.slot === selectedSchedule.time_slot)?.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#5D4037]">Penanggung Jawab</p>
                    <p className="font-semibold text-[#3E2723]">{selectedSchedule.assigned_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[#5D4037]">Estimasi Waktu</p>
                    <p className="font-semibold text-[#3E2723]">{selectedSchedule.estimated_duration_minutes} menit</p>
                  </div>
                </div>

                {selectedSchedule.notes && (
                  <div className="p-3 bg-[#F5F5DC] rounded-lg">
                    <p className="text-[#5D4037] text-sm">Catatan:</p>
                    <p className="text-[#3E2723]">{selectedSchedule.notes}</p>
                  </div>
                )}

                {selectedSchedule.status === 'completed' && (
                  <div className="p-3 bg-[#7A9E7E]/10 rounded-lg border border-[#7A9E7E]">
                    <p className="text-[#5D4037] text-sm">Diselesaikan oleh {selectedSchedule.completed_by_name}</p>
                    <p className="text-[#3E2723] text-xs">
                      pada {selectedSchedule.completed_at && format(new Date(selectedSchedule.completed_at), 'dd MMM yyyy HH:mm', { locale: id })}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailDialogOpen(false)}
                  className="border-[#8D6E63] text-[#5D4037]"
                >
                  Tutup
                </Button>
                
                {canModifySchedule(selectedSchedule) && (
                  <>
                    <Button 
                      variant="outline"
                      className="border-[#C17C53] text-[#C17C53] hover:bg-[#C17C53]/10"
                      onClick={() => {
                        setIsDetailDialogOpen(false);
                        setIsSkipDialogOpen(true);
                      }}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Lewati
                    </Button>
                    <Button 
                      className="bg-gradient-to-r from-[#7A9E7E] to-[#5D8A61] text-white"
                      onClick={() => {
                        setIsDetailDialogOpen(false);
                        handleStartCleaning(selectedSchedule);
                      }}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Mulai
                    </Button>
                  </>
                )}

                {selectedSchedule.status === 'in_progress' && (
                  <Button 
                    className="bg-gradient-to-r from-[#7A9E7E] to-[#5D8A61] text-white"
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      setIsCompleteDialogOpen(true);
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Selesai
                  </Button>
                )}

                {selectedSchedule.status !== 'in_progress' && (
                  <Button 
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-50"
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="bg-[#FAF9F6] border-[#D7CCC8]">
          <DialogHeader>
            <DialogTitle className="text-[#3E2723]">Selesaikan Pembersihan</DialogTitle>
            <DialogDescription className="text-[#5D4037]">
              Catat penyelesaian pembersihan kamar {selectedSchedule?.room_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#3E2723]">Durasi Aktual (menit)</Label>
              <input
                type="number"
                value={actualDuration}
                onChange={(e) => setActualDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-[#8D6E63] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4037] bg-white"
                min={15}
                max={120}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#3E2723]">Catatan Penyelesaian</Label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-[#8D6E63] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4037] bg-white"
                rows={3}
                placeholder="Kondisi kamar, catatan khusus, dll..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCompleteDialogOpen(false)}
              className="border-[#8D6E63] text-[#5D4037]"
            >
              Batal
            </Button>
            <Button 
              onClick={handleCompleteCleaning}
              className="bg-gradient-to-r from-[#7A9E7E] to-[#5D8A61] text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Selesaikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Dialog */}
      <Dialog open={isSkipDialogOpen} onOpenChange={setIsSkipDialogOpen}>
        <DialogContent className="bg-[#FAF9F6] border-[#D7CCC8]">
          <DialogHeader>
            <DialogTitle className="text-[#3E2723]">Lewati Jadwal</DialogTitle>
            <DialogDescription className="text-[#5D4037]">
              Berikan alasan melewati jadwal pembersihan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#3E2723]">Alasan *</Label>
              <textarea
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                className="w-full px-3 py-2 border border-[#8D6E63] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4037] bg-white"
                rows={3}
                placeholder="Penghuni sedang sakit, kamar kosong, dll..."
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsSkipDialogOpen(false)}
              className="border-[#8D6E63] text-[#5D4037]"
            >
              Batal
            </Button>
            <Button 
              onClick={handleSkipCleaning}
              disabled={!skipReason.trim()}
              className="bg-gradient-to-r from-[#C17C53] to-[#A6683F] text-white"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Lewati Jadwal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#FAF9F6] border-[#D7CCC8]">
          <DialogHeader>
            <DialogTitle className="text-[#3E2723]">Konfirmasi Hapus</DialogTitle>
            <DialogDescription className="text-[#5D4037]">
              Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-[#8D6E63] text-[#5D4037]"
            >
              Batal
            </Button>
            <Button 
              onClick={handleDeleteSchedule}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}