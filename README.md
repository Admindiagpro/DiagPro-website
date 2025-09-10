# DiagPro Car Maintenance Center API

A comprehensive backend system for managing car maintenance center operations including appointments, services, customers, payments, and smart diagnostics.

## Features

### 🚗 Customer Management
- User registration and authentication
- Customer profiles with vehicle management
- Loyalty points and membership tiers
- Service history tracking

### 🔧 Service Management
- Comprehensive service catalog
- Category-based organization
- Pricing and duration management
- Service recommendations

### 📅 Advanced Booking System
- Real-time availability checking
- Conflict detection
- Multiple time slot management
- Appointment lifecycle management

### 💳 Payment Integration (Moyasar)
- Secure payment processing
- Payment verification
- Refund management
- Payment history tracking

### 🤖 Smart Assistant
- AI-powered fault prediction
- Symptom analysis
- Maintenance recommendations
- Customer support chat

## API Endpoints

### Authentication & Customers
```
POST   /api/customers/register     - Register new customer
POST   /api/customers/login        - Customer login
GET    /api/customers              - Get all customers (Admin)
GET    /api/customers/:id          - Get customer by ID
PUT    /api/customers/:id          - Update customer
DELETE /api/customers/:id          - Delete customer
POST   /api/customers/:id/vehicles - Add vehicle to customer
PUT    /api/customers/:id/vehicles/:vehicleId - Update vehicle
DELETE /api/customers/:id/vehicles/:vehicleId - Remove vehicle
```

### Services
```
GET    /api/services               - Get all services
GET    /api/services/:id           - Get service by ID
POST   /api/services               - Create new service (Admin)
PUT    /api/services/:id           - Update service (Admin)
DELETE /api/services/:id           - Delete service (Admin)
GET    /api/services/categories    - Get service categories
GET    /api/services/popular       - Get popular services
GET    /api/services/recommendations - Get service recommendations
PATCH  /api/services/:id/popularity - Update service popularity
```

### Appointments
```
GET    /api/appointments           - Get all appointments
GET    /api/appointments/:id       - Get appointment by ID
POST   /api/appointments           - Create new appointment
PUT    /api/appointments/:id       - Update appointment
PATCH  /api/appointments/:id/cancel - Cancel appointment
GET    /api/appointments/availability - Check available time slots
GET    /api/appointments/dashboard - Get dashboard statistics (Admin)
```

### Payments (Moyasar Integration)
```
POST   /api/payments/create        - Create payment
POST   /api/payments/verify        - Verify payment (Webhook)
GET    /api/payments/status/:paymentId - Get payment status
POST   /api/payments/refund        - Process refund (Admin)
GET    /api/payments/history/:customerId - Get payment history
```

### Smart Assistant
```
POST   /api/smart-assistant/predict-faults - Predict potential faults
POST   /api/smart-assistant/maintenance-advice - Get maintenance advice
POST   /api/smart-assistant/chat - Chat with assistant
POST   /api/smart-assistant/analyze-symptoms - Analyze symptoms
POST   /api/smart-assistant/service-suggestions - Get service suggestions
```

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DiagPro-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Copy `.env.example` to `.env` and update the variables:
   ```bash
   cp .env.example .env
   ```

4. **Required Environment Variables**
   - `MONGODB_URI` - MongoDB connection string
   - `JWT_SECRET` - JWT signing secret
   - `MOYASAR_API_KEY` - Moyasar API key
   - `MOYASAR_SECRET_KEY` - Moyasar secret key
   - `OPENAI_API_KEY` - OpenAI API key for smart assistant

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Testing

Example curl commands:

### Test Smart Assistant
```bash
curl -X POST http://localhost:3000/api/smart-assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "My car is making noise"}'
```

### Test Main API
```bash
curl -X GET http://localhost:3000/
```

## Database Models

### Customer
- Personal information (name, email, phone, address)
- Multiple vehicles per customer
- Loyalty points and membership tier
- Authentication credentials

### Service
- Service details (name, description, category)
- Pricing and duration
- Vehicle type compatibility
- Popularity and rating metrics

### Appointment
- Customer and vehicle information
- Multiple services per appointment
- Date and time slot management
- Status tracking and payment information

## Smart Assistant Features

### Fault Prediction
- Analyzes customer-reported symptoms
- Cross-references with knowledge database
- Provides confidence ratings and urgency levels

### Maintenance Recommendations
- Mileage-based service intervals
- Time-based maintenance schedules
- Vehicle age considerations

## License

This project is licensed under the ISC License.
