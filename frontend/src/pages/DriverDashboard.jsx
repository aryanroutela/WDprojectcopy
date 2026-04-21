import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";
import CheckpointTracker from "../components/CheckpointTracker";
import ETADisplay from "../components/ETADisplay";

const LiveMap = lazy(() => import("../components/LiveMap"));

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API;

const DriverDashboard = () => {
  const { token, user } = useAuth();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [activeBusId, setActiveBusId] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [etaData, setEtaData] = useState(null);
  const [mapBuses, setMapBuses] = useState([]);

  // Bus registration form
  const [showRegister, setShowRegister] = useState(false);
  const [busForm, setBusForm] = useState({
    busNumber: "", routeName: "", source: "", destination: "", capacity: "",
    checkpoints: []
  });
  const [registering, setRegistering] = useState(false);

  // Checkpoint editor
  const [showCpEditor, setShowCpEditor] = useState(false);
  const [editingBusId, setEditingBusId] = useState(null);
  const [cpForm, setCpForm] = useState([{ name: "", sequence: 0, latitude: "", longitude: "" }]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    fetchMyBuses();

    socketRef.current.on("bus:realTimeUpdate", (data) => {
      if (data.checkpointProgress) setEtaData(data.checkpointProgress);
    });

    socketRef.current.on("bus:checkpointReached", (data) => {
      toast.info(`📍 Checkpoint reached: ${data.checkpointName}`);
    });

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      socketRef.current?.disconnect();
    };
  }, []);

  const fetchMyBuses = async () => {
    try {
      const res = await axios.get(`${API}/api/driver/buses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBuses(res.data.buses || []);
      setMapBuses(res.data.buses?.filter((b) => b.status === "active") || []);
    } catch { toast.error("Failed to load buses"); }
    finally { setLoading(false); }
  };

  // ── Bus Registration ─────────────────────────────────────────
  const handleRegisterBus = async (e) => {
    e.preventDefault();
    if (!busForm.busNumber || !busForm.routeName || !busForm.capacity) {
      toast.error("Bus number, route name, and capacity are required"); return;
    }
    setRegistering(true);
    try {
      let checkpoints = busForm.checkpoints;
      if (checkpoints.length === 0 && busForm.source && busForm.destination) {
        checkpoints = [
          { name: busForm.source, sequence: 0, latitude: null, longitude: null },
          { name: busForm.destination, sequence: 1, latitude: null, longitude: null },
        ];
      }
      await axios.post(`${API}/api/driver/bus/register`,
        { ...busForm, checkpoints },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Bus registered! 🚍");
      setShowRegister(false);
      setBusForm({ busNumber: "", routeName: "", source: "", destination: "", capacity: "", checkpoints: [] });
      fetchMyBuses();
    } catch (err) { toast.error(err.response?.data?.message || "Registration failed"); }
    finally { setRegistering(false); }
  };

  // ── Service Start / Stop ─────────────────────────────────────
  const handleStartService = async (bus) => {
    try {
      await axios.post(`${API}/api/driver/bus/${bus._id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Service started! 🚀");
      socketRef.current.emit("driver:joinBus", { busId: bus._id, driverId: user?.id });
      socketRef.current.emit("driver:startService", { busId: bus._id, driverId: user?.id });
      setActiveBusId(bus._id);
      startTracking(bus);
      fetchMyBuses();
    } catch { toast.error("Failed to start service"); }
  };

  const handleStopService = async (bus) => {
    try {
      await axios.post(`${API}/api/driver/bus/${bus._id}/stop`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Service stopped ⛔");
      socketRef.current.emit("driver:stopService", { busId: bus._id, driverId: user?.id });
      stopTracking();
      setActiveBusId(null);
      setEtaData(null);
      fetchMyBuses();
    } catch { toast.error("Failed to stop service"); }
  };

  // ── Live GPS Tracking ────────────────────────────────────────
  const startTracking = (bus) => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        const loc = { latitude, longitude };
        setCurrentLocation(loc);

        socketRef.current?.emit("driver:updateLocation", {
          busId: bus._id,
          driverId: user?.id,
          latitude,
          longitude,
          speed: speed ? Math.abs(speed) * 3.6 : 0,
          heading: heading || 0,
        });

        setBuses((prev) =>
          prev.map((b) => b._id === bus._id ? { ...b, currentLocation: loc, location: loc } : b)
        );
        setMapBuses((prev) =>
          prev.map((b) => b._id === bus._id ? { ...b, currentLocation: loc, location: loc } : b)
        );
      },
      () => toast.error("Could not get location"),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setTracking(false);
    setCurrentLocation(null);
  };

  // ── Seat Updates ─────────────────────────────────────────────
  const handleUpdateSeats = async (bus, newSeats) => {
    try {
      await axios.patch(
        `${API}/api/driver/bus/${bus._id}/seats`,
        { seatsAvailable: newSeats },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      socketRef.current?.emit("driver:updateSeats", {
        busId: bus._id,
        seatsAvailable: newSeats,
        capacity: bus.capacity,
      });
      setBuses((prev) =>
        prev.map((b) => b._id === bus._id ? { ...b, seatsAvailable: newSeats } : b)
      );
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update seats"); }
  };

  // ── Manual Checkpoint arrival ────────────────────────────────
  const handleArriveAtCheckpoint = (bus, cp, idx) => {
    socketRef.current?.emit("driver:arrivedAtCheckpoint", {
      busId: bus._id,
      checkpointIdx: idx,
      checkpointName: cp.name,
    });
    setBuses((prev) =>
      prev.map((b) =>
        b._id === bus._id
          ? { ...b, currentCheckpointIdx: idx, currentCheckpointName: cp.name }
          : b
      )
    );
    toast.success(`✅ Marked arrival at ${cp.name}`);
  };

  // ── Checkpoint editor submit ─────────────────────────────────
  const handleSaveCheckpoints = async () => {
    if (cpForm.length < 2) { toast.error("At least 2 checkpoints required"); return; }
    try {
      const checkpoints = cpForm.map((cp, i) => ({
        name: cp.name,
        sequence: i,
        latitude: cp.latitude ? parseFloat(cp.latitude) : null,
        longitude: cp.longitude ? parseFloat(cp.longitude) : null,
      }));
      await axios.patch(
        `${API}/api/driver/bus/${editingBusId}/checkpoints`,
        { checkpoints },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Checkpoints saved! 📍");
      setShowCpEditor(false);
      fetchMyBuses();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const activeBus = buses.find((b) => b._id === activeBusId);

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <p className="loading-text">Loading your buses...</p>
    </div>
  );

  return (
    <div className="page">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="dash-header">
        <div className="container">
          <div className="dash-header-inner">
            <div>
              <h1>
                🚌 Driver Panel
                {tracking && (
                  <span className="live-badge" style={{ marginLeft: 12, fontSize: 11, verticalAlign: "middle" }}>
                    <span className="live-dot" style={{ width: 6, height: 6 }} /> Broadcasting
                  </span>
                )}
              </h1>
              <p>Welcome, {user?.firstName || "Driver"} · Manage your buses &amp; routes</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowMap(!showMap)}
                id="driver-toggle-map"
              >
                {showMap ? "📋 Hide Map" : "🗺️ Live Map"}
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowRegister(!showRegister)}
                id="driver-register-bus"
              >
                ➕ Register Bus
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Tracking Banner ─────────────────────────────── */}
      {tracking && activeBus && (
        <div className="dash-content" style={{ paddingBottom: 0 }}>
          <div className="driver-status-banner">
            <div className="driver-status-icon">📡</div>
            <div style={{ flex: 1 }}>
              <div className="driver-status-title">Broadcasting — Bus {activeBus.busNumber}</div>
              <div className="driver-status-sub">
                {currentLocation
                  ? `📍 ${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`
                  : "Getting your location..."}
              </div>
            </div>
            <button
              className="btn btn-sm"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
              onClick={() => handleStopService(activeBus)}
            >
              ⛔ Stop
            </button>
          </div>
        </div>
      )}

      {/* ── Live Map ──────────────────────────────────────────── */}
      {showMap && (
        <div className="dash-content">
          <div className="map-wrap">
            <Suspense fallback={<div className="map-loading"><div className="spinner spinner-primary" /><p>Loading map...</p></div>}>
              <LiveMap
                buses={mapBuses}
                selectedBus={activeBus
                  ? { ...activeBus, currentLocation: currentLocation || activeBus.currentLocation }
                  : null}
                followBus={tracking}
                height="380px"
              />
            </Suspense>
          </div>
          {tracking && etaData && (
            <div style={{ marginTop: 16 }}>
              <ETADisplay etaData={etaData} eta={etaData?.etaToNextStop} busNumber={activeBus?.busNumber} />
            </div>
          )}
        </div>
      )}

      {/* ── Register Form ──────────────────────────────────────── */}
      {showRegister && (
        <div className="dash-content">
          <div className="card" style={{ border: "1px solid var(--primary)", background: "var(--primary-muted)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--primary)" }}>
              ➕ Register New Bus
            </h3>
            <form onSubmit={handleRegisterBus} id="register-bus-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Bus Number *</label>
                  <input
                    id="reg-bus-number"
                    className="form-input"
                    placeholder="BUS-101"
                    value={busForm.busNumber}
                    onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Route Name *</label>
                  <input
                    id="reg-route-name"
                    className="form-input"
                    placeholder="Downtown Express"
                    value={busForm.routeName}
                    onChange={(e) => setBusForm({ ...busForm, routeName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Source (first stop)</label>
                  <input
                    id="reg-source"
                    className="form-input"
                    placeholder="City Center"
                    value={busForm.source}
                    onChange={(e) => setBusForm({ ...busForm, source: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination (last stop)</label>
                  <input
                    id="reg-destination"
                    className="form-input"
                    placeholder="Airport"
                    value={busForm.destination}
                    onChange={(e) => setBusForm({ ...busForm, destination: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Capacity *</label>
                  <input
                    id="reg-capacity"
                    className="form-input"
                    type="number"
                    placeholder="40"
                    min="1"
                    value={busForm.capacity}
                    onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    id="reg-submit"
                    className="btn btn-primary btn-block"
                    disabled={registering}
                  >
                    {registering ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                        <span className="spinner-sm" /> Registering...
                      </span>
                    ) : "Register Bus"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bus Cards ─────────────────────────────────────────── */}
      <div className="dash-content">
        <h2 className="section-title" style={{ marginBottom: 16 }}>
          Your Buses ({buses.length})
        </h2>

        {buses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚌</div>
            <div className="empty-state-title">No buses registered</div>
            <p className="empty-state-text">Click "Register Bus" above to get started</p>
          </div>
        ) : (
          <div className="card-grid anim-stagger">
            {buses.map((bus) => (
              <div
                key={bus._id}
                id={`driver-bus-card-${bus.busNumber}`}
                className={`card ${bus._id === activeBusId ? "card-active-bus" : ""}`}
              >
                {/* Card header */}
                <div className="bus-card-header">
                  <span className="bus-number">{bus.busNumber}</span>
                  <span className={`badge ${bus.status === "active" ? "badge-green" : "badge-gray"}`}>
                    {bus.status === "active" ? "🟢 Active" : "⚪ Inactive"}
                  </span>
                </div>
                <p className="bus-route">📍 {bus.routeName}</p>
                <p className="text-sm text-muted mb-16">
                  {bus.source || "—"} → {bus.destination || "—"}
                </p>

                {/* Checkpoint Tracker for active bus */}
                {bus._id === activeBusId && bus.checkpoints?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <CheckpointTracker
                      checkpoints={bus.checkpoints}
                      currentIdx={bus.currentCheckpointIdx ?? -1}
                      currentName={bus.currentCheckpointName}
                      nextName={bus.nextCheckpointName}
                    />
                  </div>
                )}

                {/* Manual checkpoint buttons (only when active) */}
                {bus._id === activeBusId && bus.checkpoints?.length > 0 && (
                  <div className="cp-manual-btns">
                    <div className="text-sm text-muted mb-8" style={{ fontWeight: 600 }}>
                      Mark checkpoint arrival:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {bus.checkpoints.map((cp, i) => (
                        <button
                          key={i}
                          id={`cp-arrive-${i}`}
                          className={`btn btn-sm ${i <= (bus.currentCheckpointIdx ?? -1) ? "btn-success" : "btn-outline"}`}
                          onClick={() => handleArriveAtCheckpoint(bus, cp, i)}
                          disabled={i <= (bus.currentCheckpointIdx ?? -1)}
                        >
                          {i <= (bus.currentCheckpointIdx ?? -1) ? "✅" : "📍"} {cp.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seat controls */}
                <div className="bus-stats mb-16">
                  <div className="bus-stat">
                    <span className="bus-stat-val">{bus.capacity}</span>
                    <span className="bus-stat-lbl">Total</span>
                  </div>
                  <div className="bus-stat">
                    <span className="bus-stat-val" style={{ color: "var(--green)" }}>{bus.seatsAvailable}</span>
                    <span className="bus-stat-lbl">Free</span>
                  </div>
                  <div className="bus-stat">
                    <span className="bus-stat-val" style={{ color: "var(--red)" }}>{bus.capacity - bus.seatsAvailable}</span>
                    <span className="bus-stat-lbl">Taken</span>
                  </div>
                </div>

                <div className="mb-16">
                  <div className="text-sm text-muted mb-8" style={{ fontWeight: 600 }}>Update Seats</div>
                  <div className="seat-controls">
                    <button
                      id={`seat-minus-${bus.busNumber}`}
                      className="seat-btn"
                      onClick={() => handleUpdateSeats(bus, Math.max(0, bus.seatsAvailable - 1))}
                    >−</button>
                    <span className="seat-count">{bus.seatsAvailable}</span>
                    <button
                      id={`seat-plus-${bus.busNumber}`}
                      className="seat-btn"
                      onClick={() => handleUpdateSeats(bus, Math.min(bus.capacity, bus.seatsAvailable + 1))}
                    >+</button>
                  </div>
                </div>

                {/* Checkpoint editor button */}
                <button
                  className="btn btn-outline btn-sm btn-block mb-8"
                  id={`edit-checkpoints-${bus.busNumber}`}
                  onClick={() => {
                    setEditingBusId(bus._id);
                    setCpForm(
                      bus.checkpoints?.length > 0
                        ? bus.checkpoints.map((cp) => ({
                            name: cp.name,
                            sequence: cp.sequence,
                            latitude: cp.latitude || "",
                            longitude: cp.longitude || "",
                          }))
                        : [
                            { name: bus.source || "", sequence: 0, latitude: "", longitude: "" },
                            { name: bus.destination || "", sequence: 1, latitude: "", longitude: "" },
                          ]
                    );
                    setShowCpEditor(true);
                  }}
                >
                  🗺️ Edit Checkpoints ({bus.checkpoints?.length || 0})
                </button>

                {/* Service controls */}
                {bus.status === "active" ? (
                  <button
                    className="btn-stop-trip"
                    id={`stop-service-${bus.busNumber}`}
                    onClick={() => handleStopService(bus)}
                  >
                    ⛔ Stop Service
                  </button>
                ) : (
                  <button
                    className="btn-start-trip"
                    id={`start-service-${bus.busNumber}`}
                    onClick={() => handleStartService(bus)}
                  >
                    🚀 Start Service
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Checkpoint Editor Modal ───────────────────────────── */}
      {showCpEditor && (
        <div className="modal-overlay" onClick={() => setShowCpEditor(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 580, maxHeight: "85vh", overflowY: "auto" }}
          >
            <button className="modal-close" onClick={() => setShowCpEditor(false)}>✕</button>
            <h3 className="modal-title">🗺️ Edit Checkpoints</h3>
            <p className="text-sm text-muted mb-16">
              Add stops in order. Coordinates are optional but enable precise ETA.
            </p>

            {cpForm.map((cp, i) => (
              <div key={i} className="cp-edit-row">
                <div className="cp-edit-seq">{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <input
                    className="form-input"
                    placeholder={`Stop name (e.g. ${i === 0 ? "City Center" : "Airport"})`}
                    value={cp.name}
                    onChange={(e) => {
                      const updated = [...cpForm];
                      updated[i] = { ...cp, name: e.target.value };
                      setCpForm(updated);
                    }}
                    style={{ marginBottom: 8 }}
                  />
                  <div className="form-row">
                    <input
                      className="form-input"
                      placeholder="Latitude (e.g. 12.9716)"
                      value={cp.latitude}
                      onChange={(e) => {
                        const updated = [...cpForm];
                        updated[i] = { ...cp, latitude: e.target.value };
                        setCpForm(updated);
                      }}
                    />
                    <input
                      className="form-input"
                      placeholder="Longitude (e.g. 77.5946)"
                      value={cp.longitude}
                      onChange={(e) => {
                        const updated = [...cpForm];
                        updated[i] = { ...cp, longitude: e.target.value };
                        setCpForm(updated);
                      }}
                    />
                  </div>
                </div>
                <button
                  className="cp-edit-remove"
                  onClick={() => setCpForm(cpForm.filter((_, j) => j !== i))}
                  disabled={cpForm.length <= 2}
                >✕</button>
              </div>
            ))}

            <button
              className="btn btn-outline btn-sm btn-block"
              style={{ marginTop: 12 }}
              onClick={() => setCpForm([...cpForm, { name: "", sequence: cpForm.length, latitude: "", longitude: "" }])}
            >
              + Add Stop
            </button>

            <button
              id="save-checkpoints"
              className="btn btn-primary btn-block"
              style={{ marginTop: 12 }}
              onClick={handleSaveCheckpoints}
            >
              💾 Save Checkpoints
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
