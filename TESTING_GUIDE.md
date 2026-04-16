# Complete Testing Guide - Authentication & RBAC System

## 📋 Project Overview

You now have a complete **MERN stack** with:
- ✅ JWT-based authentication (signup/login)
- ✅ Role-Based Access Control (Admin, Driver, User)
- ✅ Three specialized dashboards
- ✅ Real-time Socket.IO integration
- ✅ MongoDB with 6 schemas

---

## 🚀 STEP 1: Install Dependencies

### Backend Setup
```bash
cd c:\Users\HP\OneDrive\Desktop\WDprojectcopy\backend
npm install
```

**Expected output:**
```
up to date, audited 35 packages in X.XXs
```

### Frontend Setup
```bash
cd c:\Users\HP\OneDrive\Desktop\WDprojectcopy\frontend
npm install
```

**Expected output:**
```
up to date, audited 180+ packages in X.XXs
```

---

## 🔧 STEP 2: Environment Configuration

### Backend `.env` (Already configured)
Located at: `backend/.env`

Verify it contains:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

### Frontend Configuration
Located at: `frontend/.env.local`

Verify it contains:
```
VITE_BACKEND_URL=http://localhost:5000
```

---

## ▶️ STEP 3: Start the Servers

### Terminal 1 - Backend Server
```bash
cd backend
npm run dev
```

**Success Indicator:**
```
╔════════════════════════════════════╗
║  Server running on port 5000       ║
║  MongoDB connected                 ║
║  Socket.IO initialized             ║
╚════════════════════════════════════╝
```

### Terminal 2 - Frontend Server
```bash
cd frontend
npm run dev
```

**Success Indicator:**
```
  VITE v8.0.1  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Press h + enter to show help
```

---

## 👤 STEP 4: Test User Signup (Role: User/Passenger)

