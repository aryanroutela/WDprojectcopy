# 🚀 Quick Start Guide - Smart Bus Tracking Backend

Get the Smart Bus Tracking Backend running in 5 minutes!

## Prerequisites

- **Node.js** v14+ ([Download](https://nodejs.org/))
- **PostgreSQL** v12+ ([Download](https://www.postgresql.org/download/))
- **npm** or **yarn**

## Step 1: Clone/Setup Project

```bash
cd backend
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_bus_tracking
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRE=7d

# CORS
SOCKET_IO_CORS=http://localhost:3000,http://localhost:5173
```

## Step 4: Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database (if not auto-created by init script)
CREATE DATABASE smart_bus_tracking;

# Exit
\q
```

## Step 5: Initialize Database Schema

```bash
npm run db:init
```

This will:
- Create database (if doesn't exist)
- Create all tables
- Create indexes

## Step 6: (Optional) Seed Sample Data

```bash
npm run db:seed
```

This creates:
- 3 sample users (1 driver, 2 passengers)
- 2 sample routes
- 3 sample stops per route
- 1 active bus

## Step 7: Start Server

### Development (with auto-reload)

```bash
npm run dev
```

### Production

```bash
npm start
```

You should see:

```
╔════════════════════════════════════════════════════════════╗
║      🚍 Smart Bus Tracking Backend                          ║
║      ✅ Server running on port 5000                         ║
║      📡 WebSocket ready                                      ║
║      🗄️  Database connected                                 ║
╚════════════════════════════════════════════════════════════╝
```

## Step 8: Test the API

### Health Check

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "message": "Smart Bus Tracking Backend is running",
  "timestamp": "2024-01-15T10:30:00Z",
  "connectedUsers": 0
}
```

### Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "passenger"
  }'
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "passenger"
    }
  }
}
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get All Buses

```bash
curl http://localhost:5000/api/buses
```

### Get Routes

```bash
curl http://localhost:5000/api/routes
```

## 🎯 Next Steps

1. **Frontend Integration**: Use the [CLIENT_EXAMPLES.md](./CLIENT_EXAMPLES.md) to integrate with React/Vue
2. **Real-time Testing**: Test WebSocket with Socket.io client
3. **Database**: Connect a GUI like pgAdmin if needed
4. **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup

## 📊 Database Management

### View Connected Users

```bash
psql -U postgres -d smart_bus_tracking -c "SELECT * FROM users;"
```

### View Active Buses

```bash
psql -U postgres -d smart_bus_tracking -c "SELECT * FROM active_buses WHERE is_active = true;"
```

### View Seat Reports

```bash
psql -U postgres -d smart_bus_tracking -c "SELECT * FROM seat_reports ORDER BY timestamp DESC LIMIT 10;"
```

### Reset Database

```bash
npm run db:init
npm run db:seed
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

- Verify PostgreSQL is running
- Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in `.env`
- Ensure database exists: `psql -U postgres -l`

### JWT Token Issues

```
Error: Invalid or expired token
```

- Generate new token by logging in
- Check JWT_SECRET in `.env` matches
- Token expires after 7 days (default)

### CORS Issues

```
Error: Access to XMLHttpRequest blocked by CORS policy
```

- Update SOCKET_IO_CORS in `.env`:
  ```
  SOCKET_IO_CORS=http://localhost:3000,http://localhost:5173,http://your-frontend-url
  ```
- Restart server

### WebSocket Connection Issues

```
WebSocket is closed before the connection is established
```

- Check server is running: `curl http://localhost:5000/health`
- Verify SOCKET_IO_CORS includes your frontend URL
- Check browser console for errors

## 📚 Documentation

- [API Reference](./API_DOCUMENTATION.md) - Complete API docs
- [Client Examples](./CLIENT_EXAMPLES.md) - Frontend integration examples
- [Architecture](./ARCHITECTURE.md) - System design details

## 🚀 Docker Setup (Optional)

```bash
# Build Docker image
docker build -t smart-bus-tracking-backend .

# Run container
docker run -p 5000:5000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_NAME=smart_bus_tracking \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  smart-bus-tracking-backend
```

## 📋 Checklist

- [ ] Node.js installed
- [ ] PostgreSQL running
- [ ] `.env` file configured
- [ ] Database initialized (`npm run db:init`)
- [ ] Sample data seeded (`npm run db:seed`)
- [ ] Server started (`npm run dev`)
- [ ] Health check passing
- [ ] Can register/login users
- [ ] Can fetch buses and routes

## 💡 Tips

- Use **Postman** or **Thunder Client** for API testing
- Use **pgAdmin** for database visualization
- Monitor server logs for debugging
- Check `/health` endpoint frequently
- Use `npm run dev` during development for hot-reload

## Support

For issues or questions:
1. Check [Troubleshooting](#-troubleshooting)
2. Review [API Documentation](./API_DOCUMENTATION.md)
3. Check server logs
4. Verify `.env` configuration

Happy tracking! 🚍📍
