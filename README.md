# 🚌 Bus Tracking System - Complete MERN Application

## 📌 Project Summary

A full-stack **MERN** application featuring:
- **3-Role System:** Admin, Driver/Conductor, User/Passenger
- **JWT Authentication:** Secure login/signup with token storage
- **Real-time Tracking:** Socket.IO integration for live bus updates
- **Role-Based Dashboards:** Customized UIs for each user type
- **MongoDB Integration:** Persistent data storage with Mongoose schemas
- **API-First Architecture:** RESTful endpoints with proper error handling

---

## 🏗️ Project Structure

```
WDprojectcopy/
│
├── backend/
│   ├── app.js                          # Express app setup
│   ├── index.js                        # Server entry point
│   ├── package.json                    # Dependencies
│   │
│   ├── config/
│   │   ├── db.js                       # MongoDB connection
│   │   └── socket.js                   # Socket.IO event handlers
│   │
│   ├── models/
│   │   ├── User.js                     # User schema (with roles)
│   │   ├── Bus.js                      # Bus schema (with location)
│   │   ├── Location.js                 # Location history schema
│   │   ├── registerSchema.js           # Registration form schema
│   │   └── Contact.js                  # Contact form submissions
│   │
│   ├── controllers/
│   │   ├── authController.js           # Signup, login, profile
│   │   ├── driverController.js         # Bus registration, location updates
│   │   ├── adminController.js          # Dashboard stats, user management
│   │   ├── userController.js           # Bus search, tracking
│   │   ├── contactController.js        # Contact form handling
│   │   └── registrationController.js   # Registration handling
│   │
│   ├── routes/
│   │   ├── authRoutes.js               # /api/auth endpoints
│   │   ├── driverRoutes.js             # /api/driver endpoints
│   │   ├── adminRoutes.js              # /api/admin endpoints
│   │   ├── userRoutes.js               # /api/user endpoints
│   │   ├── contactRoutes.js            # /api/contact endpoints
│   │   └── registrationRoutes.js       # /api/registration endpoints
│   │
│   ├── middleware/
│   │   ├── auth.js                     # JWT verification & role checks
│   │   ├── errorHandler.js             # Centralized error handling
│   │   └── validation.js               # Input validation schemas
│   │
│   └── utils/
│       └── seeData.js                  # Seed data utilities
│
├── frontend/
│   ├── index.html                      # HTML entry point
│   ├── vite.config.js                  # Vite configuration
│   ├── eslint.config.js                # Linting config
│   ├── package.json                    # Dependencies
│   ├── .env.local                      # Environment variables
│   │
│   ├── src/
│   │   ├── App.jsx                     # Main app with routing
│   │   ├── App.css                     # Global styles
│   │   ├── main.jsx                    # React entry point
│   │   ├── index.css                   # Base CSS
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Navigation with auth
│   │   │   └── ProtectedRoute.jsx      # Route protection wrapper
│   │   │
│   │   └── pages/
│   │       ├── Home.jsx                # Landing page
│   │       ├── About.jsx               # About page
│   │       ├── Contact.jsx             # Contact form
│   │       ├── JoinBeta.jsx            # Beta signup
│   │       ├── Login.jsx               # Login page ⭐
│   │       ├── Signup.jsx              # Signup page ⭐
│   │       ├── AdminDashboard.jsx      # Admin UI ⭐
│   │       ├── DriverDashboard.jsx     # Driver UI ⭐
│   │       └── UserDashboard.jsx       # User/Passenger UI ⭐
│   │
│   └── public/                         # Static assets
│
└── TESTING_GUIDE.md                    # Complete testing guide
```

**⭐ = New/Enhanced for authentication system**

---

## 🔐 Authentication System

### User Roles & Permissions

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| **Admin** | View all buses/drivers/users, see dashboard stats, manage drivers | Register bus, track themselves |
| **Driver** | Register bus, update location/seats/ETA in real-time, start/stop service | See other buses, access admin stats |
| **User** | Search buses, view live location, see availability, track bus | Register bus, modify any bus data |

### JWT Flow

```
1. User Signup/Login
   ↓
2. Backend validates credentials
   ↓
3. Backend generates JWT token (7 days validity)
   ↓
4. Frontend stores token in localStorage
   ↓
5. Every API request includes: Authorization: Bearer <token>
   ↓
6. Backend verifies token + role
   ↓
7. Request processed or 401/403 returned
```

---

## 🛣️ API Endpoints

