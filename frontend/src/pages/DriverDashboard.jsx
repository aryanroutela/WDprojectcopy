import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const DriverDashboard = () => {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [form, setForm] = useState({
    busNumber: "",
    routeName: "",
    capacity: "",
    stops: []
  });
  const [locationForm, setLocationForm] = useState({
    latitude: "",
    longitude: "",
    eta: ""
  });
  const [seatsForm, setSeatsForm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMyBuses();
  }, [token, navigate]);

  const fetchMyBuses = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/driver/buses`,
        { headers }
      );
      setBuses(res.data.buses);
      if (res.data.buses.length > 0) {
        setSelectedBus(res.data.buses[0]);
      }
    } catch (err) {
      toast.error("Failed to load buses");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterBus = async (e) => {
    e.preventDefault();
    
    if (!form.busNumber || !form.routeName || !form.capacity) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/driver/bus/register`,
        form,
        { headers }
      );

      toast.success("Bus registered! 🚍");
      setBuses([...buses, res.data.bus]);
      setForm({ busNumber: "", routeName: "", capacity: "", stops: [] });
      setShowRegisterForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register bus");
    }
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();

    if (!selectedBus || !locationForm.latitude || !locationForm.longitude) {
      toast.error("Please select bus and enter location");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/driver/bus/location`,
        {
          busId: selectedBus._id,
          latitude: parseFloat(locationForm.latitude),
          longitude: parseFloat(locationForm.longitude),
          eta: locationForm.eta ? parseInt(locationForm.eta) : null
        },
        { headers }
      );

      toast.success("Location updated! 📍");
      setLocationForm({ latitude: "", longitude: "", eta: "" });
    } catch (err) {
      toast.error("Failed to update location");
    }
  };

  const handleUpdateSeats = async (e) => {
    e.preventDefault();

    if (!selectedBus || seatsForm === "") {
      toast.error("Please select bus and enter seats");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/driver/bus/${selectedBus._id}/seats`,
        { seatsAvailable: parseInt(seatsForm) },
        { headers }
      );

      toast.success("Seats updated! 💺");
      setSeatsForm("");
      fetchMyBuses();
    } catch (err) {
      toast.error("Failed to update seats");
    }
  };

  const handleStartService = async () => {
    if (!selectedBus) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/driver/bus/${selectedBus._id}/start`,
        {},
        { headers }
      );

      toast.success("Service started! 🚀");
      fetchMyBuses();
    } catch (err) {
      toast.error("Failed to start service");
    }
  };

  const handleStopService = async () => {
    if (!selectedBus) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/driver/bus/${selectedBus._id}/stop`,
        {},
        { headers }
      );

      toast.success("Service stopped! ⛔");
      fetchMyBuses();
    } catch (err) {
      toast.error("Failed to stop service");
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
      <div style={styles.header}>
        <h1>🚗 Driver Dashboard</h1>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div style={styles.mainContent}>
        {/* My Buses Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>My Buses</h2>
            <button
              style={styles.btnPrimary}
              onClick={() => setShowRegisterForm(!showRegisterForm)}
            >
              {showRegisterForm ? "Cancel" : "+ Register Bus"}
            </button>
          </div>

          {/* Register Bus Form */}
          {showRegisterForm && (
            <form onSubmit={handleRegisterBus} style={styles.form}>
              <input
                style={styles.input}
                type="text"
                placeholder="Bus Number (e.g., BUS-001)"
                value={form.busNumber}
                onChange={(e) => setForm({ ...form, busNumber: e.target.value })}
              />
              <input
                style={styles.input}
                type="text"
                placeholder="Route Name (e.g., City Center - Airport)"
                value={form.routeName}
                onChange={(e) => setForm({ ...form, routeName: e.target.value })}
              />
              <input
                style={styles.input}
                type="number"
                placeholder="Capacity (e.g., 50)"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
              <button type="submit" style={styles.btnPrimary}>
                Register Bus
              </button>
            </form>
          )}

          {/* Buses List */}
          <div style={styles.busesList}>
            {buses.map((bus) => (
              <div
                key={bus._id}
                style={{
                  ...styles.busCard,
                  ...(selectedBus?._id === bus._id && styles.busCardActive)
                }}
                onClick={() => setSelectedBus(bus)}
              >
                <h3>{bus.busNumber}</h3>
                <p>Route: {bus.routeName}</p>
                <p>Capacity: {bus.capacity} seats</p>
                <p>Available: {bus.seatsAvailable} seats</p>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: bus.status === "active" ? "#10b981" : "#ef4444"
                  }}
                >
                  {bus.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Operations Section */}
        {selectedBus && (
          <div style={styles.section}>
            <h2>Bus Operations</h2>

            {/* Location Update */}
            <div style={styles.formGroup}>
              <h3>📍 Update Location</h3>
              <form onSubmit={handleUpdateLocation} style={styles.form}>
                <input
                  style={styles.input}
                  type="number"
                  step="0.0001"
                  placeholder="Latitude"
                  value={locationForm.latitude}
                  onChange={(e) =>
                    setLocationForm({ ...locationForm, latitude: e.target.value })
                  }
                />
                <input
                  style={styles.input}
                  type="number"
                  step="0.0001"
                  placeholder="Longitude"
                  value={locationForm.longitude}
                  onChange={(e) =>
                    setLocationForm({ ...locationForm, longitude: e.target.value })
                  }
                />
                <input
                  style={styles.input}
                  type="number"
                  placeholder="ETA (minutes)"
                  value={locationForm.eta}
                  onChange={(e) =>
                    setLocationForm({ ...locationForm, eta: e.target.value })
                  }
                />
                <button type="submit" style={styles.btnPrimary}>
                  Update Location
                </button>
              </form>
            </div>

            {/* Seat Update */}
            <div style={styles.formGroup}>
              <h3>💺 Update Seat Availability</h3>
              <form onSubmit={handleUpdateSeats} style={styles.form}>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="Available Seats"
                  value={seatsForm}
                  onChange={(e) => setSeatsForm(e.target.value)}
                  max={selectedBus.capacity}
                />
                <button type="submit" style={styles.btnPrimary}>
                  Update Seats
                </button>
              </form>
            </div>

            {/* Service Control */}
            <div style={styles.formGroup}>
              <h3>⚙️ Service Control</h3>
              <div style={styles.buttonGroup}>
                <button
                  style={{
                    ...styles.btnControl,
                    background: selectedBus.status === "active" ? "#10b981" : "#667eea"
                  }}
                  onClick={handleStartService}
                >
                  🚀 Start Service
                </button>
                <button
                  style={{ ...styles.btnControl, background: "#ef4444" }}
                  onClick={handleStopService}
                >
                  ⛔ Stop Service
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;

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
  mainContent: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px"
  },
  section: {
    background: "white",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  busesList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  busCard: {
    padding: "15px",
    border: "2px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.3s"
  },
  busCardActive: {
    borderColor: "#667eea",
    background: "#f0f4ff"
  },
  statusBadge: {
    padding: "4px 12px",
    color: "white",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
    marginTop: "8px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  input: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px"
  },
  formGroup: {
    marginBottom: "20px",
    paddingBottom: "20px",
    borderBottom: "1px solid #ddd"
  },
  buttonGroup: {
    display: "flex",
    gap: "10px"
  },
  btnPrimary: {
    padding: "10px 16px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600"
  },
  btnControl: {
    padding: "12px 20px",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    flex: 1
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontSize: "18px"
  }
};
