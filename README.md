# Activity Management Application

A full-stack activity management system with authentication, role-based access control, calendar integration, WhatsApp notifications, and PDF report generation.

## 🚀 Features

- **Authentication**: JWT-based login/register with bcrypt password hashing
- **Role-Based Access**: User and Admin roles with protected routes
- **Activity Management**: Create, read, update (admin), delete (admin) activities
- **Multi-User Assignment**: Assign activities to multiple users
- **Interactive Calendar**: FullCalendar integration with date-click modals
- **Activity Reports**: Upload guest list and activity photos to complete reports
- **PDF Export**: Generate PDF reports with jsPDF
- **WhatsApp Notifications**: Twilio integration for reminders
- **Admin Dashboard**: View all users' activities, set reminders, manage everything

## 📋 Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn
- Twilio account (optional, for WhatsApp notifications)

## 🛠️ Installation

### 1. Clone and Setup

```bash
cd activity-management-app
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file (copy from .env.example and configure)
cp .env.example .env
```

Edit `.env` with your settings:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/activity-management
JWT_SECRET=your-secure-secret-key
JWT_EXPIRE=7d

# Twilio (optional)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Google Drive (required for file uploads)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
activity-management-app/
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth, role check, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API endpoints
│   ├── services/        # WhatsApp, scheduler services
│   ├── utils/           # Validation rules
│   └── server.js        # Express app entry
│
└── frontend/
    └── src/
        ├── components/  # Reusable UI components
        ├── context/     # Auth and Activity contexts
        ├── pages/       # Page components
        ├── services/    # API client
        └── styles/      # CSS
```

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get profile |

### Activities
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/activities` | User | Get user's activities |
| POST | `/api/activities` | User | Create activity |
| PUT | `/api/activities/:id` | Admin | Update activity |
| DELETE | `/api/activities/:id` | Admin | Delete activity |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports` | Create report with photos |
| GET | `/api/reports/:activityId` | Get activity report |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/activities` | Get all activities |
| PUT | `/api/admin/activities/:id/reminder` | Set reminder |
| GET | `/api/admin/users` | Get all users |
| GET | `/api/admin/stats` | Get dashboard stats |

## 🎨 Tech Stack

**Backend**: Express.js, MongoDB/Mongoose, JWT, bcrypt, Multer, Twilio

**Frontend**: React 18, Vite, React Router, Formik, FullCalendar, jsPDF

## 📝 Default Users

Register as a regular user, or set `role: "admin"` in your registration request for admin access.

## 📁 Google Drive Setup (for File Uploads)

1. Create a project at [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Google Drive API**
3. Create a **Service Account** (IAM & Admin → Service Accounts)
4. Download the JSON key file
5. Create a folder in Google Drive and **share it** with the service account email
6. Copy the folder ID from the URL: `https://drive.google.com/drive/folders/{FOLDER_ID}`

## 🚀 Deployment

**Backend**: Deploy to Render, Railway, or Heroku
**Frontend**: Deploy to Vercel or Netlify
**Database**: Use MongoDB Atlas
**File Storage**: Uses Google Drive (configure service account)

## License

MIT
