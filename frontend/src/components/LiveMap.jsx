import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ── Custom Icons ─────────────────────────────────────────────────

const makeSvgIcon = (svg, size = [36, 36], anchor = [18, 18]) =>
  new L.DivIcon({
    html: svg,
    className: "",
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: [0, -22],
  });

const busIconSvg = (color = "#6366f1", isSelected = false) => {
  const size = isSelected ? 44 : 36;
  const glowColor = isSelected
    ? "rgba(99,102,241,0.9)"
    : color === "#10b981"
    ? "rgba(16,185,129,0.6)"
    : color === "#f59e0b"
    ? "rgba(245,158,11,0.6)"
    : "rgba(239,68,68,0.6)";

  return `
  <div style="
    width:${size}px;height:${size}px;border-radius:50%;
    background:${color};
    border:${isSelected ? "3px" : "2px"} solid #fff;
    box-shadow:0 2px 12px ${glowColor};
    display:flex;align-items:center;justify-content:center;
    font-size:${isSelected ? 22 : 18}px;
    animation:busGlow_${isSelected ? "sel" : "def"} 2s ease-in-out infinite alternate;
    transition:all 0.3s;
  ">🚌</div>
  <style>
    @keyframes busGlow_sel {
      from { box-shadow: 0 0 8px ${glowColor}; }
      to   { box-shadow: 0 0 24px ${glowColor}, 0 0 8px rgba(255,255,255,0.3); }
    }
    @keyframes busGlow_def {
      from { box-shadow: 0 2px 6px ${glowColor}; }
      to   { box-shadow: 0 2px 14px ${glowColor}; }
    }
  </style>`;
};

