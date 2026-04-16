# ⚡ QUICK START - Complete Auth System

## 🎯 What You Have

A complete **MERN Authentication System** with:
- ✅ 3 User Roles: Admin, Driver, User
- ✅ JWT Login/Signup
- ✅ Role-Based Dashboards
- ✅ Real-time Bus Tracking (Socket.IO)
- ✅ MongoDB Integration

---

## 📋 5-Minute Setup

### Step 1️⃣ Backend Setup (1 minute)
```bash
cd backend
npm install
npm run dev
```

**You should see:**
```
╔════════════════════════════════════╗
║  Server running on port 5000       ║
║  MongoDB connected                 ║
║  Socket.IO initialized             ║
╚════════════════════════════════════╝
```

### Step 2️⃣ Frontend Setup (New Terminal - 1 minute)
```bash
cd frontend
npm install
npm run dev
```

**You should see:**
```
VITE v8.0.1  ready in 234 ms
Local: http://localhost:5173/
```

### Step 3️⃣ Open in Browser
```
http://localhost:5173
```

### Step 4️⃣ Test Signup (2 minutes)
1. Click **"Sign Up"** (top right)
2. Fill the form:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john@test.com`
   - Password: `123456`
   - Phone: `9876543210`
   - Role: `User` (dropdown)
3. Click **"Sign Up"** button
4. Should redirect to **User Dashboard** with success message

### Step 5️⃣ Test Other Roles
Repeat signup with:
- Role = `Driver` (redirects to Driver Dashboard)
- Role = `Admin` (redirects to Admin Dashboard)

---

## ✨ What to Test

### ✅ Admin Dashboard
- Login as admin@test.com
- See tabs: Overview, Buses, Drivers
- View statistics and lists

### ✅ Driver Dashboard
- Login as driver@test.com
- Register a bus with form
- Update location/seats
- Start/Stop service

### ✅ User Dashboard
- Login as user@test.com
- See list of active buses
- Filter by route
- Click bus to see details

### ✅ Logout
- Click "Logout" in navbar
- Should redirect to home page
- Token cleared from localStorage

---

## 🐛 Troubleshooting

### "CORS Error" in browser?
✅ Backend must be running on port 5000
✅ Check: `npm run dev` in backend terminal

### "Cannot find module"?
✅ Run: `npm install` in that folder
✅ Wait for completion

### "Connection refused"?
✅ Frontend .env.local must have: `VITE_BACKEND_URL=http://localhost:5000`
✅ Backend .env must have correct MongoDB URI

### "MongoDB Connection Error"?
✅ Verify MongoDB URI in backend/.env
✅ Check IP whitelist in MongoDB Atlas
✅ Database user credentials are correct

### "Login fails with wrong credentials"?
✅ That's correct! Password is wrong
✅ Use credentials you just signed up with
✅ Or signup with new test account

---

## 📚 Full Documentation

- **[README.md](./README.md)** - Complete project overview
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Detailed testing procedures
- **[QUICK_START.md](./QUICK_START.md)** - This file (quick reference)

---

## 🎉 You're Ready!

Your complete authentication system is running!

**Next Steps:**
1. Test all features (see above)
2. Read [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing
3. Create more test users
4. Explore backend API endpoints
5. Customize styles/add features as needed

**Questions?**
- Check browser console (F12)
- Check backend terminal for errors
- Verify all environment variables are set

Good luck! 🚀


## Keep Both Terminals Open!
- Terminal 1: Backend (`npm run dev` running)
- Terminal 2: Frontend (`npm run dev` running)

**Both must be running for the app to work!**
