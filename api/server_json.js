const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database file path
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize database if not exists
function initDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [
        { id: '1', username: 'admin', email: 'admin@kosana.id', phone: '081234567890', fullName: 'Administrator', role: 'admin', isActive: true, createdAt: new Date().toISOString() }
      ],
      properties: [
        {
          id: '1',
          name: 'Kos Kebayoran Lama',
          address: 'Jl. Kebayoran Lama No. 45, Jakarta Selatan',
          city: 'Jakarta Selatan',
          district: 'Kebayoran Lama',
          postalCode: '12210',
          contactPhone: '081234567890',
          propertyManagerId: '1',
          propertyType: 'male',
          totalFloors: 3,
          totalRooms: 30,
          amenities: { wifi: true, ac: true, hotWater: true, parking: true, cctv: true },
          rules: 'Dilarang merokok di kamar. Jam malam 22:00. Tamu harus lapor.',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Kos Harmoni',
          address: 'Jl. Harmoni Raya No. 12, Jakarta Pusat',
          city: 'Jakarta Pusat',
          district: 'Harmoni',
          postalCode: '10110',
          contactPhone: '081234567891',
          propertyManagerId: '1',
          propertyType: 'female',
          totalFloors: 2,
          totalRooms: 20,
          amenities: { wifi: true, ac: true, hotWater: true, parking: true, cctv: true },
          rules: 'Dilarang membawa tamu laki-laki. Jam malam 21:00.',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      rooms: [
        { id: '1', propertyId: '1', roomNumber: '101', floor: 1, roomType: 'standard', sizeSqm: 12, occupancyType: 'double', baseMonthlyRent: 2000000, additionalPersonFee: 500000, amenities: { ac: true, privateBathroom: true, balcony: false, window: true }, status: 'occupied', acUnitId: 'AC-101', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', propertyId: '1', roomNumber: '102', floor: 1, roomType: 'deluxe', sizeSqm: 16, occupancyType: 'single', baseMonthlyRent: 2500000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: true, balcony: true, window: true }, status: 'occupied', acUnitId: 'AC-102', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '3', propertyId: '1', roomNumber: '103', floor: 1, roomType: 'standard', sizeSqm: 12, occupancyType: 'single', baseMonthlyRent: 1800000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: false, balcony: false, window: true }, status: 'available', acUnitId: 'AC-103', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '4', propertyId: '1', roomNumber: '104', floor: 1, roomType: 'premium', sizeSqm: 20, occupancyType: 'single', baseMonthlyRent: 3000000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: true, balcony: true, window: true }, status: 'occupied', acUnitId: 'AC-104', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '5', propertyId: '1', roomNumber: '105', floor: 1, roomType: 'standard', sizeSqm: 12, occupancyType: 'single', baseMonthlyRent: 1800000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: false, balcony: false, window: true }, status: 'maintenance', acUnitId: 'AC-105', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '6', propertyId: '1', roomNumber: '201', floor: 2, roomType: 'standard', sizeSqm: 12, occupancyType: 'single', baseMonthlyRent: 1900000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: false, balcony: false, window: true }, status: 'occupied', acUnitId: 'AC-201', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '7', propertyId: '1', roomNumber: '202', floor: 2, roomType: 'deluxe', sizeSqm: 16, occupancyType: 'double', baseMonthlyRent: 2400000, additionalPersonFee: 500000, amenities: { ac: true, privateBathroom: true, balcony: true, window: true }, status: 'occupied', acUnitId: 'AC-202', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '8', propertyId: '1', roomNumber: '203', floor: 2, roomType: 'standard', sizeSqm: 12, occupancyType: 'single', baseMonthlyRent: 1900000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: false, balcony: false, window: true }, status: 'available', acUnitId: 'AC-203', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '9', propertyId: '1', roomNumber: '204', floor: 2, roomType: 'standard', sizeSqm: 12, occupancyType: 'single', baseMonthlyRent: 1900000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: false, balcony: false, window: true }, status: 'occupied', acUnitId: 'AC-204', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '10', propertyId: '1', roomNumber: '205', floor: 2, roomType: 'premium', sizeSqm: 22, occupancyType: 'single', baseMonthlyRent: 3200000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: true, balcony: true, window: true }, status: 'reserved', acUnitId: 'AC-205', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '11', propertyId: '2', roomNumber: '101', floor: 1, roomType: 'standard', sizeSqm: 14, occupancyType: 'single', baseMonthlyRent: 2200000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: true, balcony: false, window: true }, status: 'occupied', acUnitId: 'AC-101', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '12', propertyId: '2', roomNumber: '102', floor: 1, roomType: 'deluxe', sizeSqm: 18, occupancyType: 'single', baseMonthlyRent: 2800000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: true, balcony: true, window: true }, status: 'occupied', acUnitId: 'AC-102', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '13', propertyId: '2', roomNumber: '103', floor: 1, roomType: 'standard', sizeSqm: 14, occupancyType: 'single', baseMonthlyRent: 2200000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: true, balcony: false, window: true }, status: 'available', acUnitId: 'AC-103', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
      tenants: [
        {
          id: '1', userId: null, propertyId: '1', roomId: '1', fullName: 'Ahmad Fauzi', phone: '081234567801', email: 'ahmad.fauzi@email.com',
          emergencyContact: 'Bapak Fauzi', emergencyPhone: '081234567811', ktpNumber: '3171012345678901', ktpImageUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400',
          checkInDate: '2025-01-01', checkOutDate: null, contractDurationMonths: 12, baseMonthlyRent: 2000000, additionalPersonFee: 500000,
          totalMonthlyRent: 2500000, securityDeposit: 2500000, lateFeePercentage: 5, paymentDueDay: 1, isSharedRoom: true,
          secondaryTenantName: 'Budi Santoso', secondaryTenantPhone: '081234567802', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        },
        {
          id: '2', userId: null, propertyId: '1', roomId: '2', fullName: 'Citra Dewi', phone: '081234567803', email: 'citra.dewi@email.com',
          emergencyContact: 'Ibu Dewi', emergencyPhone: '081234567813', ktpNumber: '3171012345678903', ktpImageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
          checkInDate: '2025-01-15', checkOutDate: null, contractDurationMonths: 6, baseMonthlyRent: 2500000, additionalPersonFee: 0,
          totalMonthlyRent: 2500000, securityDeposit: 2500000, lateFeePercentage: 5, paymentDueDay: 15, isSharedRoom: false,
          secondaryTenantName: null, secondaryTenantPhone: null, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        },
        {
          id: '3', userId: null, propertyId: '1', roomId: '4', fullName: 'Dedi Pratama', phone: '081234567805', email: 'dedi.pratama@email.com',
          emergencyContact: 'Bapak Pratama', emergencyPhone: '081234567815', ktpNumber: '3171012345678905', ktpImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
          checkInDate: '2025-02-01', checkOutDate: null, contractDurationMonths: 12, baseMonthlyRent: 3000000, additionalPersonFee: 0,
          totalMonthlyRent: 3000000, securityDeposit: 3000000, lateFeePercentage: 5, paymentDueDay: 1, isSharedRoom: false,
          secondaryTenantName: null, secondaryTenantPhone: null, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        },
        {
          id: '4', userId: null, propertyId: '1', roomId: '6', fullName: 'Eka Wijaya', phone: '081234567807', email: 'eka.wijaya@email.com',
          emergencyContact: 'Ibu Wijaya', emergencyPhone: '081234567817', ktpNumber: '3171012345678907', ktpImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
          checkInDate: '2025-01-10', checkOutDate: null, contractDurationMonths: 6, baseMonthlyRent: 1900000, additionalPersonFee: 0,
          totalMonthlyRent: 1900000, securityDeposit: 1900000, lateFeePercentage: 5, paymentDueDay: 10, isSharedRoom: false,
          secondaryTenantName: null, secondaryTenantPhone: null, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        },
        {
          id: '5', userId: null, propertyId: '2', roomId: '11', fullName: 'Fani Susanti', phone: '081234567809', email: 'fani.susanti@email.com',
          emergencyContact: 'Bapak Susanti', emergencyPhone: '081234567819', ktpNumber: '3171012345678909', ktpImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
          checkInDate: '2025-01-05', checkOutDate: null, contractDurationMonths: 12, baseMonthlyRent: 2200000, additionalPersonFee: 0,
          totalMonthlyRent: 2200000, securityDeposit: 2200000, lateFeePercentage: 5, paymentDueDay: 5, isSharedRoom: false,
          secondaryTenantName: null, secondaryTenantPhone: null, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        },
      ],
      payments: [
        { id: '1', tenantId: '1', roomId: '1', propertyId: '1', paymentPeriod: '2026-01', baseAmount: 2000000, additionalPersonFee: 500000, lateFee: 0, laundryAmount: 135000, totalAmount: 2635000, paymentMethod: 'qris', paymentStatus: 'paid', paymentDate: '2026-01-01', dueDate: '2026-01-01', paidAt: '2026-01-01', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', tenantId: '2', roomId: '2', propertyId: '1', paymentPeriod: '2026-01', baseAmount: 2500000, additionalPersonFee: 0, lateFee: 0, laundryAmount: 81000, totalAmount: 2581000, paymentMethod: 'qris', paymentStatus: 'paid', paymentDate: '2026-01-15', dueDate: '2026-01-15', paidAt: '2026-01-15', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '3', tenantId: '3', roomId: '4', propertyId: '1', paymentPeriod: '2026-01', baseAmount: 3000000, additionalPersonFee: 0, lateFee: 0, laundryAmount: 108000, totalAmount: 3108000, paymentMethod: 'qris', paymentStatus: 'paid', paymentDate: '2026-02-01', dueDate: '2026-02-01', paidAt: '2026-02-01', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '4', tenantId: '4', roomId: '6', propertyId: '1', paymentPeriod: '2026-01', baseAmount: 1900000, additionalPersonFee: 0, lateFee: 95000, laundryAmount: 54000, totalAmount: 2049000, paymentMethod: 'qris', paymentStatus: 'pending', dueDate: '2026-01-10', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '5', tenantId: '5', roomId: '11', propertyId: '2', paymentPeriod: '2026-01', baseAmount: 2200000, additionalPersonFee: 0, lateFee: 0, laundryAmount: 72000, totalAmount: 2272000, paymentMethod: 'qris', paymentStatus: 'paid', paymentDate: '2026-01-05', dueDate: '2026-01-05', paidAt: '2026-01-05', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
      expenses: [
        { id: '1', propertyId: '1', roomId: '5', expenseDate: '2026-01-05', expenseType: 'ac_repair', amount: 150000, providerName: 'Service AC Jaya', description: 'AC tidak dingin, perlu service', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', propertyId: '1', expenseDate: '2026-01-08', expenseType: 'gallon', amount: 20000, providerName: 'Aqua', description: 'Pengiriman galon bulanan', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '3', propertyId: '1', roomId: '1', expenseDate: '2026-01-10', expenseType: 'room_repair', amount: 300000, providerName: 'Tukang Bangunan Yanto', description: 'Perbaikan keramik kamar mandi', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '4', propertyId: '1', expenseDate: '2026-01-12', expenseType: 'gas', amount: 150000, providerName: 'Pertamina', description: 'Tabung gas 3kg x 5', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '5', propertyId: '1', roomId: '2', expenseDate: '2026-01-15', expenseType: 'ac_cleaning', amount: 75000, providerName: 'Clean AC Service', description: 'Pembersihan AC rutin', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '6', propertyId: '1', expenseDate: '2026-01-18', expenseType: 'electricity', amount: 1200000, providerName: 'PLN', description: 'Tagihan listrik Januari 2026', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '7', propertyId: '1', expenseDate: '2026-01-20', expenseType: 'water', amount: 300000, providerName: 'PDAM', description: 'Tagihan air Januari 2026', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '8', propertyId: '1', expenseDate: '2026-01-22', expenseType: 'internet', amount: 500000, providerName: 'Biznet', description: 'Paket internet bulanan', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '9', propertyId: '1', expenseDate: '2026-01-25', expenseType: 'staff_salary', amount: 3000000, providerName: 'Penjaga Kos', description: 'Gaji penjaga bulan Januari', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
      laundryOrders: [
        { id: '1', tenantId: '1', propertyId: '1', roomId: '1', orderDate: '2026-01-03', completionDate: '2026-01-04', weightKg: 5, pricePerKg: 9000, serviceType: 'wash_and_dry', totalPrice: 45000, status: 'completed', recordedBy: '1', completedBy: '1', completedAt: '2026-01-04', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', tenantId: '2', propertyId: '1', roomId: '2', orderDate: '2026-01-08', completionDate: '2026-01-09', weightKg: 3, pricePerKg: 9000, serviceType: 'wash_and_dry', totalPrice: 27000, status: 'completed', recordedBy: '1', completedBy: '1', completedAt: '2026-01-09', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '3', tenantId: '3', propertyId: '1', roomId: '4', orderDate: '2026-01-15', completionDate: '2026-01-16', weightKg: 4, pricePerKg: 9000, serviceType: 'wash_and_dry', totalPrice: 36000, status: 'completed', recordedBy: '1', completedBy: '1', completedAt: '2026-01-16', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '4', tenantId: '4', propertyId: '1', roomId: '6', orderDate: '2026-01-20', completionDate: '2026-01-21', weightKg: 6, pricePerKg: 9000, serviceType: 'wash_and_dry', totalPrice: 54000, status: 'completed', recordedBy: '1', completedBy: '1', completedAt: '2026-01-21', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '5', tenantId: '5', propertyId: '2', roomId: '11', orderDate: '2026-01-25', weightKg: 8, pricePerKg: 9000, serviceType: 'wash_and_dry', totalPrice: 72000, status: 'in_progress', recordedBy: '1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
      maintenanceRequests: [
        { id: '1', tenantId: '1', roomId: '1', propertyId: '1', requestDate: '2026-01-05', issueType: 'ac', description: 'AC tidak dingin, perlu service', priority: 'high', status: 'completed', cost: 150000, actualCompletion: '2026-01-06', technicianName: 'Pak Yanto', technicianContact: '081234567800', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', tenantId: '2', roomId: '2', propertyId: '1', requestDate: '2026-01-10', issueType: 'plumbing', description: 'Keran air bocor', priority: 'medium', status: 'completed', cost: 75000, actualCompletion: '2026-01-11', technicianName: 'Pak Budi', technicianContact: '081234567801', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '3', roomId: '5', propertyId: '1', requestDate: '2026-01-12', issueType: 'painting', description: 'Dinding perlu dicat ulang', priority: 'low', status: 'in_progress', cost: 500000, estimatedCompletion: '2026-01-20', technicianName: 'Pak Surya', technicianContact: '081234567802', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '4', tenantId: '3', roomId: '4', propertyId: '1', requestDate: '2026-01-18', issueType: 'electrical', description: 'Lampu kamar mati', priority: 'medium', status: 'reported', cost: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
      acCleaningSchedules: [
        { id: '1', roomId: '1', propertyId: '1', acUnitId: 'AC-101', lastCleaningDate: '2025-07-15', nextCleaningDate: '2026-01-15', scheduleIntervalDays: 180, status: 'pending', cost: 75000, reminderSent: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', roomId: '2', propertyId: '1', acUnitId: 'AC-102', lastCleaningDate: '2025-07-10', nextCleaningDate: '2026-01-10', scheduleIntervalDays: 180, status: 'completed', completedDate: '2026-01-10', cost: 75000, technicianName: 'Budi', reminderSent: true, reminderSentAt: '2026-01-03', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '3', roomId: '4', propertyId: '1', acUnitId: 'AC-104', lastCleaningDate: '2025-08-05', nextCleaningDate: '2026-02-05', scheduleIntervalDays: 180, status: 'pending', cost: 75000, reminderSent: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '4', roomId: '6', propertyId: '1', acUnitId: 'AC-201', lastCleaningDate: '2025-07-12', nextCleaningDate: '2026-01-12', scheduleIntervalDays: 180, status: 'pending', cost: 75000, reminderSent: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '5', roomId: '7', propertyId: '1', acUnitId: 'AC-202', lastCleaningDate: '2025-07-18', nextCleaningDate: '2026-01-18', scheduleIntervalDays: 180, status: 'pending', cost: 75000, reminderSent: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
      notifications: [
        { id: '1', userId: '1', title: 'Pembayaran Diterima', message: 'Pembayaran dari Ahmad Fauzi telah diterima', type: 'payment', isRead: false, createdAt: new Date().toISOString() },
        { id: '2', userId: '1', title: 'Jadwal AC Cleaning', message: 'AC kamar 102 telah selesai dibersihkan', type: 'ac_schedule', isRead: false, createdAt: new Date().toISOString() },
        { id: '3', userId: '1', title: 'Maintenance Request', message: 'Lampu kamar 104 perlu perbaikan', type: 'maintenance', isRead: true, createdAt: new Date().toISOString() },
        { id: '4', userId: '1', title: 'Pembayaran Tertunda', message: 'Eka Wijaya memiliki pembayaran tertunda', type: 'payment', isRead: false, createdAt: new Date().toISOString() },
      ],
      settings: {
        businessName: 'Kos Ana Management',
        businessEmail: 'admin@kosana.id',
        businessPhone: '081234567890',
        businessAddress: 'Jl. Kebayoran Lama No. 45',
        timezone: 'WIB',
        language: 'id',
        currency: 'IDR',
        lateFeePercentage: 5,
        gracePeriod: 3,
        qrisProvider: 'xendit',
        whatsappProvider: '360dialog',
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Read database
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

// Write database
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Initialize database
initDatabase();

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  const db = readDB();
  const totalProperties = db.properties.length;
  const totalRooms = db.rooms.length;
  const occupiedRooms = db.rooms.filter(r => r.status === 'occupied').length;
  const vacantRooms = db.rooms.filter(r => r.status === 'available').length;
  const totalTenants = db.tenants.filter(t => t.status === 'active').length;
  const monthlyRevenue = db.payments
    .filter(p => p.paymentStatus === 'paid' && p.paymentPeriod === '2026-01')
    .reduce((sum, p) => sum + p.totalAmount, 0);
  const monthlyExpenses = db.expenses
    .filter(e => e.expenseDate.startsWith('2026-01'))
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingPayments = db.payments.filter(p => p.paymentStatus === 'pending').length;
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  res.json({
    totalProperties,
    totalRooms,
    occupiedRooms,
    vacantRooms,
    totalTenants,
    monthlyRevenue,
    monthlyExpenses,
    pendingPayments,
    occupancyRate: Math.round(occupancyRate * 10) / 10
  });
});

// ==================== PROPERTIES ====================
app.get('/api/properties', (req, res) => {
  const db = readDB();
  res.json(db.properties);
});

app.get('/api/properties/:id', (req, res) => {
  const db = readDB();
  const property = db.properties.find(p => p.id === req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  res.json(property);
});

app.post('/api/properties', (req, res) => {
  const db = readDB();
  const newProperty = {
    id: uuidv4(),
    ...req.body,
    totalFloors: 0,
    totalRooms: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.properties.push(newProperty);
  writeDB(db);
  res.status(201).json(newProperty);
});

app.put('/api/properties/:id', (req, res) => {
  const db = readDB();
  const index = db.properties.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Property not found' });
  db.properties[index] = { ...db.properties[index], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  res.json(db.properties[index]);
});

app.delete('/api/properties/:id', (req, res) => {
  const db = readDB();
  db.properties = db.properties.filter(p => p.id !== req.params.id);
  writeDB(db);
  res.json({ message: 'Property deleted' });
});

// ==================== ROOMS ====================
app.get('/api/rooms', (req, res) => {
  const db = readDB();
  const { propertyId } = req.query;
  let rooms = db.rooms;
  if (propertyId) {
    rooms = rooms.filter(r => r.propertyId === propertyId);
  }
  res.json(rooms);
});

app.get('/api/rooms/:id', (req, res) => {
  const db = readDB();
  const room = db.rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

app.post('/api/rooms', (req, res) => {
  const db = readDB();
  const newRoom = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.rooms.push(newRoom);
  writeDB(db);
  res.status(201).json(newRoom);
});

app.put('/api/rooms/:id', (req, res) => {
  const db = readDB();
  const index = db.rooms.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Room not found' });
  db.rooms[index] = { ...db.rooms[index], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  res.json(db.rooms[index]);
});

app.delete('/api/rooms/:id', (req, res) => {
  const db = readDB();
  db.rooms = db.rooms.filter(r => r.id !== req.params.id);
  writeDB(db);
  res.json({ message: 'Room deleted' });
});

// ==================== TENANTS ====================
app.get('/api/tenants', (req, res) => {
  const db = readDB();
  const { status } = req.query;
  let tenants = db.tenants;
  if (status) {
    tenants = tenants.filter(t => t.status === status);
  }
  res.json(tenants);
});

app.get('/api/tenants/:id', (req, res) => {
  const db = readDB();
  const tenant = db.tenants.find(t => t.id === req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  res.json(tenant);
});

app.post('/api/tenants', (req, res) => {
  const db = readDB();
  const newTenant = {
    id: uuidv4(),
    ...req.body,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.tenants.push(newTenant);
  
  // Update room status to occupied
  const roomIndex = db.rooms.findIndex(r => r.id === newTenant.roomId);
  if (roomIndex !== -1) {
    db.rooms[roomIndex].status = 'occupied';
    db.rooms[roomIndex].updatedAt = new Date().toISOString();
  }
  
  writeDB(db);
  res.status(201).json(newTenant);
});

app.put('/api/tenants/:id', (req, res) => {
  const db = readDB();
  const index = db.tenants.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Tenant not found' });
  db.tenants[index] = { ...db.tenants[index], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  res.json(db.tenants[index]);
});

app.delete('/api/tenants/:id', (req, res) => {
  const db = readDB();
  db.tenants = db.tenants.filter(t => t.id !== req.params.id);
  writeDB(db);
  res.json({ message: 'Tenant deleted' });
});

// ==================== PAYMENTS ====================
app.get('/api/payments', (req, res) => {
  const db = readDB();
  const { status, tenantId } = req.query;
  let payments = db.payments;
  if (status) payments = payments.filter(p => p.paymentStatus === status);
  if (tenantId) payments = payments.filter(p => p.tenantId === tenantId);
  res.json(payments);
});

app.get('/api/payments/:id', (req, res) => {
  const db = readDB();
  const payment = db.payments.find(p => p.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  res.json(payment);
});

app.post('/api/payments', (req, res) => {
  const db = readDB();
  const newPayment = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.payments.push(newPayment);
  writeDB(db);
  res.status(201).json(newPayment);
});

app.put('/api/payments/:id', (req, res) => {
  const db = readDB();
  const index = db.payments.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Payment not found' });
  db.payments[index] = { ...db.payments[index], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  res.json(db.payments[index]);
});

app.delete('/api/payments/:id', (req, res) => {
  const db = readDB();
  db.payments = db.payments.filter(p => p.id !== req.params.id);
  writeDB(db);
  res.json({ message: 'Payment deleted' });
});

// Mark payment as paid
app.post('/api/payments/:id/mark-paid', (req, res) => {
  const db = readDB();
  const index = db.payments.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Payment not found' });
  db.payments[index].paymentStatus = 'paid';
  db.payments[index].paymentDate = new Date().toISOString().split('T')[0];
  db.payments[index].paidAt = new Date().toISOString();
  db.payments[index].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(db.payments[index]);
});

// ==================== EXPENSES ====================
app.get('/api/expenses', (req, res) => {
  const db = readDB();
  const { propertyId, category } = req.query;
  let expenses = db.expenses;
  if (propertyId) expenses = expenses.filter(e => e.propertyId === propertyId);
  if (category) expenses = expenses.filter(e => e.expenseType === category);
  res.json(expenses);
});

app.get('/api/expenses/:id', (req, res) => {
  const db = readDB();
  const expense = db.expenses.find(e => e.id === req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json(expense);
});

app.post('/api/expenses', (req, res) => {
  const db = readDB();
  const newExpense = {
    id: uuidv4(),
    ...req.body,
    approvalStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.expenses.push(newExpense);
  writeDB(db);
  res.status(201).json(newExpense);
});

app.put('/api/expenses/:id', (req, res) => {
  const db = readDB();
  const index = db.expenses.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Expense not found' });
  db.expenses[index] = { ...db.expenses[index], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  res.json(db.expenses[index]);
});

app.delete('/api/expenses/:id', (req, res) => {
  const db = readDB();
  db.expenses = db.expenses.filter(e => e.id !== req.params.id);
  writeDB(db);
  res.json({ message: 'Expense deleted' });
});

// ==================== LAUNDRY ====================
app.get('/api/laundry', (req, res) => {
  const db = readDB();
  const { status } = req.query;
  let orders = db.laundryOrders;
  if (status) orders = orders.filter(o => o.status === status);
  res.json(orders);
});

app.get('/api/laundry/:id', (req, res) => {
  const db = readDB();
  const order = db.laundryOrders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Laundry order not found' });
  res.json(order);
});

app.post('/api/laundry', (req, res) => {
  const db = readDB();
  const newOrder = {
    id: uuidv4(),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.laundryOrders.push(newOrder);
  writeDB(db);
  res.status(201).json(newOrder);
});

app.put('/api/laundry/:id', (req, res) => {
  const db = readDB();
  const index = db.laundryOrders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Laundry order not found' });
  db.laundryOrders[index] = { ...db.laundryOrders[index], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  res.json(db.laundryOrders[index]);
});

app.delete('/api/laundry/:id', (req, res) => {
  const db = readDB();
  db.laundryOrders = db.laundryOrders.filter(o => o.id !== req.params.id);
  writeDB(db);
  res.json({ message: 'Laundry order deleted' });
});

// Mark laundry as completed
app.post('/api/laundry/:id/complete', (req, res) => {
  const db = readDB();
  const index = db.laundryOrders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Laundry order not found' });
  db.laundryOrders[index].status = 'completed';
  db.laundryOrders[index].completionDate = new Date().toISOString().split('T')[0];
  db.laundryOrders[index].completedAt = new Date().toISOString();
  db.laundryOrders[index].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(db.laundryOrders[index]);
});

// ==================== MAINTENANCE ====================
app.get('/api/maintenance', (req, res) => {
  const db = readDB();
  const { status } = req.query;
  let requests = db.maintenanceRequests;
  if (status) requests = requests.filter(r => r.status === status);
  res.json(requests);
});

app.get('/api/maintenance/:id', (req, res) => {
  const db = readDB();
  const request = db.maintenanceRequests.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Maintenance request not found' });
  res.json(request);
});

app.post('/api/maintenance', (req, res) => {
  const db = readDB();
  const newRequest = {
    id: uuidv4(),
    ...req.body,
    status: 'reported',
    cost: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.maintenanceRequests.push(newRequest);
  writeDB(db);
  res.status(201).json(newRequest);
});

app.put('/api/maintenance/:id', (req, res) => {
  const db = readDB();
  const index = db.maintenanceRequests.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Maintenance request not found' });
  db.maintenanceRequests[index] = { ...db.maintenanceRequests[index], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  res.json(db.maintenanceRequests[index]);
});

app.delete('/api/maintenance/:id', (req, res) => {
  const db = readDB();
  db.maintenanceRequests = db.maintenanceRequests.filter(r => r.id !== req.params.id);
  writeDB(db);
  res.json({ message: 'Maintenance request deleted' });
});

// Mark maintenance as completed
app.post('/api/maintenance/:id/complete', (req, res) => {
  const db = readDB();
  const index = db.maintenanceRequests.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Maintenance request not found' });
  db.maintenanceRequests[index].status = 'completed';
  db.maintenanceRequests[index].actualCompletion = new Date().toISOString().split('T')[0];
  db.maintenanceRequests[index].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(db.maintenanceRequests[index]);
});

// ==================== AC CLEANING ====================
app.get('/api/ac-cleaning', (req, res) => {
  const db = readDB();
  const { status } = req.query;
  let schedules = db.acCleaningSchedules;
  if (status) schedules = schedules.filter(s => s.status === status);
  res.json(schedules);
});

app.get('/api/ac-cleaning/:id', (req, res) => {
  const db = readDB();
  const schedule = db.acCleaningSchedules.find(s => s.id === req.params.id);
  if (!schedule) return res.status(404).json({ error: 'AC cleaning schedule not found' });
  res.json(schedule);
});

app.post('/api/ac-cleaning', (req, res) => {
  const db = readDB();
  const newSchedule = {
    id: uuidv4(),
    ...req.body,
    status: 'pending',
    reminderSent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.acCleaningSchedules.push(newSchedule);
  writeDB(db);
  res.status(201).json(newSchedule);
});

app.put('/api/ac-cleaning/:id', (req, res) => {
  const db = readDB();
  const index = db.acCleaningSchedules.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'AC cleaning schedule not found' });
  db.acCleaningSchedules[index] = { ...db.acCleaningSchedules[index], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  res.json(db.acCleaningSchedules[index]);
});

app.delete('/api/ac-cleaning/:id', (req, res) => {
  const db = readDB();
  db.acCleaningSchedules = db.acCleaningSchedules.filter(s => s.id !== req.params.id);
  writeDB(db);
  res.json({ message: 'AC cleaning schedule deleted' });
});

// Mark AC cleaning as completed
app.post('/api/ac-cleaning/:id/complete', (req, res) => {
  const db = readDB();
  const index = db.acCleaningSchedules.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'AC cleaning schedule not found' });
  db.acCleaningSchedules[index].status = 'completed';
  db.acCleaningSchedules[index].completedDate = new Date().toISOString().split('T')[0];
  db.acCleaningSchedules[index].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(db.acCleaningSchedules[index]);
});

// ==================== NOTIFICATIONS ====================
app.get('/api/notifications', (req, res) => {
  const db = readDB();
  res.json(db.notifications);
});

app.post('/api/notifications', (req, res) => {
  const db = readDB();
  const newNotification = {
    id: uuidv4(),
    ...req.body,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  db.notifications.push(newNotification);
  writeDB(db);
  res.status(201).json(newNotification);
});

app.put('/api/notifications/:id/read', (req, res) => {
  const db = readDB();
  const index = db.notifications.findIndex(n => n.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Notification not found' });
  db.notifications[index].isRead = true;
  db.notifications[index].readAt = new Date().toISOString();
  writeDB(db);
  res.json(db.notifications[index]);
});

// ==================== SETTINGS ====================
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json(db.settings);
});

app.put('/api/settings', (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  res.json(db.settings);
});

// ==================== REPORTS ====================
app.get('/api/reports/revenue', (req, res) => {
  const db = readDB();
  const months = ['Agu', 'Sep', 'Okt', 'Nov', 'Des', 'Jan'];
  const data = months.map((month, i) => ({
    month,
    roomRevenue: 72000000 + (i * 1200000),
    laundryRevenue: 250000 + (i * 10000),
    totalRevenue: 72250000 + (i * 1210000)
  }));
  res.json(data);
});

app.get('/api/reports/occupancy', (req, res) => {
  const db = readDB();
  const months = ['Agu', 'Sep', 'Okt', 'Nov', 'Des', 'Jan'];
  const data = months.map((month, i) => ({
    month,
    occupied: 38 + i,
    vacant: 7 - Math.floor(i / 2),
    rate: 84.4 + (i * 0.6)
  }));
  res.json(data);
});

app.get('/api/reports/expenses-by-category', (req, res) => {
  const db = readDB();
  const categories = [
    { category: 'Listrik', amount: 1200000 },
    { category: 'Gaji Staff', amount: 3000000 },
    { category: 'Internet', amount: 500000 },
    { category: 'Air', amount: 300000 },
    { category: 'Perbaikan', amount: 450000 },
    { category: 'Lainnya', amount: 395000 },
  ];
  const total = categories.reduce((sum, c) => sum + c.amount, 0);
  const data = categories.map(c => ({
    ...c,
    percentage: Math.round((c.amount / total) * 100 * 10) / 10
  }));
  res.json(data);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Kos Ana API Server running on port ${PORT}`);
  console.log(`📊 API URL: http://localhost:${PORT}/api`);
  console.log(`💾 Database: ${DB_FILE}`);
});
