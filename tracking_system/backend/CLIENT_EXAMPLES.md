# 🚍 Smart Bus Tracking - Client Examples

Complete examples for using the Smart Bus Tracking Backend API from frontend applications.

## Installation

```bash
npm install axios socket.io-client
```

---

## 🔐 Authentication Service

```javascript
// authService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export class AuthService {
  static async register(name, email, password, role) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        role,
      });
      
      if (response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      
      if (response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  static getToken() {
    return localStorage.getItem('token');
  }

  static getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  static isAuthenticated() {
    return !!this.getToken();
  }
}
```

---

## 🚍 Bus Tracking Service

```javascript
// busService.js
import axios from 'axios';
import { AuthService } from './authService';

const API_URL = 'http://localhost:5000/api';

const getHeaders = () => ({
  Authorization: `Bearer ${AuthService.getToken()}`,
});

export class BusService {
  static async getAllBuses() {
    try {
      const response = await axios.get(`${API_URL}/buses`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async getBusDetails(busId) {
    try {
      const response = await axios.get(`${API_URL}/buses/${busId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async getCurrentBus() {
    try {
      const response = await axios.get(
        `${API_URL}/buses/current`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}
```

---

## 📍 Location Tracking Service

```javascript
// locationService.js
import axios from 'axios';
import { AuthService } from './authService';

const API_URL = 'http://localhost:5000/api';

const getHeaders = () => ({
  Authorization: `Bearer ${AuthService.getToken()}`,
});

export class LocationService {
  static async updateLocation(lat, lng, speed) {
    try {
      const response = await axios.post(
        `${API_URL}/location/update`,
        { lat, lng, speed },
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async getLocationStatus() {
    try {
      const response = await axios.get(
        `${API_URL}/location/status`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async exitBus() {
    try {
      const response = await axios.post(
        `${API_URL}/location/exit-bus`,
        {},
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static startTracking(callback) {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        callback({
          lat: latitude,
          lng: longitude,
          speed: speed || 0,
        });
      },
      (error) => console.error('Geolocation error:', error),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    return watchId;
  }

  static stopTracking(watchId) {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  }
}
```

---

## ⏱️ ETA Service

```javascript
// etaService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export class ETAService {
  static async getBusETA(busId) {
    try {
      const response = await axios.get(`${API_URL}/eta/${busId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async getETAToStop(busId, stopId) {
    try {
      const response = await axios.get(`${API_URL}/eta/${busId}/stop/${stopId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static formatTime(etaMinutes) {
    if (etaMinutes < 1) return 'Now';
    if (etaMinutes < 60) return `${etaMinutes} min`;
    const hours = Math.floor(etaMinutes / 60);
    const mins = etaMinutes % 60;
    return `${hours}h ${mins}m`;
  }
}
```

---

## 🪑 Seat Service

```javascript
// seatService.js
import axios from 'axios';
import { AuthService } from './authService';

const API_URL = 'http://localhost:5000/api';

const getHeaders = () => ({
  Authorization: `Bearer ${AuthService.getToken()}`,
});

export class SeatService {
  static async reportSeatAvailability(busId, status) {
    try {
      const response = await axios.post(
        `${API_URL}/seats/report`,
        { busId, status },
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async getSeatStatus(busId) {
    try {
      const response = await axios.get(`${API_URL}/seats/${busId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async getBusReports(busId) {
    try {
      const response = await axios.get(`${API_URL}/seats/${busId}/reports`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async getUserHistory() {
    try {
      const response = await axios.get(
        `${API_URL}/seats/history/me`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static getStatusColor(status) {
    const colors = {
      empty: '#4CAF50',   // Green
      standing: '#FFC107', // Amber
      full: '#F44336',    // Red
    };
    return colors[status] || '#9E9E9E'; // Gray for unknown
  }

  static getStatusLabel(status) {
    const labels = {
      empty: 'Seats Available',
      standing: 'Standing Only',
      full: 'Bus Full',
    };
    return labels[status] || 'Unknown';
  }
}
```

---

## 🔌 Real-Time Socket.io Service

```javascript
// socketService.js
import { io } from 'socket.io-client';
import { AuthService } from './authService';

const SOCKET_URL = 'http://localhost:5000';

export class SocketService {
  static socket = null;
  static listeners = {};

  static connect() {
    if (this.socket) return this.socket;

    this.socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
      
      // Authenticate
      const token = AuthService.getToken();
      if (token) {
        this.socket.emit('authenticate', token);
      }
    });

    this.socket.on('auth:success', (data) => {
      console.log('🔐 Authenticated:', data);
      this._emit('authenticated', data);
    });

    this.socket.on('auth:error', (error) => {
      console.error('❌ Auth failed:', error);
      this._emit('authError', error);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      this._emit('disconnected');
    });

    return this.socket;
  }

  static disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Location tracking
  static updateLocation(lat, lng, speed) {
    if (!this.socket) return;
    this.socket.emit('location:update', { lat, lng, speed });
  }

  static onLocationUpdateAck(callback) {
    this._on('location:update:ack', callback);
  }

  // Seat reporting
  static reportSeat(busId, status) {
    if (!this.socket) return;
    this.socket.emit('seat:update', { busId, status });
  }

  static onSeatUpdateAck(callback) {
    this._on('seat:update:ack', callback);
  }

  static onSeatUpdate(callback) {
    this._on('seat:update', callback);
  }

  // Bus subscription
  static subscribeToBus(busId) {
    if (!this.socket) return;
    this.socket.emit('bus:subscribe', busId);
  }

  static unsubscribeFromBus(busId) {
    if (!this.socket) return;
    this.socket.emit('bus:unsubscribe', busId);
  }

  static joinBus(busId) {
    if (!this.socket) return;
    this.socket.emit('join:bus', busId);
  }

  static leaveBus(busId) {
    if (!this.socket) return;
    this.socket.emit('leave:bus', busId);
  }

  // Bus events
  static onBusUpdate(callback) {
    this._on('bus:update', callback);
  }

  static onBusETAUpdate(callback) {
    this._on('bus:eta:update', callback);
  }

  static onBusUserUpdate(callback) {
    this._on('bus:user:update', callback);
  }

  static onPassengerJoined(callback) {
    this._on('bus:passenger:joined', callback);
  }

  static onPassengerLeft(callback) {
    this._on('bus:passenger:left', callback);
  }

  // Error handling
  static onError(callback) {
    this._on('error', callback);
  }

  // Internal helpers
  static _on(event, callback) {
    if (!this.socket) return;
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    this.socket.on(event, callback);
  }

  static _emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data));
    }
  }

  static off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
    delete this.listeners[event];
  }
}
```

---

## 🚀 React Hook Example

```javascript
// useLocation.js
import { useEffect, useRef, useState } from 'react';
import { LocationService } from '../services/locationService';
import { SocketService } from '../services/socketService';

export function useLocation() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentBus, setCurrentBus] = useState(null);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);
  const updateTimeoutRef = useRef(null);

  const startTracking = () => {
    setIsTracking(true);
    setError(null);

    watchIdRef.current = LocationService.startTracking(async (location) => {
      // Debounce location updates (max 1 per second)
      if (updateTimeoutRef.current) return;

      updateTimeoutRef.current = setTimeout(() => {
        updateTimeoutRef.current = null;
      }, 1000);

      try {
        // Update via Socket.io for real-time
        SocketService.updateLocation(
          location.lat,
          location.lng,
          location.speed || 0
        );

        // Periodic REST API update for backup
        const result = await LocationService.updateLocation(
          location.lat,
          location.lng,
          location.speed || 0
        );

        if (result.data.busId) {
          setCurrentBus(result.data);
        }
      } catch (err) {
        setError(err.error || 'Location update failed');
      }
    });
  };

  const stopTracking = async () => {
    setIsTracking(false);
    LocationService.stopTracking(watchIdRef.current);
    
    if (currentBus) {
      try {
        await LocationService.exitBus();
        setCurrentBus(null);
      } catch (err) {
        setError(err.error || 'Failed to exit bus');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        LocationService.stopTracking(watchIdRef.current);
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return {
    isTracking,
    currentBus,
    error,
    startTracking,
    stopTracking,
  };
}
```

---

## 🚀 React Component Example

```jsx
// BusTracker.jsx
import React, { useEffect, useState } from 'react';
import { SocketService } from '../services/socketService';
import { BusService } from '../services/busService';
import { ETAService } from '../services/etaService';
import { SeatService } from '../services/seatService';
import { useLocation } from '../hooks/useLocation';

export function BusTracker() {
  const { isTracking, currentBus, error, startTracking, stopTracking } = useLocation();
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [etaData, setEtaData] = useState(null);
  const [seatStatus, setSeatStatus] = useState(null);

  useEffect(() => {
    // Connect to Socket.io
    SocketService.connect();

    // Load all buses
    loadBuses();

    // Real-time seat updates
    SocketService.onSeatUpdate((data) => {
      setSeatStatus(data);
    });

    // Real-time ETA updates
    SocketService.onBusETAUpdate((data) => {
      if (selectedBus?.id === data.busId) {
        setEtaData(data);
      }
    });

    return () => {
      SocketService.disconnect();
    };
  }, []);

  const loadBuses = async () => {
    try {
      const result = await BusService.getAllBuses();
      setBuses(result.data);
    } catch (err) {
      console.error('Error loading buses:', err);
    }
  };

  const handleSelectBus = async (bus) => {
    setSelectedBus(bus);
    
    // Subscribe to bus updates
    SocketService.subscribeToBus(bus.id);

    // Load ETA
    try {
      const result = await ETAService.getBusETA(bus.id);
      setEtaData(result.data);
    } catch (err) {
      console.error('Error loading ETA:', err);
    }

    // Load seat status
    try {
      const result = await SeatService.getSeatStatus(bus.id);
      setSeatStatus(result.data);
    } catch (err) {
      console.error('Error loading seat status:', err);
    }
  };

  const handleReportSeat = async (status) => {
    if (!selectedBus) return;

    try {
      await SeatService.reportSeatAvailability(selectedBus.id, status);
      console.log(`✅ Reported seat status: ${status}`);
    } catch (err) {
      console.error('❌ Error reporting seat:', err);
    }
  };

  return (
    <div className="bus-tracker">
      <div className="controls">
        <button onClick={() => isTracking ? stopTracking() : startTracking()}>
          {isTracking ? '⏹️ Stop Tracking' : '▶️ Start Tracking'}
        </button>
        {error && <div className="error">{error}</div>}
      </div>

      {currentBus && (
        <div className="current-bus">
          <h3>📍 Current Bus: {currentBus.busId}</h3>
          <p>Route: {currentBus.routeId}</p>
        </div>
      )}

      <div className="buses-list">
        <h2>🚍 Active Buses</h2>
        {buses.map((bus) => (
          <div
            key={bus.id}
            className={`bus-card ${selectedBus?.id === bus.id ? 'selected' : ''}`}
            onClick={() => handleSelectBus(bus)}
          >
            <h4>{bus.route.name} ({bus.route.number})</h4>
            <p>Passengers: {bus.passengerCount}</p>
            <p>Speed: {bus.avg_speed.toFixed(1)} km/h</p>
          </div>
        ))}
      </div>

      {selectedBus && etaData && (
        <div className="eta-section">
          <h2>⏱️ Next Stops</h2>
          {etaData.upcomingStops.map((stop, idx) => (
            <div key={idx} className="stop">
              <p><strong>{stop.stopName}</strong></p>
              <p>ETA: {stop.etaTime} ({stop.distanceKm} km)</p>
            </div>
          ))}
        </div>
      )}

      {seatStatus && (
        <div className="seat-section">
          <h2>🪑 Seat Status</h2>
          <div
            className="status"
            style={{ backgroundColor: SeatService.getStatusColor(seatStatus.status) }}
          >
            <p>{SeatService.getStatusLabel(seatStatus.status)}</p>
            <p>Confidence: {seatStatus.confidence}%</p>
          </div>

          <div className="report-buttons">
            <button onClick={() => handleReportSeat('empty')}>🟢 Empty</button>
            <button onClick={() => handleReportSeat('standing')}>🟡 Standing</button>
            <button onClick={() => handleReportSeat('full')}>🔴 Full</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BusTracker;
```

---

## Performance Tips

1. **Location Updates**: Debounce to 1 update per second maximum
2. **Real-time Events**: Use Socket.io instead of polling for location/seat updates
3. **Caching**: Cache route and stop data locally
4. **Batch Requests**: Combine multiple REST calls when possible
5. **Memory**: Clean up Socket.io listeners when components unmount
6. **Accuracy**: Use high-accuracy geolocation with timeouts

---

## Error Handling

```javascript
async function handleAPIError(error) {
  if (error.response?.status === 401) {
    // Token expired, redirect to login
    AuthService.logout();
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    // Access denied
    console.error('Access denied:', error.response.data.error);
  } else if (error.response?.status === 404) {
    // Resource not found
    console.error('Not found:', error.response.data.error);
  } else {
    // Other errors
    console.error('Error:', error.response?.data?.error || error.message);
  }
}
```
