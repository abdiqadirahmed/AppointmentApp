# 🗓 Politician Appointment Scheduling App

A full-stack web application for managing 7-days-a-week appointment scheduling between a politician's office and citizens/stakeholders.

**Tech Stack:** Django REST Framework · Vite + React · TypeScript · Tailwind CSS v3 · SQLite

---

## 📁 Project Structure
```
AppointmentApp/
├── backend/          ← Django REST API
└── frontend/         ← Vite + React + Tailwind
```

---

## ⚡ Quick Start

### 1. Backend Setup (Django)

```bash
cd backend

# Create & activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env    # Windows
# cp .env.example .env    # macOS/Linux

# Run database migrations
python manage.py migrate

# Seed default weekly availability (Mon–Fri 8am–5pm)
python manage.py shell -c "
from appointments.models import Availability
defaults = [
    (0,'08:00','17:00',True,30,10,10),   # Monday
    (1,'08:00','17:00',True,30,10,10),   # Tuesday
    (2,'08:00','17:00',True,30,10,10),   # Wednesday
    (3,'08:00','17:00',True,30,10,10),   # Thursday
    (4,'08:00','17:00',True,30,10,10),   # Friday
    (5,'09:00','13:00',False,30,10,5),   # Saturday (inactive by default)
    (6,'09:00','13:00',False,30,10,5),   # Sunday (inactive by default)
]
for d,s,e,a,sd,bt,mx in defaults:
    Availability.objects.get_or_create(day_of_week=d, defaults={
        'start_time':s,'end_time':e,'is_active':a,
        'slot_duration':sd,'buffer_time':bt,'max_per_day':mx
    })
print('Done — availability seeded')
"

# Create admin user
python manage.py createsuperuser

# Start Django server
python manage.py runserver
```

The API will be available at: **http://127.0.0.1:8000/api/**

---

### 2. Frontend Setup (Vite + React + Tailwind)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxied to Django backend)
npm run dev
```

The app will be available at: **http://localhost:5173/**

---

### 3. Email / Reminder Scheduler (Optional)

Configure email in `backend/.env`, then run in a separate terminal:
```bash
cd backend
venv\Scripts\activate
python appointments/scheduler.py
```

---

## 🔑 Admin Login

After creating a superuser, visit: **http://localhost:5173/admin/login**

> Only `is_staff=True` users can log in to the admin portal.

---

## 🌐 Key URLs

| URL | Description |
|-----|-------------|
| `http://localhost:5173/` | Public booking portal |
| `http://localhost:5173/admin/login` | Admin login |
| `http://localhost:5173/admin` | Analytics overview |
| `http://localhost:5173/admin/calendar` | Calendar view |
| `http://localhost:5173/admin/appointments` | Appointments list |
| `http://localhost:5173/admin/settings` | Schedule settings |
| `http://127.0.0.1:8000/admin/` | Django admin panel |

---

## 📮 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/slots/?date=YYYY-MM-DD` | Get available time slots |
| POST | `/api/appointments/` | Submit appointment request |
| GET | `/api/captcha/` | Get CAPTCHA challenge |
| POST | `/api/captcha/verify/` | Verify CAPTCHA |

### Admin (Bearer token required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Admin login |
| GET | `/api/admin/appointments/` | List all appointments |
| PATCH | `/api/admin/appointments/:id/` | Update appointment status |
| GET | `/api/admin/calendar/` | Calendar data for month |
| GET/PUT | `/api/admin/availability/` | Weekly schedule config |
| GET/POST/DELETE | `/api/admin/blocked-dates/` | Blocked dates management |
| GET | `/api/admin/analytics/` | Statistics |

---

## 📧 Email Configuration (`.env`)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=Appointments <your-email@gmail.com>
```

> For Gmail, use an **App Password** (not your regular password).

---

## 🎨 Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#263138` | Headers, buttons, sidebar, highlights |
| Secondary | `#000000` | Text, dark elements |
| Gold Accent | `#c9a84c` | VIP badges, special accents |
| White | `#ffffff` | Backgrounds, cards |

---

## ✨ Features

- ✅ 7-day weekly appointment scheduling
- ✅ Public booking wizard (3-step with CAPTCHA)
- ✅ Admin dashboard with calendar & list views
- ✅ Approve / Cancel / Reschedule appointments
- ✅ Per-day working hours, slot duration & buffer time
- ✅ Lunch break configuration
- ✅ Daily appointment limits
- ✅ Blocked dates management
- ✅ VIP / Priority bookings
- ✅ Email confirmations & status updates
- ✅ Automated 24h and 1h reminders (scheduler.py)
- ✅ Analytics dashboard with trend charts
- ✅ JWT authentication for admin portal
- ✅ Double-booking prevention
- ✅ Mobile-responsive design