### Authentication Routes (`/api/auth`)
```
POST   /signup              - Create new user (body: firstName, lastName, email, password, phone, role)
POST   /login               - Login user (body: email, password)
GET    /profile             - Get current user (requires token)
```

### Driver Routes (`/api/driver`)
```
POST   /register            - Register new bus (requires driver role)
GET    /buses               - Get driver's buses
GET    /bus/:busId          - Get bus details
POST   /location            - Update bus location (lat, lng, eta)
PATCH  /bus/:busId/seats    - Update available seats
POST   /bus/:busId/start    - Start service
POST   /bus/:busId/stop     - Stop service
```

### Admin Routes (`/api/admin`)
```
GET    /buses               - Get all buses (with filters)
GET    /buses/live          - Get only live buses
GET    /bus/:busId          - Bus details
GET    /drivers             - Get all drivers
GET    /driver/:driverId    - Driver details
GET    /users              - Get all users
GET    /stats              - Dashboard statistics
PATCH  /driver/:driverId/status - Activate/deactivate driver
PATCH  /bus/:busId/maintenance  - Set maintenance status
```

### User Routes (`/api/user`)
```
GET    /buses              - Get all active buses
GET    /buses/search?route=X - Filter buses by route
GET    /bus/:busId         - Bus details
GET    /buses/nearby       - Nearby buses (geospatial)
GET    /routes             - Available routes list
```

---

## 💾 Database Schemas

### User Schema
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed with bcryptjs),
  phone: String,
  role: ['user', 'admin', 'driver'],
  
  // Driver-specific fields
  busTaken: Mongoose.Schema.Types.ObjectId (reference to Bus),
  licenseNumber: String,
  licenseExpiry: Date,
  isActive: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Bus Schema
```javascript
{
  busNumber: String (unique),
  routeName: String,
  driverId: ObjectId (reference to User),
  capacity: Number,
  seatsAvailable: Number,
  status: ['active', 'inactive', 'maintenance'],
  
  currentLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date,
    speed: Number,
    eta: String
  },
  
  stops: [{
    name: String,
    latitude: Number,
    longitude: Number,
    arrivalTime: Date
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### Location Schema
```javascript
{
  busId: ObjectId (reference to Bus),
  latitude: Number,
  longitude: Number,
  timestamp: Date,
  speed: Number,
  eta: String
}
```

---

## 🔌 Socket.IO Events

### Driver Events
```javascript
// Driver joins tracking for their bus
socket.on('driver:joinBus', (busId) => {
  // Joins room: 'bus-${busId}'
});

// Driver updates location in real-time
socket.on('driver:updateLocation', (data) => {
  // Broadcasts to all connected users tracking this bus
  // {busId, latitude, longitude, speed, eta}
});

// Driver updates available seats
socket.on('driver:updateSeats', (data) => {
  // {busId, seatsAvailable}
});

// Driver starts service (bus goes live)
socket.on('driver:startService', (busId) => {
  // Broadcasts status change to admin + users
});

// Driver stops service (bus goes offline)
socket.on('driver:stopService', (busId) => {
  // Broadcasts status change
});
```

### User Events
```javascript
// User joins tracking for specific bus
socket.on('user:joinTracking', (busId) => {
  // Joins room: 'bus-${busId}'
});

// Get all live buses
socket.on('getBuses', (callback) => {
  // Returns array of all active buses
});
```

### Admin Events
```javascript
// Admin joins dashboard
socket.on('admin:joinDashboard', (callback) => {
  // Joins room: 'admin-dashboard'
  // Receives real-time stats updates
});
```

---

## 🎯 Frontend Architecture

### Component Hierarchy
```
App.jsx
├── Navbar.jsx (Auth-aware navigation)
├── ProtectedRoute.jsx (Role checking wrapper)
│
├── Home.jsx (Public)
├── About.jsx (Public)
├── Contact.jsx (Public)
├── JoinBeta.jsx (Public)
│
├── Login.jsx (Public, redirects if logged in)
├── Signup.jsx (Public, redirects if logged in)
│
└── Protected Routes:
    ├── AdminDashboard.jsx (role="admin" only)
    │   ├── Overview Tab (Stats)
    │   ├── Buses Tab (Management)
    │   └── Drivers Tab (Status)
    │
    ├── DriverDashboard.jsx (role="driver" only)
    │   ├── My Buses
    │   ├── Update Location
    │   ├── Update Seats
    │   └── Service Control
    │
    └── UserDashboard.jsx (role="user" only)
        ├── Route Filter
        ├── Bus Cards
        └── Bus Details Modal
