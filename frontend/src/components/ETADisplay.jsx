import React from "react";

/**
 * ETADisplay
 * Shows ETA countdown + stop-by-stop progress for a single bus.
 * Props:
 *   etaData   – result from buildStopsETA (stopsETA array + meta)
 *   eta       – raw ETA number to next stop (minutes)
 *   busNumber – for display
 */
const ETADisplay = ({ etaData, eta, busNumber }) => {
  if (!etaData && eta == null) {
    return (
      <div className="eta-empty">
        <span style={{ fontSize: 22 }}>⏳</span>
        <p style={{ margin: "6px 0 0", color: "var(--text-muted, #94a3b8)", fontSize: 13 }}>
          ETA unavailable — bus not broadcasting location
        </p>
      </div>
    );
  }

  const stopsETA = etaData?.stopsETA || [];
  const etaMinutes = etaData?.etaToNextStop ?? eta;

  return (
    <div className="eta-display">
      {/* Primary ETA badge */}
      <div className="eta-badge">
        <div className="eta-badge-time">
          {etaMinutes != null ? `${etaMinutes} min` : "—"}
        </div>
        <div className="eta-badge-label">
          ETA to next stop
          {etaData?.nextCheckpointName && (
            <span className="eta-next-stop"> · {etaData.nextCheckpointName}</span>
          )}
        </div>
      </div>

      {/* Current position info */}
      {etaData?.currentCheckpointName && (
        <div className="eta-current-stop">
          <span className="live-dot" />
          <span>
            Bus last seen near <strong>{etaData.currentCheckpointName}</strong>
          </span>
        </div>
      )}

      {/* Remaining distance */}
      {etaData?.distanceToNext != null && (
        <div className="eta-distance">
          📏 {etaData.distanceToNext} km to next stop
        </div>
      )}

      {/* Stop-by-stop progress timeline */}
      {stopsETA.length > 0 && (
        <div className="eta-timeline">
          <div className="eta-timeline-title">Route Progress</div>
          {stopsETA.map((stop, i) => (
            <div
              key={i}
              className={`eta-stop eta-stop-${stop.status}`}
            >
              <div className="eta-stop-icon">
                {stop.status === "passed"  ? "✅" :
                 stop.status === "next"    ? "🚌" : "⚪"}
              </div>
              <div className="eta-stop-info">
                <div className="eta-stop-name">{stop.name}</div>
                {stop.status !== "passed" && stop.eta != null && (
                  <div className="eta-stop-time">
                    ⏱ {stop.eta} min
                    {stop.distanceKm != null && ` · ${stop.distanceKm} km`}
                  </div>
                )}
                {stop.status === "passed" && (
                  <div className="eta-stop-time eta-passed">Passed</div>
                )}
              </div>
              {stop.status === "next" && (
                <div className="eta-stop-badge-next">Next</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ETADisplay;
