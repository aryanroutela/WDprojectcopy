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
 * Props:
 *   onResults(buses)  – callback fired with matching bus results
 *   allBuses          – fallback array to reset to
 */
const SmartSearch = ({ onResults, allBuses = [] }) => {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleSearch = async () => {
    const src = source.trim();
    if (!src) { toast.error("Please enter a source stop"); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ source: src });
      if (destination.trim()) params.append("destination", destination.trim());

      const res = await axios.get(`${API}/api/routes/search?${params}`);
      const found = res.data.buses || [];
      setResults(found);
      onResults(found);

      if (found.length === 0) {
        toast.info("No buses found passing through that stop");
      } else {
        toast.success(`Found ${found.length} bus${found.length > 1 ? "es" : ""} passing through "${src}"`);
      }
    } catch (err) {
      toast.error("Search failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSource("");
    setDestination("");
    setResults(null);
    onResults(allBuses);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="smart-search">
      <div className="smart-search-header">
        <span className="smart-search-icon">🔍</span>
        <div>
          <div className="smart-search-title">Smart Route Search</div>
          <div className="smart-search-sub">
            Find buses passing through <em>any</em> stop — not just the starting point
          </div>
        </div>
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
          ) : (
            <> 🚌 Find Buses</>
          )}
        </button>
        {results !== null && (
          <button className="btn btn-outline btn-sm" onClick={handleClear}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Results summary */}
      {results !== null && (
        <div className="smart-search-results-info">
          {results.length > 0 ? (
            <>
              <span className="results-count-badge">{results.length}</span>
              {" "}bus{results.length > 1 ? "es" : ""} found passing through
              <strong> "{source}"</strong>
              {destination && <> → <strong>"{destination}"</strong></>}
            </>
          ) : (
            <span style={{ color: "#ef4444" }}>
              ❌ No buses found for that route. Try a different stop name.
            </span>
          )}
        </div>
      )}

      {/* Matched stop info cards */}
      {results?.length > 0 && (
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

              {bus.eta != null && (
                <div className="match-card-eta">⏱ ETA: {bus.eta} min to next stop</div>
              )}
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
