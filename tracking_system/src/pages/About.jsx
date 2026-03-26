import React from "react";

const About = () => {
  return (
    <div style={styles.page}>
      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroContent}>
          <h1 style={styles.title}>About RouteFlow</h1>
          <p style={styles.subtitle}>
            Revolutionizing urban transportation with real-time bus tracking
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section style={styles.section}>
        <div style={styles.container}>
          <div style={styles.twoColumn}>
            <div>
              <h2 style={styles.sectionTitle}>Our Mission</h2>
              <p style={styles.text}>
                We empower commuters by providing accurate, real-time information about
                bus locations, arrival times, and seat availability. Our mission is to
                make public transportation smarter, faster, and more user-friendly.
              </p>
              <p style={styles.text}>
                With RouteFlow, waiting for a bus becomes a thing of the past. Know
                exactly when your bus arrives and plan your day accordingly.
              </p>
            </div>
            <div style={styles.featureBox}>
              <span style={styles.featureIcon}>🎯</span>
              <h3 style={styles.featureTitle}>Our Vision</h3>
              <p style={styles.featureText}>
                To create a world where public transportation is as reliable and
                convenient as personal vehicles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Why Choose RouteFlow?</h2>
          <div style={styles.featuresGrid}>
            <FeatureCard
              icon="📍"
              title="Real-Time Tracking"
              description="Get live updates on bus locations and estimated arrival times"
            />
            <FeatureCard
              icon="🪑"
              title="Seat Availability"
              description="Know how many seats are available before boarding"
            />
            <FeatureCard
              icon="⚡"
              title="Fast & Reliable"
              description="99.8% uptime with millisecond-precision tracking"
            />
            <FeatureCard
              icon="📱"
              title="Mobile Optimized"
              description="Works seamlessly on all devices and screen sizes"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={styles.statsSection}>
        <div style={styles.container}>
          <div style={styles.statsGrid}>
            <StatBox number="50K+" label="Active Users" />
            <StatBox number="150+" label="Bus Routes" />
            <StatBox number="2.4M" label="Minutes Saved" />
            <StatBox number="25+" label="Cities" />
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section style={styles.section}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Our Team</h2>
          <p style={styles.text}>
            Built by a passionate team of engineers and designers dedicated to
            improving urban mobility for everyone.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.container}>
          <h2 style={styles.ctaTitle}>Ready to Transform Your Commute?</h2>
          <button style={styles.ctaButton}>
            Get Started Now →
          </button>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div style={styles.featureCard}>
    <span style={styles.cardIcon}>{icon}</span>
    <h3 style={styles.cardTitle}>{title}</h3>
    <p style={styles.cardDescription}>{description}</p>
  </div>
);

const StatBox = ({ number, label }) => (
  <div style={styles.statBox}>
    <div style={styles.statNumber}>{number}</div>
    <div style={styles.statLabel}>{label}</div>
  </div>
);

export default About;

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fff7f0 0%, #fff9f5 50%, #f0f9ff 100%)",
  },

  heroSection: {
    padding: "100px 60px",
    textAlign: "center",
  },

  heroContent: {
    maxWidth: "800px",
    margin: "0 auto",
  },

  title: {
    fontSize: "56px",
    fontWeight: "800",
    marginBottom: "16px",
    background: "linear-gradient(135deg, #ff7a18 0%, #d946ef 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },

  subtitle: {
    fontSize: "20px",
    color: "#666",
    fontWeight: "500",
    lineHeight: "1.6",
  },

  section: {
    padding: "80px 60px",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  twoColumn: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "60px",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: "42px",
    fontWeight: "800",
    marginBottom: "24px",
    color: "#1a1a1a",
  },

  text: {
    fontSize: "16px",
    color: "#666",
    lineHeight: "1.8",
    marginBottom: "16px",
  },

  featureBox: {
    background: "linear-gradient(135deg, rgba(255, 122, 24, 0.1) 0%, rgba(217, 70, 239, 0.1) 100%)",
    padding: "40px",
    borderRadius: "20px",
    border: "1px solid rgba(255, 122, 24, 0.2)",
    textAlign: "center",
  },

  featureIcon: {
    fontSize: "60px",
    display: "block",
    marginBottom: "20px",
  },

  featureTitle: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "12px",
    color: "#1a1a1a",
  },

  featureText: {
    fontSize: "16px",
    color: "#666",
    lineHeight: "1.6",
  },

  featuresSection: {
    padding: "80px 60px",
    background: "rgba(255, 255, 255, 0.5)",
  },

  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px",
  },

  featureCard: {
    background: "rgba(255, 255, 255, 0.6)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 122, 24, 0.15)",
    padding: "32px 24px",
    borderRadius: "16px",
    textAlign: "center",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },

  cardIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "16px",
  },

  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "12px",
    color: "#1a1a1a",
  },

  cardDescription: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.6",
  },

  statsSection: {
    padding: "80px 60px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "30px",
  },

  statBox: {
    textAlign: "center",
    padding: "40px 20px",
    background: "linear-gradient(135deg, rgba(255, 122, 24, 0.1) 0%, rgba(217, 70, 239, 0.1) 100%)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 122, 24, 0.2)",
  },

  statNumber: {
    fontSize: "42px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #ff7a18 0%, #ff9c42 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: "8px",
  },

  statLabel: {
    fontSize: "16px",
    color: "#666",
    fontWeight: "600",
  },

  ctaSection: {
    padding: "80px 60px",
    textAlign: "center",
  },

  ctaTitle: {
    fontSize: "42px",
    fontWeight: "800",
    marginBottom: "32px",
    color: "#1a1a1a",
  },

  ctaButton: {
    padding: "16px 40px",
    fontSize: "16px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #ff7a18 0%, #ff9c42 100%)",
    color: "white",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    boxShadow: "0 12px 32px rgba(255, 122, 24, 0.4)",
    transition: "all 0.3s ease",
  },
};
