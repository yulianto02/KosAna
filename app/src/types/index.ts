// User Roles and Authentication
export type UserRole = 'admin' | 'owner' | 'penjaga' | 'tenant';

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  full_name: string;  // Changed from fullName
  role: UserRole;
  is_active: boolean;  // Changed from isActive
  profile_image_url?: string;  // Changed from profileImageUrl
  created_at: string;  // Changed from createdAt (PostgreSQL returns ISO string)
  updated_at?: string;  // Changed from updatedAt
  last_login?: string;  // Changed from lastLogin
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
  postal_code: string;  // Changed from postalCode
  contact_phone: string;  // Changed from contactPhone
  property_manager_id: string;  // Changed from propertyManagerId
  property_type: PropertyType;  // Changed from propertyType
  total_floors: number;  // Changed from totalFloors
  total_rooms: number;  // Changed from totalRooms
  amenities: {
    wifi: boolean;
    ac: boolean;
    hot_water: boolean;  // Changed from hotWater
    parking: boolean;
    cctv: boolean;
  };
  rules?: string;
  status: PropertyStatus;
  floor_plan_images?: string[];  // Changed from floorPlanImages
  property_photos?: string[];  // Changed from propertyPhotos
  created_at: string;  // Changed from createdAt
  updated_at: string;  // Changed from updatedAt
}

// Room Management
export type RoomType = 'standard' | 'deluxe' | 'premium';
export type RoomStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';
export type OccupancyType = 'single' | 'double';

export interface Room {
  id: string;
  property_id: string;  // Changed from propertyId
  room_number: string;  // Changed from roomNumber
  floor: number;
  room_type: RoomType;  // Changed from roomType
  size_sqm?: number;  // Changed from sizeSqm
  occupancy_type: OccupancyType;  // Changed from occupancyType
  base_monthly_rent: number;  // Changed from baseMonthlyRent
  additional_person_fee: number;  // Changed from additionalPersonFee
  amenities: {
    ac: boolean;
    private_bathroom: boolean;  // Changed from privateBathroom
    balcony: boolean;
    tv: boolean;
    refrigerator: boolean;
    wardrobe: boolean;
    desk: boolean;
    wifi: boolean;
  };
  description?: string;
  status: RoomStatus;
  ac_unit_id?: string;  // Changed from acUnitId
  coordinates_x?: number;  // Changed from coordinatesX
  coordinates_y?: number;  // Changed from coordinatesY
  created_at: string;  // Changed from createdAt
  updated_at: string;  // Changed from updatedAt
}

export interface RoomMedia {
  id: string;
  room_id: string;  // Changed from roomId
  property_id: string;  // Changed from propertyId
  image_url: string;  // Changed from imageUrl
  image_type: 'room' | 'bathroom' | 'balcony' | 'view' | 'other';
  is_template: boolean;  // Changed from isTemplate
  display_order: number;  // Changed from displayOrder
  uploaded_by: string;  // Changed from uploadedBy
  created_at: string;  // Changed from createdAt
}

// Tenant Management
export type TenantStatus = 'active' | 'archived' | 'moved_out';

export interface Tenant {
  id: string;
  user_id?: string;  // Changed from userId
  property_id: string;  // Changed from propertyId
  room_id: string;  // Changed from roomId
  full_name: string;  // Changed from fullName
  phone: string;
  email?: string;
  emergency_contact: string;  // Changed from emergencyContact
  emergency_phone: string;  // Changed from emergencyPhone
  ktp_number: string;  // Changed from ktpNumber
  ktp_image_url: string;  // Changed from ktpImageUrl
  check_in_date: string;  // Changed from checkInDate
  check_out_date?: string;  // Changed from checkOutDate
  contract_duration_months: number;  // Changed from contractDurationMonths
  base_monthly_rent: number;  // Changed from baseMonthlyRent
  additional_person_fee: number;  // Changed from additionalPersonFee
  total_monthly_rent: number;  // Changed from totalMonthlyRent
  security_deposit: number;  // Changed from securityDeposit
  late_fee_percentage: number;  // Changed from lateFeePercentage
  payment_due_day: number;  // Changed from paymentDueDay
  contract_file_url?: string;  // Changed from contractFileUrl
  tenant_signature_url?: string;  // Changed from tenantSignatureUrl
  admin_signature_url?: string;  // Changed from adminSignatureUrl
  is_shared_room: boolean;  // Changed from isSharedRoom
  secondary_tenant_name?: string;  // Changed from secondaryTenantName
  secondary_tenant_phone?: string;  // Changed from secondaryTenantPhone
  status: TenantStatus;
  move_out_reason?: string;  // Changed from moveOutReason
  final_settlement_amount?: number;  // Changed from finalSettlementAmount
  archived_at?: string;  // Changed from archivedAt
  created_at: string;  // Changed from createdAt
  updated_at: string;  // Changed from updatedAt
}

