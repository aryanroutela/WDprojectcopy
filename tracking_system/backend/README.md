# Smart Bus Tracking Backend

Production-ready backend system for real-time multi-bus tracking using crowdsourced GPS data.

## Features

- 🚍 **Real-time Multi-Bus Tracking** - Track multiple buses simultaneously using passenger GPS
- 📍 **Automatic Bus Detection** - Assigns users to buses based on speed and location
- ⏱️ **Dynamic ETA Calculation** - Calculates ETAs using Haversine formula
- 🪑 **Seat Availability System** - Crowdsourced seat reports with confidence voting
- 🔐 **Secure Access Control** - JWT authentication + role-based access
- ⚡ **Real-time Updates** - WebSocket updates via Socket.io
- 📊 **Scalable Architecture** - Built with performance in mind

## Tech Stack

- **Node.js** with Express.js
- **Socket.io** for WebSockets
- **PostgreSQL** for persistent storage
- **JWT** for authentication
- **Bcryptjs** for password hashing

## Installation

### Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### Setup

1. Clone repository
```bash
cd backend
npm install
```

2. Create `.env` file (copy from `.env.example`)
```bash
cp .env.example .env
```

3. Configure your PostgreSQL database:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_bus_tracking
DB_USER=postgres
DB_PASSWORD=your_password
```

4. Initialize database:
```bash
npm run db:init
```

5. Seed sample data (optional):
```bash
npm run db:seed
```

6. Start server:
```bash
npm run dev      # Development with nodemon
npm start        # Production
```

Server runs on `http://localhost:5000`

## API Documentation

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{name, email, password, role}` | Register new user |
| POST | `/api/auth/login` | `{email, password}` | Login & get JWT token |

### Buses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/buses` | Get all active buses |
| GET | `/api/buses/:id` | Get specific bus details with current passengers |

### Location Tracking

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/location/update` | `{lat, lng, speed}` | Update user location & get bus assignment |

### ETA

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/eta/:busId` | Get ETA for all upcoming stops |

### Seat Availability

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/seats/report` | `{busId, status}` | Report seat status (empty/standing/full) |
| GET | `/api/seats/:busId` | - | Get aggregated seat status |

### Routes & Stops

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/routes` | Get all bus routes |
| GET | `/api/stops/:routeId` | Get all stops for a route |

## WebSocket Events

### Client → Server

```javascript
// Update location
socket.emit('location:update', { lat, lng, speed })

// Report seat availability
socket.emit('seat:update', { busId, status: 'empty|standing|full' })
```

### Server → Client

```javascript
// Broadcast bus location & ETA updates
socket.on('bus:update', (busData) => { ... })

// Broadcast seat availability changes
socket.on('seat:update', (seatData) => { ... })
```

## Core Algorithm Details

### Haversine Formula
Calculates distance between coordinates accounting for Earth's curvature.

### Bus Detection
1. User sends GPS location with speed
2. System matches to nearest route (distance < 500m)
3. If speed > 15 km/h, assign to that bus
4. Cluster multiple users for reliability

### Seat Confidence
- Multiple reports required (configurable threshold)
- Majority voting for final status
- Reports expire after X minutes (configurable)

### Access Control for Seat Updates
- ✅ **Allowed**: role = "driver"
- ✅ **Allowed**: distance from bus < 50m AND speed > 15 km/h
- ❌ **Rejected**: All other cases (403 Forbidden)

## Database Schema

See [db/schema.sql](db/schema.sql) for complete schema.

### Key Tables
- `users` - System users
- `routes` - Bus routes with waypoints
- `stops` - Individual stops
- `active_buses` - Currently tracking buses
- `seat_reports` - Crowdsourced seat data
- `passenger_sessions` - Active passenger tracking

## Folder Structure

```
backend/
├── src/
│   ├── controllers/        # Request handlers
│   ├── routes/             # API route definitions
│   ├── models/             # Database models
│   ├── services/           # Business logic
│   ├── sockets/            # Socket.io handlers
│   ├── middleware/         # Auth & error handlers
│   ├── utils/              # Helper functions
│   └── server.js           # Entry point
├── db/
│   ├── schema.sql          # Database schema
│   ├── seed.sql            # Sample data
│   ├── init.js             # Schema initialization
│   └── seed.js             # Data seeding
├── .env.example            # Environment template
└── package.json
```

## Performance Considerations

- ✅ Connection pooling for database
- ✅ Indexed queries for location searches
- ✅ Efficient Real-time updates via Socket.io
- ✅ Data expiration/cleanup for seat reports
- ✅ Horizontal scalability ready

## Security Features

- 🔐 JWT token-based authentication
- 🔒 Bcrypt password hashing
- 📋 Role-based access control
- ✅ Input validation
- ✅ CORS configuration

## Development

### Creating New API Endpoint

1. Create controller in `src/controllers/`
2. Add service logic in `src/services/`
3. Define route in `src/routes/`
4. Mount route in `src/server.js`

### Adding WebSocket Event

1. Create handler in `src/sockets/`
2. Register in `SocketHandler` class
3. Emit from controller when needed

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