const passedStopIcon = makeSvgIcon(
  `<div style="width:14px;height:14px;border-radius:50%;background:#10b981;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
  [14, 14], [7, 7]
);
const nextStopIcon = makeSvgIcon(
  `<div style="width:20px;height:20px;border-radius:50%;background:#f59e0b;border:3px solid #fff;box-shadow:0 1px 8px rgba(245,158,11,0.7);animation:nextPulse 1.2s infinite"></div>
   <style>@keyframes nextPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}</style>`,
  [20, 20], [10, 10]
);
const upcomingStopIcon = makeSvgIcon(
  `<div style="width:10px;height:10px;border-radius:50%;background:#94a3b8;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.2)"></div>`,
  [10, 10], [5, 5]
);
const userIcon = makeSvgIcon(
  `<div style="width:24px;height:24px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 2px 12px rgba(59,130,246,0.7);display:flex;align-items:center;justify-content:center;font-size:12px">📍</div>`,
  [24, 24], [12, 12]
);

// ── Pan-to-bus helper ────────────────────────────────────────────
const FlyToLocation = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 1 });
  }, [lat, lng, map]);
  return null;
};

// ── Shared popup content styles ──────────────────────────────────
const popupStyle = {
  fontFamily: "Inter, -apple-system, sans-serif",
  minWidth: 180,
  lineHeight: 1.5,
};
const popupTitle = {
  fontWeight: 700,
  fontSize: 15,
  marginBottom: 6,
  color: "#0f172a",
};
const popupRow = {
  fontSize: 12,
  color: "#475569",
  marginBottom: 2,
};
const popupBadge = (bg, color) => ({
  marginTop: 8,
  padding: "2px 10px",
  borderRadius: 99,
  fontSize: 11,
  fontWeight: 700,
  display: "inline-block",
  background: bg,
  color,
});

// ── Main LiveMap component ───────────────────────────────────────
/**
 * LiveMap
 * Props:
 *   buses        – array of bus objects with currentLocation / location
 *   selectedBus  – full bus object to focus/highlight
 *   userLocation – { latitude, longitude } of the current user
 *   followBus    – if true, map pans to selectedBus automatically
 *   height       – CSS string for map height (default "450px")
 */
const LiveMap = ({
  buses = [],
  selectedBus = null,
  userLocation = null,
  followBus = false,
  height = "450px",
}) => {
  const defaultCenter = [12.9716, 77.5946]; // Bangalore fallback

  const activeBuses = buses.filter((b) => {
    const loc = b.currentLocation || b.location;
    return loc?.latitude != null && loc?.longitude != null;
  });

  const routePolyline =
    selectedBus?.checkpoints
      ?.filter((cp) => cp.latitude != null && cp.longitude != null)
      .map((cp) => [cp.latitude, cp.longitude]) || [];

  const mapCenter =
    selectedBus
      ? (() => {
          const loc = selectedBus.currentLocation || selectedBus.location;
          return loc?.latitude ? [loc.latitude, loc.longitude] : defaultCenter;
        })()
      : activeBuses.length > 0
      ? (() => {
          const loc = activeBuses[0].currentLocation || activeBuses[0].location;
          return [loc.latitude, loc.longitude];
        })()
      : defaultCenter;

  const getStopIcon = (status) => {
    if (status === "passed") return passedStopIcon;
    if (status === "next") return nextStopIcon;
    return upcomingStopIcon;
  };

  const getBusColor = (busStatus) => {
    if (busStatus === "green" || busStatus === "active") return "#10b981";
    if (busStatus === "yellow") return "#f59e0b";
    if (busStatus === "red") return "#ef4444";
    return "#6366f1";
  };

  return (
    <div style={{ height, width: "100%" }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        attributionControl={false}
      >
        {/* Light map tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          maxZoom={19}
        />

        {/* Pan to selected bus */}
        {followBus && selectedBus && (() => {
          const loc = selectedBus.currentLocation || selectedBus.location;
          return loc?.latitude ? <FlyToLocation lat={loc.latitude} lng={loc.longitude} /> : null;
        })()}

        {/* User location marker */}
        {userLocation?.latitude && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userIcon}
          >
            <Popup>
              <div style={popupStyle}>
                <div style={popupTitle}>📍 You are here</div>
                <div style={popupRow}>
                  {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route polyline for selected bus */}
        {routePolyline.length >= 2 && (
          <>
            {/* Shadow */}
            <Polyline
              positions={routePolyline}
              pathOptions={{ color: "#000", weight: 7, opacity: 0.08 }}
            />
            {/* Main route */}
            <Polyline
              positions={routePolyline}
              pathOptions={{ color: "#6366f1", weight: 4, opacity: 0.85, dashArray: "10 6" }}
            />
            {/* Active portion (up to current checkpoint) */}
            {selectedBus?.currentCheckpointIdx >= 0 && routePolyline.length > 0 && (
              <Polyline
                positions={routePolyline.slice(0, (selectedBus.currentCheckpointIdx ?? 0) + 1)}
                pathOptions={{ color: "#10b981", weight: 4, opacity: 0.9 }}
              />
            )}
          </>
        )}

        {/* Checkpoints for selected bus (from etaData) */}
        {selectedBus?.etaData?.stopsETA?.map((stop, i) => {
          if (!stop.latitude || !stop.longitude) return null;
          return (
            <Marker
              key={`cp-eta-${i}`}
              position={[stop.latitude, stop.longitude]}
              icon={getStopIcon(stop.status)}
            >
              <Popup>
                <div style={popupStyle}>
                  <div style={popupTitle}>
                    {stop.status === "passed" ? "✅" : stop.status === "next" ? "🚌" : "⚪"}{" "}
                    {stop.name}
                  </div>
                  <div style={popupRow}>Stop #{stop.sequence + 1}</div>
                  {stop.status !== "passed" && stop.eta != null && (
                    <div style={{ ...popupRow, color: "#6366f1", fontWeight: 600 }}>
                      ⏱ ETA: {stop.eta} min
                    </div>
                  )}
                  {stop.distanceKm != null && (
                    <div style={popupRow}>📏 {stop.distanceKm} km away</div>
                  )}
                  <div style={popupBadge(
                    stop.status === "passed" ? "#d1fae5" : stop.status === "next" ? "#fef3c7" : "#f1f5f9",
                    stop.status === "passed" ? "#059669" : stop.status === "next" ? "#d97706" : "#64748b"
                  )}>
                    {stop.status === "passed" ? "Passed" : stop.status === "next" ? "Next Stop" : "Upcoming"}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Fallback: checkpoints when no etaData */}
        {!selectedBus?.etaData && selectedBus?.checkpoints?.map((cp, i) => {
          if (!cp.latitude || !cp.longitude) return null;
          const isPassed = i <= (selectedBus?.currentCheckpointIdx ?? -1);
          const isNext = i === (selectedBus?.currentCheckpointIdx ?? -1) + 1;
          return (
            <Marker
              key={`cp-plain-${i}`}
              position={[cp.latitude, cp.longitude]}
              icon={isPassed ? passedStopIcon : isNext ? nextStopIcon : upcomingStopIcon}
            >
              <Popup>
                <div style={popupStyle}>
                  <div style={popupTitle}>
                    {isPassed ? "✅" : isNext ? "🚌" : "⚪"} {cp.name}
                  </div>
                  <div style={popupRow}>Stop #{cp.sequence + 1}</div>
                  <div style={popupBadge(
                    isPassed ? "#d1fae5" : isNext ? "#fef3c7" : "#f1f5f9",
                    isPassed ? "#059669" : isNext ? "#d97706" : "#64748b"
                  )}>
                    {isPassed ? "Passed" : isNext ? "Next Stop" : "Upcoming"}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* All active bus markers */}
        {activeBuses.map((bus) => {
          const loc = bus.currentLocation || bus.location;
          if (!loc?.latitude) return null;
          const isSelected = selectedBus?._id === bus._id;
          const color = isSelected ? "#6366f1" : getBusColor(bus.busStatus || bus.status);
          const iconSize = isSelected ? [44, 44] : [36, 36];
          const iconAnchor = isSelected ? [22, 22] : [18, 18];

          return (
            <Marker
              key={bus._id}
              position={[loc.latitude, loc.longitude]}
              icon={makeSvgIcon(busIconSvg(color, isSelected), iconSize, iconAnchor)}
            >
              <Popup>
                <div style={popupStyle}>
                  <div style={popupTitle}>🚌 Bus {bus.busNumber}</div>
                  <div style={popupRow}>📍 {bus.routeName}</div>
                  {bus.eta != null && (
                    <div style={{ ...popupRow, color: "#6366f1", fontWeight: 600 }}>
                      ⏱ ETA to next stop: {bus.eta} min
                    </div>
                  )}
                  {bus.nextCheckpointName && (
                    <div style={popupRow}>🎯 Next: {bus.nextCheckpointName}</div>
                  )}
                  {bus.seatsAvailable != null && (
                    <div style={popupRow}>
                      💺 {bus.seatsAvailable}/{bus.capacity} seats available
                    </div>
                  )}
                  {bus.speed != null && (
                    <div style={popupRow}>🏎 {Math.round(bus.speed)} km/h</div>
                  )}
                  <div style={{ ...popupRow, marginTop: 4, fontSize: 11, color: "#94a3b8" }}>
                    🌐 {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
                  </div>
                  <div style={popupBadge(
                    isSelected ? "#eef2ff" : "#f0fdf4",
                    isSelected ? "#4338ca" : "#059669"
                  )}>
                    {isSelected ? "📡 Tracking" : "📍 On Route"}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LiveMap;
