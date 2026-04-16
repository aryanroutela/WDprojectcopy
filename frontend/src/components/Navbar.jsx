import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        {!isMobile && (
          <div style={styles.navLinks}>
            <Link to="/" style={styles.link}>Home</Link>
            <Link to="/about" style={styles.link}>About</Link>
            <Link to="/contact" style={styles.link}>Contact</Link>

            {token && user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  style={{ ...styles.link, color: "#ffd700", fontWeight: "bold" }}
                >
                  📊 {user.role.toUpperCase()}
                </Link>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={styles.link}>Login</Link>
                <Link to="/signup" style={styles.signupBtn}>Sign Up</Link>
              </>
            )}
          </div>
        )}

        {/* Mobile Toggle */}
        {isMobile && (
          <button style={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
            ☰
          </button>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobile && isOpen && (
        <div style={styles.mobileMenu}>
          <Link to="/" style={styles.mobileLink} onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/about" style={styles.mobileLink} onClick={() => setIsOpen(false)}>About</Link>
          <Link to="/contact" style={styles.mobileLink} onClick={() => setIsOpen(false)}>Contact</Link>

          {token && user ? (
            <>
              <Link to={getDashboardLink()} style={styles.mobileLink} onClick={() => setIsOpen(false)}>
                Dashboard ({user.role})
              </Link>
              <button onClick={handleLogout} style={styles.mobileLogoutBtn}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.mobileLink} onClick={() => setIsOpen(false)}>Login</Link>
              <Link to="/signup" style={styles.mobileLink} onClick={() => setIsOpen(false)}>Sign Up</Link>
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
    background: "linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)",
    color: "white",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 8px rgba(255, 107, 53, 0.2)"
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
    color: "white"
  },
  navLinks: {
    display: "flex",
    gap: "20px",
    alignItems: "center"
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    transition: "opacity 0.3s ease"
  },
  signupBtn: {
    background: "white",
    color: "#ff6b35",
    padding: "8px 16px",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "bold",
    cursor: "pointer",
    border: "none",
    transition: "all 0.3s ease"
  },
  logoutBtn: {
    background: "rgba(255,255,255,0.2)",
    color: "white",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid white",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s ease"
  },
  toggleBtn: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "24px",
    cursor: "pointer"
  },
  mobileMenu: {
    display: "flex",
    flexDirection: "column",
    padding: "15px",
    background: "rgba(0,0,0,0.15)"
  },
  mobileLink: {
    color: "white",
    textDecoration: "none",
    padding: "10px 0",
    fontWeight: "500"
  },
  mobileLogoutBtn: {
    background: "rgba(255,255,255,0.2)",
    color: "white",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid white",
    marginTop: "10px",
    cursor: "pointer",
    fontWeight: "600"
  }
};