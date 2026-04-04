# TrustFix - Home Services Marketplace

A two-sided marketplace for on-demand verified home services — plumbers, electricians, AC technicians, carpenters, and more.

## Project Status

### Completed

#### Backend (Django)
- [x] User authentication with phone OTP
- [x] Customer & Technician signup flows
- [x] Service categories and skills management
- [x] Technician profiles with location, skills, pricing
- [x] Booking creation and lifecycle management
- [x] Quote system (technicians bid on jobs)
- [x] Review and rating system
- [x] Admin panel for managing users and bookings

#### Database Models
- [x] User model (phone-based auth)
- [x] ServiceCategory, ServiceSubCategory, Skill models
- [x] TechnicianProfile with verification status
- [x] Booking model with full status tracking
- [x] Quote, Review, BookingImage models

#### API Endpoints
- [x] Authentication: OTP send/verify, signup
- [x] Profile management
- [x] Technician search by location & service
- [x] Booking CRUD operations
- [x] Quote creation and acceptance
- [x] Status updates (arrived, started, completed)

### In Progress

- [ ] AI Quote Agent integration (Gemini/Claude API)
- [ ] Payment integration (Razorpay escrow)
- [ ] Push notifications (Firebase)
- [ ] Real-time location tracking (WebSocket)

### Upcoming

#### Backend
- [ ] SMS integration (MSG91/Twilio)
- [ ] WhatsApp notifications (Interakt)
- [ ] Background job processing (Celery)
- [ ] Advanced technician matching algorithm
- [ ] Fraud detection for reviews
- [ ] Analytics dashboard endpoints

#### Frontend
- [ ] Customer React Native app
- [ ] Technician PWA
- [ ] Admin Dashboard (React)

#### DevOps
- [ ] PostgreSQL + PostGIS setup
- [ ] Redis configuration
- [ ] Railway deployment
- [ ] CI/CD pipeline

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Django + Django REST Framework |
| Database | SQLite (dev) → PostgreSQL + PostGIS (prod) |
| Cache | Redis |
| Auth | JWT (djangorestframework-simplejwt) |
| Customer App | React Native (Expo) |
| Technician App | React PWA |
| Admin Dashboard | React |
| Payments | Razorpay |
| AI | Gemini Flash / Claude Haiku |
| Hosting | Railway |

## Quick Start

```bash
# Setup
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py shell
>>> from apps.users.models import User
>>> User.objects.create_superuser('+919999999999', 'Admin', 'password123')

# Run server
python manage.py runserver
```

## API Documentation

### Authentication
```
POST /api/users/auth/otp/send/          - Send OTP
POST /api/users/auth/otp/verify/        - Verify OTP
POST /api/users/auth/signup/customer/   - Customer signup
POST /api/users/auth/signup/technician/ - Technician signup
```

### Profile
```
GET    /api/users/profile/              - Get profile
PATCH  /api/users/profile/              - Update profile
```

### Technicians (Customer)
```
GET /api/technicians/search/?lat=XX&lng=XX&service_id=XX - Search nearby
GET /api/technicians/<id>/                               - View details
```

### Technicians (Technician)
```
GET    /api/technicians/me/profile/           - My profile
PATCH  /api/technicians/me/profile/           - Update profile
POST   /api/technicians/me/toggle-availability/ - Go online/offline
GET    /api/technicians/me/nearby-jobs/       - Available jobs
```

### Bookings
```
POST   /api/bookings/create/                  - Create booking
GET    /api/bookings/my-bookings/             - List bookings
GET    /api/bookings/<id>/                    - Booking details
POST   /api/bookings/<id>/status/             - Update status
POST   /api/bookings/quotes/create/           - Send quote
POST   /api/bookings/quotes/accept/           - Accept quote
POST   /api/bookings/reviews/create/          - Create review
```

## Project Structure

```
trustfix/
├── apps/
│   ├── users/           # Authentication & user management
│   ├── services/        # Service categories & skills
│   ├── technicians/     # Technician profiles & search
│   └── bookings/        # Bookings, quotes, reviews
├── config/              # Django settings
├── docs/                # Documentation
├── frontend/            # React Native & React apps (upcoming)
└── manage.py
```

## Next Steps

1. **Test the API** - Use Postman/curl to test all endpoints
2. **Add sample data** - Create service categories and skills
3. **Build frontend** - Start with Customer React Native app
4. **Integrate payments** - Add Razorpay escrow flow
5. **Add AI quotes** - Integrate Gemini for price estimation

---

*Built for Bharat. One tap. Verified tech. Paid when done.*