export interface TenantVehicle {
  id: string;
  tenant_id: string;  // Changed from tenantId
  room_id: string;  // Changed from roomId
  property_id: string;  // Changed from propertyId
  vehicle_type: 'none' | 'motorbike' | 'car';
  license_plate?: string;  // Changed from licensePlate
  vehicle_brand?: string;  // Changed from vehicleBrand
  vehicle_color?: string;  // Changed from vehicleColor
  parking_spot?: string;  // Changed from parkingSpot
  parking_type?: 'motorbike_area' | 'car_area' | 'shared';
  is_active: boolean;  // Changed from isActive
  registered_at: string;  // Changed from registeredAt
  deregistered_at?: string;  // Changed from deregisteredAt
  created_at: string;  // Changed from createdAt
  updated_at: string;  // Changed from updatedAt
}

// Payment Management
export type PaymentMethod = 'qris' | 'bank_transfer' | 'cash';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'refunded';

export interface Payment {
  id: string;
  tenant_id: string;  // Changed from tenantId
  room_id: string;  // Changed from roomId
  property_id: string;  // Changed from propertyId
  payment_period: string;  // Changed from paymentPeriod (Format: YYYY-MM)
  base_amount: number;  // Changed from baseAmount
  additional_person_fee: number;  // Changed from additionalPersonFee
  late_fee: number;  // Changed from lateFee
  laundry_amount: number;  // Changed from laundryAmount
  total_amount: number;  // Changed from totalAmount
  payment_method: PaymentMethod;  // Changed from paymentMethod
  payment_status: PaymentStatus;  // Changed from paymentStatus
  payment_date?: string;  // Changed from paymentDate
  due_date: string;  // Changed from dueDate
  qr_code_url?: string;  // Changed from qrCodeUrl
  transaction_id?: string;  // Changed from transactionId
  payment_proof_url?: string;  // Changed from paymentProofUrl
  notes?: string;
  paid_at?: string;  // Changed from paidAt
  created_at: string;  // Changed from createdAt
  updated_at: string;  // Changed from updatedAt
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
  property_id: string;  // Changed from propertyId
  room_id?: string;  // Changed from roomId
  expense_date: string;  // Changed from expenseDate
  expense_type: ExpenseType;  // Changed from expenseType
  amount: number;
  provider_name: string;  // Changed from providerName
  description?: string;
  receipt_image_url?: string;  // Changed from receiptImageUrl
  reported_by: string;  // Changed from reportedBy
  approved_by?: string;  // Changed from approvedBy
  approval_status: ApprovalStatus;  // Changed from approvalStatus
  created_at: string;  // Changed from createdAt
  updated_at: string;  // Changed from updatedAt
}

// Room Cleaning
export interface RoomCleaningSchedule {
  id: string;
  room_id: string;
  property_id: string;
  week_start_date: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  time_slot: 1 | 2 | 3 | 4 | 5 | 6;
  scheduled_date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'rescheduled';
  assigned_to?: string;
  estimated_duration_minutes: number;
  actual_start_time?: string;
  actual_end_time?: string;
  notes?: string;
  completed_by?: string;
  completed_at?: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  room_number?: string;
  floor?: number;
  property_name?: string;
  assigned_username?: string;
  assigned_name?: string;
  completed_by_name?: string;
}

export interface CleaningSlot {
  dayOfWeek: number;
  timeSlot: number;
  time: string;
  schedule?: RoomCleaningSchedule;
  isAvailable: boolean;
}

