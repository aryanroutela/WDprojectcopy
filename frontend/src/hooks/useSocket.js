import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:5000";

/**
 * useSocket – creates a single shared socket connection.
 * @param {Object} [opts] – socket.io options
 * @returns {{ socket: Socket|null, connected: boolean }}
 */
const useSocket = (opts = {}) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      ...opts,
    });

    socketRef.current = s;

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", (err) =>
      console.warn("Socket connection error:", err.message)
    );

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { socket: socketRef.current, socketRef, connected };
};

export default useSocket;
