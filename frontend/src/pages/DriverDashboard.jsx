import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

const API = import.meta.env.VITE_BACKEND_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API;

const DriverDashboard = () => {
  const { token, user } = useAuth();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  const [showRegister, setShowRegister] = useState(false);
  const [busForm, setBusForm] = useState({
    busNumber: "", routeName: "", source: "", destination: "", capacity: ""
  });
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    fetchMyBuses();
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      socketRef.current?.disconnect();
    };
  }, []);

  const fetchMyBuses = async () => {
    try {
      const res = await axios.get(`${API}/api/driver/buses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBuses(res.data.buses);
    } catch { toast.error("Failed to load buses"); }
    finally { setLoading(false); }
  };

  const handleRegisterBus = async (e) => {
    e.preventDefault();
    if (!busForm.busNumber || !busForm.routeName || !busForm.source || !busForm.destination || !busForm.capacity) {
      toast.error("All fields are required"); return;
    }
    setRegistering(true);
    try {
      await axios.post(`${API}/api/driver/bus/register`, busForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Bus registered! 🚍");
      setShowRegister(false);
      setBusForm({ busNumber: "", routeName: "", source: "", destination: "", capacity: "" });
      fetchMyBuses();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setRegistering(false); }
  };

  const handleStartService = async (busId) => {
    try {
      await axios.post(`${API}/api/driver/bus/${busId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Service started! 🚀");
      socketRef.current.emit("driver:joinBus", { busId, driverId: user?.id });
      startTracking(busId);
      fetchMyBuses();
    } catch { toast.error("Failed to start service"); }
  };

  const handleStopService = async (busId) => {
    try {
      await axios.post(`${API}/api/driver/bus/${busId}/stop`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Service stopped ⛔");
      stopTracking();
      fetchMyBuses();
    } catch { toast.error("Failed to stop service"); }
  };

  const startTracking = (busId) => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        socketRef.current.emit("driver:updateLocation", {
          busId, driverId: user?.id,
          latitude: pos.coords.latitude, longitude: pos.coords.longitude,
          speed: pos.coords.speed || 0, eta: null
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setTracking(false);
  };

  const handleUpdateSeats = async (busId, newSeats) => {
    try {
      await axios.patch(`${API}/api/driver/bus/${busId}/seats`, { seatsAvailable: newSeats }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const bus = buses.find((b) => b._id === busId);
      if (bus) socketRef.current.emit("driver:updateSeats", { busId, seatsAvailable: newSeats, capacity: bus.capacity });
      fetchMyBuses();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /><p>Loading...</p></div>;

  return (
    <div className="page">
      {/* Header */}
      <div className="dash-header">
        <div className="container flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1>🚌 Driver Panel</h1>
            <p>Welcome, {user?.firstName || "Driver"} {tracking && <span className="badge badge-green"><span className="live-dot" /> Live Tracking</span>}</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowRegister(!showRegister)}>
            ➕ Add Bus
          </button>
        </div>
      </div>

      {/* Register Form */}
      {showRegister && (
        <div className="section" style={{ background: "var(--white)", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Register New Bus</h3>
            <form onSubmit={handleRegisterBus}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Bus Number *</label>
                  <input className="form-input" placeholder="BUS-101" value={busForm.busNumber}
                    onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Route Name *</label>
                  <input className="form-input" placeholder="Downtown Express" value={busForm.routeName}
                    onChange={(e) => setBusForm({ ...busForm, routeName: e.target.value })} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Source *</label>
                  <input className="form-input" placeholder="City Center" value={busForm.source}
                    onChange={(e) => setBusForm({ ...busForm, source: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Destination *</label>
                  <input className="form-input" placeholder="Airport" value={busForm.destination}
                    onChange={(e) => setBusForm({ ...busForm, destination: e.target.value })} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Capacity *</label>
                  <input className="form-input" type="number" placeholder="40" min="1" value={busForm.capacity}
                    onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })} required /></div>
                <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
                  <button className="btn btn-primary btn-block" disabled={registering}>
                    {registering ? "Registering..." : "Register"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Buses */}
      <div className="dash-content">
        <h2 className="section-title">Your Buses ({buses.length})</h2>
        {buses.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🚌</div><p className="empty-state-text">No buses yet. Register one above!</p></div>
        ) : (
          <div className="card-grid">
            {buses.map((bus) => (
              <div key={bus._id} className="card">
                <div className="bus-card-header">
                  <span className="bus-number">{bus.busNumber}</span>
                  <span className={`badge ${bus.status === "active" ? "badge-green" : "badge-gray"}`}>
                    {bus.status === "active" ? "🟢 Active" : "⚪ Inactive"}
                  </span>
                </div>
                <p className="bus-route">📍 {bus.routeName}</p>
                <p className="text-sm text-muted mb-16">{bus.source || "N/A"} → {bus.destination || "N/A"}</p>

                <div className="bus-stats mb-16">
                  <div className="bus-stat"><span className="bus-stat-val">{bus.capacity}</span><span className="bus-stat-lbl">Capacity</span></div>
                  <div className="bus-stat"><span className="bus-stat-val">{bus.seatsAvailable}</span><span className="bus-stat-lbl">Available</span></div>
                </div>

                {/* Seat Controls */}
                <div className="mb-16">
                  <div className="text-sm text-muted mb-8">Update Seats</div>
                  <div className="seat-controls">
                    <button className="seat-btn" onClick={() => handleUpdateSeats(bus._id, Math.max(0, bus.seatsAvailable - 1))}>−</button>
                    <span className="seat-count">{bus.seatsAvailable}</span>
                    <button className="seat-btn" onClick={() => handleUpdateSeats(bus._id, Math.min(bus.capacity, bus.seatsAvailable + 1))}>+</button>
                  </div>
                </div>

                {/* Service Button */}
                {bus.status === "active" ? (
                  <button className="btn btn-danger btn-block btn-sm" onClick={() => handleStopService(bus._id)}>⛔ Stop Service</button>
                ) : (
                  <button className="btn btn-success btn-block btn-sm" onClick={() => handleStartService(bus._id)}>🚀 Start Service</button>
                )}

                {bus.currentLocation?.latitude && (
                  <p className="text-sm text-muted mt-8">📍 {bus.currentLocation.latitude.toFixed(4)}, {bus.currentLocation.longitude.toFixed(4)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
