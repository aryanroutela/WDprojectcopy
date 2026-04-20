import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import useLiveBuses from "../hooks/useLiveBuses";
import SmartSearch from "../components/SmartSearch";
import ETADisplay from "../components/ETADisplay";
import CheckpointTracker from "../components/CheckpointTracker";

// Lazy-load the map (avoids SSR issues with Leaflet)
const LiveMap = lazy(() => import("../components/LiveMap"));

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const UserDashboard = () => {
  const { token, user } = useAuth();
  const { buses, connected, loading, trackBus, untrackBus } = useLiveBuses({
    userId: user?.id,
    role: "user",
  });

  const [filteredBuses, setFilteredBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [followBus, setFollowBus] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [activeTab, setActiveTab] = useState("map"); // "map" | "list"
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaint, setComplaint] = useState({ busNumber: "", description: "", rating: 3 });
  const [submitting, setSubmitting] = useState(false);

  const haversineDistance = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
    const toRad = (x) => (x * Math.PI) / 180;
    const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Sync filteredBuses with live bus updates
  useEffect(() => {
    setFilteredBuses((prev) => {
      if (prev.length === 0) return buses;
      const prevMap = new Map(prev.map((b) => [b._id, b]));
      return buses.filter((b) => prevMap.has(b._id)).map((liveBus) => {
        const p = prevMap.get(liveBus._id);
        let dynamicMatchedEta = p.matchedEta;
        
        if (liveBus.currentLocation?.latitude && p.matchedSourceStop?.latitude) {
          const dist = haversineDistance(
            liveBus.currentLocation.latitude, liveBus.currentLocation.longitude,
            p.matchedSourceStop.latitude, p.matchedSourceStop.longitude
          );
          const speedFactor = liveBus.speed > 2 ? liveBus.speed : 30;
          dynamicMatchedEta = Math.ceil((dist / speedFactor) * 60);
        }

        return { ...liveBus, matchedSourceStop: p.matchedSourceStop, matchedEta: dynamicMatchedEta };
      });
    });
  }, [buses]);

  // Initial data
  useEffect(() => {
    fetchRoutes();
    getUserLocation();
  }, []);

  // When bus list first arrives, show all
  useEffect(() => {
    if (buses.length > 0 && filteredBuses.length === 0) {
      setFilteredBuses(buses);
    }
  }, [buses]);

  const fetchRoutes = async () => {
    try {
      const res = await axios.get(`${API}/api/routes`);
      setRoutes(res.data.routes || []);
    } catch { /* silent */ }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {}
    );
  };

  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
    setFollowBus(true);
    setActiveTab("map");
    trackBus(bus._id);
  };

  const handleCloseBus = () => {
    if (selectedBus) untrackBus(selectedBus._id);
    setSelectedBus(null);
    setFollowBus(false);
  };

  const handleSmartResults = useCallback((results) => {
    setFilteredBuses(results.length > 0 ? results : buses);
    setSelectedBus(null);
    setActiveTab("list");
  }, [buses]);

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaint.busNumber || !complaint.description) {
      toast.error("Bus number and description required"); return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/complaints`, complaint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Complaint submitted ✅");
      setShowComplaint(false);
      setComplaint({ busNumber: "", description: "", rating: 3 });
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const getStatusClass = (s) =>
    s === "green" ? "badge-green" : s === "yellow" ? "badge-yellow" : "badge-red";
  const getStatusLabel = (s) =>
    s === "green" ? "Available" : s === "yellow" ? "Filling Up" : "Full";
  const getStatusColor = (s) =>
    s === "green" ? "#10b981" : s === "yellow" ? "#f59e0b" : "#ef4444";

  // Merge live data into selected bus
  const liveBusData = selectedBus
    ? buses.find((b) => b._id === selectedBus._id) || selectedBus
    : null;

  if (loading)
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p>Loading live bus data...</p>
      </div>
    );

  return (
    <div className="page">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="dash-header">
        <div className="container flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1>👤 Hi, {user?.firstName || "Passenger"}</h1>
            <p>
              Live tracking &nbsp;·&nbsp; Smart search &nbsp;·&nbsp; ETA updates
              {connected && (
                <span className="badge badge-green" style={{ marginLeft: 8 }}>
                  <span className="live-dot" /> Connected
                </span>
              )}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={getUserLocation} title="Use my location">
              📍 My Location
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowComplaint(true)}>
              🛑 Complaint
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ────────────────────────────────────────────── */}
      <div className="dash-stats container">
        <div className="stat-card">
          <div className="stat-card-num">{buses.length}</div>
          <div className="stat-card-label">Total Buses</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-num" style={{ color: "#10b981" }}>
            {buses.filter((b) => b.status === "active" || b.busStatus === "green").length}
          </div>
          <div className="stat-card-label">Active Now</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-num">{routes.length}</div>
          <div className="stat-card-label">Routes</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-num" style={{ color: connected ? "#10b981" : "#ef4444" }}>
            <span className="live-dot" style={{ background: connected ? "#10b981" : "#ef4444" }} />
            {connected ? " Live" : " Offline"}
          </div>
          <div className="stat-card-label">Tracking</div>
        </div>
      </div>

      {/* ── Smart Search ─────────────────────────────────────────── */}
      <div className="dash-content">
        <SmartSearch onResults={handleSmartResults} allBuses={buses} />
      </div>

      {/* ── Route Chips ──────────────────────────────────────────── */}
      {routes.length > 0 && (
        <div style={{ padding: "0 20px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span
            className="chip active"
            onClick={() => { setFilteredBuses(buses); setSelectedBus(null); }}
          >
            All
          </span>
          {routes.map((r) => (
            <span
              key={r._id || r}
              className="chip"
              onClick={() => {
                const name = r.routeName || r;
                setFilteredBuses(buses.filter((b) => b.routeName === name));
                setSelectedBus(null);
              }}
            >
              {r.routeName || r}
            </span>
          ))}
        </div>
      )}

      {/* ── Tab Switch ───────────────────────────────────────────── */}
      <div className="container" style={{ marginBottom: 0 }}>
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === "map" ? "tab-btn-active" : ""}`}
            onClick={() => setActiveTab("map")}
          >
            🗺️ Live Map
          </button>
          <button
            className={`tab-btn ${activeTab === "list" ? "tab-btn-active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            🚌 Bus List ({filteredBuses.length})
          </button>
        </div>
      </div>

      {/* ── Map View ─────────────────────────────────────────────── */}
      {activeTab === "map" && (
        <div className="dash-content">
          <Suspense fallback={<div className="map-loading">Loading map...</div>}>
            <LiveMap
              buses={buses}
              selectedBus={liveBusData}
              userLocation={userLocation}
              followBus={followBus}
              height="480px"
            />
          </Suspense>

          {/* Selected bus detail panel */}
          {liveBusData && (
            <div className="bus-detail-panel">
              <div className="bus-detail-header">
                <div>
                  <h3>🚌 Bus {liveBusData.busNumber}</h3>
                  <p>{liveBusData.routeName}</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className={`btn btn-sm ${followBus ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setFollowBus(!followBus)}
                  >
                    {followBus ? "📡 Following" : "👁 Follow"}
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={handleCloseBus}>✕</button>
                </div>
              </div>

              <div className="bus-detail-body">
                {/* ETA Panel */}
                <div className="bus-detail-section">
                  <ETADisplay
                    etaData={liveBusData.etaData}
                    eta={liveBusData.eta}
                    busNumber={liveBusData.busNumber}
                  />
                </div>

                {/* Checkpoint tracker */}
                {liveBusData.checkpoints?.length > 0 && (
                  <div className="bus-detail-section">
                    <CheckpointTracker
                      checkpoints={liveBusData.checkpoints}
                      currentIdx={liveBusData.currentCheckpointIdx ?? -1}
                      currentName={liveBusData.currentCheckpointName}
                      nextName={liveBusData.nextCheckpointName}
                    />
                  </div>
                )}

                {/* Stats grid */}
                <div className="bus-detail-stats">
                  <div className="bus-detail-stat">
                    <span className="bus-detail-stat-val">
                      {liveBusData.seatsAvailable}/{liveBusData.capacity}
                    </span>
                    <span className="bus-detail-stat-lbl">Seats</span>
                  </div>
                  <div className="bus-detail-stat">
                    <span className="bus-detail-stat-val">{liveBusData.occupancy || "—"}%</span>
                    <span className="bus-detail-stat-lbl">Occupancy</span>
                  </div>
                  {liveBusData.speed != null && (
                    <div className="bus-detail-stat">
                      <span className="bus-detail-stat-val">{Math.round(liveBusData.speed)}</span>
                      <span className="bus-detail-stat-lbl">km/h</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bus List ─────────────────────────────────────────────── */}
      {activeTab === "list" && (
        <div className="dash-content">
          {filteredBuses.length > 0 ? (
            <div className="card-grid">
              {filteredBuses.map((bus) => {
                const st = bus.busStatus || bus.status;
                const loc = bus.currentLocation || bus.location;
                return (
                  <div
                    key={bus._id}
                    className={`card bus-card ${selectedBus?._id === bus._id ? "bus-card-selected" : ""}`}
                    onClick={() => handleSelectBus(bus)}
                  >
                    <div className="bus-card-header">
                      <span className="bus-number">{bus.busNumber}</span>
                      <span className={`badge ${getStatusClass(st)}`}>{getStatusLabel(st)}</span>
                    </div>
                    <p className="bus-route">📍 {bus.routeName}</p>
                    <p className="text-sm text-muted" style={{ marginBottom: 8 }}>
                      {bus.source || bus.checkpoints?.[0]?.name || "—"} →{" "}
                      {bus.destination || bus.checkpoints?.[bus.checkpoints.length - 1]?.name || "—"}
                    </p>

                    {/* Checkpoint mini-progress */}
                    {bus.checkpoints?.length > 0 && (
                      <div className="mini-progress-row">
                        {bus.checkpoints.map((cp, i) => (
                          <div
                            key={i}
                            className={`mini-cp-dot ${
                              i <= (bus.currentCheckpointIdx ?? -1)
                                ? "mini-cp-passed"
                                : i === (bus.currentCheckpointIdx ?? -1) + 1
                                ? "mini-cp-next"
                                : "mini-cp-upcoming"
                            }`}
                            title={cp.name}
                          />
                        ))}
                      </div>
                    )}

                    <div className="bus-stats">
                      <div className="bus-stat">
                        <span className="bus-stat-val">{bus.seatsAvailable}/{bus.capacity}</span>
                        <span className="bus-stat-lbl">Seats</span>
                      </div>
                      {bus.matchedEta != null ? (
                        <div className="bus-stat" title={`ETA to ${bus.matchedSourceStop?.name}`}>
                          <span className="bus-stat-val" style={{ color: "#6366f1" }}>{bus.matchedEta}m</span>
                          <span className="bus-stat-lbl">ETA to Src</span>
                        </div>
                      ) : bus.eta != null ? (
                        <div className="bus-stat">
                          <span className="bus-stat-val" style={{ color: "#6366f1" }}>{bus.eta}m</span>
                          <span className="bus-stat-lbl">ETA</span>
                        </div>
                      ) : null}
                      {bus.speed != null && (
                        <div className="bus-stat">
                          <span className="bus-stat-val">{Math.round(bus.speed)}</span>
                          <span className="bus-stat-lbl">km/h</span>
                        </div>
                      )}
                    </div>

                    <div className="progress">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${bus.occupancy || 0}%`,
                          background: getStatusColor(st),
                        }}
                      />
                    </div>

                    {loc?.latitude && (
                      <p className="text-sm text-muted mt-8">
                        <span className="live-dot" /> Live &nbsp;·&nbsp;
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </p>
                    )}

                    {bus.nextCheckpointName && (
                      <p className="text-sm" style={{ color: "#6366f1", marginTop: 4 }}>
                        🎯 Next: {bus.nextCheckpointName}
                      </p>
                    )}

                    <div className="bus-card-cta">View on Map →</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🚌</div>
              <p className="empty-state-text">No buses match your search</p>
            </div>
          )}
        </div>
      )}

      {/* ── Complaint Modal ──────────────────────────────────────── */}
      {showComplaint && (
        <div className="modal-overlay" onClick={() => setShowComplaint(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowComplaint(false)}>✕</button>
            <h3 className="modal-title">🛑 Submit Complaint</h3>
            <form onSubmit={handleSubmitComplaint}>
              <div className="form-group">
                <label className="form-label">Bus Number *</label>
                <input
                  className="form-input"
                  placeholder="e.g. BUS-101"
                  value={complaint.busNumber}
                  onChange={(e) => setComplaint({ ...complaint, busNumber: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-input"
                  placeholder="Describe the issue..."
                  value={complaint.description}
                  onChange={(e) => setComplaint({ ...complaint, description: e.target.value })}
                  required
                  style={{ minHeight: 80, resize: "vertical" }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`star ${s <= complaint.rating ? "active" : ""}`}
                      onClick={() => setComplaint({ ...complaint, rating: s })}
                    >★</span>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
