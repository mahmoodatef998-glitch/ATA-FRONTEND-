<<<<<<< HEAD
# 🚀 ATA CRM - Generators & Power Solutions Management

A complete, production-ready CRM system for managing generators, ATS, switchgear quotations and orders. 100% free and open source.

---

## ⚡ Quick Start

### **One Command to Start:**

```bash
QUICK_START.bat
```

**That's it!** The system will:
- ✅ Start PostgreSQL
- ✅ Setup Database
- ✅ Launch Prisma Studio (port 5556)
- ✅ Launch Next.js (port 3005)
- ✅ Open browser automatically

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
Homepage:        http://localhost:3005
Client Portal:   http://localhost:3005/client/login
```

### **Admin:**
```
Admin Login:     http://localhost:3005/login
Dashboard:       http://localhost:3005/dashboard/orders

Credentials:
  📧 admin@demo.co
  🔑 00243540000
```

### **Database:**
```
Prisma Studio:   http://localhost:5556
```

---

## 📧 Email Setup (Optional)

### **Gmail (Easiest):**

1. Enable 2-Step Verification
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:

```env
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_SECURE="false"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-16-char-app-password"
EMAIL_FROM_NAME="ATA CRM"
```

4. Restart: `npm run dev`

**📚 Detailed Guide:** `📧_دليل_إعداد_Email.md`

---

## 🎯 Complete Workflow

```
1. Client → Register → Login → Portal
2. Client → Create Order (from portal)
3. Admin → Dashboard → View Order
4. Admin → Upload Quotation (Drag & Drop) → Send
5. Client → Receives Email → Reviews Quotation
6. Client → Accepts/Rejects (with comments)
7. Admin → Receives Notification → Approves
8. Client → Receives Completion Email
```

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** NextAuth.js v5, JWT (jose), bcryptjs
- **Email:** Nodemailer (free SMTP)
- **UI:** shadcn/ui, next-themes
- **File Upload:** react-dropzone

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
  ├── theme/                # Dark mode
  └── ui/                   # shadcn components

lib/
  ├── auth.ts              # Authentication
  ├── email.ts             # Email service
  ├── prisma.ts            # Database client
  └── validators/          # Zod schemas

prisma/
  ├── schema.prisma        # Database schema
  └── migrations/          # Database migrations
```

---

## 🔧 Scripts

```bash
# Quick start (recommended)
QUICK_START.bat

# Full repair (if issues)
اصلاح_كامل.bat

# Check servers
فحص_السيرفر.bat

# Development
npm run dev

# Database
npx prisma studio
npx prisma migrate dev
npm run prisma:seed
```

---

## 📚 Documentation

- **🚀 START HERE:** `🚀_ابدأ_من_هنا.txt`
- **📖 Complete Guide:** `📖_الدليل_الشامل_للمشروع.md`
- **📧 Email Setup:** `📧_دليل_إعداد_Email.md`
- **🎉 Features Summary:** `🎉_ملخص_الإنجازات_اليوم.md`
- **💎 Future Ideas:** `💎_أفكار_ميزات_قوية_للمشروع.md`

---

## 🌟 Key Features

### **🎨 Modern UI/UX:**
- Responsive design
- Dark mode support
- Professional gradients
- Mobile-friendly

### **📧 Email Notifications:**
- Order confirmation
- Quotation ready
- Status updates
- Client responses

### **🔐 Security:**
- JWT authentication
- Password hashing (bcrypt)
- Role-based access
- HTTP-only cookies

### **📎 File Management:**
- Drag & drop upload
- PDF & Excel support
- 10MB file size limit
- Local storage (free!)

---

## 💰 Cost

**100% FREE!**
- No subscriptions
- No hidden fees
- All libraries are open source
- Free email (Gmail SMTP)
- Free database (PostgreSQL)

---

## 🎯 User Roles

```
SUPERADMIN  - Full access
ADMIN       - Company management
BROKER      - Order handling
CLIENT      - Order submission & tracking
```

---

## 📊 Database Schema

```
companies       - Companies
users           - Admin/Broker users
clients         - Clients (with accounts)
orders          - Purchase orders
quotations      - Price quotes (with files)
order_histories - Activity log
notifications   - In-app notifications
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
```

---

## 🚀 Next Steps

1. Run `QUICK_START.bat`
2. Read `🚀_ابدأ_من_هنا.txt`
3. Setup emails (optional): `📧_دليل_إعداد_Email.md`
4. Start using the system!

---

## 📞 Support

For detailed guides and documentation, see:
- `📖_الدليل_الشامل_للمشروع.md` (Arabic)
- `INSTALLATION_COMPLETE.txt` (English)

---

## 🎉 Credits

Built with ❤️ using modern web technologies.
100% Free & Open Source.

---

**Ready to start? Run `QUICK_START.bat`!** 🚀
=======
# ATA CRM - Frontend

Frontend application for ATA CRM system built with Next.js 15.

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## 🔗 Backend API

This frontend connects to the backend API. Make sure to set the following environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_WS_URL=wss://your-backend-url.com
NEXTAUTH_URL=https://your-frontend-url.com
NEXTAUTH_SECRET=your-secret-key
```

## 📦 Tech Stack

- **Next.js 15** - React Framework
- **React 19** - UI Library
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time Communication

## 📝 License

Private

>>>>>>> d9990d0 (Initial commit: Frontend only)
