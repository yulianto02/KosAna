import type { 
  User, Property, Room, Tenant, Payment, Expense, 
  LaundryOrder, MaintenanceRequest, ACCleaningSchedule,
  DashboardStats, Notification, MonthlyRevenueData, 
  OccupancyData, ExpenseByCategory, RoomMedia, TenantVehicle
} from '@/types';

// Current User
export const currentUser: User = {
  id: '1',
  username: 'admin',
  email: 'admin@kosana.id',
  phone: '081234567890',
  fullName: 'Administrator',
  role: 'admin',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  lastLogin: new Date(),
};

// Properties
export const properties: Property[] = [
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
    amenities: {
      wifi: true,
      ac: true,
      hotWater: true,
      parking: true,
      cctv: true,
    },
    rules: 'Dilarang merokok di kamar. Jam malam 22:00. Tamu harus lapor.',
    status: 'active',
    propertyPhotos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
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
    amenities: {
      wifi: true,
      ac: true,
      hotWater: true,
      parking: true,
      cctv: true,
    },
    rules: 'Dilarang membawa tamu laki-laki. Jam malam 21:00.',
    status: 'active',
    propertyPhotos: [
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800',
    ],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date(),
  },
];

// Rooms
export const rooms: Room[] = [
  // Property 1 - Floor 1
  { id: '1', propertyId: '1', roomNumber: '101', floor: 1, roomType: 'standard', sizeSqm: 12, occupancyType: 'double', baseMonthlyRent: 2000000, additionalPersonFee: 500000, amenities: { ac: true, privateBathroom: true, balcony: false, window: true }, status: 'occupied', acUnitId: 'AC-101', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', propertyId: '1', roomNumber: '102', floor: 1, roomType: 'deluxe', sizeSqm: 16, occupancyType: 'single', baseMonthlyRent: 2500000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: true, balcony: true, window: true }, status: 'occupied', acUnitId: 'AC-102', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', propertyId: '1', roomNumber: '103', floor: 1, roomType: 'standard', sizeSqm: 12, occupancyType: 'single', baseMonthlyRent: 1800000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: false, balcony: false, window: true }, status: 'available', acUnitId: 'AC-103', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', propertyId: '1', roomNumber: '104', floor: 1, roomType: 'premium', sizeSqm: 20, occupancyType: 'single', baseMonthlyRent: 3000000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: true, balcony: true, window: true }, status: 'occupied', acUnitId: 'AC-104', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', propertyId: '1', roomNumber: '105', floor: 1, roomType: 'standard', sizeSqm: 12, occupancyType: 'single', baseMonthlyRent: 1800000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: false, balcony: false, window: true }, status: 'maintenance', acUnitId: 'AC-105', createdAt: new Date(), updatedAt: new Date() },
  // Property 1 - Floor 2
  { id: '6', propertyId: '1', roomNumber: '201', floor: 2, roomType: 'standard', sizeSqm: 12, occupancyType: 'single', baseMonthlyRent: 1900000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: false, balcony: false, window: true }, status: 'occupied', acUnitId: 'AC-201', createdAt: new Date(), updatedAt: new Date() },
  { id: '7', propertyId: '1', roomNumber: '202', floor: 2, roomType: 'deluxe', sizeSqm: 16, occupancyType: 'double', baseMonthlyRent: 2400000, additionalPersonFee: 500000, amenities: { ac: true, privateBathroom: true, balcony: true, window: true }, status: 'occupied', acUnitId: 'AC-202', createdAt: new Date(), updatedAt: new Date() },
  { id: '8', propertyId: '1', roomNumber: '203', floor: 2, roomType: 'standard', sizeSqm: 12, occupancyType: 'single', baseMonthlyRent: 1900000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: false, balcony: false, window: true }, status: 'available', acUnitId: 'AC-203', createdAt: new Date(), updatedAt: new Date() },
  { id: '9', propertyId: '1', roomNumber: '204', floor: 2, roomType: 'standard', sizeSqm: 12, occupancyType: 'single', baseMonthlyRent: 1900000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: false, balcony: false, window: true }, status: 'occupied', acUnitId: 'AC-204', createdAt: new Date(), updatedAt: new Date() },
  { id: '10', propertyId: '1', roomNumber: '205', floor: 2, roomType: 'premium', sizeSqm: 22, occupancyType: 'single', baseMonthlyRent: 3200000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: true, balcony: true, window: true }, status: 'reserved', acUnitId: 'AC-205', createdAt: new Date(), updatedAt: new Date() },
  // Property 2
  { id: '11', propertyId: '2', roomNumber: '101', floor: 1, roomType: 'standard', sizeSqm: 14, occupancyType: 'single', baseMonthlyRent: 2200000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: true, balcony: false, window: true }, status: 'occupied', acUnitId: 'AC-101', createdAt: new Date(), updatedAt: new Date() },
  { id: '12', propertyId: '2', roomNumber: '102', floor: 1, roomType: 'deluxe', sizeSqm: 18, occupancyType: 'single', baseMonthlyRent: 2800000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: true, balcony: true, window: true }, status: 'occupied', acUnitId: 'AC-102', createdAt: new Date(), updatedAt: new Date() },
  { id: '13', propertyId: '2', roomNumber: '103', floor: 1, roomType: 'standard', sizeSqm: 14, occupancyType: 'single', baseMonthlyRent: 2200000, additionalPersonFee: 0, amenities: { ac: true, privateBathroom: true, balcony: false, window: true }, status: 'available', acUnitId: 'AC-103', createdAt: new Date(), updatedAt: new Date() },
];

