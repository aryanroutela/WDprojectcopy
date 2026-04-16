import React from "react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="page">
      {/* Hero */}
      <section className="hero-section">
        <div className="container">
          <h1>About <span>RouteFlow</span></h1>
          <p>Making public transport smarter, faster, and easier for everyone.</p>
        </div>
      </section>

      {/* Mission */}
      <section className="section" style={{ background: "var(--white)" }}>
        <div className="container">
          <div className="content-grid" style={{ alignItems: "center" }}>
            <div>
              <h2 className="section-title">Our Mission</h2>
              <p className="text-muted" style={{ lineHeight: 1.8, marginBottom: 12 }}>
                We empower commuters by providing accurate, real-time information about
                bus locations, arrival times, and seat availability.
              </p>
              <p className="text-muted" style={{ lineHeight: 1.8 }}>
                With RouteFlow, waiting blindly at bus stops becomes a thing of the past.
                Plan your journey with confidence.
              </p>
            </div>
            <div className="card" style={{ textAlign: "center", padding: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <h3 className="font-bold mb-8">Our Vision</h3>
              <p className="text-sm text-muted">
                A world where public transport is as reliable and convenient as personal vehicles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <h2 className="section-title text-center">Why Choose RouteFlow?</h2>
          <div className="card-grid" style={{ maxWidth: 900, margin: "0 auto" }}>
            <FeatureItem icon="📍" title="Real-Time Tracking" desc="Live GPS updates every 5 seconds" />
            <FeatureItem icon="🪑" title="Seat Availability" desc="Know how many seats are free before boarding" />
            <FeatureItem icon="⚡" title="Fast & Reliable" desc="99.8% uptime with millisecond-precision" />
            <FeatureItem icon="📱" title="Mobile Optimized" desc="Works seamlessly on all devices" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section" style={{ background: "var(--white)" }}>
        <div className="container">
          <div className="dash-stats" style={{ maxWidth: 700, margin: "0 auto" }}>
            <StatItem num="50K+" label="Active Users" />
            <StatItem num="150+" label="Bus Routes" />
            <StatItem num="2.4M" label="Minutes Saved" />
            <StatItem num="25+" label="Cities" />
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section text-center">
        <div className="container">
          <h2 className="section-title">Built with ❤️</h2>
          <p className="text-muted">
            By a passionate team dedicated to improving urban mobility for everyone.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="section text-center" style={{ background: "var(--primary-bg)" }}>
        <div className="container">
          <h2 className="section-title">Ready to Transform Your Commute?</h2>
          <Link to="/signup" className="btn btn-primary mt-8">
            Get Started →
          </Link>
        </div>
      </section>
    </div>
  );
};

const FeatureItem = ({ icon, title, desc }) => (
  <div className="card feature-card">
    <div className="feature-icon">{icon}</div>
    <div className="feature-title">{title}</div>
    <div className="feature-desc">{desc}</div>
  </div>
);

const StatItem = ({ num, label }) => (
  <div className="stat-card">
    <div className="stat-card-num">{num}</div>
    <div className="stat-card-label">{label}</div>
  </div>
);

export default About;
