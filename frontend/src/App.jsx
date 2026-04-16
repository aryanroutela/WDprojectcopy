import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

// Layout wrapper for public pages with Navbar
const PublicLayout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

function App() {
  const isAuthenticated = !!localStorage.getItem("token");
  const user = isAuthenticated ? JSON.parse(localStorage.getItem("user")) : null;

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes - Only accessible when not logged in */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />}
        />

        {/* Public Routes with Navbar layout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

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
      </Routes>

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </BrowserRouter>
  );
}

export default App;