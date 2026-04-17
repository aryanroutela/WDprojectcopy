import React, { useEffect, useRef } from "react";
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

// ── Custom Icons ────────────────────────────────────────────────

const makeSvgIcon = (svg, size = [36, 36], anchor = [18, 18]) =>
  new L.DivIcon({
    html: svg,
    className: "",
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: [0, -20],
  });

const busIconSvg = (color = "#6366f1") => `
  <div style="
    width:36px;height:36px;border-radius:50%;
    background:${color};border:3px solid #fff;
    box-shadow:0 2px 10px rgba(0,0,0,0.4);
    display:flex;align-items:center;justify-content:center;
    font-size:18px;line-height:36px;
    animation: busGlow 2s ease-in-out infinite alternate;
  ">🚌</div>
  <style>
    @keyframes busGlow {
      from { box-shadow: 0 0 6px rgba(99,102,241,0.4); }
      to   { box-shadow: 0 0 18px rgba(99,102,241,0.9); }
    }
  </style>`;

const passedStopIcon = makeSvgIcon(
  `<div style="width:14px;height:14px;border-radius:50%;background:#10b981;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
  [14, 14], [7, 7]
);
const nextStopIcon = makeSvgIcon(
  `<div style="width:18px;height:18px;border-radius:50%;background:#f59e0b;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.4);animation:pulse 1.2s infinite"></div>
   <style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}</style>`,
  [18, 18], [9, 9]
);
const upcomingStopIcon = makeSvgIcon(
  `<div style="width:12px;height:12px;border-radius:50%;background:#94a3b8;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.2)"></div>`,
  [12, 12], [6, 6]
);
const userIcon = makeSvgIcon(
  `<div style="width:22px;height:22px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 2px 10px rgba(59,130,246,0.6);display:flex;align-items:center;justify-content:center;font-size:11px">📍</div>`,
  [22, 22], [11, 11]
);

// ── Pan to bus helper ────────────────────────────────────────────
const FlyToLocation = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 1 });
  }, [lat, lng, map]);
  return null;
};

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
  // Default center: India (Bangalore) — will shift after real data arrives
  const defaultCenter = [12.9716, 77.5946];

  // Get all buses that have a valid location
  const activeBuses = buses.filter((b) => {
    const loc = b.currentLocation || b.location;
    return loc?.latitude != null && loc?.longitude != null;
  });

  // Build route polyline from selected bus checkpoints
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
    <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.18)", height }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
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
              <div style={{ fontFamily: "Inter, sans-serif", minWidth: 120 }}>
                <strong>📍 You are here</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route polyline for selected bus */}
        {routePolyline.length >= 2 && (
          <>
            {/* Shadow line */}
            <Polyline
              positions={routePolyline}
              pathOptions={{ color: "#000", weight: 6, opacity: 0.12, dashArray: null }}
            />
            {/* Actual route line */}
            <Polyline
              positions={routePolyline}
              pathOptions={{ color: "#6366f1", weight: 4, opacity: 0.85, dashArray: "8 4" }}
            />
          </>
        )}

        {/* Checkpoints for selected bus */}
        {selectedBus?.etaData?.stopsETA?.map((stop, i) => {
          if (!stop.latitude || !stop.longitude) return null;
          return (
            <Marker
              key={`cp-${i}`}
              position={[stop.latitude, stop.longitude]}
              icon={getStopIcon(stop.status)}
            >
              <Popup>
                <div style={{ fontFamily: "Inter, sans-serif", minWidth: 150 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    {stop.status === "passed" ? "✅" : stop.status === "next" ? "🟡" : "⚪"}{" "}
                    {stop.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Stop #{stop.sequence + 1}
                    {stop.status !== "passed" && stop.eta != null && (
                      <> &nbsp;·&nbsp; ETA: <strong>{stop.eta} min</strong></>
                    )}
                    {stop.status !== "passed" && stop.distanceKm != null && (
                      <> &nbsp;·&nbsp; {stop.distanceKm} km</>
                    )}
                  </div>
                  <div style={{
                    marginTop: 6, padding: "2px 8px", borderRadius: 99, fontSize: 11,
                    display: "inline-block",
                    background: stop.status === "passed" ? "#d1fae5"
                      : stop.status === "next" ? "#fef3c7" : "#f1f5f9",
                    color: stop.status === "passed" ? "#059669"
                      : stop.status === "next" ? "#d97706" : "#64748b",
                  }}>
                    {stop.status === "passed" ? "Passed" : stop.status === "next" ? "Next Stop" : "Upcoming"}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Checkpoints for selected bus (when etaData not available but checkpoints exist) */}
        {!selectedBus?.etaData && selectedBus?.checkpoints?.map((cp, i) => {
          if (!cp.latitude || !cp.longitude) return null;
          return (
            <Marker key={`cp-plain-${i}`} position={[cp.latitude, cp.longitude]} icon={upcomingStopIcon}>
              <Popup>
                <div style={{ fontFamily: "Inter, sans-serif" }}>
                  <strong>{cp.name}</strong>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Stop #{cp.sequence + 1}</div>
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

          return (
            <Marker
              key={bus._id}
              position={[loc.latitude, loc.longitude]}
              icon={makeSvgIcon(busIconSvg(color), [36, 36], [18, 18])}
            >
              <Popup>
                <div style={{ fontFamily: "Inter, sans-serif", minWidth: 180 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                    🚌 Bus {bus.busNumber}
                  </div>
                  <div style={{ fontSize: 13, color: "#334155", marginBottom: 4 }}>
                    📍 {bus.routeName}
                  </div>
                  {bus.eta != null && (
                    <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600 }}>
                      ⏱ ETA to next stop: {bus.eta} min
                    </div>
                  )}
                  {bus.nextCheckpointName && (
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      Next: {bus.nextCheckpointName}
                    </div>
                  )}
                  {bus.seatsAvailable != null && (
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      💺 {bus.seatsAvailable}/{bus.capacity} seats
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    🌐 {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
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
