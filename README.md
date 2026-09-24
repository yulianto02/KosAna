# Kos Ana - Sistem Manajemen Kos Indonesia

A comprehensive property management system designed for Indonesian boarding houses (kos), inspired by platforms like Mamikos, Cove.id, and Rukos. Built with modern web technologies and ready for mobile expansion.

## 🎯 Vision

Kos Ana aims to be the all-in-one platform for kos management in Indonesia, serving three distinct user types:

1. **Pemilik Kos (Owners)** - Web-based admin dashboard for full property management
2. **Penjaga Kos (Managers)** - Mobile app for daily operations and tenant interaction
3. **Penyewa (Tenants)** - Web platform for room discovery, booking, and tenant services

---

## 🏗️ System Architecture

### Current Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript + Vite | Admin dashboard (Pemilik Kos) |
| **UI Components** | shadcn/ui + Tailwind CSS | Consistent design system |
| **Backend** | Node.js + Express | REST API server |
| **Database** | PostgreSQL | Primary data storage |
| **Auth** | JWT (jsonwebtoken) | Stateless authentication |
| **State Management** | React Hooks | Local state management |
| **Notifications** | Sonner (toast) | User feedback |

### Project Structure
kosana/
├── api/                          # Backend Node.js/Express
│   ├── server.js                 # Main server entry
│   ├── db.js                     # PostgreSQL connection pool
│   ├── middleware/
│   │   └── auth.js               # JWT auth & role middleware
│   └── repositories/             # Database access layer
│       ├── propertyRepository.js
│       ├── roomRepository.js
│       ├── tenantRepository.js
│       ├── paymentRepository.js
│       ├── expenseRepository.js
│       ├── maintenanceRepository.js
│       ├── laundryRepository.js
│       ├── acCleaningRepository.js
│       └── notificationRepository.js
│
└── app/                          # Frontend React + TypeScript
├── src/
│   ├── pages/               # Route pages
│   │   ├── Dashboard.tsx
│   │   ├── Properties.tsx
│   │   ├── Rooms.tsx
│   │   ├── Tenants.tsx
│   │   ├── Payments.tsx
│   │   ├── Expenses.tsx
│   │   ├── Maintenance.tsx   # With date picker
│   │   ├── Laundry.tsx
│   │   ├── ACCleaning.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx    # Auth handling & navigation
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/              # shadcn/ui components
│   ├── services/
│   │   ├── api.ts           # API client
│   │   └── auth.ts          # Auth service with error handling
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   └── lib/
│       └── format.ts        # Date/currency formatting
└── package.json


---

## 📊 Database Schema (PostgreSQL)

### Core Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | Admin/Penjaga accounts | id, username, role (admin/penjaga), is_active |
| `properties` | Kos locations | id, name, address, type, total_floors |
| `rooms` | Individual units | id, property_id, room_number, status, price_monthly |
| `tenants` | Occupant data | id, room_id, name, phone, email, emergency_contact, check_in_date |
| `contracts` | Rental agreements | id, tenant_id, start_date, end_date, deposit_amount |
| `payments` | Rent transactions | id, tenant_id, amount, due_date, status, payment_method |
| `expenses` | Operational costs | id, category, amount, date, description, approval_status |
| `maintenance_requests` | Repair tracking | id, room_id, issue_type, priority, status, request_date |
| `ac_cleaning_schedule` | AC maintenance | id, room_id, scheduled_date, status, completed_date |
| `laundry_orders` | Laundry service | id, tenant_id, weight, status, completed_date |
| `notifications` | System alerts | id, user_id, type, message, is_read |
| `whatsapp_messages` | WA integration | id, phone_number, message, status, sent_at |
| `audit_logs` | Activity tracking | id, user_id, action, table_name, record_id, timestamp |

### Entity Relationships

users (1) → (N) audit_logs
properties (1) → (N) rooms
rooms (1) → (N) tenants (active)
rooms (1) → (N) maintenance_requests
rooms (1) → (N) ac_cleaning_schedule
tenants (1) → (N) payments
tenants (1) → (N) laundry_orders
tenants (1) → (N) contracts