1. **Open Browser:** http://localhost:5173
2. **Click:** "Sign Up" (top right)
3. **Fill Form:**
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john@test.com`
   - Password: `123456`
   - Phone: `9876543210`
   - Role: `User` (dropdown)
4. **Click:** "Sign Up" button
5. **Expected Result:**
   - ✅ Toast message: "Signup successful!"
   - ✅ Automatic redirect to `/user-dashboard`
   - ✅ Token stored in localStorage
   - ✅ Navbar shows "Dashboard" link

**Verify in Browser Console (F12 → Console):**
```javascript
localStorage.getItem('token')      // Should return JWT token
localStorage.getItem('user')       // Should show: {"role":"user","email":"john@test.com",...}
```

---

## 🚗 STEP 5: Test Driver Signup

1. **Click:** "Logout" in navbar
2. **Click:** "Sign Up"
3. **Fill Form:**
   - First Name: `Mike`
   - Last Name: `Johnson`
   - Email: `mike@test.com`
   - Password: `123456`
   - Phone: `8765432109`
   - Role: `Driver`
4. **Expected Result:**
   - ✅ Redirect to `/driver-dashboard`
   - ✅ See sections: "My Buses", "Update Location", "Update Seats", "Service Control"

---

## 👨‍💼 STEP 6: Test Admin Signup

1. **Click:** "Logout"
2. **Click:** "Sign Up"
3. **Fill Form:**
   - First Name: `Admin`
   - Last Name: `User`
   - Email: `admin@test.com`
   - Password: `123456`
   - Phone: `7654321098`
   - Role: `Admin`
4. **Expected Result:**
   - ✅ Redirect to `/admin-dashboard`
   - ✅ See tabs: "Overview", "Buses", "Drivers"

---

## 🔑 STEP 7: Test Login Flow

1. **Click:** "Logout"
2. **Click:** "Login" (top right)
3. **Fill Form:**
   - Email: `john@test.com`
   - Password: `123456`
4. **Expected Result:**
   - ✅ Toast: "Login successful!"
   - ✅ Redirect to `/user-dashboard`
   - ✅ Same token in localStorage

### Test Wrong Credentials
1. **Email:** `john@test.com`
2. **Password:** `wrongpassword`
3. **Expected Result:**
   - ❌ Toast: "Invalid credentials"
   - ✅ Stay on login page

---

## 🛡️ STEP 8: Test Protected Routes

### Test 1: Direct URL Access
1. **Copy URL:** http://localhost:5173/admin-dashboard
2. **Paste while logged in as User:**
   - Expected: ❌ Redirect to `/user-dashboard` (wrong role)
3. **Logout and try same URL:**
   - Expected: ❌ Redirect to `/login` (no token)

### Test 2: Dashboard Links in Navbar
1. **Login as Admin:**
   - Navbar shows: "📊 ADMIN" link
2. **Login as Driver:**
   - Navbar shows: "🚗 DRIVER" link
3. **Login as User:**
   - Navbar shows: "👤 USER" link

---

## 📊 STEP 9: Test Admin Dashboard

**When Logged in as Admin:**

### Overview Tab
- [ ] Card shows: "Total Buses" (should be 0 initially)
- [ ] Card shows: "Active Buses"
- [ ] Card shows: "Total Drivers"
- [ ] Card shows: "Total Users" (should show 3 - john, mike, admin)
- [ ] Card shows: "Average Occupancy %"

### Buses Tab
- [ ] Table displays (empty initially)
- [ ] Columns: Bus Number, Route, Driver, Status, Available Seats

### Drivers Tab
- [ ] Cards display for each driver
- [ ] Show driver name, email, license info
- [ ] Status badge: "Active" or "Inactive"

---

## 🚗 STEP 10: Test Driver Dashboard

**When Logged in as Driver (mike@test.com):**

### My Buses Section
- [ ] Form to register new bus with fields:
  - Bus Number
  - Route Name
  - Capacity
  - Seats Available
- [ ] Submit button for registration

### Update Location Section
- [ ] Form with fields:
  - Latitude
  - Longitude
  - ETA
- [ ] Submit button

### Update Seats Section
- [ ] Form to update available seats

### Service Control Section
- [ ] "Start Service" button
- [ ] "Stop Service" button

**Test: Register a Bus**
1. Fill bus registration form:
   - Bus Number: `BUS001`
   - Route Name: `Delhi-Gurgaon`
   - Capacity: `50`
   - Seats Available: `35`
2. Click: "Register Bus"
3. Expected: ✅ Success toast, form clears

---

## 👤 STEP 11: Test User Dashboard

**When Logged in as User (john@test.com):**

### Initial State
- [ ] Route filter dropdown should show available routes
- [ ] Bus cards display active buses (should show BUS001 after driver registers)

### Test Route Filter
1. Select from dropdown: `Delhi-Gurgaon`
2. Expected: ✅ Shows only buses on that route

### Test Bus Card
1. Click on any bus card
2. Expected: ✅ Modal opens with:
   - Bus number
   - Route name
   - Driver name
   - Current location
   - Seats available
   - Occupancy percentage
   - "Track Bus" button

---

## ⚠️ STEP 12: Error Handling Tests

### Network Error (Stop Backend)
1. **Backend running**, frontend open at user-dashboard
2. **Terminate backend** (Ctrl+C in backend terminal)
3. **Try any action** (refresh, search buses, etc.)
4. **Expected:** ✅ Toast error message: "Network error..."
5. **Restart backend:** `npm run dev`

### Invalid Token
1. **In browser console:**
   ```javascript
   localStorage.setItem('token', 'invalid_jwt_token');
   ```
2. **Refresh page**
3. **Expected:** ✅ Redirect to login (invalid token detected)

### Session Expiry (Manual Test)
1. **Modify .env on backend:**
   ```
   JWT_EXPIRE=10s
   ```
2. **Restart backend**
3. **Signup/Login with new credentials**
4. **Wait 11 seconds**
5. **Try any action**
6. **Expected:** ✅ Redirects to login (token expired)

---

## 📡 STEP 13: Socket.IO Real-time Test

### Prerequisites
- Backend running
- 2+ browser windows with logged-in users

### Test 1: Driver Broadcasting Location
1. **Window 1:** Login as Driver, register a bus
2. **Window 2:** Login as User
3. **Window 1 (Driver):** 
   - Go to Driver Dashboard
   - Fill location form: lat=28.7041, lng=77.1025, eta=15min
   - Submit
4. **Window 2 (User):**
   - Should see updated location in bus card
   - Expected: ✅ Real-time update (no page refresh needed)

### Test 2: Multi-user Tracking
1. **3 windows:** 1 driver, 2 users
2. **Driver updates location**
3. **Both user windows should see update simultaneously**

---

## 🐛 Common Issues & Solutions

### Issue 1: "CORS error" in console
**Solution:**
```
✅ Backend must be running on port 5000
✅ .env.local must have: VITE_BACKEND_URL=http://localhost:5000
✅ Restart both servers
```

### Issue 2: "401 Unauthorized" on API calls
**Solution:**
```
✅ Token may have expired
✅ Logout and login again
✅ Check console: localStorage.getItem('token') should have a value
```

### Issue 3: Database errors
**Solution:**
```
✅ Verify MONGODB_URI in backend/.env
✅ Ensure MongoDB Atlas cluster is accessible
✅ Check network access in MongoDB Atlas (IP whitelist)
```

### Issue 4: "Cannot read property 'token' of null"
**Solution:**
```
✅ User not logged in
✅ Manually redirect to login: http://localhost:5173/login
✅ Clear localStorage: localStorage.clear() in console
```

---

## ✅ Successful Test Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can signup with User role → redirects to user-dashboard
- [ ] Can signup with Driver role → redirects to driver-dashboard
- [ ] Can signup with Admin role → redirects to admin-dashboard
- [ ] Can login with valid credentials
- [ ] Cannot login with invalid credentials
- [ ] Token is stored in localStorage after signup/login
- [ ] Protected routes redirect correctly
- [ ] Admin dashboard loads with stats
- [ ] Driver dashboard shows all sections
- [ ] User dashboard shows buses and filter
- [ ] Navbar shows correct dashboard link based on role
- [ ] Logout clears token and redirects to home
- [ ] All forms submit without errors
- [ ] Error toasts display on failures
- [ ] Socket.IO updates are real-time (when available)

---

## 🚀 Next Steps After Testing

1. **Create Seed Data:**
   - Admin user
   - 5 Driver users with buses
   - 10 User accounts
   - Test routes populated

2. **Add Additional Features:**
   - SMS/Email verification
   - Password reset
   - File uploads for license/documents
   - Payment integration
   - Push notifications

3. **Deployment:**
   - Set production environment variables
   - Use production MongoDB cluster
   - Setup HTTPS
   - Deploy backend to Heroku/Railway/Render
   - Deploy frontend to Vercel/Netlify

4. **Monitoring:**
   - Setup error logging (Sentry)
   - Monitor API performance
   - Track Socket.IO metrics

---

## 📞 Quick Reference Commands

```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Clear localStorage (in browser console)
localStorage.clear()

# Check token (in browser console)
localStorage.getItem('token')
console.log(JSON.parse(localStorage.getItem('user')))

# View all requests (browser DevTools)
F12 → Network tab → Filter by XHR

# View real-time logs (browser console)
F12 → Console tab
```

---

**Status:** ✅ Complete Auth System Ready for Testing

Good luck! 🎉
