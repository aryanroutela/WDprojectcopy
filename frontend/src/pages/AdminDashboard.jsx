import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch stats
      const statsRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/stats`,
        { headers }
      );
      setStats(statsRes.data.stats);

      // Fetch buses
      const busesRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/buses`,
        { headers }
      );
      setBuses(busesRes.data.buses);

      // Fetch drivers
      const driversRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/drivers`,
        { headers }
      );
      setDrivers(driversRes.data.drivers);
    } catch (err) {
      toast.error("Failed to load dashboard");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return <div style={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1>🔧 Admin Dashboard</h1>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["overview", "buses", "drivers"].map((tab) => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab && styles.activeTab)
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Overview Tab */}
        {activeTab === "overview" && stats && (
          <div style={styles.gridContainer}>
            <StatCard label="Total Buses" value={stats.totalBuses} icon="🚍" />
            <StatCard label="Active Buses" value={stats.activeBuses} icon="✅" />
            <StatCard label="Total Drivers" value={stats.totalDrivers} icon="🚗" />
            <StatCard label="Total Users" value={stats.totalUsers} icon="👥" />
            <StatCard label="Avg Occupancy" value={stats.avgOccupancy} icon="📊" />
            <StatCard label="Total Admins" value={stats.totalAdmins} icon="🔧" />
          </div>
        )}

        {/* Buses Tab */}
        {activeTab === "buses" && (
          <div>
            <h2 style={styles.sectionTitle}>All Buses</h2>
            <div style={styles.table}>
              <table style={styles.tableElement}>
                <thead>
                  <tr style={styles.headerRow}>
                    <th style={styles.th}>Bus #</th>
                    <th style={styles.th}>Route</th>
                    <th style={styles.th}>Driver</th>
                    <th style={styles.th}>Capacity</th>
                    <th style={styles.th}>Available</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map((bus) => (
                    <tr key={bus._id} style={styles.tableRow}>
                      <td style={styles.td}>{bus.busNumber}</td>
                      <td style={styles.td}>{bus.routeName}</td>
                      <td style={styles.td}>
                        {bus.driverId?.firstName || "N/A"}
                      </td>
                      <td style={styles.td}>{bus.capacity}</td>
                      <td style={styles.td}>{bus.seatsAvailable}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            background:
                              bus.status === "active"
                                ? "#10b981"
                                : bus.status === "maintenance"
                                ? "#f59e0b"
                                : "#ef4444"
                          }}
                        >
                          {bus.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Drivers Tab */}
        {activeTab === "drivers" && (
          <div>
            <h2 style={styles.sectionTitle}>All Drivers</h2>
            <div style={styles.cardGrid}>
              {drivers.map((driver) => (
                <div key={driver._id} style={styles.card}>
                  <h3>{driver.firstName} {driver.lastName}</h3>
                  <p><strong>Email:</strong> {driver.email}</p>
                  <p><strong>Phone:</strong> {driver.phone}</p>
                  <p><strong>License:</strong> {driver.licenseNumber || "N/A"}</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        color: driver.isActive ? "#10b981" : "#ef4444"
                      }}
                    >
                      {driver.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon }) => (
  <div style={styles.statCard}>
    <div style={styles.statIcon}>{icon}</div>
    <div style={styles.statContent}>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
    </div>
  </div>
);

export default AdminDashboard;

const styles = {
  container: {
    padding: "20px",
    background: "#f5f5f5",
    minHeight: "100vh"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "white",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  logoutBtn: {
    padding: "10px 20px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  tabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    background: "white",
    padding: "10px",
    borderRadius: "8px"
  },
  tab: {
    padding: "10px 20px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    borderBottom: "2px solid transparent"
  },
  activeTab: {
    borderBottomColor: "#667eea",
    color: "#667eea"
  },
  content: {
    background: "white",
    padding: "20px",
    borderRadius: "8px"
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px"
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    padding: "20px",
    background: "#f9f9f9",
    borderRadius: "8px",
    gap: "15px"
  },
  statIcon: {
    fontSize: "32px"
  },
  statContent: {
    flex: 1
  },
  statLabel: {
    fontSize: "12px",
    color: "#666",
    margin: "0"
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
    margin: "0"
  },
  sectionTitle: {
    marginBottom: "20px",
    color: "#333"
  },
  table: {
    overflowX: "auto"
  },
  tableElement: {
    width: "100%",
    borderCollapse: "collapse"
  },
  headerRow: {
    background: "#f5f5f5"
  },
  th: {
    padding: "12px",
    textAlign: "left",
    fontWeight: "600",
    borderBottom: "2px solid #ddd"
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #ddd"
  },
  tableRow: {
    "&:hover": {
      background: "#f9f9f9"
    }
  },
  statusBadge: {
    padding: "4px 12px",
    color: "white",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600"
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px"
  },
  card: {
    padding: "20px",
    background: "#f9f9f9",
    borderRadius: "8px",
    border: "1px solid #ddd"
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontSize: "18px",
    color: "#666"
  }
};
