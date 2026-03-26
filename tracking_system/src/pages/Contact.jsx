import React, { useState } from "react";

const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setForm({ name: "", email: "", subject: "", message: "" });
      setSubmitted(false);
    }, 2000);
  }; 

  return (
    <div style={styles.page}>
      {/* Hero Section */}
      <section style={styles.heroSection}>
        <h1 style={styles.title}>Get in Touch</h1>
        <p style={styles.subtitle}>
          Have questions? We'd love to hear from you. Send us a message!
        </p>
      </section>

      {/* Contact Content */}
      <section style={styles.contentSection}>
        <div style={styles.container}>
          <div style={styles.gridLayout}>
            {/* Contact Form */}
            <div style={styles.formContainer}>
              <h2 style={styles.formTitle}>Send us a Message</h2>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name</label>
                  <input
                    style={styles.input}
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    style={styles.input}
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Subject</label>
                  <input
                    style={styles.input}
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Message</label>
                  <textarea
                    style={styles.textarea}
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us more..."
                    required
                  />
                </div>

                <button
                  style={{
                    ...styles.submitButton,
                    ...(submitted && styles.submitButtonSuccess),
                  }}
                  type="submit"
                >
                  {submitted ? "✓ Message Sent!" : "Send Message"}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div style={styles.infoContainer}>
              <h2 style={styles.infoTitle}>Contact Information</h2>

              <ContactInfoCard
                icon="📧"
                title="Email"
              value="support@routeflow.com"
                icon="📞"
                title="Phone"
                value="+1 (555) 123-4567"
              />

              <ContactInfoCard
                icon="📍"
                title="Address"
                value="123 Tech Street, Silicon Valley, CA 94025"
              />

              <ContactInfoCard
                icon="🕐"
                title="Business Hours"
                value="Mon - Fri: 9:00 AM - 6:00 PM PST"
              />

              {/* Social Links */}
              <div style={styles.socialSection}>
                <h3 style={styles.socialTitle}>Follow Us</h3>
                <div style={styles.socialLinksContainer}>
                  <a href="#" style={styles.socialLink}>
                    🐦 Twitter
                  </a>
                  <a href="#" style={styles.socialLink}>
                    f Facebook
                  </a>
                  <a href="#" style={styles.socialLink}>
                    📷 Instagram
                  </a>
                  <a href="#" style={styles.socialLink}>
                    💼 LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={styles.faqSection}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>
          <div style={styles.faqGrid}>
            <FAQCard
              q="How accurate is the real-time tracking?"
              a="Our tracking system updates every 5 seconds with 99.8% accuracy using GPS and crowdsourced data."
            />
            <FAQCard
              q="Is my location data secure?"
              a="Yes, all location data is encrypted and only shared with your consent. We never store personal data longer than necessary."
            />
            <FAQCard
              q="Which cities do you operate in?"
              a="We currently operate in 25+ major cities across North America. Check our app for updates on new cities."
            />
            <FAQCard
              q="How much does RouteFlow cost?"
              a="RouteFlow is completely free to use. We're committed to making public transport accessible to everyone."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.container}>
          <h2 style={styles.ctaTitle}>Ready to Transform Your Commute?</h2>
          <p style={styles.ctaText}>
            Download RouteFlow today and start saving time on your daily commute.
          </p>
          <button style={styles.ctaButton}>Download Now →</button>
        </div>
      </section>
    </div>
  );
};

const ContactInfoCard = ({ icon, title, value }) => (
  <div style={styles.infoCard}>
    <span style={styles.infoIcon}>{icon}</span>
    <div style={styles.infoContent}>
      <h4 style={styles.infoCardTitle}>{title}</h4>
      <p style={styles.infoValue}>{value}</p>
    </div>
  </div>
);

const FAQCard = ({ q, a }) => (
  <div style={styles.faqCard}>
    <h3 style={styles.faqQuestion}>{q}</h3>
    <p style={styles.faqAnswer}>{a}</p>
  </div>
);

