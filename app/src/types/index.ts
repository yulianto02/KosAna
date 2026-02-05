// User Roles and Authentication
export type UserRole = 'admin' | 'owner' | 'penjaga' | 'tenant';

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  profileImageUrl?: string;
  createdAt: Date;
  lastLogin?: Date;
}

// Property Management
export type PropertyType = 'male' | 'female' | 'mixed';
export type PropertyStatus = 'active' | 'inactive' | 'maintenance';

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  contactPhone: string;
  propertyManagerId: string;
  propertyType: PropertyType;
  totalFloors: number;
  totalRooms: number;
  amenities: {
    wifi: boolean;
    ac: boolean;
    hotWater: boolean;
    parking: boolean;
    cctv: boolean;
  };
  rules?: string;
  status: PropertyStatus;
  floorPlanImages?: string[];
  propertyPhotos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Room Management
export type RoomType = 'standard' | 'deluxe' | 'premium';
export type RoomStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';
export type OccupancyType = 'single' | 'double';

export interface Room {
  id: string;
  propertyId: string;
  roomNumber: string;
  floor: number;
  roomType: RoomType;
  sizeSqm?: number;
  occupancyType: OccupancyType;
  baseMonthlyRent: number;
  additionalPersonFee: number;
  amenities: {
    ac: boolean;
    privateBathroom: boolean;
    balcony: boolean;
    tv: boolean;
    refrigerator: boolean;
    wardrobe: boolean;
    desk: boolean;
    wifi: boolean;
  };
  description?: string;
  status: RoomStatus;
  acUnitId?: string;
  coordinatesX?: number;
  coordinatesY?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomMedia {
  id: string;
  roomId: string;
  propertyId: string;
  imageUrl: string;
  imageType: 'room' | 'bathroom' | 'balcony' | 'view' | 'other';
  isTemplate: boolean;
  displayOrder: number;
  uploadedBy: string;
  createdAt: Date;
}

// Tenant Management
export type TenantStatus = 'active' | 'archived' | 'moved_out';

export interface Tenant {
  id: string;
  userId?: string;
  propertyId: string;
  roomId: string;
  fullName: string;
  phone: string;
  email?: string;
  emergencyContact: string;
  emergencyPhone: string;
  ktpNumber: string;
  ktpImageUrl: string;
  checkInDate: Date;
  checkOutDate?: Date;
  contractDurationMonths: number;
  baseMonthlyRent: number;
  additionalPersonFee: number;
  totalMonthlyRent: number;
  securityDeposit: number;
  lateFeePercentage: number;
  paymentDueDay: number;
  contractFileUrl?: string;
  tenantSignatureUrl?: string;
  adminSignatureUrl?: string;
  isSharedRoom: boolean;
  secondaryTenantName?: string;
  secondaryTenantPhone?: string;
  status: TenantStatus;
  moveOutReason?: string;
  finalSettlementAmount?: number;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantVehicle {
  id: string;
  tenantId: string;
  roomId: string;
  propertyId: string;
  vehicleType: 'none' | 'motorbike' | 'car';
  licensePlate?: string;
  vehicleBrand?: string;
  vehicleColor?: string;
  parkingSpot?: string;
  parkingType?: 'motorbike_area' | 'car_area' | 'shared';
  isActive: boolean;
  registeredAt: Date;
  deregisteredAt?: Date;
}

// Payment Management
export type PaymentMethod = 'qris' | 'bank_transfer' | 'cash';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'refunded';

export interface Payment {
  id: string;
  tenantId: string;
  roomId: string;
  propertyId: string;
  paymentPeriod: string; // Format: YYYY-MM
  baseAmount: number;
  additionalPersonFee: number;
  lateFee: number;
  laundryAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDate?: Date;
  dueDate: Date;
  qrCodeUrl?: string;
  transactionId?: string;
  paymentProofUrl?: string;
  notes?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Expense Management
export type ExpenseType = 
  | 'ac_repair' 
  | 'room_repair' 
  | 'ac_cleaning' 
  | 'gallon' 
  | 'gas' 
  | 'laundry_soap' 
  | 'electricity' 
  | 'water' 
  | 'internet' 
  | 'staff_salary' 
  | 'other';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Expense {
  id: string;
  propertyId: string;
  roomId?: string;
  expenseDate: Date;
  expenseType: ExpenseType;
  amount: number;
  providerName: string;
  description?: string;
  receiptImageUrl?: string;
  reportedBy: string;
  approvedBy?: string;
  approvalStatus: ApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Laundry Management
export type LaundryServiceType = 'wash_only' | 'wash_and_dry' | 'wash_dry_fold';
export type LaundryStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface LaundryOrder {
  id: string;
  tenantId: string;
  propertyId: string;
  roomId: string;
  orderDate: Date;
  completionDate?: Date;
  weightKg?: number;
  itemCount?: number;
  pricePerKg: number;
  serviceType: LaundryServiceType;
  totalPrice: number;
  status: LaundryStatus;
  notes?: string;
  recordedBy: string;
  completedBy?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Maintenance Management
export type IssueType = 'ac' | 'plumbing' | 'electrical' | 'furniture' | 'painting' | 'other';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'reported' | 'in_progress' | 'completed' | 'cancelled';

export interface MaintenanceRequest {
  id: string;
  tenantId?: string;
  roomId: string;
  propertyId: string;
  requestDate: Date;
  issueType: IssueType;
  description: string;
  priority: PriorityLevel;
  status: MaintenanceStatus;
  assignedTo?: string;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  cost: number;
  photos?: string[];
  technicianName?: string;
  technicianContact?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// AC Cleaning Schedule
export type ACScheduleStatus = 'pending' | 'completed' | 'overdue' | 'skipped';

export interface ACCleaningSchedule {
  id: string;
  roomId: string;
  propertyId: string;
  acUnitId?: string;
  lastCleaningDate?: Date;
  nextCleaningDate: Date;
  scheduleIntervalDays: number;
  status: ACScheduleStatus;
  completedDate?: Date;
  technicianName?: string;
  technicianContact?: string;
  cost: number;
  notes?: string;
  completedBy?: string;
  reminderSent: boolean;
  reminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard Stats
export interface DashboardStats {
  totalProperties: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  totalTenants: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  pendingPayments: number;
  occupancyRate: number;
}

// Notification
export type NotificationType = 'payment' | 'maintenance' | 'system' | 'reminder' | 'ac_schedule';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  actionUrl?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: Date;
  readAt?: Date;
}

// WhatsApp Message
export type WhatsAppMessageType = 
  | 'payment_reminder' 
  | 'late_warning' 
  | 'payment_confirmed'
  | 'vacancy_alert' 
  | 'maintenance_update' 
  | 'ac_reminder' 
  | 'broadcast';

export type WhatsAppMessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppMessage {
  id: string;
  recipientPhone: string;
  recipientType: 'tenant' | 'prospect' | 'admin';
  recipientId?: string;
  messageType: WhatsAppMessageType;
  messageTemplate: string;
  messageContent: string;
  whatsappMessageId?: string;
  status: WhatsAppMessageStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failureReason?: string;
  createdAt: Date;
}

// Audit Log
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Contract
export type ContractStatus = 'draft' | 'signed' | 'active' | 'expired' | 'terminated';

export interface Contract {
  id: string;
  tenantId: string;
  propertyId: string;
  roomId: string;
  contractNumber: string;
  startDate: Date;
  endDate: Date;
  baseMonthlyRent: number;
  additionalPersonFee: number;
  totalMonthlyRent: number;
  securityDeposit: number;
  lateFeePercentage: number;
  termsAndConditions: string;
  specialClauses?: string;
  contractFileUrl?: string;
  tenantSignatureUrl?: string;
  adminSignatureUrl?: string;
  status: ContractStatus;
  signedAt?: Date;
  terminatedAt?: Date;
  terminationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Vacancy Alert
export type VacancyAlertStatus = 'active' | 'notified' | 'expired';

export interface VacancyAlert {
  id: string;
  prospectName: string;
  prospectPhone: string;
  prospectEmail?: string;
  preferredPropertyId?: string;
  preferredRoomType: 'standard' | 'deluxe' | 'premium' | 'any';
  preferredOccupancy: 'single' | 'double' | 'any';
  budgetMin?: number;
  budgetMax?: number;
  moveInDate?: Date;
  status: VacancyAlertStatus;
  notifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Chart Data Types
export interface MonthlyRevenueData {
  month: string;
  roomRevenue: number;
  laundryRevenue: number;
  totalRevenue: number;
}

export interface OccupancyData {
  month: string;
  occupied: number;
  vacant: number;
  rate: number;
}

export interface ExpenseByCategory {
  category: string;
  amount: number;
  percentage: number;
}
