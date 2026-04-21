import React, { lazy, Suspense, useState } from "react";
import useLiveBuses from "../hooks/useLiveBuses";
import ETADisplay from "../components/ETADisplay";
import CheckpointTracker from "../components/CheckpointTracker";
import SmartSearch from "../components/SmartSearch";

const LiveMap = lazy(() => import("../components/LiveMap"));

/**
 * LiveTrackingPage — Public map page accessible without login.
 * Route: /track
 */
const LiveTrackingPage = () => {
  const { buses, connected, loading } = useLiveBuses({ userId: "public", role: "user" });
  const [selectedBus, setSelectedBus] = useState(null);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [followBus, setFollowBus] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const haversineDistance = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
    const toRad = (x) => (x * Math.PI) / 180;
    const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  React.useEffect(() => {
    setFilteredBuses((prev) => {
      if (prev.length === 0) return [];
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

  // Sync live data into selectedBus
  const liveBus = selectedBus
    ? buses.find((b) => b._id === selectedBus._id) || selectedBus
    : null;

  const activeBuses = buses.filter((b) => {
    const loc = b.currentLocation || b.location;
    return loc?.latitude != null;
  });

  const displayBuses = filteredBuses.length > 0 ? filteredBuses : buses;

  const getStatusBadge = (b) => {
    const s = b.busStatus || b.status;
    if (s === "green" || s === "active") return { label: "Available", cls: "badge-green" };
    if (s === "yellow") return { label: "Filling", cls: "badge-yellow" };
    return { label: "Full", cls: "badge-red" };
  };

  return (
    <div className="page">
      {/* ── Hero Header ──────────────────────────────────────────── */}
      <div className="tracking-hero">
        <div className="container">
          <div className="tracking-hero-inner">
            <div>
              <h1 className="tracking-hero-title">🗺️ Live Bus Tracker</h1>
              <p className="tracking-hero-sub">
                Real-time positions · ETA · Checkpoint progress
              </p>
            </div>
            <div className="tracking-hero-stats">
              <div className="tracking-stat">
                <span className="tracking-stat-num">{buses.length}</span>
                <span className="tracking-stat-lbl">Total</span>
              </div>
              <div className="tracking-stat">
                <span className="tracking-stat-num" style={{ color: "#86efac" }}>{activeBuses.length}</span>
                <span className="tracking-stat-lbl">On Map</span>
              </div>
              <div className="tracking-stat">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span
                    className="live-dot"
                    style={{ background: connected ? "#86efac" : "#fca5a5", width: 10, height: 10 }}
                  />
                  <span className="tracking-stat-lbl" style={{ fontSize: 13 }}>
                    {connected ? "Live" : "Offline"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Smart Search ──────────────────────────────────────────── */}
      <div className="container" style={{ marginTop: 20 }}>
        <SmartSearch
          onResults={(results) => {
            setFilteredBuses(results.length > 0 ? results : []);
          }}
          allBuses={buses}
        />
      </div>

      {/* ── Main layout: Map + sidebar ─────────────────────────── */}
      <div className="tracking-layout container">
        {/* Map */}
        <div className="tracking-map-col">
          {loading ? (
            <div className="map-loading">
              <div className="spinner spinner-primary" />
              <p>Connecting to live tracking...</p>
            </div>
          ) : (
            <div className="map-wrap">
              <Suspense fallback={<div className="map-loading"><div className="spinner spinner-primary" /><p>Loading map...</p></div>}>
                <LiveMap
                  buses={displayBuses}
                  selectedBus={liveBus}
                  followBus={followBus}
                  height="520px"
                />
              </Suspense>
            </div>
          )}

          {/* Mobile: show selected bus info below map */}
          {liveBus && (
            <div className="bus-detail-panel" style={{ marginTop: 16 }}>
              <div className="bus-detail-header">
                <div>
                  <h3>🚌 Bus {liveBus.busNumber}</h3>
                  <p>{liveBus.routeName}</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    id="track-follow-btn"
                    className={`btn btn-sm ${followBus ? "btn-accent" : "btn-outline"}`}
                    onClick={() => setFollowBus(!followBus)}
                  >
                    {followBus ? "📡 Following" : "👁 Follow"}
                  </button>
                  <button
                    id="track-close-btn"
                    className="btn btn-sm btn-ghost btn-icon-only"
                    onClick={() => { setSelectedBus(null); setFollowBus(false); }}
                  >✕</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="tracking-sidebar">
          {/* Selected bus detail */}
          {liveBus ? (
            <div className="tracking-bus-detail">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>🚌 Bus {liveBus.busNumber}</h3>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    id="sidebar-follow-btn"
                    className={`btn btn-sm ${followBus ? "btn-accent" : "btn-outline"}`}
                    onClick={() => setFollowBus(!followBus)}
                  >
                    {followBus ? "📡" : "👁"}
                  </button>
                  <button
                    id="sidebar-close-btn"
                    className="btn btn-sm btn-ghost btn-icon-only"
                    onClick={() => { setSelectedBus(null); setFollowBus(false); }}
                  >✕</button>
                </div>
              </div>

              <p className="text-sm text-muted mb-12">{liveBus.routeName}</p>

              {/* ETA */}
              <ETADisplay
                etaData={liveBus.etaData}
                eta={liveBus.eta}
                busNumber={liveBus.busNumber}
              />

              {/* Checkpoint progress */}
              {liveBus.checkpoints?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <CheckpointTracker
                    checkpoints={liveBus.checkpoints}
                    currentIdx={liveBus.currentCheckpointIdx ?? -1}
                    currentName={liveBus.currentCheckpointName}
                    nextName={liveBus.nextCheckpointName}
                  />
                </div>
              )}

              {/* Quick stats */}
              <div className="bus-detail-stats" style={{ marginTop: 16 }}>
                <div className="bus-detail-stat">
                  <span className="bus-detail-stat-val">{liveBus.seatsAvailable}/{liveBus.capacity}</span>
                  <span className="bus-detail-stat-lbl">Seats</span>
                </div>
                {liveBus.speed != null && (
                  <div className="bus-detail-stat">
                    <span className="bus-detail-stat-val">{Math.round(liveBus.speed)}</span>
                    <span className="bus-detail-stat-lbl">km/h</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="tracking-no-selection">
              <div style={{ fontSize: 40, marginBottom: 12 }}>🚌</div>
              <p style={{ fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
                Select a bus
              </p>
              <p>Click a bus on the map or from the list below to see live details</p>
            </div>
          )}

          {/* Bus list */}
          <div className="tracking-bus-list">
            <div className="tracking-bus-list-header">
              {filteredBuses.length > 0
                ? `${filteredBuses.length} result${filteredBuses.length > 1 ? "s" : ""}`
                : `${buses.length} bus${buses.length !== 1 ? "es" : ""} on route`}
            </div>
            {displayBuses.map((bus) => {
              const badge = getStatusBadge(bus);
              const loc = bus.currentLocation || bus.location;
              const hasLocation = loc?.latitude != null;
              const eta = bus.matchedEta ?? bus.eta;

              return (
                <div
                  key={bus._id}
                  id={`track-bus-${bus.busNumber}`}
                  className={`tracking-bus-item ${selectedBus?._id === bus._id ? "tracking-bus-item-active" : ""}`}
                  onClick={() => { setSelectedBus(bus); setFollowBus(true); }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{bus.busNumber}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {eta != null && (
                        <span style={{
                          background: "var(--accent-muted)", color: "var(--accent)",
                          fontSize: 11, fontWeight: 700,
                          padding: "2px 8px", borderRadius: "var(--radius-full)",
                        }}>
                          ⏱ {eta}m
                        </span>
                      )}
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted">{bus.routeName}</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 5, flexWrap: "wrap", alignItems: "center" }}>
                    {bus.nextCheckpointName && (
                      <span className="text-xs" style={{ color: "var(--accent)", fontWeight: 600 }}>
                        🎯 {bus.nextCheckpointName}
                      </span>
                    )}
                    {hasLocation && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }} className="text-xs text-muted">
                        <span className="live-dot" style={{ width: 6, height: 6 }} /> Live
                      </span>
                    )}
                  </div>
                  {/* Mini checkpoint progress dots */}
                  {bus.checkpoints?.length > 0 && (
                    <div className="mini-progress-row" style={{ marginTop: 8 }}>
                      {bus.checkpoints.map((cp, i) => (
                        <div
                          key={i}
                          className={`mini-cp-dot ${
                            i <= (bus.currentCheckpointIdx ?? -1) ? "mini-cp-passed"
                            : i === (bus.currentCheckpointIdx ?? -1) + 1 ? "mini-cp-next"
                            : "mini-cp-upcoming"
                          }`}
                          title={cp.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {buses.length === 0 && !loading && (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 28, fontSize: 13 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🚌</div>
                No active buses right now
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingPage;