```

### State Management
- **localStorage:** Stores JWT token and user info
- **React State:** Component-level data (forms, modals, loading states)
- **API Calls:** Axios for backend communication
- **Real-time:** Socket.IO for live updates

### Key Dependencies
```json
{
  "react": "^19.2.5",
  "react-router-dom": "^7.14.1",
  "axios": "^1.15.0",
  "socket.io-client": "^4.8.3",
  "react-toastify": "^11.0.5",
  "lucide-react": "^1.7.0"
}
```

---

## ⚙️ Backend Architecture

### Middleware Stack
```
Request
  ↓
CORS Handler
  ↓
Body Parser (JSON)
  ↓
Routes
  ├── Auth Routes
  │   └── No auth required
  ├── Driver Routes
  │   └── verifyToken() → isDriver()
  ├── Admin Routes
  │   └── verifyToken() → isAdmin()
  ├── User Routes
  │   └── verifyToken() → isUser()
  └── Contact/Registration Routes
      └── No auth required
  ↓
Controllers (Business Logic)
  ↓
Models (Database)
  ↓
Response
```

### Error Handling
```javascript
// Global error handler catches:
- Invalid JWT tokens (401)
- Missing tokens (401)
- Wrong roles (403)
- Database errors (500)
- Validation errors (400)

// Auto-adds to response:
{
  success: false,
  message: "Error description",
  status: 400 | 401 | 403 | 500
}
```

### Validation
```javascript
// Using Joi for schema validation:
- Email format validation
- Password minimum length
- Phone format
- Bus registration data
- Location coordinates
```

---

## 🔑 Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env.local)
```
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🚀 Getting Started

### Quick Start (5 minutes)

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Start Backend** (Terminal 1)
   ```bash
   cd backend
   npm run dev
   ```

4. **Start Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm run dev
   ```

5. **Open Browser**
   ```
   http://localhost:5173
   ```

6. **Test Signup**
   - Click "Sign Up"
   - Fill form with user type
   - Verify you're redirected to appropriate dashboard

---

## 🧪 Testing the System

Complete testing guide available in [TESTING_GUIDE.md](./TESTING_GUIDE.md)

**Quick Tests:**
1. ✅ Signup with all 3 roles
2. ✅ Login/logout functionality
3. ✅ Token persistence in localStorage
4. ✅ Protected route access
5. ✅ Dashboard loading and API calls
6. ✅ Form submissions

---

## ⚠️ Important Notes

### Security Considerations
1. **JWT_SECRET:** Change in production to a strong random string
2. **HTTPS:** Enable in production
3. **CORS:** Restrict to your frontend domain in production
4. **MongoDB:** Enable IP whitelist in MongoDB Atlas
5. **Password:** Minimum 6 characters (consider 8-12 in production)

### Common Issues
1. **CORS Error:** Ensure backend is running on correct port
2. **Token Expired:** Re-login (7 days expiry)
3. **Database Connection:** Verify MongoDB URI and network access
4. **VITE_BACKEND_URL:** Must match backend server URL

### File Naming Note
- Backend uses: `driverController.js`, `adminController.js`, `userController.js`
- Old files: `BusControler.js` (keep for reference, not used)
- Routes import from correct file names

---

## 📚 Additional Resources

### Backend Stack
- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Documentation](https://jwt.io/)
- [Socket.IO Documentation](https://socket.io/)

### Frontend Stack
- [React Documentation](https://react.dev/)
- [React Router v7](https://reactrouter.com/)
- [Axios Documentation](https://axios-http.com/)
- [Vite Documentation](https://vitejs.dev/)

### Deployment
- Backend: Heroku, Railway, Render
- Frontend: Vercel, Netlify, GitHub Pages
- Database: MongoDB Atlas

---

## 🎉 Next Steps

1. **Run the testing guide** to verify everything works
2. **Create seed data** for realistic testing (5-10 users, buses, routes)
3. **Implement additional features** (notifications, payments, etc.)
4. **Prepare for deployment** (environment configs, HTTPS, etc.)
5. **Monitor and maintain** (error tracking, performance, etc.)

---

## 📞 Support

If you encounter issues:
1. Check console for errors (F12 → Console)
2. Check backend logs for API errors
3. Verify environment variables are set correctly
4. Ensure both servers (backend & frontend) are running
5. Check network tab (F12 → Network) for failed requests

---

**Status:** ✅ Complete | Ready for Testing

Good luck with your Bus Tracking System! 🚌✨
