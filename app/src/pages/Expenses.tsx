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
import { Label } from '@/components/ui/label';
import { expensesAPI, propertiesAPI, roomsAPI } from '@/services/api';
import { getUserFromToken } from '@/services/auth';
import type { Expense, Property, Room } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, getExpenseTypeLabel } from '@/lib/format';

export function Expenses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // NEW FILTER STATES
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state - using snake_case to match database
  const [formData, setFormData] = useState({
    property_id: '',
    room_id: '',
    expense_type: 'electricity',
    provider_name: '',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    approval_status: 'approved' as 'pending' | 'approved' | 'rejected',
    reported_by: '',
  });

  // Calculate available months from expenses data
  const monthOptions = useMemo(() => {
    const monthsSet = new Set<string>();
    expenses.forEach(expense => {
      if (expense.expense_date) {
        // Extract YYYY-MM from date string (handles ISO format and YYYY-MM-DD)
        const dateStr = expense.expense_date.toString();
        const monthKey = dateStr.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(monthKey)) {
          monthsSet.add(monthKey);
        }
      }
    });
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a)); // Newest first
  }, [expenses]);
  
  // Format month key (YYYY-MM) to Indonesian display format
  const formatMonthKey = (key: string) => {
    const [year, month] = key.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return monthIndex >= 0 && monthIndex < 12 
      ? `${monthNames[monthIndex]} ${year}` 
      : key;
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [expensesRes, propertiesRes, roomsRes] = await Promise.all([
        expensesAPI.getAll(),
        propertiesAPI.getAll(),
        roomsAPI.getAll(),
      ]);
      setExpenses(expensesRes);
      setProperties(propertiesRes);
      setRooms(roomsRes);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter expenses with new property and month filters
  const filteredExpenses = expenses.filter(expense => {
    // Existing filters
    const matchesSearch = 
      expense.provider_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || expense.expense_type === selectedCategory;
    
    // NEW: Property filter
    const matchesProperty = selectedProperty === 'all' || 
                           expense.property_id === selectedProperty;
    
    // NEW: Month filter
    let matchesMonth = true;
    if (selectedMonth !== 'all' && expense.expense_date) {
      const expenseMonth = expense.expense_date.toString().substring(0, 7);
      matchesMonth = expenseMonth === selectedMonth;
    }
    
    return matchesSearch && matchesCategory && matchesProperty && matchesMonth;
  });

  // Calculate totals with null/undefined safety
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const roomExpenses = filteredExpenses.filter(e => e.room_id).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const overheadExpenses = filteredExpenses.filter(e => !e.room_id).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Get expense categories
  const categories = Array.from(new Set(expenses.map(e => e.expense_type)));

  // Reset form - using snake_case, ADD reported_by from current user
  const resetForm = () => {
    const currentUser = getUserFromToken();
    setFormData({
      property_id: properties[0]?.id || '',
      room_id: '',
      expense_type: 'electricity',
      provider_name: '',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      description: '',
      approval_status: 'approved',
      reported_by: currentUser?.id || '',
    });
  };

  // Handle add expense - include reported_by
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentUser = getUserFromToken();
      if (!currentUser?.id) {
        toast.error('Sesi tidak valid, silakan login ulang');
        return;
      }
      
      const dataToSubmit = {
        ...formData,
        reported_by: currentUser.id,
      };
      
      await expensesAPI.create(dataToSubmit);
      toast.success('Pengeluaran berhasil ditambahkan');
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Gagal menambahkan pengeluaran');
    }
  };

  // Handle edit expense - include reported_by
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    try {
      const currentUser = getUserFromToken();
      
      const dataToSubmit = {
        ...formData,
        reported_by: selectedExpense.reported_by || currentUser?.id || '',
      };
      
      await expensesAPI.update(selectedExpense.id, dataToSubmit);
      toast.success('Pengeluaran berhasil diperbarui');
      setIsEditDialogOpen(false);
      setSelectedExpense(null);
      fetchData();
    } catch (error) {
      toast.error('Gagal memperbarui pengeluaran');
    }
  };

  // Handle delete expense
  const handleDelete = async () => {
    if (!selectedExpense) return;
    try {
      await expensesAPI.delete(selectedExpense.id);
      toast.success('Pengeluaran berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setSelectedExpense(null);
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus pengeluaran');
    }
  };

  // Open edit dialog - using snake_case, ADD reported_by
  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
      property_id: expense.property_id,
      room_id: expense.room_id || '',
      expense_type: expense.expense_type,
      provider_name: expense.provider_name,
      amount: expense.amount,
      expense_date: new Date(expense.expense_date).toISOString().split('T')[0],
      description: expense.description || '',
      approval_status: expense.approval_status,
      reported_by: expense.reported_by || '',
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengeluaran</h1>
          <p className="text-gray-500">Catat dan kelola semua pengeluaran operasional</p>
        </div>
        <Button 
          className="bg-[#1A3D5C] hover:bg-[#0F2744]"
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pengeluaran
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Pengeluaran</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pengeluaran Kamar</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(roomExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pengeluaran Operasional</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(overheadExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NEW FILTERS ROW - Property and Month */}
      <div className="flex flex-wrap items-end gap-4 pb-4 border-b border-gray-200">
        {/* Property Filter */}
        <div className="min-w-[200px]">
          <Label htmlFor="property-filter" className="text-xs text-gray-500 mb-1 block">
            Properti
          </Label>
          <select
            id="property-filter"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C] text-sm"
          >
            <option value="all">Semua Properti</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Month Filter */}
        <div className="min-w-[180px]">
          <Label htmlFor="month-filter" className="text-xs text-gray-500 mb-1 block">
            Bulan
          </Label>
          <select
            id="month-filter"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C] text-sm"
          >
            <option value="all">Semua Bulan</option>
            {monthOptions.map(monthKey => (
              <option key={monthKey} value={monthKey}>
                {formatMonthKey(monthKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Existing Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari pengeluaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
        >
          <option value="all">Semua Kategori</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{getExpenseTypeLabel(cat)}</option>
          ))}
        </select>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Memuat data...</p>
        </div>
      )}

      {/* Expenses Table */}
      {!isLoading && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tanggal</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kategori</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kamar</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Provider</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Keterangan</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Jumlah</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredExpenses.map((expense) => {
                  const room = rooms.find(r => r.id === expense.room_id);
                  return (
                    <tr 
                      key={expense.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedExpense(expense)}
                    >
                      <td className="px-4 py-3">{formatDate(expense.expense_date)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{getExpenseTypeLabel(expense.expense_type)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {room ? (
                          <span>{room.room_number}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{expense.provider_name}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 line-clamp-1">{expense.description || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn(
                          expense.approval_status === 'approved' && "bg-green-100 text-green-700",
                          expense.approval_status === 'pending' && "bg-yellow-100 text-yellow-700",
                          expense.approval_status === 'rejected' && "bg-red-100 text-red-700",
                        )}>
                          {expense.approval_status === 'approved' ? 'Disetujui' : 
                           expense.approval_status === 'pending' ? 'Menunggu' : 'Ditolak'}
                        </Badge>
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
      {!isLoading && filteredExpenses.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Tidak ada pengeluaran ditemukan</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pengeluaran
          </Button>
        </div>
      )}

      {/* Add Expense Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Pengeluaran</DialogTitle>
            <DialogDescription>
              Catat pengeluaran baru
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="property">Properti *</Label>
              <select
                id="property"
                value={formData.property_id}
                onChange={(e) => setFormData({ ...formData, property_id: e.target.value, room_id: '' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                required
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room">Kamar (opsional)</Label>
              <select
                id="room"
                value={formData.room_id}
                onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
              >
                <option value="">Overhead</option>
                {rooms.filter(r => r.property_id === formData.property_id).map(r => (
                  <option key={r.id} value={r.id}>{r.room_number}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense_type">Kategori *</Label>
              <select
                id="expense_type"
                value={formData.expense_type}
                onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                required
              >
                <option value="electricity">Listrik</option>
                <option value="water">Air</option>
                <option value="internet">Internet</option>
                <option value="ac_repair">Perbaikan AC</option>
                <option value="room_repair">Perbaikan Kamar</option>
                <option value="ac_cleaning">Pembersihan AC</option>
                <option value="gallon">Galon</option>
                <option value="gas">Gas</option>
                <option value="laundry_soap">Deterjen Laundry</option>
                <option value="staff_salary">Gaji Staf</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider_name">Nama Provider *</Label>
              <Input
                id="provider_name"
                value={formData.provider_name}
                onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                placeholder="Contoh: PLN, PDAM, dll"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah (Rp) *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value)||0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense_date">Tanggal *</Label>
              <Input
                id="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Keterangan</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                rows={3}
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

      {/* Expense Detail Dialog */}
      <Dialog open={!!selectedExpense && !isEditDialogOpen && !isDeleteDialogOpen} onOpenChange={() => setSelectedExpense(null)}>
        <DialogContent className="max-w-lg">
          {selectedExpense && (
            <>
              <DialogHeader>
                <DialogTitle>Detail Pengeluaran</DialogTitle>
                <DialogDescription>
                  Informasi lengkap pengeluaran
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Jumlah Pengeluaran</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(selectedExpense.amount)}
                    </p>
                  </div>
                  <Badge className={cn(
                    selectedExpense.approval_status === 'approved' && "bg-green-100 text-green-700",
                    selectedExpense.approval_status === 'pending' && "bg-yellow-100 text-yellow-700",
                    selectedExpense.approval_status === 'rejected' && "bg-red-100 text-red-700",
                  )}>
                    {selectedExpense.approval_status === 'approved' ? 'Disetujui' : 
                     selectedExpense.approval_status === 'pending' ? 'Menunggu' : 'Ditolak'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tanggal</span>
                    <span className="font-medium">{formatDate(selectedExpense.expense_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kategori</span>
                    <Badge variant="outline">{getExpenseTypeLabel(selectedExpense.expense_type)}</Badge>
                  </div>
                  {selectedExpense.room_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Kamar</span>
                      <span className="font-medium">
                        {rooms.find(r => r.id === selectedExpense.room_id)?.room_number}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Provider</span>
                    <span className="font-medium">{selectedExpense.provider_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Keterangan</span>
                    <span>{selectedExpense.description || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Properti</span>
                    <span className="font-medium">
                      {properties.find(p => p.id === selectedExpense.property_id)?.name}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedExpense(null)}>
                  Tutup
                </Button>
                <Button 
                  variant="outline"
                  className="text-red-600"
                  onClick={() => openDeleteDialog(selectedExpense)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
                <Button 
                  className="bg-[#1A3D5C] hover:bg-[#0F2744]"
                  onClick={() => {
                    openEditDialog(selectedExpense);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pengeluaran</DialogTitle>
            <DialogDescription>
              Perbarui informasi pengeluaran
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-property">Properti *</Label>
              <select
                id="edit-property"
                value={formData.property_id}
                onChange={(e) => setFormData({ ...formData, property_id: e.target.value, room_id: '' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                required
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-room">Kamar (opsional)</Label>
              <select
                id="edit-room"
                value={formData.room_id}
                onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
              >
                <option value="">Overhead</option>
                {rooms.filter(r => r.property_id === formData.property_id).map(r => (
                  <option key={r.id} value={r.id}>{r.room_number}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-expense_type">Kategori *</Label>
              <select
                id="edit-expense_type"
                value={formData.expense_type}
                onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                required
              >
                <option value="electricity">Listrik</option>
                <option value="water">Air</option>
                <option value="internet">Internet</option>
                <option value="ac_repair">Perbaikan AC</option>
                <option value="room_repair">Perbaikan Kamar</option>
                <option value="ac_cleaning">Pembersihan AC</option>
                <option value="gallon">Galon</option>
                <option value="gas">Gas</option>
                <option value="laundry_soap">Deterjen Laundry</option>
                <option value="staff_salary">Gaji Staf</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-provider_name">Nama Provider *</Label>
              <Input
                id="edit-provider_name"
                value={formData.provider_name}
                onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">Jumlah (Rp) *</Label>
              <Input
                id="edit-amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-expense_date">Tanggal *</Label>
              <Input
                id="edit-expense_date"
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Keterangan</Label>
              <textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#1A3D5C] hover:bg-[#0F2744]">
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengeluaran ini? 
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