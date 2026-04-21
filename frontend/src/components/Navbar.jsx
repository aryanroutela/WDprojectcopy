import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { token, user, logoutAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  const handleLogout = () => {
    logoutAuth();
    toast.success(language === "en" ? "Logged out successfully" : "सफलतापूर्वक लॉग आउट किया गया");
    navigate("/");
    setIsOpen(false);
  };

  const close = () => setIsOpen(false);

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin-dashboard";
    if (user.role === "driver") return "/driver-dashboard";
    return "/user-dashboard";
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ── Top Navbar ─────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo" onClick={close}>
            <div className="navbar-logo-icon">🚍</div>
            RouteFlow
          </Link>

          {/* Desktop Nav Links */}
          <div className="navbar-links">
            <Link to="/" style={isActive("/") ? { color: "var(--primary)", fontWeight: 700 } : {}}>
              {t("nav.home")}
            </Link>
            <Link to="/about" style={isActive("/about") ? { color: "var(--primary)", fontWeight: 700 } : {}}>
              {t("nav.about")}
            </Link>
            <Link to="/contact" style={isActive("/contact") ? { color: "var(--primary)", fontWeight: 700 } : {}}>
              {t("nav.contact")}
            </Link>
            <Link to="/track" className="navbar-link-live">
              🗺️ Live Track
            </Link>

            {token && user ? (
              <>
                <Link to={getDashboardLink()} className="nav-role">
                  {user.role === "admin" ? "🛡️" : user.role === "driver" ? "🚌" : "👤"}{" "}
                  {t("nav.dashboard")}
                </Link>
                <button className="btn btn-sm nav-btn-logout" onClick={handleLogout}>
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/login">{t("nav.login")}</Link>
                <Link to="/signup" className="nav-btn-primary">
                  {t("nav.signup")}
                </Link>
              </>
            )}
          </div>

          {/* Right Side Controls */}
          <div className="navbar-actions">
            {/* Theme Toggle */}
            <button
              className="icon-btn"
              onClick={toggleTheme}
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
              aria-label="Toggle theme"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>

            {/* Language Toggle */}
            <button
              className="icon-btn"
              onClick={toggleLanguage}
              title="Toggle Language"
              aria-label="Toggle language"
              style={{ fontSize: 12, fontWeight: 700 }}
            >
              {language === "en" ? "हिं" : "EN"}
            </button>

            {/* Hamburger */}
            <button
              className="nav-toggle"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle mobile menu"
            >
              {isOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="nav-mobile open">
            <div className="nav-mobile-toggles">
              <button className="nav-mobile-toggle-btn" onClick={toggleTheme}>
                {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
              </button>
              <button className="nav-mobile-toggle-btn" onClick={toggleLanguage} style={{ fontWeight: 700 }}>
                {language === "en" ? "हिंदी" : "English"}
              </button>
            </div>

            <Link to="/" onClick={close}>🏠 {t("nav.home")}</Link>
            <Link to="/about" onClick={close}>ℹ️ {t("nav.about")}</Link>
            <Link to="/contact" onClick={close}>📞 {t("nav.contact")}</Link>
            <Link to="/track" onClick={close} style={{ color: "var(--primary)", fontWeight: 600 }}>
              🗺️ Live Track
            </Link>

            {token && user ? (
              <>
                <Link to={getDashboardLink()} onClick={close}>
                  📊 {t("nav.dashboard")} ({user.role})
                </Link>
                <button onClick={handleLogout} style={{ color: "var(--red)" }}>
                  🚪 {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={close}>🔑 {t("nav.login")}</Link>
                <Link to="/signup" onClick={close} style={{ color: "var(--primary)", fontWeight: 700 }}>
                  ✨ {t("nav.signup")}
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ── Bottom Navigation (Mobile Only) ───────────────────── */}
      <nav className="bottom-nav" role="navigation" aria-label="Mobile navigation">
        <Link
          to="/"
          id="bottom-nav-home"
          className={`bottom-nav-item ${isActive("/") ? "active" : ""}`}
        >
          <div className="bottom-nav-icon">🏠</div>
          Home
        </Link>

        <Link
          to="/track"
          id="bottom-nav-track"
          className={`bottom-nav-item ${isActive("/track") ? "active" : ""}`}
        >
          <div className="bottom-nav-icon">🗺️</div>
          Track
        </Link>

        {token && user ? (
          <Link
            to={getDashboardLink()}
            id="bottom-nav-dashboard"
            className={`bottom-nav-item ${
              location.pathname.includes("dashboard") ? "active" : ""
            }`}
          >
            <div className="bottom-nav-icon">
              {user.role === "admin" ? "🛡️" : user.role === "driver" ? "🚌" : "📊"}
            </div>
            {user.role === "admin" ? "Admin" : user.role === "driver" ? "Driver" : "My Bus"}
          </Link>
        ) : (
          <Link
            to="/login"
            id="bottom-nav-login"
            className={`bottom-nav-item ${isActive("/login") ? "active" : ""}`}
          >
            <div className="bottom-nav-icon">🔑</div>
            Login
          </Link>
        )}

        <Link
          to="/contact"
          id="bottom-nav-contact"
          className={`bottom-nav-item ${isActive("/contact") ? "active" : ""}`}
        >
          <div className="bottom-nav-icon">✉️</div>
          Support
        </Link>
      </nav>
    </>
  );
};

export default Navbar;