import { useState } from 'react';
import { Plus, Search, Receipt, Download, Edit } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { properties, rooms, expenses } from '@/data/mockData';
import type { Expense } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, getExpenseTypeLabel } from '@/lib/format';

export function Expenses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengeluaran</h1>
          <p className="text-gray-500">Catat dan kelola semua pengeluaran operasional</p>
        </div>
        <Button className="bg-[#1A3D5C] hover:bg-[#0F2744]">
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

      {/* Expenses Table */}
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

      {/* Expense Detail Dialog */}
      <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
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

                {selectedExpense.receiptImageUrl && (
                  <div>
                    <Label className="text-gray-500">Bukti Pembayaran</Label>
                    <div className="mt-2">
                      <img 
                        src={selectedExpense.receiptImageUrl} 
                        alt="Bukti"
                        className="w-full max-h-64 object-contain rounded-lg border"
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedExpense(null)}>
                  Tutup
                </Button>
                <Button className="bg-[#1A3D5C] hover:bg-[#0F2744]">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
