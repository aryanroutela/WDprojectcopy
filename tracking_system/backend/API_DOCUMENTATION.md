# 🚍 Smart Bus Tracking Backend - API Documentation

Complete reference for all REST API endpoints and WebSocket events.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Auth Endpoints

### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "passenger"
}
```

**Response (201):**
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

**Roles:** `passenger` or `driver`

---

### Login User

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
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

---

### Get Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "passenger",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🚍 Bus Endpoints

### Get All Active Buses

```http
GET /buses
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "bus-uuid",
      "route_id": "route-uuid",
      "session_id": "BUS_M1_001_...",
      "current_lat": 40.7128,
      "current_lng": -74.0060,
      "avg_speed": 25.5,
      "last_updated": "2024-01-15T10:35:00Z",
      "is_active": true,
      "passengerCount": 12,
      "route": {
        "id": "route-uuid",
        "name": "Uptown Express",
        "number": "M1"
      },
      "stops": [...]
    }
  ],
  "count": 5
}
```

---

### Get Specific Bus

```http
GET /buses/:busId
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "bus-uuid",
    "sessionId": "BUS_M1_001_...",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "speed": 25.5,
    "lastUpdated": "2024-01-15T10:35:00Z",
    "route": {
      "id": "route-uuid",
      "name": "Uptown Express",
      "number": "M1",
      "description": "Times Square to Central Park"
    },
    "stops": [...],
    "passengers": [
      {
        "id": "user-uuid",
        "name": "Jane Doe",
        "role": "passenger",
        "joinedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "passengerCount": 12
  }
}
```

---

### Get Users Current Bus

```http
GET /buses/current
Authorization: Bearer <token>
```

---

### Close Bus Session

```http
POST /buses/:busId/close
Authorization: Bearer <driver_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Bus session ended",
  "data": { ... }
}
```

---

## 📍 Location Tracking Endpoints

### Update User Location

```http
POST /location/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "lat": 40.7128,
  "lng": -74.0060,
  "speed": 25.5
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User assigned to bus",
  "data": {
    "busId": "bus-uuid",
    "routeId": "route-uuid",
    "timestamp": "2024-01-15T10:35:00Z"
  }
}
```

**Possible Messages:**
- `"User assigned to bus"` - Successfully detected on bus
- `"User not detected as on a bus"` - Speed too low or not close enough
- `"User location not matching any route"` - Location doesn't match any route

---

### Get Location Status

```http
GET /location/status
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "onBus": true,
    "busDetails": {
      "id": "bus-uuid",
      "route": { ... },
      "stops": [...],
      "passengers": [...]
    }
  }
}
```

---

### Exit Bus

```http
POST /location/exit-bus
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User removed from bus"
}
```

---

## ⏱️ ETA Endpoints

### Get ETA for All Stops

```http
GET /eta/:busId
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "busId": "bus-uuid",
    "busLocation": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "busSpeed": 25.5,
    "route": {
      "id": "route-uuid",
      "name": "Uptown Express",
      "number": "M1"
    },
    "nearestStop": {
      "stopId": "stop-uuid",
      "stopName": "Times Square",
      "distanceMeters": 450
    },
    "upcomingStops": [
      {
        "stopId": "stop-uuid",
        "stopName": "Times Square",
        "stopOrder": 1,
        "location": {
          "lat": 40.7128,
          "lng": -74.0060
        },
        "distanceMeters": 450,
        "distanceKm": "0.45",
        "etaSeconds": 64,
        "etaMinutes": 1,
        "etaTime": "1m 4s"
      }
    ],
    "allStops": [...]
  }
}
```

---

### Get ETA to Specific Stop

```http
GET /eta/:busId/stop/:stopId
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "busId": "bus-uuid",
    "stopId": "stop-uuid",
    "stopName": "Grand Central",
    "distanceMeters": 1250,
    "distanceKm": "1.25",
    "etaSeconds": 180,
    "etaMinutes": 3,
    "etaTime": "3m 0s"
  }
}
```

---

## 🪑 Seat Availability Endpoints

### Report Seat Availability

```http
POST /seats/report
Authorization: Bearer <token>
Content-Type: application/json

