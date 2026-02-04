// Currency formatter for Indonesian Rupiah
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Short currency format (in millions/billions)
export function formatCurrencyShort(value: number): string {
  if (value >= 1000000000) {
    return `Rp ${(value / 1000000000).toFixed(1)}M`;
  }
  if (value >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)}jt`;
  }
  if (value >= 1000) {
    return `Rp ${(value / 1000).toFixed(0)}rb`;
  }
  return formatCurrency(value);
}

// Percentage formatter
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Date formatter
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Short date formatter
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// DateTime formatter
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Number formatter with thousand separators
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

// Phone number formatter
export function formatPhone(phone: string): string {
  if (phone.startsWith('0')) {
    return `+62 ${phone.slice(1).replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}`;
  }
  return phone;
}

// Room status color mapper
export function getRoomStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: 'bg-green-500',
    occupied: 'bg-blue-500',
    reserved: 'bg-yellow-500',
    maintenance: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-500';
}

// Room status label mapper
export function getRoomStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: 'Tersedia',
    occupied: 'Terisi',
    reserved: 'Dipesan',
    maintenance: 'Perawatan',
  };
  return labels[status] || status;
}

// Payment status color mapper
export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: 'bg-green-500',
    pending: 'bg-yellow-500',
    overdue: 'bg-red-500',
    refunded: 'bg-gray-500',
  };
  return colors[status] || 'bg-gray-500';
}

// Payment status label mapper
export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    paid: 'Lunas',
    pending: 'Tertunda',
    overdue: 'Terlambat',
    refunded: 'Dikembalikan',
  };
  return labels[status] || status;
}

// Expense type label mapper
export function getExpenseTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ac_repair: 'Perbaikan AC',
    room_repair: 'Perbaikan Kamar',
    ac_cleaning: 'Pembersihan AC',
    gallon: 'Galon',
    gas: 'Gas',
    laundry_soap: 'Sabun Laundry',
    electricity: 'Listrik',
    water: 'Air',
    internet: 'Internet',
    staff_salary: 'Gaji Staff',
    other: 'Lainnya',
  };
  return labels[type] || type;
}

// Maintenance issue type label mapper
export function getIssueTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ac: 'AC',
    plumbing: 'Plumbing',
    electrical: 'Listrik',
    furniture: 'Furniture',
    painting: 'Pengecatan',
    other: 'Lainnya',
  };
  return labels[type] || type;
}

// Priority level color mapper
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
  };
  return colors[priority] || 'bg-gray-500';
}

// Priority level label mapper
export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
    urgent: 'Mendesak',
  };
  return labels[priority] || priority;
}
