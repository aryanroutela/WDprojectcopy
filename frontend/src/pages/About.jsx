import React from "react";
import { Link } from "react-router-dom";

const About = () => {
  const stats = [
    { num: "50K+", label: "Active Users", icon: "👤" },
    { num: "150+", label: "Bus Routes", icon: "🗺️" },
    { num: "2.4M", label: "Minutes Saved", icon: "⏱" },
    { num: "25+", label: "Cities", icon: "🏙️" },
  ];

  const features = [
    { icon: "📍", title: "Real-Time Tracking", desc: "Live GPS updates every 5 seconds for pinpoint accuracy" },
    { icon: "🪑", title: "Seat Availability", desc: "Know how many seats are free before you leave home" },
    { icon: "⚡", title: "Fast & Reliable", desc: "99.8% uptime with sub-second response times" },
    { icon: "📱", title: "Mobile Optimized", desc: "Built mobile-first — works perfectly on any device" },
    { icon: "🌙", title: "Dark Mode", desc: "Easy on the eyes — use it day or night" },
    { icon: "🛡️", title: "Secure & Private", desc: "End-to-end encrypted with zero data selling" },
  ];

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero-section">
        <div className="hero-badge" style={{ margin: "0 auto 24px" }}>
          <span className="hero-badge-dot" />
          Made for Indian Commuters
        </div>
        <h1>
          About <span>RouteFlow</span>
        </h1>
        <p>Making public transport smarter, faster, and easier for every Indian commuter.</p>
        <div className="hero-cta-group">
          <Link to="/signup" className="btn btn-primary btn-lg" id="about-get-started">
            🚀 Get Started
          </Link>
          <Link to="/track" className="btn btn-outline btn-lg">
            🗺️ Try Live Tracking
          </Link>
        </div>
      </section>

      {/* Mission */}
      <section className="section" style={{ background: "var(--surface)" }}>
        <div className="container">
          <div className="content-grid" style={{ alignItems: "center" }}>
            <div>
              <div className="section-eyebrow">Our Mission</div>
              <h2 className="section-title">Ending the Blind Wait at Bus Stops</h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.85, marginBottom: 16 }}>
                We empower commuters by providing accurate, real-time information about
                bus locations, arrival times, and seat availability — all in one app.
              </p>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.85 }}>
                With RouteFlow, waiting blindly at bus stops becomes a thing of the past.
                Plan your journey with confidence, save time, and reduce stress.
              </p>
            </div>
            <div className="card" style={{ textAlign: "center", padding: "40px 32px", background: "linear-gradient(135deg, var(--primary-muted), var(--accent-muted))" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: "var(--text)" }}>Our Vision</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                A world where public transport is as reliable and convenient as a personal vehicle.
                RouteFlow is our step towards that future.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">By the Numbers</div>
            <h2 className="section-title">RouteFlow in Action</h2>
          </div>
          <div className="dash-stats anim-stagger" style={{ padding: 0 }}>
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-card-icon">{s.icon}</div>
                <div className="stat-card-num">{s.num}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" style={{ background: "var(--surface)" }}>
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Why RouteFlow</div>
            <h2 className="section-title">Everything a Commuter Needs</h2>
            <p className="section-subtitle">Designed from the ground up for Indian roads and Indian riders.</p>
          </div>
          <div className="card-grid anim-stagger">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon"><span>{f.icon}</span></div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section text-center">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="section-eyebrow">Team</div>
          <h2 className="section-title">Built with ❤️ in India</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 32 }}>
            RouteFlow is built by a passionate team of engineers and designers dedicated
            to improving urban mobility for every Indian commuter.
          </p>
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 24,
            flexWrap: "wrap",
          }}>
            {["React", "Node.js", "Socket.io", "MongoDB", "Leaflet"].map((tech) => (
              <span key={tech} className="chip">{tech}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section text-center">
        <div className="container">
          <div style={{
            background: "linear-gradient(135deg, var(--primary), var(--accent-light))",
            borderRadius: "var(--radius-xl)",
            padding: "56px 32px",
            color: "#fff",
          }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 900, marginBottom: 12 }}>
              Ready to Transform Your Commute?
            </h2>
            <p style={{ fontSize: 16, opacity: 0.85, marginBottom: 28 }}>
              Join 50,000+ commuters who trust RouteFlow every day.
            </p>
            <Link
              to="/signup"
              id="about-cta-signup"
              className="btn"
              style={{ background: "#fff", color: "var(--primary)", fontWeight: 800, fontSize: 16, padding: "14px 32px" }}
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
