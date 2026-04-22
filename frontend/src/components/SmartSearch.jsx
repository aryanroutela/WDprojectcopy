import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

/**
 * SmartSearch
 * Smart route + bus suggestion panel.
 * Searches buses that pass through the entered source stop
 * (source does NOT have to be the route's starting point).
 *
 * Now includes AI-powered bus recommendations with scoring.
 *
 * Props:
 *   onResults(buses)  – callback fired with matching bus results
 *   allBuses          – fallback array to reset to
 */
const SmartSearch = ({ onResults, allBuses = [] }) => {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [useAI, setUseAI] = useState(false);
  const [aiResults, setAiResults] = useState(null);

  // Get user location for smart sorting
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const haversineDistance = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleSearch = async (searchSrc = source, searchDst = destination) => {
    const src = searchSrc.trim();
    if (!src) { 
      setResults(null);
      setAiResults(null);
      onResults(allBuses);
      return; 
    }
    setLoading(true);
    try {
      if (useAI) {
        // Use AI recommendation endpoint
        const params = new URLSearchParams({ source: src });
        if (searchDst.trim()) params.append("destination", searchDst.trim());
        if (userLocation) {
          params.append("lat", userLocation.lat);
          params.append("lng", userLocation.lng);
        }

        const res = await axios.get(`${API}/api/ai/recommend?${params}`);
        const recommendations = res.data.recommendations || [];
        setAiResults(recommendations);
        setResults(null);

        // Map AI results to compatible format for onResults callback
        const mapped = recommendations.map(r => ({
          _id: r._id,
          busNumber: r.busNumber,
          routeName: r.routeName,
          source: r.source,
          destination: r.destination,
          seatsAvailable: r.seatsAvailable,
          capacity: r.capacity,
          occupancy: r.occupancy,
          busStatus: r.seatStatus,
          currentLocation: r.currentLocation,
          eta: r.smartETA?.minutes,
          matchedEta: r.smartETA?.minutes,
          matchedSourceStop: { name: r.matchedSource },
          driver: r.driver,
          status: "active",
          scoring: r.scoring,
          smartETA: r.smartETA,
          distanceKm: r.distanceKm
        }));
        onResults(mapped);
      } else {
        // Original search logic
        const params = new URLSearchParams({ source: src });
        if (searchDst.trim()) params.append("destination", searchDst.trim());

        const res = await axios.get(`${API}/api/routes/search?${params}`);
        let found = res.data.buses || [];

        // Geolocation-aware sorting: sort by distance to user if location exists
        if (userLocation) {
          found.sort((a, b) => {
            const distA = haversineDistance(userLocation.lat, userLocation.lng, a.currentLocation?.latitude, a.currentLocation?.longitude);
            const distB = haversineDistance(userLocation.lat, userLocation.lng, b.currentLocation?.latitude, b.currentLocation?.longitude);
            return distA - distB;
          });
        }

        setResults(found);
        setAiResults(null);
        onResults(found);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search when input changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (source.trim()) {
        handleSearch(source, destination);
      } else {
        handleClear();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [source, destination, useAI]);

  const handleClear = () => {
    setSource("");
    setDestination("");
    setResults(null);
    setAiResults(null);
    onResults(allBuses);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch(source, destination);
  };

  const getScoreColor = (score) => {
    if (score >= 75) return "#22c55e";
    if (score >= 50) return "#eab308";
    return "#f97316";
  };

  const displayResults = useAI ? aiResults : results;

  return (
    <div className="smart-search">
      <div className="smart-search-header">
        <span className="smart-search-icon">{useAI ? "🧠" : "🔍"}</span>
        <div style={{ flex: 1 }}>
          <div className="smart-search-title">
            {useAI ? "AI Smart Recommendations" : "Smart Route Search"}
          </div>
          <div className="smart-search-sub">
            {useAI
              ? "AI ranks buses by ETA, distance, route match & availability"
              : <>Find buses passing through <em>any</em> stop — not just the starting point</>
            }
          </div>
        </div>
        {/* AI Toggle */}
        <button
          className="ai-toggle-btn"
          onClick={() => setUseAI(!useAI)}
          title={useAI ? "Switch to standard search" : "Switch to AI recommendations"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 20,
            border: useAI ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.15)",
            background: useAI
              ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))"
              : "rgba(255,255,255,0.05)",
            color: useAI ? "#a78bfa" : "var(--text-muted, #94a3b8)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {useAI ? "🧠 AI On" : "⚡ AI Off"}
        </button>
      </div>

      <div className="smart-search-inputs">
        <div className="smart-search-field">
          <div className="smart-search-field-icon">📍</div>
          <input
            id="smart-search-source"
            className="smart-search-input"
            type="text"
            placeholder="Board from (any stop, e.g. MG Road)"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {source && (
            <button className="smart-search-clear-field" onClick={() => setSource("")}>✕</button>
          )}
        </div>

        <div className="smart-search-field">
          <div className="smart-search-field-icon">🏁</div>
          <input
            id="smart-search-destination"
            className="smart-search-input"
            type="text"
            placeholder="Going to (optional, e.g. Airport)"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {destination && (
            <button className="smart-search-clear-field" onClick={() => setDestination("")}>✕</button>
          )}
        </div>
      </div>

      <div className="smart-search-actions">
        <button
          id="smart-search-btn"
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={loading || !source.trim()}
        >
          {loading ? (
            <><span className="spinner-sm" /> Searching...</>
          ) : useAI ? (
            <> 🧠 AI Recommend</>
          ) : (
            <> 🚌 Find Buses</>
          )}
        </button>
        {(results !== null || aiResults !== null) && (
          <button className="btn btn-outline btn-sm" onClick={handleClear}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Results summary */}
      {displayResults !== null && (
        <div className="smart-search-results-info">
          {displayResults.length > 0 ? (
            <>
              <span className="results-count-badge">{displayResults.length}</span>
              {" "}bus{displayResults.length > 1 ? "es" : ""} found
              {useAI && " (AI ranked)"}
              {" "}passing through
              <strong> "{source}"</strong>
              {destination && <> → <strong>"{destination}"</strong></>}
              {useAI && aiResults?.[0]?.smartETA?.isPeakHour && (
                <span style={{
                  marginLeft: 8,
                  padding: "2px 8px",
                  borderRadius: 8,
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#f87171",
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  🔥 Peak Hour
                </span>
              )}
            </>
          ) : (
            <span style={{ color: "#ef4444" }}>
              ❌ No buses found for that route. Try a different stop name.
            </span>
          )}
        </div>
      )}

      {/* AI Recommendation Cards */}
      {useAI && aiResults?.length > 0 && (
        <div className="smart-search-match-cards">
          {aiResults.slice(0, 3).map((bus) => (
            <div key={bus._id} className="match-card" style={{ position: "relative" }}>
              {/* AI Score Badge */}
              <div style={{
                position: "absolute",
                top: -8,
                right: 12,
                background: `linear-gradient(135deg, ${getScoreColor(bus.scoring.totalScore)}dd, ${getScoreColor(bus.scoring.totalScore)}88)`,
                color: "#fff",
                fontSize: 11,
                fontWeight: 800,
                padding: "3px 10px",
                borderRadius: 12,
                boxShadow: `0 2px 8px ${getScoreColor(bus.scoring.totalScore)}40`,
                letterSpacing: 0.5,
              }}>
                {bus.scoring.totalScore}/100
              </div>

              <div className="match-card-top">
                <span className="match-card-num">🚌 {bus.busNumber}</span>
                <span className={`badge ${
                  bus.seatStatus === "green" ? "badge-green"
                  : bus.seatStatus === "yellow" ? "badge-yellow"
                  : "badge-red"
                }`}>
                  {bus.seatsAvailable} seats
                </span>
              </div>
              <div className="match-card-route">{bus.routeName}</div>

              {/* AI Scoring Breakdown */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "4px 12px",
                margin: "8px 0",
                fontSize: 11,
                color: "var(--text-muted, #94a3b8)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 16 }}>⏱</span>
                  <span>ETA: </span>
                  <span style={{ color: "#e2e2e2", fontWeight: 600 }}>
                    {bus.smartETA?.minutes != null ? `${bus.smartETA.minutes}m` : "—"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 16 }}>📏</span>
                  <span>Dist: </span>
                  <span style={{ color: "#e2e2e2", fontWeight: 600 }}>
                    {bus.distanceKm != null ? `${bus.distanceKm}km` : "—"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 16 }}>🎯</span>
                  <span>Route: </span>
                  <span style={{ color: "#e2e2e2", fontWeight: 600 }}>
                    {bus.scoring.breakdown.routeMatchScore}%
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 16 }}>💺</span>
                  <span>Seat: </span>
                  <span style={{ color: "#e2e2e2", fontWeight: 600 }}>
                    {bus.scoring.breakdown.seatScore}%
                  </span>
                </div>
              </div>

              {/* Score bar */}
              <div style={{
                height: 4,
                borderRadius: 2,
                background: "rgba(255,255,255,0.06)",
                marginTop: 6,
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${bus.scoring.totalScore}%`,
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${getScoreColor(bus.scoring.totalScore)}, ${getScoreColor(bus.scoring.totalScore)}88)`,
                  transition: "width 0.5s ease",
                }} />
              </div>

              {/* Recommendation tag */}
              <div style={{
                marginTop: 6,
                fontSize: 11,
                fontWeight: 600,
                color: bus.scoring.totalScore >= 75 ? "#22c55e" :
                       bus.scoring.totalScore >= 50 ? "#eab308" : "#f97316",
              }}>
                {bus.scoring.recommendation}
              </div>

              {/* ETA method indicator */}
              {bus.smartETA?.method && (
                <div style={{
                  marginTop: 4,
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 4,
                  display: "inline-block",
                  background: bus.smartETA.method === "ai_linear_regression"
                    ? "rgba(34,197,94,0.12)" : "rgba(99,102,241,0.12)",
                  color: bus.smartETA.method === "ai_linear_regression"
                    ? "#4ade80" : "#a78bfa",
                  fontWeight: 600,
                  letterSpacing: 0.3,
                }}>
                  {bus.smartETA.method === "ai_linear_regression" ? "🧠 AI ETA" : "📐 Calculated ETA"}
                </div>
              )}
            </div>
          ))}
          {aiResults.length > 3 && (
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
              + {aiResults.length - 3} more bus{aiResults.length - 3 > 1 ? "es" : ""} shown in the list below
            </div>
          )}
        </div>
      )}

      {/* Standard matched stop info cards (non-AI mode) */}
      {!useAI && results?.length > 0 && (
        <div className="smart-search-match-cards">
          {results.slice(0, 3).map((bus) => (
            <div key={bus._id} className="match-card">
              <div className="match-card-top">
                <span className="match-card-num">🚌 {bus.busNumber}</span>
                <span className={`badge ${
                  bus.busStatus === "green" ? "badge-green"
                  : bus.busStatus === "yellow" ? "badge-yellow"
                  : "badge-red"
                }`}>
                  {bus.seatsAvailable} seats
                </span>
              </div>
              <div className="match-card-route">{bus.routeName}</div>

              {/* Matched stop highlight */}
              <div className="match-card-stops">
                {bus.remainingStops?.map((stop, i) => (
                  <span
                    key={i}
                    className={`match-stop-chip ${
                      stop.name === bus.matchedSourceStop?.name ? "match-stop-chip-active" : ""
                    }`}
                  >
                    {i > 0 && <span className="match-stop-sep">→</span>}
                    {stop.name}
                  </span>
                ))}
              </div>

              {bus.matchedEta != null ? (
                <div className="match-card-eta">⏱ ETA: {bus.matchedEta} min to {bus.matchedSourceStop?.name}</div>
              ) : bus.eta != null ? (
                <div className="match-card-eta">⏱ ETA: {bus.eta} min to next stop</div>
              ) : null}
            </div>
          ))}
          {results.length > 3 && (
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
              + {results.length - 3} more bus{results.length - 3 > 1 ? "es" : ""} shown in the list below
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
