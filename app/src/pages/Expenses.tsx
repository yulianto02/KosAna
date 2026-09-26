// app/src/pages/Expenses.tsx - Responsive Mobile Version
import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Receipt, Download, Edit, Trash2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { expensesAPI, propertiesAPI, roomsAPI } from '@/services/api';
import { getUserFromToken } from '@/services/auth';
import type { Expense, Property, Room } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, getExpenseTypeLabel } from '@/lib/format';
import { useIsMobile } from '@/hooks/use-mobile';

export function Expenses() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    property_id: '', room_id: '', expense_type: 'electricity', provider_name: '', amount: 0,
    expense_date: new Date().toISOString().split('T')[0], description: '',
    approval_status: 'approved' as 'pending' | 'approved' | 'rejected', reported_by: '',
  });

  const monthOptions = useMemo(() => {
    const monthsSet = new Set<string>();
    expenses.forEach(expense => {
      if (expense.expense_date) {
        const dateStr = expense.expense_date.toString();
        const monthKey = dateStr.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(monthKey)) monthsSet.add(monthKey);
      }
    });
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [expenses]);

  const formatMonthKey = (key: string) => {
    const [year, month] = key.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthIndex = parseInt(month, 10) - 1;
    return monthIndex >= 0 && monthIndex < 12? `${monthNames[monthIndex]} ${year}` : key;
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [expensesRes, propertiesRes, roomsRes] = await Promise.all([expensesAPI.getAll(), propertiesAPI.getAll(), roomsAPI.getAll()]);
      setExpenses(expensesRes); setProperties(propertiesRes); setRooms(roomsRes);
    } catch (error) { toast.error('Gagal memuat data'); }
    finally { setIsLoading(false); }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.provider_name.toLowerCase().includes(searchQuery.toLowerCase()) || expense.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || expense.expense_type === selectedCategory;
    const matchesProperty = selectedProperty === 'all' || expense.property_id === selectedProperty;
    let matchesMonth = true;
    if (selectedMonth!== 'all' && expense.expense_date) {
      const expenseMonth = expense.expense_date.toString().substring(0, 7);
      matchesMonth = expenseMonth === selectedMonth;
    }
    return matchesSearch && matchesCategory && matchesProperty && matchesMonth;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const roomExpenses = filteredExpenses.filter(e => e.room_id).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const overheadExpenses = filteredExpenses.filter(e =>!e.room_id).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const categories = Array.from(new Set(expenses.map(e => e.expense_type)));

  const resetForm = () => {
    const currentUser = getUserFromToken();
    setFormData({
      property_id: properties[0]?.id || '', room_id: '', expense_type: 'electricity', provider_name: '', amount: 0,
      expense_date: new Date().toISOString().split('T')[0], description: '', approval_status: 'approved', reported_by: currentUser?.id || '',
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentUser = getUserFromToken();
      if (!currentUser?.id) { toast.error('Sesi tidak valid, silakan login ulang'); return; }
      await expensesAPI.create({...formData, reported_by: currentUser.id});
      toast.success('Pengeluaran berhasil ditambahkan'); setIsAddDialogOpen(false); resetForm(); fetchData();
    } catch (error) { toast.error('Gagal menambahkan pengeluaran'); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedExpense) return;
    try {
      const currentUser = getUserFromToken();
      await expensesAPI.update(selectedExpense.id, {...formData, reported_by: selectedExpense.reported_by || currentUser?.id || ''});
      toast.success('Pengeluaran berhasil diperbarui'); setIsEditDialogOpen(false); setSelectedExpense(null); fetchData();
    } catch (error) { toast.error('Gagal memperbarui pengeluaran'); }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    try { await expensesAPI.delete(selectedExpense.id); toast.success('Pengeluaran berhasil dihapus'); setIsDeleteDialogOpen(false); setSelectedExpense(null); fetchData(); }
    catch (error) { toast.error('Gagal menghapus pengeluaran'); }
  };

  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
      property_id: expense.property_id, room_id: expense.room_id || '', expense_type: expense.expense_type,
      provider_name: expense.provider_name, amount: expense.amount,
      expense_date: new Date(expense.expense_date).toISOString().split('T')[0],
      description: expense.description || '', approval_status: expense.approval_status, reported_by: expense.reported_by || '',
    });
    setIsEditDialogOpen(true);
  };
  const openDeleteDialog = (expense: Expense) => { setSelectedExpense(expense); setIsDeleteDialogOpen(true); };

  const FormFields = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2"><Label className="text-sm">Properti *</Label>
        <select id={`${isEdit? 'edit-' : ''}property`} value={formData.property_id} onChange={(e) => setFormData({...formData, property_id: e.target.value, room_id: ''})} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" required>
          {properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>
      </div>
      <div className="space-y-2"><Label className="text-sm">Kamar (opsional)</Label>
        <select id={`${isEdit? 'edit-' : ''}room`} value={formData.room_id} onChange={(e) => setFormData({...formData, room_id: e.target.value})} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]">
          <option value="">Overhead</option>{rooms.filter(r => r.property_id === formData.property_id).map(r => (<option key={r.id} value={r.id}>{r.room_number}</option>))}
        </select>
      </div>
      <div className="space-y-2"><Label className="text-sm">Kategori *</Label>
        <select id={`${isEdit? 'edit-' : ''}expense_type`} value={formData.expense_type} onChange={(e) => setFormData({...formData, expense_type: e.target.value})} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" required>
          <option value="electricity">Listrik</option><option value="water">Air</option><option value="internet">Internet</option><option value="ac_repair">Perbaikan AC</option><option value="room_repair">Perbaikan Kamar</option><option value="ac_cleaning">Pembersihan AC</option><option value="gallon">Galon</option><option value="gas">Gas</option><option value="laundry_soap">Deterjen Laundry</option><option value="staff_salary">Gaji Staf</option><option value="other">Lainnya</option>
        </select>
      </div>
      <div className="space-y-2"><Label className="text-sm">Nama Provider *</Label><Input id={`${isEdit? 'edit-' : ''}provider_name`} value={formData.provider_name} onChange={(e) => setFormData({...formData, provider_name: e.target.value})} placeholder="Contoh: PLN, PDAM, dll" required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
      <div className="space-y-2"><Label className="text-sm">Jumlah (Rp) *</Label><Input id={`${isEdit? 'edit-' : ''}amount`} type="text" inputMode="numeric" value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value) || 0})} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
      <div className="space-y-2"><Label className="text-sm">Tanggal *</Label><Input id={`${isEdit? 'edit-' : ''}expense_date`} type="date" value={formData.expense_date} onChange={(e) => setFormData({...formData, expense_date: e.target.value})} required className="h-11 text-base sm:h-10 sm:text-sm" /></div>
      <div className="space-y-2"><Label className="text-sm">Keterangan</Label><textarea id={`${isEdit? 'edit-' : ''}description`} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" rows={3} /></div>
    </div>
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Pengeluaran</h1><p className="text-sm sm:text-base text-gray-500">Catat dan kelola semua pengeluaran operasional</p></div>
        <Button className="bg-[#1A3D5C] hover:bg-[#0F2744] w-full sm:w-auto h-11 sm:h-10 shrink-0" onClick={() => { resetForm(); setIsAddDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Tambah Pengeluaran</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
        <Card className="w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0"><Receipt className="w-5 h-5 text-red-600" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-gray-500">Total Pengeluaran</p><p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{formatCurrency(totalExpenses)}</p></div></div></CardContent></Card>
        <Card className="w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0"><Receipt className="w-5 h-5 text-orange-600" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-gray-500">Pengeluaran Kamar</p><p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{formatCurrency(roomExpenses)}</p></div></div></CardContent></Card>
        <Card className="w-full overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0"><Receipt className="w-5 h-5 text-blue-600" /></div><div className="min-w-0 flex-1"><p className="text-xs sm:text-sm text-gray-500">Pengeluaran Operasional</p><p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{formatCurrency(overheadExpenses)}</p></div></div></CardContent></Card>
      </div>

      {/* Filters - Property + Month */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end bg-white p-3 sm:p-4 rounded-lg border border-gray-200 w-full">
        <div className="grid grid-cols-2 sm:flex gap-3 w-full sm:w-auto">
          <div className="w-full sm:min-w-">
            <Label htmlFor="property-filter" className="text-xs text-gray-500 mb-1 block">Properti</Label>
            <select id="property-filter" value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]">
              <option value="all">Semua Properti</option>{properties.map(property => (<option key={property.id} value={property.id}>{property.name}</option>))}
            </select>
          </div>
          <div className="w-full sm:min-w-">
            <Label htmlFor="month-filter" className="text-xs text-gray-500 mb-1 block">Bulan</Label>
            <select id="month-filter" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]">
              <option value="all">Semua Bulan</option>{monthOptions.map(monthKey => (<option key={monthKey} value={monthKey}>{formatMonthKey(monthKey)}</option>))}
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:flex-1">
          <div className="relative w-full sm:max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input type="text" placeholder="Cari pengeluaran..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 text-base sm:h-10 sm:text-sm w-full" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="flex-1 sm:flex-none h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]">
              <option value="all">Semua Kategori</option>{categories.map(cat => (<option key={cat} value={cat}>{getExpenseTypeLabel(cat)}</option>))}
            </select>
            <Button variant="outline" className="h-11 sm:h-10 shrink-0"><Download className="w-4 h-4 mr-2" />Export</Button>
          </div>
        </div>
      </div>

      {isLoading && (<div className="text-center py-12"><div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" /><p className="text-gray-500">Memuat data...</p></div>)}

      {!isLoading && (
        <>
          {/* Desktop Table */}
          <Card className="hidden sm:block w-full overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tanggal</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kategori</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kamar</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Provider</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Keterangan</th><th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Jumlah</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th></tr></thead>
              <tbody className="divide-y">{filteredExpenses.map((expense) => {
                const room = rooms.find(r => r.id === expense.room_id);
                return (<tr key={expense.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedExpense(expense)}><td className="px-4 py-3">{formatDate(expense.expense_date)}</td><td className="px-4 py-3"><Badge variant="outline">{getExpenseTypeLabel(expense.expense_type)}</Badge></td><td className="px-4 py-3">{room? (<span>{room.room_number}</span>) : (<span className="text-gray-400">-</span>)}</td><td className="px-4 py-3">{expense.provider_name}</td><td className="px-4 py-3"><span className="text-sm text-gray-600 line-clamp-1">{expense.description || '-'}</span></td><td className="px-4 py-3 text-right font-medium">{formatCurrency(expense.amount)}</td><td className="px-4 py-3"><Badge className={cn(expense.approval_status === 'approved' && "bg-green-100 text-green-700", expense.approval_status === 'pending' && "bg-yellow-100 text-yellow-700", expense.approval_status === 'rejected' && "bg-red-100 text-red-700")}>{expense.approval_status === 'approved'? 'Disetujui' : expense.approval_status === 'pending'? 'Menunggu' : 'Ditolak'}</Badge></td></tr>);
              })}</tbody>
            </table></div>
          </Card>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-3 sm:hidden w-full">
            {filteredExpenses.map((expense) => {
              const room = rooms.find(r => r.id === expense.room_id);
              return (
                <Card key={expense.id} className="w-full overflow-hidden cursor-pointer active:bg-gray-50" onClick={() => setSelectedExpense(expense)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1"><p className="font-medium text-gray-900 truncate text-">{expense.provider_name}</p><p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2"><span>{formatDate(expense.expense_date)}</span><span>•</span><span>{getExpenseTypeLabel(expense.expense_type)}</span>{room && <><span>•</span><span>Kamar {room.room_number}</span></>}</p></div>
                      <Badge className={cn("shrink-0 text-xs", expense.approval_status === 'approved' && "bg-green-100 text-green-700", expense.approval_status === 'pending' && "bg-yellow-100 text-yellow-700", expense.approval_status === 'rejected' && "bg-red-100 text-red-700")}>{expense.approval_status === 'approved'? 'Disetujui' : expense.approval_status === 'pending'? 'Menunggu' : 'Ditolak'}</Badge>
                    </div>
                    <div className="mt-3 flex justify-between items-end gap-2">
                      <div className="min-w-0 flex-1"><p className="text-xs text-gray-500">Jumlah</p><p className="font-bold text-gray-900 truncate">{formatCurrency(expense.amount)}</p>{expense.description && <p className="text-xs text-gray-500 mt-1 truncate">{expense.description}</p>}</div>
                      <Badge variant="outline" className="shrink-0 text-xs">{getExpenseTypeLabel(expense.expense_type)}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {!isLoading && filteredExpenses.length === 0 && (<div className="text-center py-12 bg-gray-50 rounded-lg px-4"><p className="text-gray-500">Tidak ada pengeluaran ditemukan</p><Button variant="outline" className="mt-4 h-11 w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Tambah Pengeluaran</Button></div>)}

      {/* Add */}
      {isMobile? (
        <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col bg-white">
            <SheetHeader className="p-4 border-b shrink-0 text-left"><SheetTitle>Tambah Pengeluaran</SheetTitle><SheetDescription>Catat pengeluaran baru</SheetDescription></SheetHeader>
            <form onSubmit={handleAdd} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)]"><FormFields /></div>
              <SheetFooter className="p-4 border-t flex-row gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setIsAddDialogOpen(false)}>Batal</Button><Button type="submit" className="flex-1 bg-[#1A3D5C] hover:bg-[#0F2744] h-11">Simpan</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg max-h- overflow-y-auto"><DialogHeader><DialogTitle>Tambah Pengeluaran</DialogTitle><DialogDescription>Catat pengeluaran baru</DialogDescription></DialogHeader><form onSubmit={handleAdd} className="space-y-4"><FormFields /><DialogFooter><Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button><Button type="submit" className="bg-[#1A3D5C] hover:bg-[#0F2744]">Simpan</Button></DialogFooter></form></DialogContent>
        </Dialog>
      )}

      {/* Detail */}
      {isMobile? (
        <Sheet open={!!selectedExpense &&!isEditDialogOpen &&!isDeleteDialogOpen} onOpenChange={() => setSelectedExpense(null)}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col bg-white">
            {selectedExpense && (
              <>
                <SheetHeader className="p-4 border-b shrink-0 text-left"><SheetTitle>Detail Pengeluaran</SheetTitle><SheetDescription>Informasi lengkap pengeluaran</SheetDescription></SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[env(safe-area-inset-bottom)]">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"><div className="min-w-0 flex-1"><p className="text-xs text-gray-500">Jumlah Pengeluaran</p><p className="text-xl font-bold text-gray-900 truncate">{formatCurrency(selectedExpense.amount)}</p></div><Badge className={cn("shrink-0 ml-2", selectedExpense.approval_status === 'approved' && "bg-green-100 text-green-700", selectedExpense.approval_status === 'pending' && "bg-yellow-100 text-yellow-700", selectedExpense.approval_status === 'rejected' && "bg-red-100 text-red-700")}>{selectedExpense.approval_status === 'approved'? 'Disetujui' : selectedExpense.approval_status === 'pending'? 'Menunggu' : 'Ditolak'}</Badge></div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-2"><span className="text-gray-500">Tanggal</span><span className="font-medium">{formatDate(selectedExpense.expense_date)}</span></div>
                    <div className="flex justify-between gap-2"><span className="text-gray-500">Kategori</span><Badge variant="outline" className="text-xs">{getExpenseTypeLabel(selectedExpense.expense_type)}</Badge></div>
                    {selectedExpense.room_id && (<div className="flex justify-between gap-2"><span className="text-gray-500">Kamar</span><span className="font-medium">{rooms.find(r => r.id === selectedExpense.room_id)?.room_number}</span></div>)}
                    <div className="flex justify-between gap-2"><span className="text-gray-500">Provider</span><span className="font-medium truncate">{selectedExpense.provider_name}</span></div>
                    <div className="flex justify-between gap-2"><span className="text-gray-500">Properti</span><span className="font-medium truncate">{properties.find(p => p.id === selectedExpense.property_id)?.name}</span></div>
                    <div className="pt-2"><span className="text-gray-500 text-xs">Keterangan</span><p className="font-medium mt-1 break-words bg-gray-50 p-3 rounded-lg">{selectedExpense.description || '-'}</p></div>
                  </div>
                </div>
                <div className="p-4 border-t grid grid-cols-3 gap-2 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  <Button variant="outline" className="h-11" onClick={() => setSelectedExpense(null)}>Tutup</Button>
                  <Button variant="outline" className="text-red-600 h-11" onClick={() => openDeleteDialog(selectedExpense)}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button>
                  <Button className="bg-[#1A3D5C] hover:bg-[#0F2744] h-11" onClick={() => { if (selectedExpense) { const e = selectedExpense; setSelectedExpense(null); setTimeout(() => openEditDialog(e), 100); } }}><Edit className="w-4 h-4 mr-2" />Edit</Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedExpense &&!isEditDialogOpen &&!isDeleteDialogOpen} onOpenChange={() => setSelectedExpense(null)}>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Detail Pengeluaran</DialogTitle><DialogDescription>Informasi lengkap pengeluaran</DialogDescription></DialogHeader>
            {selectedExpense && (
              <>
                <div className="space-y-4"><div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"><div><p className="text-sm text-gray-500">Jumlah Pengeluaran</p><p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedExpense.amount)}</p></div><Badge className={cn(selectedExpense.approval_status === 'approved' && "bg-green-100 text-green-700", selectedExpense.approval_status === 'pending' && "bg-yellow-100 text-yellow-700", selectedExpense.approval_status === 'rejected' && "bg-red-100 text-red-700")}>{selectedExpense.approval_status === 'approved'? 'Disetujui' : selectedExpense.approval_status === 'pending'? 'Menunggu' : 'Ditolak'}</Badge></div>
                  <div className="space-y-3"><div className="flex justify-between"><span className="text-gray-500">Tanggal</span><span className="font-medium">{formatDate(selectedExpense.expense_date)}</span></div><div className="flex justify-between"><span className="text-gray-500">Kategori</span><Badge variant="outline">{getExpenseTypeLabel(selectedExpense.expense_type)}</Badge></div>{selectedExpense.room_id && (<div className="flex justify-between"><span className="text-gray-500">Kamar</span><span className="font-medium">{rooms.find(r => r.id === selectedExpense.room_id)?.room_number}</span></div>)}<div className="flex justify-between"><span className="text-gray-500">Provider</span><span className="font-medium">{selectedExpense.provider_name}</span></div><div className="flex justify-between"><span className="text-gray-500">Keterangan</span><span>{selectedExpense.description || '-'}</span></div><div className="flex justify-between"><span className="text-gray-500">Properti</span><span className="font-medium">{properties.find(p => p.id === selectedExpense.property_id)?.name}</span></div></div>
                </div>
                <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setSelectedExpense(null)}>Tutup</Button><Button variant="outline" className="text-red-600" onClick={() => openDeleteDialog(selectedExpense)}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button><Button className="bg-[#1A3D5C] hover:bg-[#0F2744]" onClick={() => { openEditDialog(selectedExpense); }}><Edit className="w-4 h-4 mr-2" />Edit</Button></DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Edit */}
      {isMobile? (
        <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <SheetContent side="bottom" className="h- w-full p-0 flex flex-col bg-white">
            <SheetHeader className="p-4 border-b shrink-0 text-left"><SheetTitle>Edit Pengeluaran</SheetTitle><SheetDescription>Perbarui informasi pengeluaran</SheetDescription></SheetHeader>
            <form onSubmit={handleEdit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)]"><FormFields isEdit /></div>
              <SheetFooter className="p-4 border-t flex-row gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setIsEditDialogOpen(false)}>Batal</Button><Button type="submit" className="flex-1 bg-[#1A3D5C] hover:bg-[#0F2744] h-11">Simpan Perubahan</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg max-h- overflow-y-auto"><DialogHeader><DialogTitle>Edit Pengeluaran</DialogTitle><DialogDescription>Perbarui informasi pengeluaran</DialogDescription></DialogHeader><form onSubmit={handleEdit} className="space-y-4"><FormFields isEdit /><DialogFooter><Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button><Button type="submit" className="bg-[#1A3D5C] hover:bg-[#0F2744]">Simpan Perubahan</Button></DialogFooter></form></DialogContent>
        </Dialog>
      )}

      {/* Delete */}
      {isMobile? (
        <Sheet open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <SheetContent side="bottom" className="h-auto w-full p-0 flex flex-col bg-white rounded-t-xl">
            <SheetHeader className="p-5 text-left"><SheetTitle>Konfirmasi Hapus</SheetTitle><SheetDescription className="text-left">Apakah Anda yakin ingin menghapus pengeluaran ini? Tindakan ini tidak dapat dibatalkan.</SheetDescription></SheetHeader>
            <div className="p-4 flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button variant="outline" className="flex-1 h-11" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button><Button variant="destructive" className="flex-1 h-11" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button></div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Konfirmasi Hapus</DialogTitle><DialogDescription>Apakah Anda yakin ingin menghapus pengeluaran ini? Tindakan ini tidak dapat dibatalkan.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button><Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Hapus</Button></DialogFooter></DialogContent>
        </Dialog>
      )}
    </div>
  );
}