# DiagPro Car Maintenance Center Backend API

مركز التشخيص الاحترافي للسيارات - واجهة برمجة التطبيقات الخلفية

## 🌟 Features / المميزات

### Core Functionality / الوظائف الأساسية
- ✅ **Bookings Management** / إدارة الحجوزات
- ✅ **Services Management** / إدارة الخدمات
- ✅ **Customer Management** / إدارة العملاء
- ✅ **Payment Gateway Integration (Moyasar)** / تكامل بوابة الدفع (ميسر)
- ✅ **Smart Assistant for Fault Prediction** / المساعد الذكي للتنبؤ بالأعطال

### Technical Features / المميزات التقنية
- ✅ **Arabic RTL Support** / دعم العربية من اليمين لليسار
- ✅ **Bilingual API (Arabic/English)** / واجهة برمجة تطبيقات ثنائية اللغة
- ✅ **RESTful API Design** / تصميم واجهة برمجة تطبيقات RESTful
- ✅ **MongoDB Database Integration** / تكامل قاعدة بيانات MongoDB
- ✅ **Request Validation** / التحقق من صحة الطلبات
- ✅ **Error Handling** / معالجة الأخطاء
- ✅ **Security Middleware** / برمجيات الأمان الوسطية
- ✅ **Rate Limiting** / تحديد معدل الطلبات
- ✅ **Logging** / نظام التسجيل

## 🚀 Quick Start / البدء السريع

### Prerequisites / المتطلبات المسبقة
- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm >= 8.0.0

### Installation / التثبيت

1. **Clone the repository / استنساخ المستودع**
```bash
git clone https://github.com/Admindiagpro/DiagPro-website.git
cd DiagPro-website
```

2. **Install dependencies / تثبيت التبعيات**
```bash
npm install
```

3. **Setup environment variables / إعداد متغيرات البيئة**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB / تشغيل MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name diagpro-mongo mongo:latest

# Or start your local MongoDB service
```

5. **Seed the database (optional) / إضافة بيانات تجريبية (اختياري)**
```bash
npm run seed
```

6. **Start the server / تشغيل الخادم**
```bash
# Development mode / وضع التطوير
npm run dev

# Production mode / وضع الإنتاج
npm start
```

## 📚 API Endpoints / نقاط النهاية لواجهة برمجة التطبيقات

### Core Endpoints / النقاط الأساسية
- `GET /health` - Health check / فحص الصحة
- `GET /` - API information / معلومات واجهة برمجة التطبيقات

### Customers / العملاء
- `GET /api/customers` - List customers / قائمة العملاء
- `POST /api/customers` - Create customer / إنشاء عميل
- `GET /api/customers/:id` - Get customer / الحصول على عميل
- `PUT /api/customers/:id` - Update customer / تحديث عميل
- `DELETE /api/customers/:id` - Delete customer / حذف عميل

### Services / الخدمات
- `GET /api/services` - List services / قائمة الخدمات
- `POST /api/services` - Create service / إنشاء خدمة
- `GET /api/services/:id` - Get service / الحصول على خدمة
- `PUT /api/services/:id` - Update service / تحديث خدمة
- `GET /api/services/popular` - Popular services / الخدمات الشائعة

### Bookings / الحجوزات
- `GET /api/bookings` - List bookings / قائمة الحجوزات
- `POST /api/bookings` - Create booking / إنشاء حجز
- `GET /api/bookings/:id` - Get booking / الحصول على حجز
- `PUT /api/bookings/:id` - Update booking / تحديث حجز
- `PATCH /api/bookings/:id/status` - Update status / تحديث الحالة
- `GET /api/bookings/available-slots` - Available slots / المواعيد المتاحة

### Payments / المدفوعات
- `POST /api/payments/create` - Create payment / إنشاء دفعة
- `GET /api/payments/status/:bookingId` - Payment status / حالة الدفع
- `POST /api/payments/refund/:bookingId` - Process refund / معالجة الاسترداد
- `GET /api/payments/methods` - Payment methods / طرق الدفع

### Smart Assistant / المساعد الذكي
- `POST /api/assistant/predict-faults` - Predict faults / التنبؤ بالأعطال
- `POST /api/assistant/chat` - Chat with assistant / الدردشة مع المساعد
- `POST /api/assistant/analyze-symptoms` - Analyze symptoms / تحليل الأعراض
- `GET /api/assistant/maintenance-schedule/:vehicleId` - Maintenance schedule / جدول الصيانة

## 🔧 Configuration / التكوين

### Environment Variables / متغيرات البيئة

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/diagpro |
| `MOYASAR_API_KEY` | Moyasar payment gateway API key | - |
| `JWT_SECRET` | JWT secret for authentication | - |

## 🌐 Arabic RTL Support / دعم العربية من اليمين لليسار

The API provides full Arabic RTL support:
- Arabic field names and descriptions / أسماء الحقول والأوصاف بالعربية
- RTL-aware responses / استجابات متوافقة مع الاتجاه من اليمين لليسار
- Language detection via headers / كشف اللغة عبر العناوين
- Bilingual error messages / رسائل الخطأ ثنائية اللغة

### Usage Examples / أمثلة الاستخدام

```bash
# English response
curl -H "Accept-Language: en" http://localhost:3000/

# Arabic response / استجابة عربية
curl -H "Accept-Language: ar" http://localhost:3000/
```

## 🛠️ Development / التطوير

### Scripts / السكريبتات
```bash
npm run dev        # Start development server / تشغيل خادم التطوير
npm run start      # Start production server / تشغيل خادم الإنتاج
npm run test       # Run tests / تشغيل الاختبارات
npm run lint       # Run linter / تشغيل فاحص الكود
npm run seed       # Seed database / إضافة بيانات تجريبية
```

### Project Structure / هيكل المشروع
```
src/
├── config/         # Configuration files / ملفات التكوين
├── controllers/    # Route controllers / وحدات تحكم المسارات
├── middleware/     # Custom middleware / البرمجيات الوسطية المخصصة
├── models/         # Database models / نماذج قاعدة البيانات
├── routes/         # API routes / مسارات واجهة برمجة التطبيقات
├── services/       # Business logic / المنطق التجاري
├── utils/          # Utility functions / وظائف مساعدة
└── validators/     # Input validators / أدوات التحقق من المدخلات
```

---

**DiagPro Team** / فريق التشخيص الاحترافي  
🚗 Making car maintenance smarter / نجعل صيانة السيارات أذكى
