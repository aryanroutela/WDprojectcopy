import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

const API = import.meta.env.VITE_BACKEND_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API;

const UserDashboard = () => {
  const { token, user } = useAuth();
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedBus, setSelectedBus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Complaint state
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaint, setComplaint] = useState({ busNumber: "", description: "", rating: 3 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const s = io(SOCKET_URL);
    s.emit("user:joinTracking", { userId: user?.id, role: "user" });

    s.on("bus:locationUpdate", (data) => {
      const update = (list) =>
        list.map((b) => b._id === data.busId ? { ...b, location: data.coordinates, eta: data.eta } : b);
      setBuses(update);
      setFilteredBuses(update);
    });

    s.on("bus:seatsUpdate", (data) => {
      const update = (list) =>
        list.map((b) => b._id === data.busId
          ? { ...b, seatsAvailable: data.seatsAvailable, occupancy: data.occupancy, status: data.status }
          : b);
      setBuses(update);
      setFilteredBuses(update);
    });

    return () => s.disconnect();
  }, []);

  useEffect(() => {
    fetchBuses();
    fetchRoutes();
  }, []);

  const fetchBuses = async () => {
    try {
      const res = await axios.get(`${API}/api/user/buses`);
      setBuses(res.data.buses);
      setFilteredBuses(res.data.buses);
    } catch { toast.error("Failed to load buses"); }
    finally { setLoading(false); }
  };

  const fetchRoutes = async () => {
    try {
      const res = await axios.get(`${API}/api/user/routes`);
      setRoutes(res.data.routes);
    } catch { /* silent */ }
  };

  const handleSearch = async () => {
    if (!source && !destination) { setFilteredBuses(buses); return; }
    try {
      const params = new URLSearchParams();
      if (source) params.append("source", source);
      if (destination) params.append("destination", destination);
      const res = await axios.get(`${API}/api/user/buses/search?${params}`);
      setFilteredBuses(res.data.buses);
    } catch { toast.error("Search failed"); }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaint.busNumber || !complaint.description) {
      toast.error("Bus number and description are required"); return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/complaints`, complaint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Complaint submitted");
      setShowComplaint(false);
      setComplaint({ busNumber: "", description: "", rating: 3 });
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const getStatusClass = (s) => s === "green" ? "badge-green" : s === "yellow" ? "badge-yellow" : "badge-red";
  const getStatusLabel = (s) => s === "green" ? "Available" : s === "yellow" ? "Filling Up" : "Full";
  const getStatusColor = (s) => s === "green" ? "var(--green)" : s === "yellow" ? "var(--yellow)" : "var(--red)";

  if (loading) return <div className="loading-page"><div className="spinner" /><p>Loading buses...</p></div>;

  return (
    <div className="page">
      {/* Header */}
      <div className="dash-header">
        <div className="container flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1>👤 Hi, {user?.firstName || "Passenger"}</h1>
            <p>Track buses • Search routes • Stay updated</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowComplaint(true)}>
            🛑 File Complaint
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <input className="form-input" placeholder="Source (e.g. City Center)"
          value={source} onChange={(e) => setSource(e.target.value)} />
        <input className="form-input" placeholder="Destination (e.g. Airport)"
          value={destination} onChange={(e) => setDestination(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={handleSearch}>Search</button>
        <button className="btn btn-outline btn-sm" onClick={() => { setSource(""); setDestination(""); setFilteredBuses(buses); }}>
          Clear
        </button>
      </div>

      {/* Route Chips */}
      {routes.length > 0 && (
        <div style={{ padding: "12px 20px", display: "flex", gap: 8, flexWrap: "wrap", overflowX: "auto" }}>
          <span className="chip active" onClick={() => setFilteredBuses(buses)}>All</span>
          {routes.map((r) => (
            <span key={r} className="chip"
              onClick={() => setFilteredBuses(buses.filter((b) => b.routeName === r))}>
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="dash-stats container">
        <div className="stat-card"><div className="stat-card-num">{buses.length}</div><div className="stat-card-label">Total Buses</div></div>
        <div className="stat-card"><div className="stat-card-num">{buses.filter((b) => b.status === "green").length}</div><div className="stat-card-label">Available</div></div>
        <div className="stat-card"><div className="stat-card-num">{routes.length}</div><div className="stat-card-label">Routes</div></div>
        <div className="stat-card"><div className="stat-card-num" style={{ color: "var(--green)" }}><span className="live-dot" /> Live</div><div className="stat-card-label">Tracking</div></div>
      </div>

      {/* Bus Grid */}
      <div className="dash-content">
        <h2 className="section-title">🚌 Buses ({filteredBuses.length})</h2>
        {filteredBuses.length > 0 ? (
          <div className="card-grid">
            {filteredBuses.map((bus) => (
              <div key={bus._id} className="card bus-card" onClick={() => setSelectedBus(bus)}>
                <div className="bus-card-header">
                  <span className="bus-number">{bus.busNumber}</span>
                  <span className={`badge ${getStatusClass(bus.status)}`}>{getStatusLabel(bus.status)}</span>
                </div>
                <p className="bus-route">📍 {bus.routeName}</p>
                <div className="bus-stats">
                  <div className="bus-stat">
                    <span className="bus-stat-val">{bus.seatsAvailable}/{bus.capacity}</span>
                    <span className="bus-stat-lbl">Seats</span>
                  </div>
                  <div className="bus-stat">
                    <span className="bus-stat-val">{bus.occupancy}%</span>
                    <span className="bus-stat-lbl">Full</span>
                  </div>
                  {bus.eta && <div className="bus-stat"><span className="bus-stat-val">{bus.eta}m</span><span className="bus-stat-lbl">ETA</span></div>}
                </div>
                <div className="progress">
                  <div className="progress-fill" style={{ width: `${bus.occupancy}%`, background: getStatusColor(bus.status) }} />
                </div>
                {bus.location?.latitude && (
                  <p className="text-sm text-muted mt-8"><span className="live-dot" /> {bus.location.latitude?.toFixed?.(4)}, {bus.location.longitude?.toFixed?.(4)}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><div className="empty-state-icon">🚌</div><p className="empty-state-text">No buses match your search</p></div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedBus && (
        <div className="modal-overlay" onClick={() => setSelectedBus(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedBus(null)}>✕</button>
            <h3 className="modal-title">Bus {selectedBus.busNumber}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <DI label="Route" value={selectedBus.routeName} />
              <DI label="Status" value={getStatusLabel(selectedBus.status)} />
              <DI label="Seats" value={`${selectedBus.seatsAvailable}/${selectedBus.capacity}`} />
              <DI label="Occupancy" value={`${selectedBus.occupancy}%`} />
              {selectedBus.eta && <DI label="ETA" value={`${selectedBus.eta} min`} />}
              <DI label="Driver" value={selectedBus.driver?.firstName || "N/A"} />
            </div>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {showComplaint && (
        <div className="modal-overlay" onClick={() => setShowComplaint(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowComplaint(false)}>✕</button>
            <h3 className="modal-title">🛑 Submit Complaint</h3>
            <form onSubmit={handleSubmitComplaint}>
              <div className="form-group">
                <label className="form-label">Bus Number *</label>
                <input className="form-input" placeholder="e.g. BUS-101"
                  value={complaint.busNumber}
                  onChange={(e) => setComplaint({ ...complaint, busNumber: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-input" placeholder="Describe the issue..."
                  value={complaint.description}
                  onChange={(e) => setComplaint({ ...complaint, description: e.target.value })}
                  required style={{ minHeight: 80, resize: "vertical" }} />
              </div>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={`star ${s <= complaint.rating ? "active" : ""}`}
                      onClick={() => setComplaint({ ...complaint, rating: s })}>★</span>
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

const DI = ({ label, value }) => (
  <div style={{ padding: 10, background: "var(--bg)", borderRadius: 8 }}>
    <div className="text-sm text-muted">{label}</div>
    <div className="font-bold">{value}</div>
  </div>
);

export default UserDashboard;