## 🔐 Authentication System

### Current Implementation

**JWT-based Authentication:**
- Token stored in `localStorage` (kosana_token)
- 24-hour expiration
- Auto-redirect to login on 401/403 errors
- Role-based access control (admin/penjaga)

**Auth Flow:**
1. User logs in → receives JWT token
2. Token stored in localStorage
3. All API requests include `Authorization: Bearer <token>`
4. Middleware validates token & checks user exists in DB
5. On expiry → automatic logout + redirect

**Files:**
- `api/middleware/auth.js` - JWT verification & role checking
- `app/src/services/auth.ts` - Login/logout/getCurrentUser
- `app/src/components/Layout.tsx` - Auth state & auto-redirect

---

## 🚀 Current Features (Admin Dashboard)

### Property Management
- ✅ Multi-property support
- ✅ Room inventory with status tracking (available/occupied/maintenance)
- ✅ Property details & media management

### Tenant Management
- ✅ Tenant registration with KTP/data diri
- ✅ Contract management (start/end dates, deposits)
- ✅ Emergency contact information
- ✅ Room assignment & transfers

### Financial Operations
- ✅ Monthly payment tracking (rent + utilities)
- ✅ Payment status (pending/paid/overdue)
- ✅ Expense recording with categories
- ✅ Revenue reports by period
- ✅ Automatic late fee calculation

### Maintenance & Services
- ✅ Maintenance request system with date picker
- ✅ Priority levels (low/medium/high/urgent)
- ✅ AC cleaning scheduling
- ✅ Laundry service tracking
- ✅ Technician assignment

### Notifications
- ✅ In-app notification system
- ✅ WhatsApp integration ready (table exists)
- ✅ Audit logging for all actions

---

## 🛣️ Roadmap: Future Development

### Phase 1: Tenant-Facing Web Platform (Q2 2025)

**Goal:** Transform Kos Ana into a discovery platform like Mamikos/Cove.id

**New Features:**

#### Public Room Search
- Landing page with property showcase
- Advanced filters (location, price range, room type, facilities)
- Interactive map integration (Google Maps/Leaflet)
- Virtual tour support (360° photos)
- "Kos Putri/Putri/Campur" filtering
- Availability calendar

#### Tenant Portal
- User registration (tenants)
- Booking requests with deposit payment
- Online rent payment integration (Midtrans/Xendit)
- Maintenance request submission
- Payment history & invoices
- Contract renewal requests
- Community features (events, announcements)

**Tech Additions:**
- Next.js for SEO/public pages
- Prisma ORM (optional migration from raw SQL)
- Redis for session caching
- Image optimization (Cloudinary/AWS S3)
- Payment gateway integration