// Room Media
export const roomMedia: RoomMedia[] = [
  { id: '1', roomId: '1', propertyId: '1', imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400', imageType: 'room', isTemplate: false, displayOrder: 1, uploadedBy: '1', createdAt: new Date() },
  { id: '2', roomId: '1', propertyId: '1', imageUrl: 'https://images.unsplash.com/photo-1620626012053-1f0c8b79c2d9?w=400', imageType: 'bathroom', isTemplate: false, displayOrder: 2, uploadedBy: '1', createdAt: new Date() },
  { id: '3', roomId: '2', propertyId: '1', imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400', imageType: 'room', isTemplate: false, displayOrder: 1, uploadedBy: '1', createdAt: new Date() },
  { id: '4', roomId: '2', propertyId: '1', imageUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400', imageType: 'balcony', isTemplate: false, displayOrder: 2, uploadedBy: '1', createdAt: new Date() },
];

// Tenants
export const tenants: Tenant[] = [
  {
    id: '1',
    propertyId: '1',
    roomId: '1',
    fullName: 'Ahmad Fauzi',
    phone: '081234567801',
    email: 'ahmad.fauzi@email.com',
    emergencyContact: 'Bapak Fauzi',
    emergencyPhone: '081234567811',
    ktpNumber: '3171012345678901',
    ktpImageUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400',
    checkInDate: new Date('2025-01-01'),
    contractDurationMonths: 12,
    baseMonthlyRent: 2000000,
    additionalPersonFee: 500000,
    totalMonthlyRent: 2500000,
    securityDeposit: 2500000,
    lateFeePercentage: 5,
    paymentDueDay: 1,
    isSharedRoom: true,
    secondaryTenantName: 'Budi Santoso',
    secondaryTenantPhone: '081234567802',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    propertyId: '1',
    roomId: '2',
    fullName: 'Citra Dewi',
    phone: '081234567803',
    email: 'citra.dewi@email.com',
    emergencyContact: 'Ibu Dewi',
    emergencyPhone: '081234567813',
    ktpNumber: '3171012345678903',
    ktpImageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    checkInDate: new Date('2025-01-15'),
    contractDurationMonths: 6,
    baseMonthlyRent: 2500000,
    additionalPersonFee: 0,
    totalMonthlyRent: 2500000,
    securityDeposit: 2500000,
    lateFeePercentage: 5,
    paymentDueDay: 15,
    isSharedRoom: false,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    propertyId: '1',
    roomId: '4',
    fullName: 'Dedi Pratama',
    phone: '081234567805',
    email: 'dedi.pratama@email.com',
    emergencyContact: 'Bapak Pratama',
    emergencyPhone: '081234567815',
    ktpNumber: '3171012345678905',
    ktpImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    checkInDate: new Date('2025-02-01'),
    contractDurationMonths: 12,
    baseMonthlyRent: 3000000,
    additionalPersonFee: 0,
    totalMonthlyRent: 3000000,
    securityDeposit: 3000000,
    lateFeePercentage: 5,
    paymentDueDay: 1,
    isSharedRoom: false,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    propertyId: '1',
    roomId: '6',
    fullName: 'Eka Wijaya',
    phone: '081234567807',
    email: 'eka.wijaya@email.com',
    emergencyContact: 'Ibu Wijaya',
    emergencyPhone: '081234567817',
    ktpNumber: '3171012345678907',
    ktpImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    checkInDate: new Date('2025-01-10'),
    contractDurationMonths: 6,
    baseMonthlyRent: 1900000,
    additionalPersonFee: 0,
    totalMonthlyRent: 1900000,
    securityDeposit: 1900000,
    lateFeePercentage: 5,
    paymentDueDay: 10,
    isSharedRoom: false,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    propertyId: '2',
    roomId: '11',
    fullName: 'Fani Susanti',
    phone: '081234567809',
    email: 'fani.susanti@email.com',
    emergencyContact: 'Bapak Susanti',
    emergencyPhone: '081234567819',
    ktpNumber: '3171012345678909',
    ktpImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    checkInDate: new Date('2025-01-05'),
    contractDurationMonths: 12,
    baseMonthlyRent: 2200000,
    additionalPersonFee: 0,
    totalMonthlyRent: 2200000,
    securityDeposit: 2200000,
    lateFeePercentage: 5,
    paymentDueDay: 5,
    isSharedRoom: false,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Tenant Vehicles
export const tenantVehicles: TenantVehicle[] = [
  { id: '1', tenantId: '1', roomId: '1', propertyId: '1', vehicleType: 'motorbike', licensePlate: 'B 1234 ABC', vehicleBrand: 'Honda', vehicleColor: 'Hitam', parkingSpot: 'P-01', parkingType: 'motorbike_area', isActive: true, registeredAt: new Date() },
  { id: '2', tenantId: '2', roomId: '2', propertyId: '1', vehicleType: 'car', licensePlate: 'B 5678 DEF', vehicleBrand: 'Toyota', vehicleColor: 'Silver', parkingSpot: 'P-05', parkingType: 'car_area', isActive: true, registeredAt: new Date() },
  { id: '3', tenantId: '3', roomId: '4', propertyId: '1', vehicleType: 'motorbike', licensePlate: 'B 9012 GHI', vehicleBrand: 'Yamaha', vehicleColor: 'Merah', parkingSpot: 'P-02', parkingType: 'motorbike_area', isActive: true, registeredAt: new Date() },
];

// Payments
export const payments: Payment[] = [
  { id: '1', tenantId: '1', roomId: '1', propertyId: '1', paymentPeriod: '2026-01', baseAmount: 2000000, additionalPersonFee: 500000, lateFee: 0, laundryAmount: 135000, totalAmount: 2635000, paymentMethod: 'qris', paymentStatus: 'paid', paymentDate: new Date('2026-01-01'), dueDate: new Date('2026-01-01'), paidAt: new Date('2026-01-01'), createdAt: new Date(), updatedAt: new Date() },
  { id: '2', tenantId: '2', roomId: '2', propertyId: '1', paymentPeriod: '2026-01', baseAmount: 2500000, additionalPersonFee: 0, lateFee: 0, laundryAmount: 81000, totalAmount: 2581000, paymentMethod: 'qris', paymentStatus: 'paid', paymentDate: new Date('2026-01-15'), dueDate: new Date('2026-01-15'), paidAt: new Date('2026-01-15'), createdAt: new Date(), updatedAt: new Date() },
  { id: '3', tenantId: '3', roomId: '4', propertyId: '1', paymentPeriod: '2026-01', baseAmount: 3000000, additionalPersonFee: 0, lateFee: 0, laundryAmount: 108000, totalAmount: 3108000, paymentMethod: 'qris', paymentStatus: 'paid', paymentDate: new Date('2026-02-01'), dueDate: new Date('2026-02-01'), paidAt: new Date('2026-02-01'), createdAt: new Date(), updatedAt: new Date() },
  { id: '4', tenantId: '4', roomId: '6', propertyId: '1', paymentPeriod: '2026-01', baseAmount: 1900000, additionalPersonFee: 0, lateFee: 95000, laundryAmount: 54000, totalAmount: 2049000, paymentMethod: 'qris', paymentStatus: 'pending', dueDate: new Date('2026-01-10'), createdAt: new Date(), updatedAt: new Date() },
  { id: '5', tenantId: '5', roomId: '11', propertyId: '2', paymentPeriod: '2026-01', baseAmount: 2200000, additionalPersonFee: 0, lateFee: 0, laundryAmount: 72000, totalAmount: 2272000, paymentMethod: 'qris', paymentStatus: 'paid', paymentDate: new Date('2026-01-05'), dueDate: new Date('2026-01-05'), paidAt: new Date('2026-01-05'), createdAt: new Date(), updatedAt: new Date() },
];

// Expenses
export const expenses: Expense[] = [
  { id: '1', propertyId: '1', roomId: '5', expenseDate: new Date('2026-01-05'), expenseType: 'ac_repair', amount: 150000, providerName: 'Service AC Jaya', description: 'AC tidak dingin, perlu service', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', propertyId: '1', expenseDate: new Date('2026-01-08'), expenseType: 'gallon', amount: 20000, providerName: 'Aqua', description: 'Pengiriman galon bulanan', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', propertyId: '1', roomId: '1', expenseDate: new Date('2026-01-10'), expenseType: 'room_repair', amount: 300000, providerName: 'Tukang Bangunan Yanto', description: 'Perbaikan keramik kamar mandi', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', propertyId: '1', expenseDate: new Date('2026-01-12'), expenseType: 'gas', amount: 150000, providerName: 'Pertamina', description: 'Tabung gas 3kg x 5', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', propertyId: '1', roomId: '2', expenseDate: new Date('2026-01-15'), expenseType: 'ac_cleaning', amount: 75000, providerName: 'Clean AC Service', description: 'Pembersihan AC rutin', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date(), updatedAt: new Date() },
  { id: '6', propertyId: '1', expenseDate: new Date('2026-01-18'), expenseType: 'electricity', amount: 1200000, providerName: 'PLN', description: 'Tagihan listrik Januari 2026', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date(), updatedAt: new Date() },
  { id: '7', propertyId: '1', expenseDate: new Date('2026-01-20'), expenseType: 'water', amount: 300000, providerName: 'PDAM', description: 'Tagihan air Januari 2026', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date(), updatedAt: new Date() },
  { id: '8', propertyId: '1', expenseDate: new Date('2026-01-22'), expenseType: 'internet', amount: 500000, providerName: 'Biznet', description: 'Paket internet bulanan', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date(), updatedAt: new Date() },
  { id: '9', propertyId: '1', expenseDate: new Date('2026-01-25'), expenseType: 'staff_salary', amount: 3000000, providerName: 'Penjaga Kos', description: 'Gaji penjaga bulan Januari', approvalStatus: 'approved', reportedBy: '1', createdAt: new Date(), updatedAt: new Date() },
];

// Laundry Orders
export const laundryOrders: LaundryOrder[] = [
  { id: '1', tenantId: '1', propertyId: '1', roomId: '1', orderDate: new Date('2026-01-03'), completionDate: new Date('2026-01-04'), weightKg: 5, pricePerKg: 9000, serviceType: 'wash_and_dry', totalPrice: 45000, status: 'completed', recordedBy: '1', completedBy: '1', completedAt: new Date('2026-01-04'), createdAt: new Date(), updatedAt: new Date() },
  { id: '2', tenantId: '2', propertyId: '1', roomId: '2', orderDate: new Date('2026-01-08'), completionDate: new Date('2026-01-09'), weightKg: 3, pricePerKg: 9000, serviceType: 'wash_and_dry', totalPrice: 27000, status: 'completed', recordedBy: '1', completedBy: '1', completedAt: new Date('2026-01-09'), createdAt: new Date(), updatedAt: new Date() },
  { id: '3', tenantId: '3', propertyId: '1', roomId: '4', orderDate: new Date('2026-01-15'), completionDate: new Date('2026-01-16'), weightKg: 4, pricePerKg: 9000, serviceType: 'wash_and_dry', totalPrice: 36000, status: 'completed', recordedBy: '1', completedBy: '1', completedAt: new Date('2026-01-16'), createdAt: new Date(), updatedAt: new Date() },
  { id: '4', tenantId: '4', propertyId: '1', roomId: '6', orderDate: new Date('2026-01-20'), completionDate: new Date('2026-01-21'), weightKg: 6, pricePerKg: 9000, serviceType: 'wash_and_dry', totalPrice: 54000, status: 'completed', recordedBy: '1', completedBy: '1', completedAt: new Date('2026-01-21'), createdAt: new Date(), updatedAt: new Date() },
  { id: '5', tenantId: '5', propertyId: '2', roomId: '11', orderDate: new Date('2026-01-25'), weightKg: 8, pricePerKg: 9000, serviceType: 'wash_and_dry', totalPrice: 72000, status: 'in_progress', recordedBy: '1', createdAt: new Date(), updatedAt: new Date() },
];

// Maintenance Requests
export const maintenanceRequests: MaintenanceRequest[] = [
  { id: '1', tenantId: '1', roomId: '1', propertyId: '1', requestDate: new Date('2026-01-05'), issueType: 'ac', description: 'AC tidak dingin, perlu service', priority: 'high', status: 'completed', cost: 150000, actualCompletion: new Date('2026-01-06'), technicianName: 'Pak Yanto', technicianContact: '081234567800', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', tenantId: '2', roomId: '2', propertyId: '1', requestDate: new Date('2026-01-10'), issueType: 'plumbing', description: 'Keran air bocor', priority: 'medium', status: 'completed', cost: 75000, actualCompletion: new Date('2026-01-11'), technicianName: 'Pak Budi', technicianContact: '081234567801', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', roomId: '5', propertyId: '1', requestDate: new Date('2026-01-12'), issueType: 'painting', description: 'Dinding perlu dicat ulang', priority: 'low', status: 'in_progress', cost: 500000, estimatedCompletion: new Date('2026-01-20'), technicianName: 'Pak Surya', technicianContact: '081234567802', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', tenantId: '3', roomId: '4', propertyId: '1', requestDate: new Date('2026-01-18'), issueType: 'electrical', description: 'Lampu kamar mati', priority: 'medium', status: 'reported', cost: 0, createdAt: new Date(), updatedAt: new Date() },
];

// AC Cleaning Schedule
export const acCleaningSchedules: ACCleaningSchedule[] = [
  { id: '1', roomId: '1', propertyId: '1', acUnitId: 'AC-101', lastCleaningDate: new Date('2025-07-15'), nextCleaningDate: new Date('2026-01-15'), scheduleIntervalDays: 180, status: 'pending', cost: 75000, reminderSent: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', roomId: '2', propertyId: '1', acUnitId: 'AC-102', lastCleaningDate: new Date('2025-07-10'), nextCleaningDate: new Date('2026-01-10'), scheduleIntervalDays: 180, status: 'completed', completedDate: new Date('2026-01-10'), cost: 75000, technicianName: 'Budi', reminderSent: true, reminderSentAt: new Date('2026-01-03'), createdAt: new Date(), updatedAt: new Date() },
  { id: '3', roomId: '4', propertyId: '1', acUnitId: 'AC-104', lastCleaningDate: new Date('2025-08-05'), nextCleaningDate: new Date('2026-02-05'), scheduleIntervalDays: 180, status: 'pending', cost: 75000, reminderSent: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '4', roomId: '6', propertyId: '1', acUnitId: 'AC-201', lastCleaningDate: new Date('2025-07-12'), nextCleaningDate: new Date('2026-01-12'), scheduleIntervalDays: 180, status: 'pending', cost: 75000, reminderSent: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '5', roomId: '7', propertyId: '1', acUnitId: 'AC-202', lastCleaningDate: new Date('2025-07-18'), nextCleaningDate: new Date('2026-01-18'), scheduleIntervalDays: 180, status: 'pending', cost: 75000, reminderSent: false, createdAt: new Date(), updatedAt: new Date() },
];

// Dashboard Stats
export const dashboardStats: DashboardStats = {
  totalProperties: 2,
  totalRooms: 50,
  occupiedRooms: 42,
  vacantRooms: 6,
  totalTenants: 45,
  monthlyRevenue: 78800000,
  monthlyExpenses: 5845000,
  pendingPayments: 1,
  occupancyRate: 87.5,
};

// Notifications
export const notifications: Notification[] = [
  { id: '1', userId: '1', title: 'Pembayaran Diterima', message: 'Pembayaran dari Ahmad Fauzi telah diterima', type: 'payment', isRead: false, createdAt: new Date() },
  { id: '2', userId: '1', title: 'Jadwal AC Cleaning', message: 'AC kamar 102 telah selesai dibersihkan', type: 'ac_schedule', isRead: false, createdAt: new Date() },
  { id: '3', userId: '1', title: 'Maintenance Request', message: 'Lampu kamar 104 perlu perbaikan', type: 'maintenance', isRead: true, createdAt: new Date() },
  { id: '4', userId: '1', title: 'Pembayaran Tertunda', message: 'Eka Wijaya memiliki pembayaran tertunda', type: 'payment', isRead: false, createdAt: new Date() },
];

// Chart Data
export const monthlyRevenueData: MonthlyRevenueData[] = [
  { month: 'Agu', roomRevenue: 72000000, laundryRevenue: 250000, totalRevenue: 72250000 },
  { month: 'Sep', roomRevenue: 74000000, laundryRevenue: 270000, totalRevenue: 74270000 },
  { month: 'Okt', roomRevenue: 75000000, laundryRevenue: 280000, totalRevenue: 75280000 },
  { month: 'Nov', roomRevenue: 76000000, laundryRevenue: 290000, totalRevenue: 76290000 },
  { month: 'Des', roomRevenue: 77000000, laundryRevenue: 295000, totalRevenue: 77295000 },
  { month: 'Jan', roomRevenue: 78000000, laundryRevenue: 300000, totalRevenue: 78300000 },
];

export const occupancyData: OccupancyData[] = [
  { month: 'Agu', occupied: 38, vacant: 7, rate: 84.4 },
  { month: 'Sep', occupied: 39, vacant: 6, rate: 86.7 },
  { month: 'Okt', occupied: 40, vacant: 5, rate: 88.9 },
  { month: 'Nov', occupied: 41, vacant: 5, rate: 89.1 },
  { month: 'Des', occupied: 41, vacant: 5, rate: 89.1 },
  { month: 'Jan', occupied: 42, vacant: 6, rate: 87.5 },
];

export const expenseByCategory: ExpenseByCategory[] = [
  { category: 'Listrik', amount: 1200000, percentage: 20.5 },
  { category: 'Gaji Staff', amount: 3000000, percentage: 51.3 },
  { category: 'Internet', amount: 500000, percentage: 8.6 },
  { category: 'Air', amount: 300000, percentage: 5.1 },
  { category: 'Perbaikan', amount: 450000, percentage: 7.7 },
  { category: 'Lainnya', amount: 395000, percentage: 6.8 },
];