{
  "busId": "bus-uuid",
  "status": "empty"
}
```

**Status Options:** `"empty"`, `"standing"`, `"full"`

**Response (201):**
```json
{
  "success": true,
  "message": "Seat availability reported successfully",
  "data": {
    "report": {
      "id": "report-uuid",
      "bus_id": "bus-uuid",
      "user_id": "user-uuid",
      "status": "empty",
      "timestamp": "2024-01-15T10:35:00Z"
    },
    "aggregatedStatus": {
      "busId": "bus-uuid",
      "status": "empty",
      "confidence": 100,
      "reportCount": 3,
      "meetsThreshold": true,
      "expiryMinutes": 10,
      "message": "Bus is empty (3 reports)"
    }
  }
}
```

**Access Control:**
- ✅ Role = "driver"
- ✅ Distance from bus < 50m AND speed > 15 km/h
- ❌ All other cases return 403 Forbidden

---

### Get Aggregated Seat Status

```http
GET /seats/:busId
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "busId": "bus-uuid",
    "status": "standing",
    "confidence": 87,
    "reportCount": 8,
    "meetsThreshold": true,
    "expiryMinutes": 10,
    "message": "Bus is standing (7 reports)"
  }
}
```

---

### Get Detailed Seat Reports

```http
GET /seats/:busId/reports
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "busId": "bus-uuid",
    "aggregatedStatus": {
      "busId": "bus-uuid",
      "status": "standing",
      "confidence": 87,
      "reportCount": 8,
      "meetsThreshold": true,
      "expiryMinutes": 10,
      "message": "Bus is standing (7 reports)"
    },
    "reportsByStatus": {
      "empty": [],
      "standing": [
        {
          "id": "report-uuid",
          "userId": "user-uuid",
          "userName": "John Doe",
          "role": "passenger",
          "status": "standing",
          "timestamp": "2024-01-15T10:35:00Z"
        }
      ],
      "full": []
    }
  }
}
```

---

### Get User's Report History

```http
GET /seats/history/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "reportCount": 15,
    "reports": [
      {
        "id": "report-uuid",
        "busId": "bus-uuid",
        "status": "standing",
        "timestamp": "2024-01-15T10:35:00Z"
      }
    ]
  }
}
```

---

## 🛣️ Route Endpoints

### Get All Routes

```http
GET /routes
?active=true
```

**Query Parameters:**
- `active` (optional): `true` or `false` (default: `true`)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "route-uuid",
      "name": "Uptown Express",
      "number": "M1",
      "description": "Times Square to Central Park",
      "waypoints": "[{\"lat\": 40.7128, \"lng\": -74.0060}, ...]",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "count": 5
}
```

---

### Get Route Details

```http
GET /routes/:routeId
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "route-uuid",
    "name": "Uptown Express",
    "number": "M1",
    "description": "Times Square to Central Park",
    "waypoints": [
      { "lat": 40.7128, "lng": -74.0060 },
      { "lat": 40.7489, "lng": -73.9680 },
      { "lat": 40.7614, "lng": -73.9776 }
    ],
    "is_active": true,
    "stops": [
      {
        "id": "stop-uuid",
        "route_id": "route-uuid",
        "name": "Times Square",
        "lat": 40.7128,
        "lng": -74.0060,
        "stop_order": 1,
        "created_at": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

### Get Route Stops

```http
GET /routes/:routeId/stops
```

**Response (200):**
```json
{
  "success": true,
  "route": {
    "id": "route-uuid",
    "name": "Uptown Express",
    "number": "M1"
  },
  "data": [
    {
      "id": "stop-uuid",
      "route_id": "route-uuid",
      "name": "Times Square",
      "lat": 40.7128,
      "lng": -74.0060,
      "stop_order": 1
    }
  ],
  "count": 5
}
```

---

### Create New Route

```http
POST /routes
Authorization: Bearer <driver_token>
Content-Type: application/json

