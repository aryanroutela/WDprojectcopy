import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.navbar}>
      {/* Logo */}
      <Link to="/" style={styles.logo}>
        <span style={styles.logoIcon}>🚍</span>
        <span style={styles.logoText}>RouteFlow</span>
      </Link>

      {/* Desktop Navigation */}
      <div style={styles.links}>
        <Link
          to="/"
          style={{
            ...styles.link,
            ...(isActive("/") && styles.linkActive),
          }}
        >
          Home
        </Link>
        <Link
          to="/about"
          style={{
            ...styles.link,
            ...(isActive("/about") && styles.linkActive),
          }}
        >
          About
        </Link>
        <Link
          to="/contact"
          style={{
            ...styles.link,
            ...(isActive("/contact") && styles.linkActive),
          }}
        >
          Contact
        </Link>
      </div>

      {/* Right Side Icons */}
      <div style={styles.rightSection}>
        <button style={styles.iconButton} title="Search">
          🔍
        </button>
        <button style={styles.userButton}>👤</button>
      </div>

      {/* Mobile Menu Toggle */}
      <button
        style={styles.mobileToggle}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        ☰
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={styles.mobileMenu}>
          <Link to="/" style={styles.mobileLink}>
            Home
          </Link>
          <Link to="/about" style={styles.mobileLink}>
            About
          </Link>
          <Link to="/contact" style={styles.mobileLink}>
            Contact
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

/* ================= INLINE CSS ================= */

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    background:
      "rgba(255, 255, 255, 0.7) linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 250, 245, 0.6) 100%)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255, 122, 24, 0.1)",
    boxShadow: "0 8px 32px rgba(255, 122, 24, 0.1)",
    "@media (maxWidth: 768px)": {
      padding: "12px 16px",
    },
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    cursor: "pointer",
    transition: "transform 0.3s ease",
  },

  logoIcon: {
    fontSize: "28px",
    animation: "float 3s ease-in-out infinite",
  },

  logoText: {
    fontSize: "24px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #ff7a18 0%, #ff9c42 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.5px",
  },

  links: {
    display: "flex",
    gap: "32px",
    "@media (maxWidth: 768px)": {
      display: "none",
    },
  },

  link: {
    textDecoration: "none",
    color: "#333",
    fontWeight: "600",
    fontSize: "15px",
    paddingBottom: "6px",
    borderBottom: "2px solid transparent",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    position: "relative",
  },

  linkActive: {
    color: "#ff7a18",
    borderBottom: "2px solid #ff7a18",
    textShadow: "0 0 12px rgba(255, 122, 24, 0.2)",
  },

  rightSection: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    "@media (maxWidth: 768px)": {
      display: "none",
    },
  },

  iconButton: {
    background: "transparent",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "50%",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  userButton: {
    background: "linear-gradient(135deg, #ff7a18 0%, #ff9c42 100%)",
    border: "none",
    fontSize: "18px",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(255, 122, 24, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  mobileToggle: {
    display: "none",
    background: "linear-gradient(135deg, #ff7a18 0%, #ff9c42 100%)",
    border: "none",
    color: "white",
    fontSize: "24px",
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: "12px",
    "@media (maxWidth: 768px)": {
      display: "block",
    },
  },

  mobileMenu: {
    position: "absolute",
    top: "70px",
    left: 0,
    right: 0,
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    gap: "15px",
    borderBottom: "1px solid rgba(255, 122, 24, 0.1)",
    "@media (minWidth: 769px)": {
      display: "none",
    },
  },

  mobileLink: {
    textDecoration: "none",
    color: "#333",
    fontWeight: "600",
    fontSize: "16px",
    padding: "10px",
    borderRadius: "8px",
    transition: "all 0.3s ease",
  },
};