export interface CleaningStats {
  scheduled: number;
  in_progress: number;
  completed: number;
  skipped: number;
  total: number;
}

// Laundry Management
export type LaundryServiceType = 'wash_only' | 'wash_and_dry' | 'wash_dry_fold';
export type LaundryStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface LaundryOrder {
  id: string;
  tenant_id: string;  // Changed from tenantId
  property_id: string;  // Changed from propertyId
  room_id: string;  // Changed from roomId
  order_date: string;  // Changed from orderDate
  completion_date?: string;  // Changed from completionDate
  weight_kg?: number;  // Changed from weightKg
  item_count?: number;  // Changed from itemCount
  price_per_kg: number;  // Changed from pricePerKg
  service_type: LaundryServiceType;  // Changed from serviceType
  total_price: number;  // Changed from totalPrice
  status: LaundryStatus;
  notes?: string;
  recorded_by: string;  // Changed from recordedBy
  completed_by?: string;  // Changed from completedBy
  completed_at?: string;  // Changed from completedAt
  created_at: string;  // Changed from createdAt
  updated_at: string;  // Changed from updatedAt
}

// Maintenance Management
export type IssueType = 'ac' | 'plumbing' | 'electrical' | 'furniture' | 'painting' | 'other';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'reported' | 'in_progress' | 'completed' | 'cancelled';

export interface MaintenanceRequest {
  id: string;
  tenant_id?: string;  // Changed from tenantId
  room_id: string;  // Changed from roomId
  property_id: string;  // Changed from propertyId
  request_date: string;  // Changed from requestDate
  issue_type: IssueType;  // Changed from issueType
  description: string;
  priority: PriorityLevel;
  status: MaintenanceStatus;
  assigned_to?: string;  // Changed from assignedTo
  estimated_completion?: string;  // Changed from estimatedCompletion
  actual_completion?: string;  // Changed from actualCompletion
  cost: number;
  photos?: string[];
  technician_name?: string;  // Changed from technicianName
  technician_contact?: string;  // Changed from technicianContact
  notes?: string;
  created_at: string;  // Changed from createdAt
  updated_at: string;  // Changed from updatedAt
}

// AC Cleaning Schedule
export type ACScheduleStatus = 'pending' | 'completed' | 'overdue' | 'skipped';

export interface ACCleaningSchedule {
  id: string;
  room_id: string;  // Changed from roomId
  property_id: string;  // Changed from propertyId
  ac_unit_id?: string;  // Changed from acUnitId
  last_cleaning_date?: string;  // Changed from lastCleaningDate
  next_cleaning_date: string;  // Changed from nextCleaningDate
  schedule_interval_days: number;  // Changed from scheduleIntervalDays
  status: ACScheduleStatus;
  completed_date?: string;  // Changed from completedDate
  technician_name?: string;  // Changed from technicianName
  technician_contact?: string;  // Changed from technicianContact
  cost: number;
  notes?: string;
  completed_by?: string;  // Changed from completedBy
  reminder_sent: boolean;  // Changed from reminderSent
  reminder_sent_at?: string;  // Changed from reminderSentAt
  created_at: string;  // Changed from createdAt
  updated_at: string;  // Changed from updatedAt
}

// With this (snake_case to match PostgreSQL):
export interface DashboardStats {
  total_properties: number;
  total_rooms: number;
  occupied_rooms: number;
  vacant_rooms: number;
  total_tenants: number;
  monthly_revenue: number;
  monthly_expenses: number;
  pending_payments: number;
  occupancy_rate: number;
}

// Notification
export type NotificationType = 'payment' | 'maintenance' | 'system' | 'reminder' | 'ac_schedule';

