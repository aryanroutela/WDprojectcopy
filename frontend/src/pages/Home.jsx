import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const Home = () => {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [activeStatus, setActiveStatus] = useState(null);

  // Socket.io connection and API initialization
  useEffect(() => {
    // Fetch buses from API
    fetch("http://localhost:5000/api/buses")
      .then((res) => res.json())
      .then((data) => setBuses(data))
      .catch((error) => console.error("Error fetching buses:", error));

    // Initialize Socket.io
    const socket = io("http://localhost:5000");

    socket.on("bus:update", (data) => {
      setBuses(data);
    });

    // Geolocation - Send live location updates
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition((pos) => {
        socket.emit("location:update", {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: new Date().toISOString(),
        });
      });

      return () => {
        navigator.geolocation.clearWatch(watchId);
        socket.disconnect();
      };
    }
  }, []);

  const getStatusColor = (status) => {
    if (status === "green") return "#10b981";
    if (status === "yellow") return "#f59e0b";
    return "#ef4444";
  };

  const getStatusLabel = (status) => {
    if (status === "green") return "Seats Available";
    if (status === "yellow") return "Standing Only";
    return "Full";
  };

  const getOccupancyLabel = (occupancy) => {
    if (occupancy <= 50) return "Low";
    if (occupancy <= 80) return "Medium";
    return "High";
  };

  const updateStatus = (busId, newStatus) => {
    // Map status to API format
    const statusMap = {
      "green": "vacant",
      "yellow": "available",
      "red": "full"
    };

    fetch("http://localhost:5000/api/seats/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        busId,
        status: statusMap[newStatus] || newStatus,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBuses((prev) =>
            prev.map((bus) =>
              bus.id === busId ? { ...bus, status: newStatus } : bus
            )
          );
        } else {
          console.error("Failed to update status:", data.message);
        }
      })
      .catch((error) => console.error("Error updating status:", error));
  };

  return (
    <div style={styles.page}>
      {/* HERO SECTION */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Track Your Bus in Real-Time
          </h1>
          <p style={styles.heroSubtitle}>
            No more waiting. Know exactly when your bus arrives with precision tracking.
          </p>
          <button style={styles.ctaButton}>
            Start Tracking Now
            <span style={styles.buttonArrow}>→</span>
          </button>

          {/* Stats Preview */}
          <div style={styles.statsPreview}>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{buses.length}</span>
              <span style={styles.statLabel}>Active Buses</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>2.4m</span>
              <span style={styles.statLabel}>Avg Wait Saved</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>12.5K</span>
              <span style={styles.statLabel}>Users Online</span>
            </div>
          </div>
        </div>

        {/* Hero Right - Animated Illustration */}
        <div style={styles.heroIllustration}>
          <div style={styles.floatingBus}>🚍</div>
          <div style={styles.floatingShape1}></div>
          <div style={styles.floatingShape2}></div>
        </div>
      </section>

      {/* LIVE TRACKING SECTION TITLE */}
      <section style={styles.trackingSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>🗺️ Live Bus Tracking</h2>
          <p style={styles.sectionSubtitle}>Monitor all active buses in real-time</p>
        </div>

        {/* BUSES GRID */}
        <div style={styles.busesGrid}>
          {buses.map((bus) => (
            <div
              key={bus.id}
              style={{
                ...styles.busCard,
                ...(selectedBus?.id === bus.id && styles.busCardSelected),
              }}
              onClick={() => setSelectedBus(selectedBus?.id === bus.id ? null : bus)}
            >
              {/* Card Header */}
              <div style={styles.cardHeader}>
                <div style={styles.routeInfo}>
                  <span style={styles.routeBadge}>{bus.route}</span>
                  <span style={styles.routeDestination}>→ {bus.destination}</span>
                </div>
                <div
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(bus.status),
                  }}
                >
                  {bus.status === "green" && "✓"}
                  {bus.status === "yellow" && "◐"}
                  {bus.status === "red" && "✕"}
                </div>
              </div>

              {/* ETA - Big Bold */}
              <div style={styles.etaSection}>
                <span style={styles.etaLabel}>Arriving in</span>
                <span style={styles.etaTime}>{bus.eta}</span>
                <span style={styles.etaUnit}>min</span>
              </div>

              {/* Status Text */}
              <p style={{ ...styles.statusText, color: getStatusColor(bus.status) }}>
                {getStatusLabel(bus.status)}
              </p>

              {/* Progress Bar */}
              <div style={styles.progressContainer}>
                <div style={styles.progressLabel}>
                  <span>Journey Progress</span>
                  <span>{Math.round((bus.distance / 10) * 100)}%</span>
                </div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${(bus.distance / 10) * 100}%`,
                      backgroundColor: getStatusColor(bus.status),
                    }}
                  ></div>
                </div>
              </div>

              {/* Card Info Row */}
              <div style={styles.cardInfoRow}>
                <div style={styles.infoItem}>
                  <span style={styles.infoIcon}>📍</span>
                  <div>
                    <span style={styles.infoLabel}>Next Stop</span>
                    <span style={styles.infoValue}>{bus.nextStop}</span>
                  </div>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoIcon}>📏</span>
                  <div>
                    <span style={styles.infoLabel}>Distance</span>
                    <span style={styles.infoValue}>{bus.distance} km</span>
                  </div>
                </div>
              </div>

              {/* Occupancy */}
              <div style={styles.occupancySection}>
                <div style={styles.occupancyHeader}>
                  <span>Occupancy Status</span>
                  <span style={styles.occupancyPercent}>{bus.occupancy}%</span>
                </div>
                <div style={styles.occupancyBar}>
                  <div
                    style={{
                      ...styles.occupancyFill,
                      width: `${bus.occupancy}%`,
                      backgroundColor:
                        bus.occupancy <= 50
                          ? "#10b981"
                          : bus.occupancy <= 80
                          ? "#f59e0b"
                          : "#ef4444",
                    }}
                  ></div>
                </div>
                <span style={styles.occupancyLabel}>
                  {getOccupancyLabel(bus.occupancy)} Occupancy
                </span>
              </div>

              {/* Seat Status Buttons - Show when selected */}
              {selectedBus?.id === bus.id && (
                <div style={styles.seatButtonsContainer}>
                  <button
                    style={{
                      ...styles.seatButton,
                      backgroundColor: "#10b981",
                      borderColor: activeStatus === "empty" ? "#059669" : "transparent",
                    }}
                    onClick={() => {
                      setActiveStatus("empty");
                      updateStatus(bus.id, "green");
                    }}
                  >
                    🟢 Empty
                  </button>
                  <button
                    style={{
                      ...styles.seatButton,
                      backgroundColor: "#f59e0b",
                      borderColor: activeStatus === "standing" ? "#d97706" : "transparent",
                    }}
                    onClick={() => {
                      setActiveStatus("standing");
                      updateStatus(bus.id, "yellow");
                    }}
                  >
                    🟡 Standing
                  </button>
                  <button
                    style={{
                      ...styles.seatButton,
                      backgroundColor: "#ef4444",
                      borderColor: activeStatus === "full" ? "#dc2626" : "transparent",
                    }}
                    onClick={() => {
                      setActiveStatus("full");
                      updateStatus(bus.id, "red");
                    }}
                  >
                    🔴 Full
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* STATS SECTION */}
      <section style={styles.statsFullSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>📊 Platform Statistics</h2>
        </div>

        <div style={styles.statsGrid}>
          <StatsCard
            icon="🚌"
            title="Active Buses"
            value={buses.length}
            subtitle="Operating Now"
            gradient="linear-gradient(135deg, #ff7a18 0%, #ff9c42 100%)"
          />
          <StatsCard
            icon="⏱️"
            title="Avg Wait Saved"
            value="2.4m"
            subtitle="Per Journey"
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
          <StatsCard
            icon="👥"
            title="Users Online"
            value="12.5K"
            subtitle="Right Now"
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          />
          <StatsCard
            icon="✓"
            title="Accuracy"
            value="99.8%"
            subtitle="On-Time Rate"
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          />
        </div>
      </section>

      {/* ANIMATED BACKGROUND ELEMENTS */}
      <div style={styles.backgroundGrid}></div>
    </div>
  );
};

const StatsCard = ({ icon, title, value, subtitle, gradient }) => (
  <div style={{ ...styles.statsCard, background: gradient }}>
    <span style={styles.statsIcon}>{icon}</span>
    <span style={styles.statsValue}>{value}</span>
    <span style={styles.statsTitle}>{title}</span>
    <span style={styles.statsSubtitle}>{subtitle}</span>
  </div>
);

export default Home;

/* ================= INLINE CSS ================= */

const keyframes = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(255, 122, 24, 0.2); }
    50% { box-shadow: 0 0 40px rgba(255, 122, 24, 0.4); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// Inject keyframes into document
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = keyframes;
  document.head.appendChild(style);
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fff7f0 0%, #fff9f5 50%, #f0f9ff 100%)",
    overflow: "hidden",
    position: "relative",
  },

  /* ===== HERO SECTION ===== */
  hero: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "80px 60px",
    minHeight: "600px",
    position: "relative",
    overflow: "hidden",
    "@media (maxWidth: 1024px)": {
      flexDirection: "column",
      padding: "60px 30px",
      minHeight: "auto",
    },
  },

  heroContent: {
    flex: 1,
    maxWidth: "600px",
    zIndex: 10,
    animation: "slideInLeft 0.8s ease-out",
  },

  heroTitle: {
    fontSize: "56px",
    fontWeight: "800",
    lineHeight: "1.2",
    marginBottom: "24px",
    background: "linear-gradient(135deg, #ff7a18 0%, #ff9c42 50%, #d946ef 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-1px",
  },

  heroSubtitle: {
    fontSize: "18px",
    color: "#666",
    lineHeight: "1.6",
    marginBottom: "32px",
    fontWeight: "500",
  },

  ctaButton: {
    padding: "16px 40px",
    fontSize: "16px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #ff7a18 0%, #ff9c42 100%)",
    color: "white",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.3s ease",
    boxShadow: "0 12px 32px rgba(255, 122, 24, 0.4)",
    position: "relative",
    overflow: "hidden",
  },

  buttonArrow: {
    transition: "transform 0.3s ease",
  },

  statsPreview: {
    display: "flex",
    gap: "40px",
    marginTop: "48px",
    flexWrap: "wrap",
  },

  statItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  statNumber: {
    fontSize: "32px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #ff7a18 0%, #ff9c42 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },

  statLabel: {
    fontSize: "14px",
    color: "#999",
    fontWeight: "600",
  },

  heroIllustration: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: "400px",
  },

  floatingBus: {
    fontSize: "140px",
    animation: "float 3s ease-in-out infinite",
    filter: "drop-shadow(0 20px 40px rgba(255, 122, 24, 0.3))",
  },

  floatingShape1: {
    position: "absolute",
    width: "200px",
    height: "200px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(255, 122, 24, 0.1) 0%, rgba(255, 122, 24, 0) 100%)",
    top: 0,
    right: 0,
    animation: "float 4s ease-in-out infinite",
  },

  floatingShape2: {
    position: "absolute",
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(217, 70, 239, 0.1) 0%, rgba(217, 70, 239, 0) 100%)",
    bottom: 0,
    left: 0,
    animation: "float 5s ease-in-out infinite 0.5s",
  },

  /* ===== TRACKING SECTION ===== */
  trackingSection: {
    padding: "80px 60px",
    position: "relative",
    zIndex: 10,
  },

  sectionHeader: {
    textAlign: "center",
    marginBottom: "60px",
  },

  sectionTitle: {
    fontSize: "42px",
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: "12px",
  },

  sectionSubtitle: {
    fontSize: "16px",
    color: "#999",
    fontWeight: "500",
  },

  busesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
    gap: "24px",
    "@media (maxWidth: 768px)": {
      gridTemplateColumns: "1fr",
    },
  },

  busCard: {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 122, 24, 0.15)",
    borderRadius: "20px",
    padding: "24px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
    position: "relative",
    overflow: "hidden",
  },

  busCardSelected: {
    transform: "translateY(-8px)",
    boxShadow: "0 20px 60px rgba(255, 122, 24, 0.2)",
    border: "1px solid rgba(255, 122, 24, 0.3)",
    background: "rgba(255, 122, 24, 0.05)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
    paddingBottom: "16px",
    borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
  },

  routeInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  routeBadge: {
    display: "inline-block",
    fontSize: "14px",
    fontWeight: "700",
    color: "#fff",
    background: "linear-gradient(135deg, #ff7a18 0%, #ff9c42 100%)",
    padding: "6px 12px",
    borderRadius: "8px",
    width: "fit-content",
  },

  routeDestination: {
    fontSize: "14px",
    color: "#666",
    fontWeight: "500",
  },

  statusBadge: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "20px",
    fontWeight: "700",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },

  etaSection: {
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
    marginBottom: "16px",
    padding: "16px",
    background: "rgba(255, 122, 24, 0.1)",
    borderRadius: "14px",
  },

  etaLabel: {
    fontSize: "13px",
    color: "#999",
    fontWeight: "500",
  },

  etaTime: {
    fontSize: "42px",
    fontWeight: "800",
    color: "#ff7a18",
    lineHeight: "1",
  },

  etaUnit: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#ff7a18",
  },

  statusText: {
    fontSize: "14px",
    fontWeight: "700",
    marginBottom: "16px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  progressContainer: {
    marginBottom: "20px",
  },

  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    fontWeight: "600",
    color: "#666",
    marginBottom: "8px",
  },

  progressBar: {
    height: "8px",
    background: "rgba(0, 0, 0, 0.08)",
    borderRadius: "8px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: "8px",
    transition: "width 0.6s ease",
    background: "linear-gradient(90deg, #ff7a18 0%, #ff9c42 100%)",
  },

  cardInfoRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "20px",
    padding: "16px 0",
    borderTop: "1px solid rgba(0, 0, 0, 0.05)",
    borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
  },

  infoItem: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
  },

  infoIcon: {
    fontSize: "18px",
  },

  infoLabel: {
    display: "block",
    fontSize: "12px",
    color: "#999",
    fontWeight: "500",
  },

  infoValue: {
    display: "block",
    fontSize: "16px",
    fontWeight: "700",
    color: "#1a1a1a",
  },

  occupancySection: {
    padding: "16px",
    background: "rgba(0, 0, 0, 0.02)",
    borderRadius: "12px",
    marginBottom: "16px",
  },

  occupancyHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    fontWeight: "600",
    color: "#666",
    marginBottom: "8px",
  },

  occupancyPercent: {
    fontWeight: "700",
    color: "#ff7a18",
  },

  occupancyBar: {
    height: "6px",
    background: "rgba(0, 0, 0, 0.08)",
    borderRadius: "6px",
    overflow: "hidden",
    marginBottom: "8px",
  },

  occupancyFill: {
    height: "100%",
    borderRadius: "6px",
    transition: "width 0.6s ease",
  },

  occupancyLabel: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },

  seatButtonsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid rgba(0, 0, 0, 0.05)",
    animation: "fadeInUp 0.3s ease",
  },

  seatButton: {
    padding: "10px 8px",
    fontSize: "13px",
    fontWeight: "700",
    border: "2px solid transparent",
    borderRadius: "10px",
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    textAlign: "center",
  },

  /* ===== STATS SECTION ===== */
  statsFullSection: {
    padding: "80px 60px",
    position: "relative",
    zIndex: 10,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px",
  },

  statsCard: {
    padding: "32px 24px",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    color: "white",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
  },

  statsIcon: {
    fontSize: "40px",
  },

  statsValue: {
    fontSize: "36px",
    fontWeight: "800",
    lineHeight: "1",
  },

  statsTitle: {
    fontSize: "16px",
    fontWeight: "700",
    opacity: "0.9",
  },

  statsSubtitle: {
    fontSize: "13px",
    fontWeight: "500",
    opacity: "0.8",
  },

  /* ===== BACKGROUND ===== */
  backgroundGrid: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundImage: `
      linear-gradient(0deg, transparent 24%, rgba(255, 122, 24, 0.05) 25%, rgba(255, 122, 24, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 122, 24, 0.05) 75%, rgba(255, 122, 24, 0.05) 76%, transparent 77%, transparent),
      linear-gradient(90deg, transparent 24%, rgba(255, 122, 24, 0.05) 25%, rgba(255, 122, 24, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 122, 24, 0.05) 75%, rgba(255, 122, 24, 0.05) 76%, transparent 77%, transparent)
    `,
    backgroundSize: "50px 50px",
    pointerEvents: "none",
    zIndex: 1,
  },
};