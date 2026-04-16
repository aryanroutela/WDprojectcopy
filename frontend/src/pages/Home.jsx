import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import io from "socket.io-client";
import { useLanguage } from "../context/LanguageContext";

const Home = () => {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const { t } = useLanguage();

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

  const getStatusClass = (status) => {
    if (status === "green") return "badge-green";
    if (status === "yellow") return "badge-yellow";
    return "badge-red";
  };

  const getStatusLabel = (status) => {
    if (status === "green") return t('home.available');
    if (status === "yellow") return t('home.fillingUp');
    return t('home.busFull');
  };

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero-section">
        <div className="container">
          <h1>
            {t('home.title')} <span>{t('home.titleHighlight')}</span>
          </h1>
          <p>{t('home.subtitle')}</p>
          <Link to="/signup" className="btn btn-primary" style={{ display: "inline-flex" }}>
            {t('home.getStarted')}
          </Link>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num">{buses.length || "—"}</span>
              <span className="hero-stat-label">{t('home.activeBuses')}</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">50K+</span>
              <span className="hero-stat-label">{t('home.users')}</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">150+</span>
              <span className="hero-stat-label">{t('home.routes')}</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">99.8%</span>
              <span className="hero-stat-label">{t('home.accuracy')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Buses */}
      <section className="section">
        <div className="container">
          <div className="flex-between mb-24" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 className="section-title" style={{ marginBottom: 4 }}>
                {t('home.liveBuses')}
              </h2>
              <p className="text-sm text-muted">{buses.length} {t('home.activeNow')}</p>
            </div>
            <Link to="/login" className="btn btn-outline btn-sm">
              {t('home.trackAll')}
            </Link>
          </div>

          {buses.length > 0 ? (
            <div className="card-grid">
              {buses.slice(0, 6).map((bus) => (
                <div
                  key={bus._id}
                  className="card bus-card"
                  onClick={() => setSelectedBus(selectedBus?._id === bus._id ? null : bus)}
                >
                  <div className="bus-card-header">
                    <span className="bus-number">{bus.busNumber}</span>
                    <span className={`badge ${getStatusClass(bus.status)}`}>
                      {getStatusLabel(bus.status)}
                    </span>
                  </div>
                  <p className="bus-route">📍 {bus.routeName}</p>

                  <div className="bus-stats">
                    <div className="bus-stat">
                      <span className="bus-stat-val">
                        {bus.seatsAvailable}/{bus.capacity}
                      </span>
                      <span className="bus-stat-lbl">{t('home.seats')}</span>
                    </div>
                    <div className="bus-stat">
                      <span className="bus-stat-val">{bus.occupancy}%</span>
                      <span className="bus-stat-lbl">{t('home.full')}</span>
                    </div>
                    {bus.eta && (
                      <div className="bus-stat">
                        <span className="bus-stat-val">{bus.eta}m</span>
                        <span className="bus-stat-lbl">{t('home.eta')}</span>
                      </div>
                    )}
                  </div>

                  <div className="progress">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${bus.occupancy}%`,
                        background:
                          bus.status === "green"
                            ? "var(--green)"
                            : bus.status === "yellow"
                            ? "var(--yellow)"
                            : "var(--red)",
                      }}
                    />
                  </div>

                  {bus.location && bus.location.latitude && (
                    <p className="text-sm text-muted mt-8">
                      <span className="live-dot" /> Live • {bus.location.latitude?.toFixed?.(4)}, {bus.location.longitude?.toFixed?.(4)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🚌</div>
              <p className="empty-state-text">{t('home.noBuses')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="section" style={{ background: "var(--white)" }}>
        <div className="container">
          <h2 className="section-title text-center">{t('home.whyRouteFlow')}</h2>
          <div className="card-grid" style={{ maxWidth: 900, margin: "0 auto" }}>
            <FeatureItem icon="📍" title={t('home.ft1Title')} desc={t('home.ft1Desc')} />
            <FeatureItem icon="🪑" title={t('home.ft2Title')} desc={t('home.ft2Desc')} />
            <FeatureItem icon="⚡" title={t('home.ft3Title')} desc={t('home.ft3Desc')} />
            <FeatureItem icon="🛡️" title={t('home.ft4Title')} desc={t('home.ft4Desc')} />
            <FeatureItem icon="🛑" title={t('home.ft5Title')} desc={t('home.ft5Desc')} />
            <FeatureItem icon="📱" title={t('home.ft6Title')} desc={t('home.ft6Desc')} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section text-center">
        <div className="container">
          <h2 className="section-title">{t('home.ctaTitle')}</h2>
          <p className="text-muted mb-24">
            {t('home.ctaDesc')}
          </p>
          <Link to="/signup" className="btn btn-primary">
            {t('home.createAccount')}
          </Link>
        </div>
      </section>

      {/* Bus Detail Modal */}
      {selectedBus && (
        <div className="modal-overlay" onClick={() => setSelectedBus(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedBus(null)}>✕</button>
            <h3 className="modal-title">Bus {selectedBus.busNumber}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <DetailItem label="Route" value={selectedBus.routeName} />
              <DetailItem label="Status" value={getStatusLabel(selectedBus.status)} />
              <DetailItem label={t('home.seats')} value={`${selectedBus.seatsAvailable}/${selectedBus.capacity}`} />
              <DetailItem label={t('home.full')} value={`${selectedBus.occupancy}%`} />
              {selectedBus.eta && <DetailItem label={t('home.eta')} value={`${selectedBus.eta} min`} />}
              <DetailItem label="Driver" value={selectedBus.driver?.firstName || "N/A"} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FeatureItem = ({ icon, title, desc }) => (
  <div className="feature-card">
    <div className="feature-icon">{icon}</div>
    <div className="feature-title">{title}</div>
    <div className="feature-desc">{desc}</div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div style={{ padding: 12, background: "var(--bg)", borderRadius: 8 }}>
    <div className="text-sm text-muted">{label}</div>
    <div className="font-bold">{value}</div>
  </div>
);

export default Home;