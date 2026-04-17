import React from "react";

/**
 * CheckpointTracker
 * Visual progress bar showing bus's position across all checkpoints.
 * Props:
 *   checkpoints       – array of { name, sequence, latitude, longitude }
 *   currentIdx        – index of the checkpoint bus is near / has passed
 *   currentName       – name of current checkpoint
 *   nextName          – name of next checkpoint
 */
const CheckpointTracker = ({ checkpoints = [], currentIdx = -1, currentName, nextName }) => {
  if (!checkpoints || checkpoints.length === 0) {
    return (
      <div style={{ color: "#94a3b8", fontSize: 13, padding: "12px 0" }}>
        No checkpoints defined for this route.
      </div>
    );
  }

  const total = checkpoints.length;
  const progressPct = currentIdx < 0 ? 0 : Math.min(100, ((currentIdx + 1) / total) * 100);

  const getStatus = (i) => {
    if (i <= currentIdx) return "passed";
    if (i === currentIdx + 1) return "next";
    return "upcoming";
  };

  return (
    <div className="checkpoint-tracker">
      {/* Header */}
      <div className="cp-header">
        <span className="cp-label">Route Progress</span>
        <span className="cp-fraction">{Math.max(0, currentIdx + 1)}/{total} stops</span>
      </div>

      {/* Progress bar */}
      <div className="cp-progress-bar">
        <div
          className="cp-progress-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Stops timeline */}
      <div className="cp-stops">
        {checkpoints.map((cp, i) => {
          const status = getStatus(i);
          return (
            <div key={i} className={`cp-stop cp-stop-${status}`}>
              {/* Connector line before stop (not on first) */}
              {i > 0 && (
                <div className={`cp-connector ${i <= currentIdx + 1 ? "cp-connector-active" : ""}`} />
              )}
              {/* Stop dot */}
              <div className="cp-dot-wrapper">
                <div className={`cp-dot cp-dot-${status}`}>
                  {status === "passed" ? "✓" : status === "next" ? "▶" : i + 1}
                </div>
              </div>
              {/* Stop name */}
              <div className={`cp-name cp-name-${status}`}>{cp.name}</div>
              {/* Badge */}
              {status === "next" && (
                <div className="cp-badge cp-badge-next">Next Stop</div>
              )}
              {i === 0 && currentIdx < 0 && (
                <div className="cp-badge cp-badge-start">Start</div>
              )}
              {i === total - 1 && (
                <div className="cp-badge cp-badge-end">Destination</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current/Next info bar */}
      {(currentName || nextName) && (
        <div className="cp-info-bar">
          {currentName && (
            <div className="cp-info-item">
              <span className="cp-info-icon">📍</span>
              <span>
                <span className="cp-info-lbl">Current: </span>
                <strong>{currentName}</strong>
              </span>
            </div>
          )}
          {nextName && (
            <div className="cp-info-item">
              <span className="cp-info-icon">🎯</span>
              <span>
                <span className="cp-info-lbl">Next: </span>
                <strong>{nextName}</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckpointTracker;
