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
  const [activeRouteFilter, setActiveRouteFilter] = useState("All");

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
    s === "green" ? "var(--green)" : s === "yellow" ? "var(--yellow)" : "var(--red)";

  // Merge live data into selected bus
  const liveBusData = selectedBus
    ? buses.find((b) => b._id === selectedBus._id) || selectedBus
    : null;

  // Smart UX message
  const getSmartMessage = () => {
    if (!liveBusData) return null;
    const eta = liveBusData.matchedEta ?? liveBusData.eta;
    if (eta != null && eta <= 3) return { type: "arriving", text: "🚨 Bus arriving soon — head to the stop!" };
    if (eta != null && eta <= 10) return { type: "next", text: `⏱ Next bus in ${eta} mins — you have time` };
    return null;
  };
  const smartMsg = getSmartMessage();

  if (loading)
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p className="loading-text">Loading live bus data...</p>
      </div>
    );

  return (
    <div className="page">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="dash-header">
        <div className="container">
          <div className="dash-header-inner">
            <div>
              <h1>
                👤 Hi, {user?.firstName || "Passenger"}
                {connected && (
                  <span className="live-badge" style={{ marginLeft: 12, fontSize: 11, verticalAlign: "middle" }}>
                    <span className="live-dot" style={{ width: 6, height: 6 }} /> Live
                  </span>
                )}
              </h1>
              <p>Live tracking · Smart search · Real-time ETAs</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={getUserLocation}
                id="user-get-location"
                title="Use my location"
              >
                📍 My Location
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowComplaint(true)}
                id="user-file-complaint"
              >
                🛑 Complaint
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ────────────────────────────────────────────── */}
      <div className="dash-stats anim-stagger">
        <div className="stat-card">
          <div className="stat-card-icon">🚌</div>
          <div className="stat-card-num">{buses.length}</div>
          <div className="stat-card-label">Total Buses</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🟢</div>
          <div className="stat-card-num" style={{ color: "var(--green)" }}>
            {buses.filter((b) => b.status === "active" || b.busStatus === "green").length}
          </div>
          <div className="stat-card-label">Active Now</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🗺️</div>
          <div className="stat-card-num">{routes.length}</div>
          <div className="stat-card-label">Routes</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">{connected ? "📡" : "⚠️"}</div>
          <div className="stat-card-num" style={{ color: connected ? "var(--green)" : "var(--red)", fontSize: 18 }}>
            <span className="live-dot" style={{ background: connected ? "var(--green)" : "var(--red)" }} />
            {connected ? " Live" : " Offline"}
          </div>
          <div className="stat-card-label">Tracking</div>
        </div>
      </div>

      {/* ── Smart Search ─────────────────────────────────────────── */}
      <div className="dash-content" style={{ paddingBottom: 0 }}>
        <SmartSearch onResults={handleSmartResults} allBuses={buses} />
      </div>

      {/* ── Route Filter Chips ────────────────────────────────────── */}
      {routes.length > 0 && (
        <div style={{ padding: "0 20px 16px" }}>
          <div className="chips-row">
            <span
              className={`chip ${activeRouteFilter === "All" ? "active" : ""}`}
              id="filter-all"
              onClick={() => { setActiveRouteFilter("All"); setFilteredBuses(buses); setSelectedBus(null); }}
            >
              All
            </span>
            {routes.map((r) => {
              const name = r.routeName || r;
              return (
                <span
                  key={r._id || r}
                  className={`chip ${activeRouteFilter === name ? "active" : ""}`}
                  id={`filter-route-${typeof r === "string" ? r : r._id}`}
                  onClick={() => {
                    setActiveRouteFilter(name);
                    setFilteredBuses(buses.filter((b) => b.routeName === name));
                    setSelectedBus(null);
                  }}
                >
                  {name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab Switch ───────────────────────────────────────────── */}
      <div className="dash-content" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="tab-bar">
          <button
            id="tab-map"
            className={`tab-btn ${activeTab === "map" ? "tab-btn-active" : ""}`}
            onClick={() => setActiveTab("map")}
          >
            🗺️ Live Map
          </button>
          <button
            id="tab-list"
            className={`tab-btn ${activeTab === "list" ? "tab-btn-active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            🚌 Buses ({filteredBuses.length})
          </button>
        </div>
      </div>

      {/* ── Smart UX Message ─────────────────────────────────────── */}
      {smartMsg && (
        <div className="dash-content" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className={`smart-message ${
            smartMsg.type === "arriving" ? "smart-message-arriving" : "smart-message-next"
          }`}>
            {smartMsg.text}
          </div>
        </div>
      )}

      {/* ── Map View ─────────────────────────────────────────────── */}
      {activeTab === "map" && (
        <div className="dash-content">
          <div className="map-wrap">
            <Suspense fallback={<div className="map-loading"><div className="spinner spinner-primary" /><p>Loading map...</p></div>}>
              <LiveMap
                buses={buses}
                selectedBus={liveBusData}
                userLocation={userLocation}
                followBus={followBus}
                height="480px"
              />
            </Suspense>
          </div>

          {/* Selected bus detail panel */}
          {liveBusData && (
            <div className="bus-detail-panel">
              <div className="bus-detail-header">
                <div>
                  <h3>🚌 Bus {liveBusData.busNumber}</h3>
                  <p>{liveBusData.routeName}</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    id="btn-follow-bus"
                    className={`btn btn-sm ${followBus ? "btn-accent" : "btn-outline"}`}
                    onClick={() => setFollowBus(!followBus)}
                  >
                    {followBus ? "📡 Following" : "👁 Follow"}
                  </button>
                  <button
                    id="btn-close-bus"
                    className="btn btn-sm btn-ghost btn-icon-only"
                    onClick={handleCloseBus}
                  >
                    ✕
                  </button>
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
                    <span className="bus-detail-stat-val">{liveBusData.seatsAvailable}/{liveBusData.capacity}</span>
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
            <div className="card-grid anim-stagger">
              {filteredBuses.map((bus) => {
                const st = bus.busStatus || bus.status;
                const loc = bus.currentLocation || bus.location;
                const eta = bus.matchedEta ?? bus.eta;

                return (
                  <div
                    key={bus._id}
                    id={`bus-list-card-${bus.busNumber}`}
                    className={`card bus-card ${selectedBus?._id === bus._id ? "bus-card-selected" : ""}`}
                    onClick={() => handleSelectBus(bus)}
                  >
                    <div className="bus-card-header">
                      <span className="bus-number">{bus.busNumber}</span>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {eta != null && (
                          <span style={{
                            background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: "var(--radius-full)",
                          }}>
                            ⏱ {eta}m
                          </span>
                        )}
                        <span className={`badge ${getStatusClass(st)}`}>{getStatusLabel(st)}</span>
                      </div>
                    </div>

                    <p className="bus-route">📍 {bus.routeName}</p>
                    <p className="text-sm text-muted" style={{ marginBottom: 10 }}>
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
                      <div className="bus-stat">
                        <span className="bus-stat-val">{bus.occupancy || 0}%</span>
                        <span className="bus-stat-lbl">Full</span>
                      </div>
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
                        style={{ width: `${bus.occupancy || 0}%`, background: getStatusColor(st) }}
                      />
                    </div>

                    {loc?.latitude && (
                      <p className="text-sm text-muted mt-8" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span className="live-dot" style={{ width: 6, height: 6 }} /> Live
                      </p>
                    )}

                    {bus.nextCheckpointName && (
                      <p className="text-sm mt-4" style={{ color: "var(--accent)", fontWeight: 600 }}>
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
              <div className="empty-state-title">No buses found</div>
              <p className="empty-state-text">Try adjusting your search or filters</p>
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
            <form onSubmit={handleSubmitComplaint} id="complaint-form">
              <div className="form-group">
                <label className="form-label">Bus Number *</label>
                <input
                  id="complaint-bus-number"
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
                  id="complaint-description"
                  className="form-input"
                  placeholder="Describe the issue in detail..."
                  value={complaint.description}
                  onChange={(e) => setComplaint({ ...complaint, description: e.target.value })}
                  required
                  style={{ minHeight: 90, resize: "vertical" }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      id={`star-${s}`}
                      className={`star ${s <= complaint.rating ? "active" : ""}`}
                      onClick={() => setComplaint({ ...complaint, rating: s })}
                    >★</span>
                  ))}
                </div>
              </div>
              <button
                id="complaint-submit"
                className="btn btn-primary btn-block"
                disabled={submitting}
              >
                {submitting ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                    <span className="spinner-sm" /> Submitting...
                  </span>
                ) : "Submit Complaint"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
