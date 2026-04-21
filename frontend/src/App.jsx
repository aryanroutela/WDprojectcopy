import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Context
import { useAuth } from "./context/AuthContext";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

// Pages - Auth
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Pages - Public
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";

// Pages - Dashboards
import AdminDashboard from "./pages/AdminDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import UserDashboard from "./pages/UserDashboard";
import LiveTrackingPage from "./pages/LiveTrackingPage";

// Global Layout wrapper so Navbar is visible everywhere
const GlobalLayout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

// App-level full-screen loader
const AppLoader = () => (
  <div style={{
    position: "fixed", inset: 0,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: "var(--bg)",
    gap: 16, zIndex: 9999,
  }}>
    <div style={{
      width: 52, height: 52,
      background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
      borderRadius: 14,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 26,
      boxShadow: "0 8px 24px var(--primary-glow)",
      animation: "pulse-dot 1.5s infinite",
    }}>
      🚍
    </div>
    <p style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>
      Loading RouteFlow...
    </p>
  </div>
);

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AppLoader />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GlobalLayout />}>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/track" element={<LiveTrackingPage />} />

          {/* Auth Routes - Only accessible when not logged in */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />}
          />

          {/* Admin Dashboard - Protected */}
          <Route
            path="/admin-dashboard"
            element={<ProtectedRoute component={AdminDashboard} requiredRole="admin" />}
          />

          {/* Driver Dashboard - Protected */}
          <Route
            path="/driver-dashboard"
            element={<ProtectedRoute component={DriverDashboard} requiredRole="driver" />}
          />

          {/* User Dashboard - Protected */}
          <Route
            path="/user-dashboard"
            element={<ProtectedRoute component={UserDashboard} requiredRole="user" />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        style={{ zIndex: 9999 }}
      />
    </BrowserRouter>
  );
}

export default App;