import { useState, useEffect } from 'react';
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
import type { Expense, Property, Room } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, getExpenseTypeLabel } from '@/lib/format';

export function Expenses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    propertyId: '',
    roomId: '',
    expenseType: 'electricity',
    providerName: '',
    amount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
    approvalStatus: 'approved' as 'pending' | 'approved' | 'rejected',
  });

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

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || expense.expenseType === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate totals
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const roomExpenses = filteredExpenses.filter(e => e.roomId).reduce((sum, e) => sum + e.amount, 0);
  const overheadExpenses = filteredExpenses.filter(e => !e.roomId).reduce((sum, e) => sum + e.amount, 0);

  // Get expense categories
  const categories = Array.from(new Set(expenses.map(e => e.expenseType)));

  // Reset form
  const resetForm = () => {
    setFormData({
      propertyId: properties[0]?.id || '',
      roomId: '',
      expenseType: 'electricity',
      providerName: '',
      amount: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      description: '',
      approvalStatus: 'approved',
    });
  };

  // Handle add expense
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await expensesAPI.create(formData);
      toast.success('Pengeluaran berhasil ditambahkan');
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Gagal menambahkan pengeluaran');
    }
  };

  // Handle edit expense
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    try {
      await expensesAPI.update(selectedExpense.id, formData);
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

  // Open edit dialog
  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
      propertyId: expense.propertyId,
      roomId: expense.roomId || '',
      expenseType: expense.expenseType,
      providerName: expense.providerName,
      amount: expense.amount,
      expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
      description: expense.description || '',
      approvalStatus: expense.approvalStatus,
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

      {/* Filters */}
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
                  const room = rooms.find(r => r.id === expense.roomId);
                  return (
                    <tr 
                      key={expense.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedExpense(expense)}
                    >
                      <td className="px-4 py-3">{formatDate(expense.expenseDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{getExpenseTypeLabel(expense.expenseType)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {room ? (
                          <span>{room.roomNumber}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{expense.providerName}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 line-clamp-1">{expense.description || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn(
                          expense.approvalStatus === 'approved' && "bg-green-100 text-green-700",
                          expense.approvalStatus === 'pending' && "bg-yellow-100 text-yellow-700",
                          expense.approvalStatus === 'rejected' && "bg-red-100 text-red-700",
                        )}>
                          {expense.approvalStatus === 'approved' ? 'Disetujui' : 
                           expense.approvalStatus === 'pending' ? 'Menunggu' : 'Ditolak'}
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
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value, roomId: '' })}
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
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
              >
                <option value="">Tidak ada (Operasional)</option>
                {rooms.filter(r => r.propertyId === formData.propertyId).map(r => (
                  <option key={r.id} value={r.id}>{r.roomNumber}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenseType">Kategori *</Label>
              <select
                id="expenseType"
                value={formData.expenseType}
                onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                required
              >
                <option value="electricity">Listrik</option>
                <option value="water">Air</option>
                <option value="internet">Internet</option>
                <option value="cleaning">Kebersihan</option>
                <option value="maintenance">Perawatan</option>
                <option value="security">Keamanan</option>
                <option value="staff">Staf</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="providerName">Nama Provider *</Label>
              <Input
                id="providerName"
                value={formData.providerName}
                onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenseDate">Tanggal *</Label>
              <Input
                id="expenseDate"
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
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
                    selectedExpense.approvalStatus === 'approved' && "bg-green-100 text-green-700",
                    selectedExpense.approvalStatus === 'pending' && "bg-yellow-100 text-yellow-700",
                  )}>
                    {selectedExpense.approvalStatus === 'approved' ? 'Disetujui' : 'Menunggu'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tanggal</span>
                    <span className="font-medium">{formatDate(selectedExpense.expenseDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kategori</span>
                    <Badge variant="outline">{getExpenseTypeLabel(selectedExpense.expenseType)}</Badge>
                  </div>
                  {selectedExpense.roomId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Kamar</span>
                      <span className="font-medium">
                        {rooms.find(r => r.id === selectedExpense.roomId)?.roomNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Provider</span>
                    <span className="font-medium">{selectedExpense.providerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Keterangan</span>
                    <span>{selectedExpense.description || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Properti</span>
                    <span className="font-medium">
                      {properties.find(p => p.id === selectedExpense.propertyId)?.name}
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
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value, roomId: '' })}
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
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
              >
                <option value="">Tidak ada (Operasional)</option>
                {rooms.filter(r => r.propertyId === formData.propertyId).map(r => (
                  <option key={r.id} value={r.id}>{r.roomNumber}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-expenseType">Kategori *</Label>
              <select
                id="edit-expenseType"
                value={formData.expenseType}
                onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]"
                required
              >
                <option value="electricity">Listrik</option>
                <option value="water">Air</option>
                <option value="internet">Internet</option>
                <option value="cleaning">Kebersihan</option>
                <option value="maintenance">Perawatan</option>
                <option value="security">Keamanan</option>
                <option value="staff">Staf</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-providerName">Nama Provider *</Label>
              <Input
                id="edit-providerName"
                value={formData.providerName}
                onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
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
              <Label htmlFor="edit-expenseDate">Tanggal *</Label>
              <Input
                id="edit-expenseDate"
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
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
