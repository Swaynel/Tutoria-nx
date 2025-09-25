# Tuitora - Multi-School EdTech Platform

Tuitora - Modern School Management

A comprehensive multi-tenant school management platform built for African educational institutions. Tuitora provides essential school management functions with seamless SMS and USSD integration via Africa's Talking.

---

## 🚀 Features

### Core Modules
- **📊 Parent-Teacher Communication Hub** – Real-time messaging with SMS/WhatsApp integration  
- **📝 Attendance & Engagement Tracking** – Digital attendance with instant parent notifications  
- **💰 Payment Tracking & Notifications** – Fee management with automated reminders  
- **👥 Multi-Role User Management** – Support for superadmins, school admins, teachers, parents, and students  
- **🏫 Multi-School Support** – Complete data isolation between institutions  

### Africa's Talking Integration
- **📱 USSD Service:** `*384*38164#` for attendance/fees checking  
- **💬 SMS Short Code:** `15680` for all communications  
- **🔔 Automated Notifications** – Attendance alerts, payment confirmations, announcements  
- **📞 Two-way Communication** – Parents can reply to messages  

### Technical Features
- **🎯 GitHub-inspired Dual Sidebar** – Intuitive navigation  
- **📱 Fully Responsive** – Mobile-first design  
- **🔒 Role-Based Access Control** – Secure data isolation  
- **⚡ Real-time Updates** – Live data synchronization  
- **🌐 Multi-tenant Architecture** – Scalable school management  

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 15 with TypeScript  
- **Styling:** Tailwind CSS  
- **UI Components:** Headless UI  
- **State Management:** React Context + Hooks  

### Backend
- **Database:** Supabase (PostgreSQL)  
- **Authentication:** Supabase Auth  
- **API Routes:** Next.js API Routes  
- **SMS/USSD:** Africa's Talking API  

### Deployment
- **Hosting:** Vercel  
- **Database:** Supabase (Free Tier)  
- **CDN:** Vercel Edge Network  

---

## 📋 Prerequisites

- Node.js 18+  
- Supabase account  
- Africa's Talking account  
- Kenyan phone number for testing  

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/tuitora.git
cd tuitora
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Africa's Talking Configuration
AFRICAS_TALKING_API_KEY=your_at_api_key
AFRICAS_TALKING_USERNAME=your_at_username

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Database Setup

Run the SQL schema in your Supabase SQL editor:

```sql
-- Complete schema available in src/lib/supabase-schema.sql
-- This creates all tables, RLS policies, and indexes
```

### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

---

## 🏫 School Registration Flow

### For New Schools
1. Visit landing page and click "Get Started Free"  
2. Enter school information (name, contact, URL slug, address, phone)  
3. Create admin account (name, email, password)  
4. System generates unique `school_id` and sets up initial sample data  

### For Existing Schools
- Use search to find school  
- Request to join existing school  
- Admin approval  
- Role assignment  

---

## 📱 SMS & USSD Configuration

### SMS Setup
- Africa's Talking Dashboard → SMS → Settings  
- Configure callback URLs:
  - Delivery Reports: `https://your-domain.com/api/sms/delivery-report`  
  - Incoming Messages: `https://your-domain.com/api/sms/incoming`  
- Ensure short code `15680` is active  
- Configure auto-responses for keywords (`STOP`, `HELP`)  

### USSD Setup
- Africa's Talking Dashboard → USSD → Services  
- Service Code: `*384*38164#`  
- Callback URL: `https://your-domain.com/api/ussd/callback`  
- HTTP Method: POST  
- Content Type: `application/x-www-form-urlencoded`  

### Testing

*Development Testing*
```bash
# Test SMS API
curl -X POST http://localhost:3000/api/sms/send   -H "Content-Type: application/json"   -d '{"to":["0712345678"],"message":"Test SMS"}'

# Test USSD API
curl -X POST http://localhost:3000/api/ussd/session   -H "Content-Type: application/json"   -d '{"phoneNumber":"0712345678"}'
```

*Production Testing*
- SMS: Send to short code `15680`  
- USSD: Dial `*384*38164#` from Kenyan SIM  
- Monitor via Africa's Talking dashboard  

---

## 👥 User Roles & Permissions

| Feature             | Superadmin | School Admin | Teacher | Parent | Student |
|--------------------|------------|--------------|--------|--------|---------|
| View Dashboard      | ✅         | ✅           | ✅     | ✅     | ✅      |
| Manage Schools      | ✅         | ❌           | ❌     | ❌     | ❌      |
| Manage Users        | ✅         | ✅           | ❌     | ❌     | ❌      |
| Send Messages       | ✅         | ✅           | ✅     | ✅     | ❌      |
| Mark Attendance     | ✅         | ✅           | ✅     | ❌     | ❌      |
| View Payments       | ✅         | ✅           | ✅     | ❌     | ❌      |
| Bulk SMS            | ✅         | ✅           | ❌     | ❌     | ❌      |

---

## 🗄 Database Schema

**Core Tables:** `schools`, `profiles`, `students`, `attendance`, `payments`, `messages`, `parent_student_relationships`  

**Row Level Security (RLS):**  
- Data isolation between schools  
- Role-based access control  
- Secure multi-tenant architecture  

---

## 🔧 API Endpoints

**SMS:** `/api/sms/send`, `/api/sms/bulk`, `/api/sms/delivery-report`, `/api/sms/incoming`  
**USSD:** `/api/ussd/callback`, `/api/ussd/session`, `/api/ussd/status`  
**School Management:** `/api/schools/invite`, `/api/schools/[slug]`  

---

## 🎨 UI Components

```
src/components/
├── Layout.tsx
├── LeftSidebar.tsx
├── RightSidebar.tsx
└── ModalManager.tsx
```

**Modals:** `ComposeMessageModal`, `MarkAttendanceModal`, `RecordPaymentModal`, `AddUserModal`, `SendBulkSMSModal`  

---

## 🚀 Deployment

- Connect repo to Vercel  
- Configure environment variables  
- Build: `npm run build`  
- Automatic deployments on git push  

**Production Environment Variables**
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
AFRICAS_TALKING_API_KEY=your_production_at_key
AFRICAS_TALKING_USERNAME=your_production_at_username
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Supabase Production Setup:** migration, RLS, backups  

---

## 📊 Monitoring & Analytics

- Africa's Talking: SMS delivery, USSD sessions, billing  
- Vercel Analytics: frontend performance  
- Supabase Dashboard: database usage  
- Custom audit logs: track user actions  

---

## 🐛 Troubleshooting

**SMS Issues:** balance, short code active, callback URLs, API keys  
**USSD Issues:** service code active, POST callback, content type, Kenyan SIM  
**Database Issues:** RLS, roles, connection strings, Supabase dashboard  

**Debug Mode**
```env
NODE_ENV=development
DEBUG=true
```

---

## 🤝 Contributing

- Fork repo  
- Create feature branch  
- Commit and push  
- Open Pull Request  

**Code Standards:** TypeScript, React best practices, documentation, tests  

---

## 📞 Support

**Documentation:** User guide, API reference, deployment guide  
**Community:** GitHub Issues, Email: support@tuitora.com, Community forum  
**Enterprise:** `enterprise@tuitora.com` – custom features, priority support, white-label, API access  

---

## 📄 License

MIT License – see LICENSE file  

---

## 🙏 Acknowledgments

- Africa's Talking  
- Supabase  
- Vercel  
- Tailwind CSS  

Tuitora – Modern school management for African educational institutions. Built with ❤️ for the future of education.  

[https://tuitora.com](https://tuitora.com) | hello@tuitora.com
