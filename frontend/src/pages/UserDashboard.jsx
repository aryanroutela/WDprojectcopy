import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const UserDashboard = () => {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedBus, setSelectedBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchBuses();
    fetchRoutes();
  }, [token, navigate]);

  const fetchBuses = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/buses`
      );
      setBuses(res.data.buses);
      setFilteredBuses(res.data.buses);
    } catch (err) {
      toast.error("Failed to load buses");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/routes`
      );
      setRoutes(res.data.routes);
    } catch (err) {
      console.error("Failed to load routes");
    }
  };

  const handleRouteChange = (route) => {
    setSelectedRoute(route);
    if (route === "") {
      setFilteredBuses(buses);
    } else {
      setFilteredBuses(buses.filter((b) => b.routeName === route));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return <div style={styles.loading}>Loading buses...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>👤 User Dashboard - Track Buses</h1>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Search Section */}
      <div style={styles.searchSection}>
        <h2>🔍 Search Buses by Route</h2>
        <div style={styles.filterContainer}>
          <label>Select Route:</label>
          <select
            style={styles.select}
            value={selectedRoute}
            onChange={(e) => handleRouteChange(e.target.value)}
          >
            <option value="">All Routes</option>
            {routes.map((route) => (
              <option key={route} value={route}>
                {route}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bus Details Modal */}
      {selectedBus && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <button
              style={styles.closeBtn}
              onClick={() => setSelectedBus(null)}
            >
              ✕
            </button>
            <h2>Bus Details</h2>
            <div style={styles.detailGroup}>
              <p>
                <strong>Bus Number:</strong> {selectedBus.busNumber}
              </p>
              <p>
                <strong>Route:</strong> {selectedBus.routeName}
              </p>
              <p>
                <strong>Capacity:</strong> {selectedBus.capacity} seats
              </p>
              <p>
                <strong>Available:</strong> {selectedBus.seatsAvailable} seats
              </p>
              <p>
                <strong>Occupancy:</strong> {selectedBus.occupancy}%
              </p>
              {selectedBus.eta && (
                <p>
                  <strong>ETA:</strong> {selectedBus.eta} minutes
                </p>
              )}
              {selectedBus.location && (
                <p>
                  <strong>Location:</strong> Lat: {selectedBus.location.latitude.toFixed(4)}, 
                  Lng: {selectedBus.location.longitude.toFixed(4)}
                </p>
              )}
              <p>
                <strong>Driver:</strong> {selectedBus.driver?.firstName || "N/A"}
              </p>
              <div style={styles.statusIndicator}>
                <div
                  style={{
                    ...styles.statusDot,
                    background:
                      selectedBus.status === "green"
                        ? "#10b981"
                        : selectedBus.status === "yellow"
                        ? "#f59e0b"
                        : "#ef4444"
                  }}
                ></div>
                <span>
                  {selectedBus.status === "green"
                    ? "✅ Seats Available"
                    : selectedBus.status === "yellow"
                    ? "⚠️ Standing Only"
                    : "❌ Full"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buses Grid */}
      <div style={styles.content}>
        <h2>
          Available Buses{" "}
          {selectedRoute && `- ${selectedRoute}`}
        </h2>
        <div style={styles.busesGrid}>
          {filteredBuses.length > 0 ? (
            filteredBuses.map((bus) => (
              <div key={bus._id} style={styles.busCard}>
                <div
                  style={{
                    ...styles.statusBar,
                    background:
                      bus.status === "green"
                        ? "#10b981"
                        : bus.status === "yellow"
                        ? "#f59e0b"
                        : "#ef4444"
                  }}
                ></div>
                <div style={styles.cardContent}>
                  <h3 style={styles.busNumber}>{bus.busNumber}</h3>
                  <p style={styles.route}>📍 {bus.routeName}</p>

                  <div style={styles.stats}>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Seats</span>
                      <span style={styles.statValue}>
                        {bus.seatsAvailable}/{bus.capacity}
                      </span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Occupancy</span>
                      <span style={styles.statValue}>{bus.occupancy}%</span>
                    </div>
                    {bus.eta && (
                      <div style={styles.stat}>
                        <span style={styles.statLabel}>ETA</span>
                        <span style={styles.statValue}>{bus.eta} min</span>
                      </div>
                    )}
                  </div>

                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${bus.occupancy}%`
                      }}
                    ></div>
                  </div>

                  <button
                    style={styles.detailsBtn}
                    onClick={() => setSelectedBus(bus)}
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={styles.noData}>
              <p>No buses available on this route</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

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
  searchSection: {
    background: "white",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px"
  },
  filterContainer: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginTop: "15px"
  },
  select: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    minWidth: "200px"
  },
  content: {
    background: "white",
    padding: "20px",
    borderRadius: "8px"
  },
  busesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "20px",
    marginTop: "20px"
  },
  busCard: {
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    transition: "all 0.3s",
    cursor: "pointer"
  },
  statusBar: {
    height: "4px"
  },
  cardContent: {
    padding: "20px"
  },
  busNumber: {
    fontSize: "20px",
    fontWeight: "bold",
    margin: "0 0 8px 0",
    color: "#333"
  },
  route: {
    fontSize: "14px",
    color: "#666",
    margin: "0 0 15px 0"
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginBottom: "15px"
  },
  stat: {
    textAlign: "center",
    padding: "8px",
    background: "#f5f5f5",
    borderRadius: "4px"
  },
  statLabel: {
    display: "block",
    fontSize: "12px",
    color: "#666",
    marginBottom: "4px"
  },
  statValue: {
    display: "block",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333"
  },
  progressBar: {
    height: "6px",
    background: "#e0e0e0",
    borderRadius: "3px",
    overflow: "hidden",
    marginBottom: "15px"
  },
  progressFill: {
    height: "100%",
    background: "#667eea",
    transition: "width 0.3s"
  },
  detailsBtn: {
    width: "100%",
    padding: "10px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600"
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  modalContent: {
    background: "white",
    padding: "30px",
    borderRadius: "8px",
    maxWidth: "500px",
    width: "90%",
    maxHeight: "80vh",
    overflowY: "auto",
    position: "relative"
  },
  closeBtn: {
    position: "absolute",
    top: "15px",
    right: "15px",
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#666"
  },
  detailGroup: {
    marginTop: "20px"
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "15px",
    padding: "10px",
    background: "#f5f5f5",
    borderRadius: "4px"
  },
  statusDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%"
  },
  noData: {
    textAlign: "center",
    padding: "40px",
    color: "#666"
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontSize: "18px"
  }
};
