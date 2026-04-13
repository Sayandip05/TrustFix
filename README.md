# TrustFix

> "The Zomato of Home Services — Built for Bharat, Powered by AI"

A two-sided marketplace for on-demand verified home services with AI-powered quotes, escrow payments, and real-time tracking.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Local Setup](#local-setup)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Seed Data](#seed-data)
8. [Testing](#testing)
9. [Project Structure](#project-structure)
10. [Tech Stack](#tech-stack)
11. [API Documentation](#api-documentation)
12. [Contributing](#contributing)
13. [License](#license)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/TrustFix.git
cd TrustFix

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # On Linux/Mac: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
copy .env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Python | 3.10+ | Backend runtime |
| Node.js | 18+ | Frontend development |
| PostgreSQL | 14+ | Primary database |
| Redis | 6+ | Cache and queue |
| Git | 2.x | Version control |

### Required Accounts

- [Railway.app](https://railway.app) - Hosting (or local PostgreSQL/Redis)
- [Razorpay](https://razorpay.com) - Payment processing
- [Firebase](https://firebase.google.com) - Push notifications
- [Groq](https://groq.com) - AI quote generation
- [Mapbox](https://mapbox.com) - Maps and geocoding

---

## Environment Variables

### Backend (.env)

```bash
# Django
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=trustfix
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT Authentication
JWT_SECRET_KEY=your-jwt-secret
JWT_ACCESS_TOKEN_LIFETIME=1d
JWT_REFRESH_TOKEN_LIFETIME=7d

# Razorpay
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret

# Firebase
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-credentials.json

# AI Services
ANTHROPIC_API_KEY=your-anthropic-key
GEMINI_API_KEY=your-gemini-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Mapbox
MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

---

## Local Setup

### Backend Setup

```bash
# Navigate to project root
cd TrustFix

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env
# Edit .env with your configuration

# Run database migrations
python manage.py migrate

# Create superuser (admin access)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Customer App Setup

```bash
# Navigate to customer app directory
cd customer-app

# Install dependencies
npm install

# Start development server
npm start
```

### Technician PWA Setup

```bash
# Navigate to technician PWA directory
cd technician-pwa

# Install dependencies
npm install

# Start development server
npm start
```

### Admin Dashboard Setup

```bash
# Navigate to admin dashboard directory
cd admin-dashboard

# Install dependencies
npm install

# Start development server
npm start
```

---

## Database Setup

### Local PostgreSQL

```bash
# Create database
createdb trustfix

# Enable PostGIS extension
psql -d trustfix -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### Migrations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations

# Reset database (development only)
python manage.py migrate --run-syncdb
```

### Redis Setup

```bash
# Start Redis server
redis-server

# Test Redis connection
redis-cli ping
```

---

## Running the Application

### Development Mode

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Django
python manage.py runserver

# Terminal 3: Start Celery worker (background tasks)
celery -A config worker -l info
```

### Docker Mode

```bash
# Build and start all services
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
```

---

## Seed Data

### Create Initial Data

```bash
# Load seed data
python manage.py loaddata seed_data.json

# Create test cities
python manage.py create_cities

# Create test service categories
python manage.py create_services

# Create test users (customers and technicians)
python manage.py create_test_users
```

### Seed Data Categories

```python
SERVICE_CATEGORIES = [
    {'name': 'Plumbing', 'slug': 'plumbing', 'base_price_min': 300, 'base_price_max': 800, 'emergency_multiplier': 1.4},
    {'name': 'Electrical', 'slug': 'electrical', 'base_price_min': 300, 'base_price_max': 600, 'emergency_multiplier': 1.4},
    {'name': 'AC Service', 'slug': 'ac-service', 'base_price_min': 500, 'base_price_max': 3000, 'emergency_multiplier': 1.5},
    {'name': 'Carpentry', 'slug': 'carpentry', 'base_price_min': 400, 'base_price_max': 1200, 'emergency_multiplier': 1.4},
    {'name': 'Appliance Repair', 'slug': 'appliance-repair', 'base_price_min': 350, 'base_price_max': 1500, 'emergency_multiplier': 1.4},
]
```

### Test Credentials

```bash
# Admin user
Username: admin
Email: admin@trustfix.com
Password: admin123

# Test customer
Phone: +919876543210
OTP: 123456

# Test technician
Phone: +919876543211
OTP: 123456
```

---

## Testing

### Backend Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.users
python manage.py test apps.bookings
python manage.py test apps.technicians

# Run with coverage
coverage run --manage.py test
coverage report
```

### API Tests

```bash
# Using HTTPie
http GET http://localhost:8000/api/health/
http POST http://localhost:8000/api/auth/otp/send/ phone="+919876543210"
```

---

## Project Structure

```
TrustFix/
├── apps/
│   ├── users/               # User authentication & management
│   │   ├── models.py        # User, Address models
│   │   ├── views.py         # Auth views, profile views
│   │   ├── serializers.py  # DRF serializers
│   │   └── urls.py          # URL routing
│   ├── technicians/         # Technician profiles
│   │   ├── models.py        # TechnicianProfile, Skill models
│   │   ├── views.py         # Search, profile views
│   │   ├── serializers.py   # DRF serializers
│   │   └── urls.py          # URL routing
│   ├── bookings/            # Booking lifecycle
│   │   ├── models.py        # Booking, Quote, Review models
│   │   ├── views.py         # Booking CRUD views
│   │   ├── serializers.py   # DRF serializers
│   │   └── urls.py          # URL routing
│   └── services/            # Service categories
│       ├── models.py        # ServiceCategory, ServiceSubCategory
│       └── views.py         # Service views
├── config/
│   ├── settings.py          # Django settings
│   ├── urls.py              # URL routing
│   ├── wsgi.py              # WSGI config
│   └── asgi.py              # ASGI config (WebSocket)
├── docs/                     # Documentation
├── requirements.txt
├── manage.py
├── .env.example
└── README.md
```

---

## Tech Stack

### Backend

| Component | Technology |
|-----------|------------|
| Framework | Django 5.x + DRF |
| Database | PostgreSQL + PostGIS |
| Cache | Redis |
| Task Queue | Celery |
| AI | Groq API (Free) |
| Authentication | JWT |

### Frontend

| Component | Technology |
|-----------|------------|
| Customer App | React Native (Expo) |
| Technician App | React PWA |
| Admin Dashboard | React + Recharts |
| Navigation | React Navigation |

### External Services

| Service | Purpose |
|---------|---------|
| Razorpay | Payments & Escrow |
| Firebase FCM | Push Notifications |
| MSG91 | SMS |
| Interakt | WhatsApp |
| Mapbox | Maps |

---

## API Documentation

### Authentication

```
POST /api/auth/otp/send/          - Send OTP to phone
POST /api/auth/otp/verify/        - Verify OTP, get JWT token
POST /api/auth/signup/customer/   - Customer signup
POST /api/auth/signup/technician/ - Technician signup
```

### Profile

```
GET  /api/users/profile/         - Get current user profile
PATCH /api/users/profile/        - Update profile
```

### Service Categories

```
GET /api/services/                - List all service categories
GET /api/services/{id}/           - Get service details
GET /api/services/{id}/sub-categories/ - Get sub-categories
```

### Technicians

```
GET /api/technicians/search/?lat=XX&lng=XX&service_id=XX - Search nearby technicians
GET /api/technicians/{id}/        - Get technician details
GET /api/technicians/me/profile/  - My technician profile
PATCH /api/technicians/me/profile/ - Update profile
POST /api/technicians/me/toggle-availability/ - Go online/offline
GET /api/technicians/me/nearby-jobs/ - Available jobs
```

### Bookings

```
POST /api/bookings/create/                  - Create new booking
GET /api/bookings/my-bookings/             - List my bookings
GET /api/bookings/{id}/                    - Get booking details
POST /api/bookings/{id}/status/            - Update booking status
POST /api/bookings/quotes/create/          - Submit quote (technician)
POST /api/bookings/quotes/accept/          - Accept quote (customer)
POST /api/bookings/{id}/reviews/create/   - Create review
```

### Payments

```
POST /api/payments/create-order/           - Create Razorpay order
POST /api/payments/verify/                 - Verify payment
POST /api/payments/release/                - Release escrow to technician
```

---

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) for Python
- Follow [Airbnb Style Guide](https://github.com/airbnb/javascript) for JavaScript
- Use meaningful variable and function names
- Write docstrings for all public functions

### Commit Messages

```
feat: add new booking feature
fix: resolve payment timeout issue
docs: update API documentation
refactor: simplify booking state machine
test: add tests for payment flow
```

### Pull Request Guidelines

- Ensure all tests pass
- Update documentation for any changes
- Add tests for new features
- Follow the code style guidelines

---

## Project Status

### Completed

- [x] User authentication with phone OTP
- [x] Customer & Technician signup flows
- [x] Service categories and skills management
- [x] Technician profiles with location, skills, pricing
- [x] Booking creation and lifecycle management
- [x] Quote system (technicians bid on jobs)
- [x] Review and rating system
- [x] Admin panel for managing users and bookings

### In Progress

- [ ] AI Quote Agent integration (Groq API)
- [ ] Payment integration (Razorpay escrow)
- [ ] Push notifications (Firebase)
- [ ] Real-time location tracking (WebSocket)

### Upcoming

- [ ] SMS integration (MSG91/Twilio)
- [ ] WhatsApp notifications (Interakt)
- [ ] Background job processing (Celery)
- [ ] Advanced technician matching algorithm
- [ ] Fraud detection for reviews
- [ ] Customer React Native app
- [ ] Technician PWA
- [ ] Admin Dashboard (React)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

- Documentation: [docs.trustfix.com](https://docs.trustfix.com)
- Issues: [GitHub Issues](https://github.com/yourusername/TrustFix/issues)
- Email: support@trustfix.com

---

*Built for Bharat. One tap. Verified tech. Paid when done.*

*TrustFix — The last home services app your city will ever need.*
