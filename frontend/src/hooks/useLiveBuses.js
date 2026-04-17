import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API;

/**
 * useLiveBuses
 * Manages a live map of buses (keyed by busId) that auto-updates via Socket.IO.
 * Re-exports helper actions for driver interactions.
 */
const useLiveBuses = ({ userId, role = "user" } = {}) => {
  const socketRef = useRef(null);
  const [busMap, setBusMap] = useState({});     // { [busId]: busData }
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Merge a single bus update into the map
  const mergeBus = useCallback((busId, patch) => {
    setBusMap((prev) => ({
      ...prev,
      [busId]: { ...(prev[busId] || {}), ...patch },
    }));
  }, []);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = s;

    s.on("connect", () => {
      setConnected(true);
      // Join tracking room
      s.emit("user:joinTracking", { userId: userId || "guest", role });
      // Request initial snapshot
      s.emit("getBuses");
    });

    s.on("disconnect", () => setConnected(false));

    // ---- Initial snapshot ----
    s.on("buses:list", (buses) => {
      const map = {};
      buses.forEach((b) => { map[b._id] = b; });
      setBusMap(map);
      setLoading(false);
    });

    // ---- Live location update ----
    s.on("bus:locationUpdate", (data) => {
      mergeBus(data.busId, {
        currentLocation: data.coordinates,
        location: data.coordinates,
        speed: data.speed,
        heading: data.heading,
        eta: data.eta,
        etaData: data.etaData,
      });
    });

    // ---- Seat update ----
    s.on("bus:seatsUpdate", (data) => {
      mergeBus(data.busId, {
        seatsAvailable: data.seatsAvailable,
        occupancy: data.occupancy,
        busStatus: data.status,
        status: data.status,
      });
    });

    // ---- Checkpoint reached ----
    s.on("bus:checkpointReached", (data) => {
      mergeBus(data.busId, {
        currentCheckpointIdx: data.checkpointIdx,
        currentCheckpointName: data.checkpointName,
        nextCheckpointName: data.nextStop,
        checkpoints: data.allCheckpoints,
      });
    });

    // ---- Service started/stopped ----
    s.on("bus:serviceStarted", (data) => {
      mergeBus(data.busId, { status: "active", busStatus: "green" });
    });
    s.on("bus:serviceStopped", (data) => {
      mergeBus(data.busId, {
        status: "inactive",
        currentLocation: null,
        location: null,
        eta: null,
      });
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [userId, role, mergeBus]);

  /** Track a specific bus (join bus room for detailed updates) */
  const trackBus = useCallback((busId) => {
    socketRef.current?.emit("user:trackBus", { busId });
  }, []);

  /** Stop tracking a specific bus */
  const untrackBus = useCallback((busId) => {
    socketRef.current?.emit("user:untrackBus", { busId });
  }, []);

  const buses = Object.values(busMap);

  return { buses, busMap, connected, loading, socketRef, trackBus, untrackBus };
};

export default useLiveBuses;