export interface Notification {
  id: string;
  user_id: string;  // Changed from userId
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;  // Changed from isRead
  action_url?: string;  // Changed from actionUrl
  related_entity_type?: string;  // Changed from relatedEntityType
  related_entity_id?: string;  // Changed from relatedEntityId
  created_at: string;  // Changed from createdAt
  read_at?: string;  // Changed from readAt
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
  recipient_phone: string;  // Changed from recipientPhone
  recipient_type: 'tenant' | 'prospect' | 'admin';  // Changed from recipientType
  recipient_id?: string;  // Changed from recipientId
  message_type: WhatsAppMessageType;  // Changed from messageType
  message_template: string;  // Changed from messageTemplate
  message_content: string;  // Changed from messageContent
  whatsapp_message_id?: string;  // Changed from whatsappMessageId
  status: WhatsAppMessageStatus;
  sent_at?: string;  // Changed from sentAt
  delivered_at?: string;  // Changed from deliveredAt
  read_at?: string;  // Changed from readAt
  failure_reason?: string;  // Changed from failureReason
  created_at: string;  // Changed from createdAt
}

// Audit Log
export interface AuditLog {
  id: string;
  user_id: string;  // Changed from userId
  action: string;
  entity_type: string;  // Changed from entityType
  entity_id: string;  // Changed from entityId
  old_values?: Record<string, any>;  // Changed from oldValues
  new_values?: Record<string, any>;  // Changed from newValues
  ip_address?: string;  // Changed from ipAddress
  user_agent?: string;  // Changed from userAgent
  created_at: string;  // Changed from createdAt
}

// Contract
export type ContractStatus = 'draft' | 'signed' | 'active' | 'expired' | 'terminated';

export interface Contract {
  id: string;
  tenant_id: string;  // Changed from tenantId
  property_id: string;  // Changed from propertyId
  room_id: string;  // Changed from roomId
  contract_number: string;  // Changed from contractNumber
  start_date: string;  // Changed from startDate
  end_date: string;  // Changed from endDate
  base_monthly_rent: number;  // Changed from baseMonthlyRent
  additional_person_fee: number;  // Changed from additionalPersonFee
  total_monthly_rent: number;  // Changed from totalMonthlyRent
  security_deposit: number;  // Changed from securityDeposit
  late_fee_percentage: number;  // Changed from lateFeePercentage
  terms_and_conditions: string;  // Changed from termsAndConditions
  special_clauses?: string;  // Changed from specialClauses
  contract_file_url?: string;  // Changed from contractFileUrl
  tenant_signature_url?: string;  // Changed from tenantSignatureUrl
  admin_signature_url?: string;  // Changed from adminSignatureUrl
  status: ContractStatus;
  signed_at?: string;  // Changed from signedAt
  terminated_at?: string;  // Changed from terminatedAt
  termination_reason?: string;  // Changed from terminationReason
  created_at: string;  // Changed from createdAt
  updated_at: string;  // Changed from updatedAt
}

// Vacancy Alert
export type VacancyAlertStatus = 'active' | 'notified' | 'expired';

export interface VacancyAlert {
  id: string;
  prospect_name: string;  // Changed from prospectName
  prospect_phone: string;  // Changed from prospectPhone
  prospect_email?: string;  // Changed from prospectEmail
  preferred_property_id?: string;  // Changed from preferredPropertyId
  preferred_room_type: 'standard' | 'deluxe' | 'premium' | 'any';  // Changed from preferredRoomType
  preferred_occupancy: 'single' | 'double' | 'any';  // Changed from preferredOccupancy
  budget_min?: number;  // Changed from budgetMin
  budget_max?: number;  // Changed from budgetMax
  move_in_date?: string;  // Changed from moveInDate
  status: VacancyAlertStatus;
  notified_at?: string;  // Changed from notifiedAt
  created_at: string;  // Changed from createdAt
  updated_at: string;  // Changed from updatedAt
}

// Chart Data Types
export interface MonthlyRevenueData {
  month: string;
  room_revenue: number;      // Changed from roomRevenue
  laundry_revenue: number;   // Changed from laundryRevenue
  total_revenue: number;     // Changed from totalRevenue
}

export interface OccupancyData {
  month: string;
  occupied: number;
  vacant: number;
  rate: number;              // Keep as 'rate' if your API returns this
  // OR if your API returns occupancy_rate:
  // occupancy_rate: number;
}

// Replace ExpenseByCategory (around line 443):
export interface ExpenseByCategory {
  category: string;          // OR expense_type if that's what your API returns
  amount: number;            // OR total_amount
  percentage: number;
}

