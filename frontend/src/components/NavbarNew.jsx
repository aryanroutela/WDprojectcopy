import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Check if user is authenticated
  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/");
    setIsOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin-dashboard";
    if (user.role === "driver") return "/driver-dashboard";
    return "/user-dashboard";
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          🚍 RouteFlow
        </Link>

        {/* Desktop Navigation */}
        <div style={styles.navLinks}>
          <Link to="/" style={styles.link}>
            Home
          </Link>
          <Link to="/about" style={styles.link}>
            About
          </Link>
          <Link to="/contact" style={styles.link}>
            Contact
          </Link>
          <Link to="/join-beta" style={styles.link}>
            Beta
          </Link>

          {/* Auth Section */}
          {token && user ? (
            <>
              <Link
                to={getDashboardLink()}
                style={{ ...styles.link, color: "#ffd700", fontWeight: "bold" }}
              >
                📊 {user.role.toUpperCase()}
              </Link>
              <button
                onClick={handleLogout}
                style={styles.logoutBtn}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>
                Login
              </Link>
              <Link to="/signup" style={styles.signupBtn}>
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          style={styles.toggleBtn}
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div style={styles.mobileMenu}>
          <Link to="/" style={styles.mobileLink} onClick={() => setIsOpen(false)}>
            Home
          </Link>
          <Link to="/about" style={styles.mobileLink} onClick={() => setIsOpen(false)}>
            About
          </Link>
          <Link to="/contact" style={styles.mobileLink} onClick={() => setIsOpen(false)}>
            Contact
          </Link>
          <Link to="/join-beta" style={styles.mobileLink} onClick={() => setIsOpen(false)}>
            Beta
          </Link>
          
          {token && user ? (
            <>
              <Link to={getDashboardLink()} style={styles.mobileLink} onClick={() => setIsOpen(false)}>
                Dashboard ({user.role})
              </Link>
              <button
                onClick={handleLogout}
                style={styles.mobileLogoutBtn}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.mobileLink} onClick={() => setIsOpen(false)}>
                Login
              </Link>
              <Link to="/signup" style={styles.mobileLink} onClick={() => setIsOpen(false)}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

const styles = {
  navbar: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    position: "sticky",
    top: 0,
    zIndex: 100
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "70px"
  },
  logo: {
    fontSize: "24px",
    fontWeight: "bold",
    textDecoration: "none",
    color: "white",
    display: "flex",
    alignItems: "center"
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap"
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    transition: "opacity 0.3s",
    padding: "5px 10px"
  },
  signupBtn: {
    background: "white",
    color: "#667eea",
    padding: "8px 20px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.3s"
  },
  logoutBtn: {
    background: "rgba(255, 255, 255, 0.2)",
    color: "white",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid white",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.3s"
  },
  toggleBtn: {
    display: "none",
    background: "none",
    border: "none",
    color: "white",
    fontSize: "24px",
    cursor: "pointer"
  },
  mobileMenu: {
    display: "none",
    flexDirection: "column",
    background: "rgba(0, 0, 0, 0.1)",
    padding: "10px 20px",
    maxHeight: "400px",
    overflowY: "auto"
  },
  mobileLink: {
    color: "white",
    textDecoration: "none",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
    display: "block"
  },
  mobileLogoutBtn: {
    background: "rgba(255, 255, 255, 0.2)",
    color: "white",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid white",
    cursor: "pointer",
    fontWeight: "600",
    marginTop: "10px",
    width: "100%"
  }
};

// Apply responsive styles
if (typeof window !== "undefined" && window.innerWidth <= 768) {
  styles.toggleBtn.display = "block";
  styles.navLinks.display = "none";
  styles.mobileMenu.display = "flex";
}
