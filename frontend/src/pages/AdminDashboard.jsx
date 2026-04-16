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

  if (loading) return <div className="loading-page"><div className="spinner" /><p>Loading admin panel...</p></div>;

  return (
    <div className="page">
      {/* Header */}
      <div className="dash-header">
        <div className="container">
          <h1>🛡️ Admin Dashboard</h1>
          <p>RouteFlow Control Center</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="dash-stats container">
          <div className="stat-card"><div className="stat-card-icon">🚌</div><div className="stat-card-num">{stats.totalBuses}</div><div className="stat-card-label">Total Buses</div></div>
          <div className="stat-card"><div className="stat-card-icon">🟢</div><div className="stat-card-num">{stats.activeBuses}</div><div className="stat-card-label">Active</div></div>
          <div className="stat-card"><div className="stat-card-icon">🚗</div><div className="stat-card-num">{stats.totalDrivers}</div><div className="stat-card-label">Drivers</div></div>
          <div className="stat-card"><div className="stat-card-icon">👤</div><div className="stat-card-num">{stats.totalUsers}</div><div className="stat-card-label">Users</div></div>
          <div className="stat-card"><div className="stat-card-icon">📊</div><div className="stat-card-num">{stats.avgOccupancy}</div><div className="stat-card-label">Avg Occupancy</div></div>
          <div className="stat-card"><div className="stat-card-icon">🛑</div><div className="stat-card-num">{complaints.length}</div><div className="stat-card-label">Complaints</div></div>
        </div>
      )}

      {/* Tabs */}
      <div className="dash-content">
        <div className="tabs mb-24">
          {["overview", "buses", "drivers", "complaints"].map((t) => (
            <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t === "overview" && "📊 "}
              {t === "buses" && "🚌 "}
              {t === "drivers" && "🚗 "}
              {t === "complaints" && "🛑 "}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div>
            <h2 className="section-title">Live Bus Overview</h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bus #</th><th>Route</th><th>Status</th><th>Seats</th><th>Driver</th><th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map((bus) => (
                    <tr key={bus._id}>
                      <td><strong>{bus.busNumber}</strong></td>
                      <td>{bus.routeName}</td>
                      <td><span className={`badge ${bus.status === "active" ? "badge-green" : bus.status === "maintenance" ? "badge-yellow" : "badge-gray"}`}>{bus.status}</span></td>
                      <td>{bus.seatsAvailable}/{bus.capacity}</td>
                      <td>{bus.driverId?.firstName ? `${bus.driverId.firstName} ${bus.driverId.lastName || ""}` : "N/A"}</td>
                      <td>{bus.currentLocation?.latitude ? `${bus.currentLocation.latitude.toFixed(3)}, ${bus.currentLocation.longitude.toFixed(3)}` : "—"}</td>
                    </tr>
                  ))}
                  {buses.length === 0 && <tr><td colSpan="6" className="text-center text-muted" style={{ padding: 32 }}>No buses found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BUSES */}
        {tab === "buses" && (
          <div>
            <h2 className="section-title">All Buses ({buses.length})</h2>
            <div className="card-grid">
              {buses.map((bus) => (
                <div key={bus._id} className="card">
                  <div className="bus-card-header">
                    <span className="bus-number">{bus.busNumber}</span>
                    <span className={`badge ${bus.status === "active" ? "badge-green" : bus.status === "maintenance" ? "badge-yellow" : "badge-gray"}`}>{bus.status}</span>
                  </div>
                  <p className="bus-route">📍 {bus.routeName}</p>
                  <p className="text-sm text-muted">🪑 {bus.seatsAvailable}/{bus.capacity} seats</p>
                  <p className="text-sm text-muted mb-16">👤 {bus.driverId?.firstName || "Unassigned"}</p>
                  {bus.status !== "maintenance" && (
                    <button className="btn btn-outline btn-sm btn-block" onClick={() => setMaintenance(bus._id)}>
                      ⚙️ Set Maintenance
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DRIVERS */}
        {tab === "drivers" && (
          <div>
            <h2 className="section-title">All Drivers ({drivers.length})</h2>
            <div className="card-grid">
              {drivers.map((d) => (
                <div key={d._id} className="card">
                  <div className="flex-between mb-8">
                    <span className="font-bold">{d.firstName} {d.lastName || ""}</span>
                    <span className={`badge ${d.isActive ? "badge-green" : "badge-red"}`}>
                      {d.isActive ? "Active" : "Suspended"}
                    </span>
                  </div>
                  <p className="text-sm text-muted">📧 {d.email}</p>
                  <p className="text-sm text-muted">📱 {d.phone || "N/A"}</p>
                  <p className="text-sm text-muted">🪪 {d.licenseNumber || "N/A"}</p>
                  <p className="text-sm text-muted mb-16">🚌 {d.busTaken?.busNumber || "None"}</p>
                  <button
                    className={`btn btn-sm btn-block ${d.isActive ? "btn-danger" : "btn-success"}`}
                    onClick={() => toggleDriver(d._id, d.isActive)}>
                    {d.isActive ? "⛔ Suspend" : "✅ Activate"}
                  </button>
                </div>
              ))}
              {drivers.length === 0 && <div className="empty-state"><div className="empty-state-icon">🚗</div><p className="empty-state-text">No drivers found</p></div>}
            </div>
          </div>
        )}

        {/* COMPLAINTS */}
        {tab === "complaints" && (
          <div>
            <h2 className="section-title">Complaints ({complaints.length})</h2>
            {complaints.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">✅</div><p className="empty-state-text">No complaints. All clear!</p></div>
            ) : (
              <div className="card-grid">
                {complaints.map((c) => (
                  <div key={c._id} className="card">
                    <div className="flex-between mb-8">
                      <span className="font-bold">🚌 {c.busNumber}</span>
                      <span className={`badge ${
                        c.status === "open" ? "badge-red" :
                        c.status === "investigating" ? "badge-yellow" :
                        c.status === "resolved" ? "badge-green" : "badge-gray"
                      }`}>{c.status}</span>
                    </div>
                    <p className="complaint-desc">{c.description}</p>
                    {c.rating && <p className="complaint-meta">⭐ {c.rating}/5</p>}
                    <p className="complaint-meta">👤 {c.userId?.firstName || "Unknown"} ({c.userId?.email || ""})</p>
                    {c.driverId && <p className="complaint-meta">🚗 Driver: {c.driverId?.firstName || "N/A"}</p>}
                    <p className="complaint-meta">📅 {new Date(c.createdAt).toLocaleDateString()}</p>
                    <div className="complaint-actions">
                      {c.status === "open" && (
                        <button className="btn btn-outline btn-sm" onClick={() => updateComplaint(c._id, "investigating")}>🔍 Investigate</button>
                      )}
                      {(c.status === "open" || c.status === "investigating") && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => updateComplaint(c._id, "resolved")}>✅ Resolve</button>
                          <button className="btn btn-outline btn-sm" onClick={() => updateComplaint(c._id, "dismissed")}>❌ Dismiss</button>
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
