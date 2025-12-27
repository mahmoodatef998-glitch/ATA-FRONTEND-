# 🚀 ATA CRM - Generators & Power Solutions Management

A complete, production-ready CRM system for managing generators, ATS, switchgear quotations and orders. 100% free and open source.

---

## ⚡ Quick Start

### **Installation:**

```bash
npm install
```

### **Development:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### **Build:**

```bash
npm run build
npm start
```

---

## 🌟 Features

### **For Clients:**
- 📝 Register & Login (Email or Phone)
- 📦 Create Orders from Personal Portal
- 📊 Track All Orders in One Place
- 📄 Download Quotations
- ✅ Accept/Reject Quotations
- 💬 Add Comments & Notes
- 📧 Email Notifications
- 🌙 Dark Mode Support

### **For Admins:**
- 📊 Comprehensive Dashboard
- 📦 Full Order Management
- 📎 Upload Quotations (Drag & Drop)
- 📤 Send to Client (One-Click)
- ✅ Approve/Reject Orders
- 💬 View Client Feedback
- 🔔 Real-time Notifications
- 📧 Automated Emails
- 🌙 Dark Mode

---

## 🔗 Quick Links

### **Public:**
```
Homepage:        http://localhost:3000
Client Portal:   http://localhost:3000/client/login
```

### **Admin:**
```
Admin Login:     http://localhost:3000/login
Dashboard:       http://localhost:3000/dashboard/orders
```

### **Database:**
```
Prisma Studio:   npx prisma studio
```

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (Supabase)
- **Auth:** NextAuth.js v5, JWT (jose), bcryptjs
- **Email:** Nodemailer (free SMTP)
- **UI:** shadcn/ui, next-themes
- **File Upload:** Cloudinary, react-dropzone
- **Real-time:** Socket.io (optional)

---

## 📁 Project Structure

```
app/
  ├── (auth)/login          # Admin authentication
  ├── (dashboard)/          # Admin dashboard
  ├── (public)/client/      # Client portal
  └── api/                  # API routes

components/
  ├── dashboard/            # Admin components
  ├── client/               # Client components
  ├── team/                 # Team management
  └── ui/                   # shadcn components

lib/
  ├── auth.ts              # Authentication
  ├── prisma.ts            # Database client
  ├── cloudinary.ts        # File upload
  └── validators/          # Zod schemas

prisma/
  ├── schema.prisma        # Database schema
  └── migrations/          # Database migrations
```

---

## 🔧 Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Database
npx prisma studio
npx prisma migrate dev
npx prisma db push
npm run prisma:seed

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 📚 Documentation

- **Performance Optimizations:** `PERFORMANCE_OPTIMIZATIONS.md`
- **Cloudinary Setup:** `CLOUDINARY_SETUP_INSTRUCTIONS.md`
- **Database Indexes:** `DATABASE_INDEXES_INSTRUCTIONS.md`
- **Daily Report Cron:** `SETUP_DAILY_REPORT_CRON.md`
- **RBAC System:** `docs/RBAC_SYSTEM.md`

---

## 🌟 Key Features

### **🎨 Modern UI/UX:**
- Responsive design (mobile-first)
- Dark mode support
- Professional gradients
- Mobile-friendly navigation

### **📧 Email Notifications:**
- Order confirmation
- Quotation ready
- Status updates
- Client responses

### **🔐 Security:**
- JWT authentication
- Password hashing (bcrypt)
- Role-based access control (RBAC)
- HTTP-only cookies
- Rate limiting

### **📎 File Management:**
- Cloudinary integration
- Drag & drop upload
- PDF & Excel support
- Signed URLs for private files

### **⚡ Performance:**
- Client-side caching
- Database query optimization
- Reduced N+1 queries
- Optimized dashboard loading

---

## 🎯 User Roles

```
ADMIN              - Full access
OPERATIONS_MANAGER - Operations management
ACCOUNTANT         - Financial management
HR                 - Human resources
SUPERVISOR         - Team supervision
TECHNICIAN         - Field operations
CLIENT             - Order submission & tracking
```

---

## 📊 Database Schema

```
companies       - Companies
users           - Admin/Staff users
clients         - Clients (with accounts)
orders          - Purchase orders
quotations      - Price quotes (with files)
purchase_orders - Purchase orders
delivery_notes  - Delivery documentation
order_histories - Activity log
notifications   - In-app notifications
tasks           - Task management
work_logs       - Work tracking
attendance      - Attendance tracking
```

---

## 🎊 Production Ready

```
✅ Full CRUD operations
✅ Authentication & Authorization
✅ File upload & download
✅ Email notifications
✅ Dark mode
✅ Mobile responsive
✅ Error handling
✅ Input validation
✅ Rate limiting
✅ Security best practices
✅ Performance optimizations
✅ Real-time updates (optional)
```

---

## 🚀 Deployment

### **Vercel (Frontend):**
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

### **Supabase (Database):**
1. Create project
2. Run migrations
3. Set up connection string

### **Cloudinary (File Storage):**
1. Create account
2. Get credentials
3. Add to environment variables

---

## 📝 License

Private

---

**Built with ❤️ using modern web technologies.**