{
  "name": "Downtown Express",
  "number": "M2",
  "description": "Bryant Park to Central Park",
  "waypoints": [
    { "lat": 40.7505, "lng": -73.9972 },
    { "lat": 40.7549, "lng": -73.9840 },
    { "lat": 40.7614, "lng": -73.9776 }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Route created successfully",
  "data": {
    "id": "route-uuid",
    "name": "Downtown Express",
    "number": "M2",
    ...
  }
}
```

---

### Update Route

```http
PATCH /routes/:routeId
Authorization: Bearer <driver_token>
Content-Type: application/json

{
  "name": "Downtown Express - Updated",
  "is_active": true
}
```

---

## 🔌 WebSocket Events

Connect to Socket.io at `ws://localhost:5000`

### Connection Flow

```javascript
// 1. Connect
const socket = io('http://localhost:5000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

// 2. Authenticate
socket.emit('authenticate', 'your_jwt_token');

// 3. Listen for auth result
socket.on('auth:success', (data) => {
  console.log('Authenticated:', data);
});

socket.on('auth:error', (error) => {
  console.error('Auth failed:', error);
});
```

---

### Client → Server Events

#### Location Update

```javascript
socket.emit('location:update', {
  lat: 40.7128,
  lng: -74.0060,
  speed: 25.5
});

socket.on('location:update:ack', (data) => {
  console.log('Location acknowledged:', data);
  // {
  //   success: true,
  //   busId: "bus-uuid",
  //   routeId: "route-uuid"
  // }
});
```

#### Seat Update

```javascript
socket.emit('seat:update', {
  busId: 'bus-uuid',
  status: 'empty' // or 'standing', 'full'
});

socket.on('seat:update:ack', (data) => {
  console.log('Seat update acknowledged:', data);
  // {
  //   success: true,
  //   aggregatedStatus: { ... }
  // }
});
```

#### Subscribe to Bus

```javascript
socket.emit('bus:subscribe', 'bus-uuid');

socket.on('bus:subscribe:ack', (data) => {
  console.log('Subscribed:', data);
});
```

#### Unsubscribe from Bus

```javascript
socket.emit('bus:unsubscribe', 'bus-uuid');
```

#### Join Bus Room

```javascript
socket.emit('join:bus', 'bus-uuid');

socket.on('bus:join:ack', (data) => {
  console.log('Joined bus:', data);
});
```

#### Leave Bus Room

```javascript
socket.emit('leave:bus', 'bus-uuid');
```

---

### Server → Client Events

#### Bus Update

```javascript
socket.on('bus:update', (data) => {
  console.log('Bus location updated:', data);
  // {
  //   id: "bus-uuid",
  //   location: { lat, lng },
  //   speed: 25.5,
  //   timestamp: "2024-01-15T10:35:00Z"
  // }
});
```

#### Bus ETA Update

```javascript
socket.on('bus:eta:update', (data) => {
  console.log('ETA updated:', data);
  // {
  //   busId: "bus-uuid",
  //   upcomingStops: [...],
  //   timestamp: "2024-01-15T10:35:00Z"
  // }
});
```

#### Seat Status Update

```javascript
socket.on('seat:update', (data) => {
  console.log('Seat status updated:', data);
  // {
  //   busId: "bus-uuid",
  //   status: "empty",
  //   confidence: 100,
  //   reportCount: 3,
  //   timestamp: "2024-01-15T10:35:00Z"
  // }
});
```

#### Seat Status

```javascript
socket.on('seat:status', (data) => {
  console.log('Seat status:', data);
});
```

#### Bus User Update

```javascript
socket.on('bus:user:update', (data) => {
  console.log('User updated on bus:', data);
  // {
  //   userId: "user-uuid",
  //   busId: "bus-uuid",
  //   location: { lat, lng },
  //   speed: 25.5,
  //   timestamp: "2024-01-15T10:35:00Z"
  // }
});
```

#### Passenger Joined

```javascript
socket.on('bus:passenger:joined', (data) => {
  console.log('Passenger joined:', data);
  // {
  //   userId: "user-uuid",
  //   busId: "bus-uuid",
  //   timestamp: "2024-01-15T10:35:00Z"
  // }
});
```

#### Passenger Left

```javascript
socket.on('bus:passenger:left', (data) => {
  console.log('Passenger left:', data);
});
```

#### Error

```javascript
socket.on('error', (data) => {
  console.error('Error:', data.message);
});
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid email format",
  "code": "ValidationError"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token",
  "code": "AUTH_ERROR"
}
```

### 403 Forbidden
```json
{
  "error": "You are not authorized to report seat availability for this bus",
  "code": "AuthorizationError"
}
```

### 404 Not Found
```json
{
  "error": "Bus not found",
  "code": "NotFoundError"
}
```

### 409 Conflict
```json
{
  "error": "User with this email already exists",
  "code": "ConflictError"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

---

## Rate Limiting & Best Practices

- Limit location updates to 1-2 per second max
- Aggregate seat reports before updating
- Subscribe to specific buses instead of polling
- Use exponential backoff for reconnection
- Cache route/stop data on client side
- Validate all input before sending

---

## Example Client Implementation

See [CLIENT_EXAMPLES.md](./CLIENT_EXAMPLES.md) for complete JavaScript/React examples.
