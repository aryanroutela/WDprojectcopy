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
                <span className="tracking-stat-num" style={{ color: "#10b981" }}>{activeBuses.length}</span>
                <span className="tracking-stat-lbl">On Map</span>
              </div>
              <div className={`tracking-stat tracking-status-${connected ? "live" : "off"}`}>
                <span className="live-dot" style={{ background: connected ? "#10b981" : "#ef4444" }} />
                <span className="tracking-stat-lbl">{connected ? "Live" : "Offline"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Smart Search ─────────────────────────────────────────── */}
      <div className="container" style={{ marginTop: 20 }}>
        <SmartSearch
          onResults={(results) => {
            setFilteredBuses(results.length > 0 ? results : []);
          }}
          allBuses={buses}
        />
      </div>

      {/* ── Main layout: Map + sidebar ───────────────────────────── */}
      <div className="tracking-layout container">
        {/* Map */}
        <div className="tracking-map-col">
          {loading ? (
            <div className="map-loading">
              <div className="spinner" />
              <p>Connecting to live tracking...</p>
            </div>
          ) : (
            <Suspense fallback={<div className="map-loading">Loading map...</div>}>
              <LiveMap
                buses={displayBuses}
                selectedBus={liveBus}
                followBus={followBus}
                height="520px"
              />
            </Suspense>
          )}
        </div>

        {/* Sidebar */}
        <div className="tracking-sidebar">
          {/* Selected bus detail */}
          {liveBus ? (
            <div className="tracking-bus-detail">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>🚌 Bus {liveBus.busNumber}</h3>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className={`btn btn-sm ${followBus ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setFollowBus(!followBus)}
                    title="Follow bus on map"
                  >
                    {followBus ? "📡 Following" : "👁 Follow"}
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={() => { setSelectedBus(null); setFollowBus(false); }}>✕</button>
                </div>
              </div>

              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>{liveBus.routeName}</p>

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
              <div style={{ fontSize: 36 }}>🚌</div>
              <p>Click a bus on the map or from the list to see live details</p>
            </div>
          )}

          {/* Bus list */}
          <div className="tracking-bus-list">
            <div className="tracking-bus-list-header">
              {filteredBuses.length > 0
                ? `${filteredBuses.length} search result${filteredBuses.length > 1 ? "s" : ""}`
                : `${buses.length} bus${buses.length !== 1 ? "es" : ""} on route`}
            </div>
            {displayBuses.map((bus) => {
              const badge = getStatusBadge(bus);
              const loc = bus.currentLocation || bus.location;
              const hasLocation = loc?.latitude != null;
              return (
                <div
                  key={bus._id}
                  className={`tracking-bus-item ${selectedBus?._id === bus._id ? "tracking-bus-item-active" : ""}`}
                  onClick={() => { setSelectedBus(bus); setFollowBus(true); }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700 }}>{bus.busNumber}</span>
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", margin: "3px 0" }}>{bus.routeName}</div>
                  <div style={{ display: "flex", gap: 10, fontSize: 12, flexWrap: "wrap" }}>
                    {bus.eta != null && (
                      <span style={{ color: "#6366f1", fontWeight: 600 }}>⏱ {bus.eta}m</span>
                    )}
                    {bus.nextCheckpointName && (
                      <span style={{ color: "#64748b" }}>🎯 {bus.nextCheckpointName}</span>
                    )}
                    {hasLocation && <span className="live-dot" style={{ marginTop: 2 }} />}
                  </div>
                  {/* Mini checkpoint progress dots */}
                  {bus.checkpoints?.length > 0 && (
                    <div className="mini-progress-row" style={{ marginTop: 6 }}>
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
              <div style={{ textAlign: "center", color: "#94a3b8", padding: 24, fontSize: 13 }}>
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