export default Contact;

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fff7f0 0%, #fff9f5 50%, #f0f9ff 100%)",
  },

  heroSection: {
    padding: "80px 60px",
    textAlign: "center",
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
    fontSize: "18px",
    color: "#666",
    fontWeight: "500",
    maxWidth: "600px",
    margin: "0 auto",
  },

  contentSection: {
    padding: "60px",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  gridLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "60px",
  },

  formContainer: {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 122, 24, 0.15)",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
  },

  formTitle: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "24px",
    color: "#1a1a1a",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
  },

  label: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#333",
  },

  input: {
    padding: "12px 16px",
    fontSize: "16px",
    border: "1px solid rgba(255, 122, 24, 0.2)",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.8)",
    fontFamily: "inherit",
    transition: "all 0.3s ease",
    outline: "none",
  },

  textarea: {
    padding: "12px 16px",
    fontSize: "16px",
    border: "1px solid rgba(255, 122, 24, 0.2)",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.8)",
    fontFamily: "inherit",
    minHeight: "120px",
    resize: "vertical",
    transition: "all 0.3s ease",
    outline: "none",
  },

  submitButton: {
    padding: "14px 32px",
    fontSize: "16px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #ff7a18 0%, #ff9c42 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 8px 24px rgba(255, 122, 24, 0.3)",
  },

  submitButtonSuccess: {
    background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
  },

  infoContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  infoTitle: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#1a1a1a",
  },

  infoCard: {
    display: "flex",
    gap: "16px",
    padding: "20px",
    background: "rgba(255, 255, 255, 0.6)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 122, 24, 0.15)",
    borderRadius: "16px",
    transition: "all 0.3s ease",
  },

  infoIcon: {
    fontSize: "32px",
    display: "flex",
    alignItems: "flex-start",
  },

  infoContent: {
    display: "flex",
    flexDirection: "column",
  },

  infoCardTitle: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "4px",
    color: "#1a1a1a",
  },

  infoValue: {
    fontSize: "14px",
    color: "#666",
    margin: 0,
  },

  socialSection: {
    marginTop: "24px",
    padding: "24px",
    background: "linear-gradient(135deg, rgba(255, 122, 24, 0.1) 0%, rgba(217, 70, 239, 0.1) 100%)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 122, 24, 0.2)",
  },

  socialTitle: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#1a1a1a",
  },

  socialLinksContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },

  socialLink: {
    padding: "10px 16px",
    background: "rgba(255, 255, 255, 0.8)",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#ff7a18",
    textDecoration: "none",
    transition: "all 0.3s ease",
    textAlign: "center",
    cursor: "pointer",
  },

  faqSection: {
    padding: "80px 60px",
  },

  sectionTitle: {
    fontSize: "42px",
    fontWeight: "800",
    marginBottom: "48px",
    textAlign: "center",
    color: "#1a1a1a",
  },

  faqGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },

  faqCard: {
    background: "rgba(255, 255, 255, 0.6)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 122, 24, 0.15)",
    padding: "28px",
    borderRadius: "16px",
    transition: "all 0.3s ease",
  },

  faqQuestion: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "12px",
    color: "#1a1a1a",
  },

  faqAnswer: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.6",
    margin: 0,
  },

  ctaSection: {
    padding: "80px 60px",
    textAlign: "center",
    background: "linear-gradient(135deg, rgba(255, 122, 24, 0.05) 0%, rgba(217, 70, 239, 0.05) 100%)",
  },

  ctaTitle: {
    fontSize: "42px",
    fontWeight: "800",
    marginBottom: "16px",
    color: "#1a1a1a",
  },

  ctaText: {
    fontSize: "18px",
    color: "#666",
    marginBottom: "32px",
    maxWidth: "600px",
    margin: "0 auto 32px",
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
