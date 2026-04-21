import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

const API = import.meta.env.VITE_BACKEND_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API;

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = io(SOCKET_URL);
    s.emit("admin:joinDashboard", { adminId: user?.id });
    s.on("bus:locationUpdate", (data) => {
      setBuses((prev) => prev.map((b) => b._id === data.busId ? { ...b, currentLocation: data.coordinates, eta: data.eta } : b));
    });
    s.on("bus:seatsUpdate", (data) => {
      setBuses((prev) => prev.map((b) => b._id === data.busId ? { ...b, seatsAvailable: data.seatsAvailable } : b));
    });
    fetchAll();
    return () => s.disconnect();
  }, []);

  const fetchAll = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [sRes, bRes, dRes, cRes] = await Promise.all([
        axios.get(`${API}/api/admin/stats`, { headers }),
        axios.get(`${API}/api/admin/buses`, { headers }),
        axios.get(`${API}/api/admin/drivers`, { headers }),
        axios.get(`${API}/api/complaints`, { headers }).catch(() => ({ data: { complaints: [] } }))
      ]);
      setStats(sRes.data.stats);
      setBuses(bRes.data.buses);
      setDrivers(dRes.data.drivers);
      setComplaints(cRes.data.complaints || []);
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  const toggleDriver = async (id, active) => {
    try {
      await axios.patch(`${API}/api/admin/driver/${id}/status`, { isActive: !active }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(active ? "Driver suspended" : "Driver activated");
      fetchAll();
    } catch { toast.error("Action failed"); }
  };

  const updateComplaint = async (id, status) => {
    try {
      await axios.patch(`${API}/api/complaints/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Complaint ${status}`);
      fetchAll();
    } catch { toast.error("Failed"); }
  };

  const setMaintenance = async (busId) => {
    try {
      await axios.patch(`${API}/api/admin/bus/${busId}/maintenance`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Bus set to maintenance");
      fetchAll();
    } catch { toast.error("Failed"); }
  };

  const tabs = [
    { id: "overview",   label: "Overview",   icon: "📊", count: null },
    { id: "buses",      label: "Buses",      icon: "🚌", count: buses.length },
    { id: "drivers",    label: "Drivers",    icon: "👨‍✈️", count: drivers.length },
    { id: "complaints", label: "Complaints", icon: "🛑", count: complaints.filter(c => c.status === "open").length || null },
  ];

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <p className="loading-text">Loading admin panel...</p>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="dash-header">
        <div className="container">
          <div className="dash-header-inner">
            <div>
              <h1>🛡️ Admin Dashboard</h1>
              <p>RouteFlow Control Center · Welcome, {user?.firstName}</p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={fetchAll}
              id="admin-refresh"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="dash-stats anim-stagger">
          <div className="stat-card">
            <div className="stat-card-icon">🚌</div>
            <div className="stat-card-num">{stats.totalBuses}</div>
            <div className="stat-card-label">Total Buses</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">🟢</div>
            <div className="stat-card-num" style={{ color: "var(--green)" }}>{stats.activeBuses}</div>
            <div className="stat-card-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">👨‍✈️</div>
            <div className="stat-card-num">{stats.totalDrivers}</div>
            <div className="stat-card-label">Drivers</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">👤</div>
            <div className="stat-card-num">{stats.totalUsers}</div>
            <div className="stat-card-label">Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">📊</div>
            <div className="stat-card-num">{stats.avgOccupancy}%</div>
            <div className="stat-card-label">Avg Occupancy</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">🛑</div>
            <div className="stat-card-num" style={{ color: complaints.filter(c => c.status === "open").length > 0 ? "var(--red)" : "var(--green)" }}>
              {complaints.filter(c => c.status === "open").length}
            </div>
            <div className="stat-card-label">Open Issues</div>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="admin-tabs-wrap">
        <div className="admin-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              id={`admin-tab-${t.id}`}
              className={`admin-tab-btn ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
              {t.count != null && t.count > 0 && (
                <span className="admin-tab-count">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-content">
        {/* OVERVIEW */}
        {tab === "overview" && (
          <div style={{ animation: "fadeInUp 0.3s ease" }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Live Bus Overview</h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bus #</th>
                    <th>Route</th>
                    <th>Status</th>
                    <th>Seats</th>
                    <th>Driver</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map((bus) => (
                    <tr key={bus._id}>
                      <td><strong style={{ color: "var(--primary)" }}>{bus.busNumber}</strong></td>
                      <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{bus.routeName}</td>
                      <td>
                        <span className={`badge ${bus.status === "active" ? "badge-green" : bus.status === "maintenance" ? "badge-yellow" : "badge-gray"}`}>
                          {bus.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{bus.seatsAvailable}/{bus.capacity}</td>
                      <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        {bus.driverId?.firstName ? `${bus.driverId.firstName} ${bus.driverId.lastName || ""}` : "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {bus.currentLocation?.latitude
                          ? <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <span className="live-dot" style={{ width: 6, height: 6 }} />
                              {bus.currentLocation.latitude.toFixed(3)}, {bus.currentLocation.longitude.toFixed(3)}
                            </span>
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {buses.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted" style={{ padding: 40 }}>
                        No buses registered
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BUSES */}
        {tab === "buses" && (
          <div style={{ animation: "fadeInUp 0.3s ease" }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>All Buses ({buses.length})</h2>
            <div className="card-grid anim-stagger">
              {buses.map((bus) => (
                <div key={bus._id} className="card" id={`admin-bus-${bus.busNumber}`}>
                  <div className="bus-card-header">
                    <span className="bus-number">{bus.busNumber}</span>
                    <span className={`badge ${bus.status === "active" ? "badge-green" : bus.status === "maintenance" ? "badge-yellow" : "badge-gray"}`}>
                      {bus.status}
                    </span>
                  </div>
                  <p className="bus-route">📍 {bus.routeName}</p>
                  <p className="text-sm text-muted mb-8">🪑 {bus.seatsAvailable}/{bus.capacity} seats</p>
                  <p className="text-sm text-muted mb-16">
                    👨‍✈️ {bus.driverId?.firstName || <span style={{ color: "var(--red)" }}>Unassigned</span>}
                  </p>
                  {bus.status !== "maintenance" && (
                    <button
                      className="btn btn-outline btn-sm btn-block"
                      onClick={() => setMaintenance(bus._id)}
                      id={`bus-maintenance-${bus.busNumber}`}
                    >
                      ⚙️ Set Maintenance
                    </button>
                  )}
                </div>
              ))}
              {buses.length === 0 && (
                <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                  <div className="empty-state-icon">🚌</div>
                  <div className="empty-state-title">No buses found</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DRIVERS */}
        {tab === "drivers" && (
          <div style={{ animation: "fadeInUp 0.3s ease" }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>All Drivers ({drivers.length})</h2>
            <div className="card-grid anim-stagger">
              {drivers.map((d) => (
                <div key={d._id} className="driver-card" id={`driver-${d._id}`}>
                  <div className="driver-avatar">
                    {d.firstName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-between mb-12">
                    <span className="font-bold" style={{ fontSize: 16 }}>
                      {d.firstName} {d.lastName || ""}
                    </span>
                    <span className={`badge ${d.isActive ? "badge-green" : "badge-red"}`}>
                      {d.isActive ? "Active" : "Suspended"}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 16 }}>
                    <span className="text-sm text-muted">📧 {d.email}</span>
                    <span className="text-sm text-muted">📱 {d.phone || "N/A"}</span>
                    <span className="text-sm text-muted">🪪 {d.licenseNumber || "N/A"}</span>
                    <span className="text-sm text-muted">🚌 {d.busTaken?.busNumber || "No bus assigned"}</span>
                  </div>
                  <button
                    className={`btn btn-sm btn-block ${d.isActive ? "btn-danger" : "btn-success"}`}
                    onClick={() => toggleDriver(d._id, d.isActive)}
                    id={`driver-toggle-${d._id}`}
                  >
                    {d.isActive ? "⛔ Suspend Driver" : "✅ Activate Driver"}
                  </button>
                </div>
              ))}
              {drivers.length === 0 && (
                <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                  <div className="empty-state-icon">👨‍✈️</div>
                  <div className="empty-state-title">No drivers registered</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COMPLAINTS */}
        {tab === "complaints" && (
          <div style={{ animation: "fadeInUp 0.3s ease" }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>
              Complaints ({complaints.length})
              {complaints.filter(c => c.status === "open").length > 0 && (
                <span className="badge badge-red" style={{ marginLeft: 12, fontSize: 12 }}>
                  {complaints.filter(c => c.status === "open").length} open
                </span>
              )}
            </h2>
            {complaints.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <div className="empty-state-title">All clear!</div>
                <p className="empty-state-text">No complaints filed by users.</p>
              </div>
            ) : (
              <div className="card-grid anim-stagger">
                {complaints.map((c) => (
                  <div key={c._id} className="complaint-card" id={`complaint-${c._id}`}>
                    <div className="flex-between mb-8">
                      <span className="font-bold">🚌 {c.busNumber}</span>
                      <span className={`badge ${
                        c.status === "open" ? "badge-red" :
                        c.status === "investigating" ? "badge-yellow" :
                        c.status === "resolved" ? "badge-green" : "badge-gray"
                      }`}>{c.status}</span>
                    </div>
                    <p className="complaint-desc">{c.description}</p>
                    {c.rating && <p className="complaint-meta">⭐ Rating: {c.rating}/5</p>}
                    <p className="complaint-meta">👤 {c.userId?.firstName || "Unknown"} ({c.userId?.email || ""})</p>
                    {c.driverId && <p className="complaint-meta">👨‍✈️ Driver: {c.driverId?.firstName || "N/A"}</p>}
                    <p className="complaint-meta">📅 {new Date(c.createdAt).toLocaleDateString("en-IN")}</p>
                    <div className="complaint-actions">
                      {c.status === "open" && (
                        <button className="btn btn-outline btn-sm" onClick={() => updateComplaint(c._id, "investigating")}>
                          🔍 Investigate
                        </button>
                      )}
                      {(c.status === "open" || c.status === "investigating") && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => updateComplaint(c._id, "resolved")}>
                            ✅ Resolve
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => updateComplaint(c._id, "dismissed")}>
                            ❌ Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
