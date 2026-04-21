import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import io from "socket.io-client";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/buses`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.buses)) {
          setBuses(data.buses);
        }
      })
      .catch((error) => console.error("Error fetching buses:", error));

    const socket = io(`${import.meta.env.VITE_BACKEND_URL}`);
    socket.on("bus:locationUpdate", (data) => {
      setBuses((prev) =>
        prev.map((b) =>
          b._id === data.busId
            ? { ...b, location: data.coordinates, eta: data.eta }
            : b
        )
      );
    });
    socket.on("bus:seatsUpdate", (data) => {
      setBuses((prev) =>
        prev.map((b) =>
          b._id === data.busId
            ? { ...b, seatsAvailable: data.seatsAvailable, occupancy: data.occupancy, status: data.status }
            : b
        )
      );
    });

    return () => socket.disconnect();
  }, []);

  const getStatusColor = (status) => {
    if (status === "green") return "var(--green)";
    if (status === "yellow") return "var(--yellow)";
    return "var(--red)";
  };

  const getStatusClass = (status) => {
    if (status === "green") return "badge-green";
    if (status === "yellow") return "badge-yellow";
    return "badge-red";
  };

  const getStatusLabel = (status) => {
    if (status === "green") return t("home.available");
    if (status === "yellow") return t("home.fillingUp");
    return t("home.busFull");
  };

  return (
    <div className="page">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          {buses.length > 0 ? `${buses.length} buses live right now` : "Real-time tracking active"}
        </div>

        <h1>
          {t("home.title")}{" "}
          <span>{t("home.titleHighlight")}</span>
        </h1>
        <p>{t("home.subtitle")}</p>

        <div className="hero-cta-group">
          <Link to="/user-dashboard" className="btn btn-primary btn-lg" id="hero-get-started">
            🚀 {t("home.getStarted")}
          </Link>
          <Link to="/track" className="btn btn-outline btn-lg" id="hero-live-track">
            🗺️ Live Map
          </Link>
        </div>

        <div className="hero-stats anim-stagger">
          <div className="hero-stat">
            <span className="hero-stat-num">{buses.length > 0 ? buses.length : "—"}</span>
            <span className="hero-stat-label">{t("home.activeBuses")}</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-num">50K+</span>
            <span className="hero-stat-label">{t("home.users")}</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-num">150+</span>
            <span className="hero-stat-label">{t("home.routes")}</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-num">99.8%</span>
            <span className="hero-stat-label">{t("home.accuracy")}</span>
          </div>
        </div>
      </section>

      {/* ── Live Buses ───────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="flex-between mb-24" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <div className="section-eyebrow">Live Updates</div>
              <h2 className="section-title" style={{ marginBottom: 4 }}>
                {t("home.liveBuses")}
              </h2>
              <div className="flex items-center gap-8" style={{ marginTop: 6 }}>
                <span className="live-dot" />
                <span className="text-sm text-muted">{buses.length} {t("home.activeNow")}</span>
              </div>
            </div>
            <Link to="/login" className="btn btn-outline btn-sm" id="home-track-all">
              {t("home.trackAll")} →
            </Link>
          </div>

          {buses.length > 0 ? (
            <div className="card-grid anim-stagger">
              {buses.slice(0, 6).map((bus) => (
                <div
                  key={bus._id}
                  id={`bus-card-${bus.busNumber}`}
                  className="live-bus-card"
                  onClick={() => setSelectedBus(selectedBus?._id === bus._id ? null : bus)}
                >
                  <div className="live-bus-top">
                    <div>
                      <div className="live-bus-num">{bus.busNumber}</div>
                      <div className="live-bus-route">📍 {bus.routeName}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span className={`badge ${getStatusClass(bus.status)}`}>
                        {getStatusLabel(bus.status)}
                      </span>
                      {bus.eta && (
                        <span className="live-bus-eta-pill">⏱ {bus.eta}m</span>
                      )}
                    </div>
                  </div>

                  <div className="live-bus-info-row">
                    <div className="live-bus-info-item">
                      <span>🪑</span>
                      <span>{bus.seatsAvailable}/{bus.capacity} seats</span>
                    </div>
                    <div className="live-bus-info-item">
                      <span>📊</span>
                      <span>{bus.occupancy}% full</span>
                    </div>
                    {bus.location?.latitude && (
                      <div className="live-bus-info-item">
                        <span className="live-dot" style={{ width: 6, height: 6 }} />
                        <span>Live</span>
                      </div>
                    )}
                  </div>

                  <div className="live-bus-progress">
                    <div
                      className="live-bus-progress-fill"
                      style={{
                        width: `${bus.occupancy || 0}%`,
                        background: getStatusColor(bus.status),
                      }}
                    />
                  </div>

                  {bus.nextCheckpointName && (
                    <p className="text-sm" style={{ color: "var(--accent)", marginTop: 8, fontWeight: 600 }}>
                      🎯 Next: {bus.nextCheckpointName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🚌</div>
              <div className="empty-state-title">No buses online</div>
              <p className="empty-state-text">{t("home.noBuses")}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--surface)" }}>
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Why RouteFlow</div>
            <h2 className="section-title">{t("home.whyRouteFlow")}</h2>
            <p className="section-subtitle">
              The smartest way to track city buses — built for Indian commuters.
            </p>
          </div>
          <div className="card-grid anim-stagger" style={{ maxWidth: 960, margin: "0 auto" }}>
            <FeatureItem icon="📍" title={t("home.ft1Title")} desc={t("home.ft1Desc")} />
            <FeatureItem icon="🪑" title={t("home.ft2Title")} desc={t("home.ft2Desc")} />
            <FeatureItem icon="⚡" title={t("home.ft3Title")} desc={t("home.ft3Desc")} />
            <FeatureItem icon="🛡️" title={t("home.ft4Title")} desc={t("home.ft4Desc")} />
            <FeatureItem icon="🛑" title={t("home.ft5Title")} desc={t("home.ft5Desc")} />
            <FeatureItem icon="📱" title={t("home.ft6Title")} desc={t("home.ft6Desc")} />
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="section text-center" style={{ background: "var(--bg)" }}>
        <div className="container">
          <div
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--accent-light))",
              borderRadius: "var(--radius-xl)",
              padding: "56px 32px",
              color: "#fff",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", top: "-20%", right: "-5%",
              width: 200, height: 200, borderRadius: "50%",
              background: "rgba(255,255,255,0.08)", pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", bottom: "-30%", left: "5%",
              width: 150, height: 150, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)", pointerEvents: "none",
            }} />
            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(24px, 5vw, 36px)",
              fontWeight: 900,
              marginBottom: 12,
              letterSpacing: "-0.5px",
              position: "relative", zIndex: 1,
            }}>
              {t("home.ctaTitle")}
            </h2>
            <p style={{ fontSize: 16, opacity: 0.85, marginBottom: 28, position: "relative", zIndex: 1 }}>
              {t("home.ctaDesc")}
            </p>
            <Link
              to="/signup"
              id="home-create-account"
              className="btn btn-lg"
              style={{
                background: "#fff",
                color: "var(--primary)",
                fontWeight: 800,
                position: "relative", zIndex: 1,
              }}
            >
              {t("home.createAccount")} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bus Detail Modal ──────────────────────────────────────── */}
      {selectedBus && (
        <div className="modal-overlay" onClick={() => setSelectedBus(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedBus(null)}>✕</button>
            <h3 className="modal-title">🚌 Bus {selectedBus.busNumber}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <DetailItem label="Route" value={selectedBus.routeName} />
              <DetailItem label="Status" value={getStatusLabel(selectedBus.status)} />
              <DetailItem label={t("home.seats")} value={`${selectedBus.seatsAvailable}/${selectedBus.capacity}`} />
              <DetailItem label={t("home.full")} value={`${selectedBus.occupancy}%`} />
              {selectedBus.eta && <DetailItem label="ETA" value={`${selectedBus.eta} min`} />}
              <DetailItem label="Driver" value={selectedBus.driver?.firstName || "N/A"} />
            </div>

            <div className="progress" style={{ marginBottom: 16 }}>
              <div
                className="progress-fill"
                style={{
                  width: `${selectedBus.occupancy || 0}%`,
                  background: getStatusColor(selectedBus.status),
                }}
              />
            </div>

            <Link to="/track" className="btn btn-accent btn-block" onClick={() => setSelectedBus(null)}>
              🗺️ Track Live on Map
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

const FeatureItem = ({ icon, title, desc }) => (
  <div className="feature-card">
    <div className="feature-icon">
      <span>{icon}</span>
    </div>
    <div className="feature-title">{title}</div>
    <div className="feature-desc">{desc}</div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div style={{ padding: "12px 14px", background: "var(--bg2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
    <div className="text-xs text-muted" style={{ marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
    <div style={{ fontWeight: 700, fontSize: 15 }}>{value}</div>
  </div>
);

export default Home;