**New Database Tables:**
```sql
-- Tenant users (separate from admin users)
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100),
    password_hash VARCHAR(255),
    full_name VARCHAR(100),
    ktp_number VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Booking requests before contract
CREATE TABLE booking_requests (
    id UUID PRIMARY KEY,
    tenant_user_id UUID REFERENCES tenant_users(id),
    room_id UUID REFERENCES rooms(id),
    check_in_date DATE,
    duration_months INTEGER,
    status VARCHAR(20), -- pending/approved/rejected
    deposit_paid DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews & ratings
CREATE TABLE room_reviews (
    id UUID PRIMARY KEY,
    tenant_user_id UUID REFERENCES tenant_users(id),
    room_id UUID REFERENCES rooms(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


### Phase 2: Penjaga Kos Mobile App (Q3 2025)

#### Goal: Android app for daily operations management
Platform: React Native with Expo

#### Core Features:
1. Tenant Management
Quick tenant lookup by room/name
View tenant profile & phone (click to call/WhatsApp)
Check-in/check-out processing
Contract renewal reminders

2. Maintenance Operations
View all maintenance requests
Update status (reported → in_progress → completed)
Photo upload for before/after
Assign technicians
Create new maintenance requests (voice input?)

3. AC Cleaning Schedule
Daily/weekly cleaning checklist
Mark rooms as cleaned
Reschedule notifications
Overdue alerts

4. Financial Tasks
Record cash payments (rent/laundry/deposits)
Daily cash balance tracking
Expense recording with photo receipts
View pending payments list

5. Communications
Broadcast announcements to all tenants
Individual tenant messaging
Maintenance status notifications
Emergency contact quick dial

6. Reports
Daily summary (new tenants, payments, issues)
Occupancy rate dashboard
Monthly financial snapshot


#### Mobile App Architecture:
mobile/
├── App.tsx                    # Entry point
├── src/
│   ├── api/                  # API client (axios)
│   │   └── client.ts         # With token refresh
│   ├── components/
│   │   ├── TenantCard.tsx
│   │   ├── RoomStatusBadge.tsx
│   │   └── PaymentRecorder.tsx
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Dashboard
│   │   ├── TenantsScreen.tsx        # Tenant list
│   │   ├── TenantDetailScreen.tsx   # Profile + actions
│   │   ├── MaintenanceScreen.tsx      # Request list
│   │   ├── MaintenanceDetailScreen.tsx
│   │   ├── CleaningScreen.tsx         # AC schedule
│   │   ├── PaymentsScreen.tsx         # Record payments
│   │   └── ProfileScreen.tsx          # Settings
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTenants.ts
│   │   └── useMaintenance.ts
│   └── utils/
│       └── storage.ts        # AsyncStorage helpers
└── package.json

#### API Endpoints for Mobile:

// New mobile-specific endpoints to add to api/server.js
// GET /api/mobile/tenants?propertyId=xxx - List with room info
// GET /api/mobile/tenants/:id - Full profile + contract + payment history
// POST /api/mobile/payments/quick - Record cash payment
// GET /api/mobile/maintenance/today - Today's requests
// PUT /api/mobile/maintenance/:id/status - Update status with photo
// GET /api/mobile/ac-cleaning/schedule - Weekly schedule view
// PUT /api/mobile/ac-cleaning/:id/complete - Mark done
// GET /api/mobile/dashboard/summary - Daily stats

Offline Support:
Cache tenant list locally (SQLite/WatermelonDB)
Queue actions when offline (background sync)
Optimistic UI updates

updates
🛠️ Development Guidelines
For Vibe Coding / AI-Assisted Development
When adding new features:
Database First: Add migrations to api/migrations/
Repository Layer: Create/update repository in api/repositories/
API Routes: Add endpoints to api/server.js with proper auth
TypeScript Types: Update app/src/types/index.ts
Frontend: Build pages in app/src/pages/ using shadcn/ui components
Testing: Use existing error handling patterns (toast notifications)
Code Patterns to Follow:


Repository Pattern (Backend):

// api/repositories/exampleRepository.js
const pool = require('../db');

class ExampleRepository {
  async findAll(filters = {}) {
    const query = 'SELECT * FROM table WHERE condition = $1';
    const result = await pool.query(query, [filters.value]);
    return result.rows;
  }
  
  async create(data) {
    const query = 'INSERT INTO table (col1, col2) VALUES ($1, $2) RETURNING *';
    const result = await pool.query(query, [data.col1, data.col2]);
    return result.rows[0];
  }
}

module.exports = new ExampleRepository();


API Error Handling:

// Always use asyncHandler wrapper
app.get('/api/resource', asyncHandler(async (req, res) => {
  const data = await repository.findAll();
  res.json(data);
}));

Frontend Data Fetching:
// services/api.ts
export const resourceAPI = {
  getAll: () => api.get('/resource'),
  create: (data) => api.post('/resource', data),
  update: (id, data) => api.put(`/resource/${id}`, data),
  delete: (id) => api.delete(`/resource/${id}`),
};

Form Handling with Date Pickers:
// Pattern used in Maintenance.tsx
const [formData, setFormData] = useState({
  requestDate: new Date(), // Date object
  // ... other fields
});

// On submit
const apiData = {
  request_date: formData.requestDate.toISOString().split('T')[0],
  // ... convert other camelCase to snake_case
};

📱 API Documentation
Authentication Endpoints
| Method | Endpoint                    | Description            | Auth |
| ------ | --------------------------- | ---------------------- | ---- |
| POST   | `/api/auth/login`           | Login with credentials | No   |
| POST   | `/api/auth/register`        | Register new admin     | No   |
| GET    | `/api/auth/me`              | Get current user       | Yes  |
| POST   | `/api/auth/change-password` | Update password        | Yes  |


Core Resources
All endpoints require Authentication header: Authorization: Bearer <token>
| Resource                        | GET         | POST              | PUT    | DELETE |
| ------------------------------- | ----------- | ----------------- | ------ | ------ |
| `/api/properties`               | List all    | Create new        | -      | -      |
| `/api/properties/:id`           | Get details | -                 | Update | Delete |
| `/api/rooms`                    | List all    | Create new        | -      | -      |
| `/api/rooms/:id`                | Get details | -                 | Update | Delete |
| `/api/tenants`                  | List all    | Create new        | -      | -      |
| `/api/tenants/:id`              | Get details | -                 | Update | Delete |
| `/api/payments`                 | List all    | Create new        | -      | -      |
| `/api/payments/:id/mark-paid`   | -           | Mark as paid      | -      | -      |
| `/api/expenses`                 | List all    | Create new        | -      | -      |
| `/api/expenses/:id/approve`     | -           | Approve expense   | -      | -      |
| `/api/maintenance`              | List all    | Create request    | -      | -      |
| `/api/maintenance/:id/complete` | -           | Complete request  | -      | -      |
| `/api/ac-cleaning`              | List all    | Schedule cleaning | -      | -      |
| `/api/ac-cleaning/:id/complete` | -           | Mark complete     | -      | -      |
| `/api/laundry`                  | List all    | Create order      | -      | -      |
| `/api/laundry/:id/complete`     | -           | Complete order    | -      | -      |
| `/api/dashboard/stats`          | Get stats   | -                 | -      | -      |


🔧 Environment Setup

Backend (.env)
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/kosana_prod
JWT_SECRET=your-super-secret-key-change-in-production
NODE_ENV=development

Frontend (.env)
VITE_API_URL=http://localhost:3001/api


Production Checklist
[ ] Build frontend: cd app && npm run build
[ ] Configure Nginx reverse proxy
[ ] Set up PM2 for Node.js process management
[ ] Enable PostgreSQL automated backups
[ ] Configure SSL certificates (Let's Encrypt)
[ ] Set up firewall rules (ufw)
[ ] Environment variables for production


📈 Inspiration & Competitors
| Platform       | Country   | Key Features to Learn From                                 |
| -------------- | --------- | ---------------------------------------------------------- |
| **Mamikos**    | Indonesia | Room search filters, virtual tours, MamiPoin rewards       |
| **Cove.id**    | Indonesia | Co-living experience, community events, flexible contracts |
| **Rukos**      | Indonesia | Simple UI, automated rent collection, financial reports    |
| **Managrrkos** | Indonesia | Mobile-first approach, instant receipts, cloud data        |


🤝 Contributing
This project is designed for vibe coding - feel free to use AI assistants to:
Generate new repository methods
Create React components following shadcn/ui patterns
Write database migrations
Build API endpoints
Always ensure:
TypeScript types are updated
Error handling follows existing patterns
New features have proper auth checks
UI remains consistent with Tailwind/shadcn
📄 License
Private - For internal use only
📞 Contact
For questions or support, contact the development team.
Built with ❤️ for Indonesian Kos Management

This README provides:

1. **Complete technical context** - Architecture, database schema, file structure
2. **Current state documentation** - What's already built and working
3. **Future roadmap** - Clear phases for tenant platform and mobile app
4. **Code patterns** - Examples of how to extend the system
5. **API documentation** - Quick reference for existing endpoints
6. **Competitor analysis** - Features to learn from Mamikos, Cove.id, etc.
7. **Vibe coding guidelines** - How to work with AI assistants on this codebase

You can use this README to provide context to AI coding assistants for future development work!


How to run the app:
1. open terminal and cd kosana/api
   node server.js
2. cd kosana/app
   npm run dev

Username: admin
password: admin123

Troubleshoot
1. when ip change you have to change the ip address in
   app/.env
   app/config/api.ts

   