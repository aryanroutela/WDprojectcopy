import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const Navbar = () => {
  const navigate = useNavigate();
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

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" onClick={close}>
          🚍 RouteFlow
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-links">
          <Link to="/">{t('nav.home')}</Link>
          <Link to="/about">{t('nav.about')}</Link>
          <Link to="/contact">{t('nav.contact')}</Link>

          <button onClick={toggleTheme} style={{ fontSize: "16px", padding: '8px', cursor: 'pointer' }}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          
          <button onClick={toggleLanguage} style={{ fontSize: "14px", fontWeight: "bold", padding: '8px', cursor: 'pointer' }}>
             {language === 'en' ? 'हिंदी' : 'EN'}
          </button>

          {token && user ? (
            <>
              <Link to={getDashboardLink()} className="nav-role">
                {user.role === "admin" ? "🛡️" : user.role === "driver" ? "🚌" : "👤"}{" "}
                {t('nav.dashboard')}
              </Link>
              <button className="nav-btn-logout" onClick={handleLogout}>
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login">{t('nav.login')}</Link>
              <Link to="/signup" className="nav-btn-primary">
                {t('nav.signup')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="mobile-actions">
          <button className="nav-toggle" onClick={toggleTheme} style={{ display: 'none', padding: '6px' }}>
             {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button className="nav-toggle" onClick={toggleLanguage} style={{ display: 'none', fontSize: "12px", fontWeight: "bold" }}>
             {language === 'en' ? 'हिं' : 'EN'}
          </button>
          
          {/* Note: I added simple display none logic above which can be overridden via css for pure mobile. 
              Let's ensure toggle button is purely mobile via simple inline inline style */}
          
          <button className="nav-toggle" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`nav-mobile ${isOpen ? "open" : ""}`}>
        {/* We place toggles here for clear mobile UX */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', background: 'var(--primary-bg)', borderRadius: 'var(--radius)', marginBottom: 8, marginTop: 8 }}>
           <button onClick={toggleTheme} style={{ flex: 1, textAlign: 'center', padding: '8px', border: '1px solid var(--border)' }}>
             {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
           </button>
           <button onClick={toggleLanguage} style={{ flex: 1, textAlign: 'center', padding: '8px', border: '1px solid var(--border)', fontWeight: 'bold' }}>
             {language === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
           </button>
        </div>

        <Link to="/" onClick={close}>{t('nav.home')}</Link>
        <Link to="/about" onClick={close}>{t('nav.about')}</Link>
        <Link to="/contact" onClick={close}>{t('nav.contact')}</Link>

        {token && user ? (
          <>
            <Link to={getDashboardLink()} onClick={close}>
              📊 {t('nav.dashboard')} ({user.role})
            </Link>
            <button onClick={handleLogout} style={{ color: "var(--red)" }}>
              {t('nav.logout')}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={close}>{t('nav.login')}</Link>
            <Link to="/signup" onClick={close} style={{ color: "var(--primary)", fontWeight: 600 }}>
              {t('nav.signup')}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;