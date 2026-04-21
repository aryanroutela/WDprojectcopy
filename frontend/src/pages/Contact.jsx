import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/contact`, form);
      toast.success("Message sent! We'll get back to you soon 📧");
      setSubmitted(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { icon: "📧", title: "Email", value: "support@routeflow.com" },
    { icon: "📞", title: "Phone", value: "+91 98765 43210" },
    { icon: "📍", title: "Address", value: "Dehradun, Uttarakhand, India" },
    { icon: "🕐", title: "Hours", value: "Mon–Fri · 9 AM – 6 PM IST" },
  ];

  const faqs = [
    { q: "How accurate is the tracking?", a: "Our GPS tracking updates every 5 seconds with 99.8% accuracy across all supported routes." },
    { q: "Is my data secure?", a: "Yes, all data is encrypted end-to-end. We never sell personal information." },
    { q: "Which cities do you cover?", a: "We're expanding across India rapidly. Check the app for your city." },
    { q: "Is RouteFlow free?", a: "Yes, RouteFlow is completely free for all passengers. Always." },
  ];

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero-section">
        <div className="hero-badge" style={{ margin: "0 auto 24px" }}>
          <span className="hero-badge-dot" />
          We typically reply within 24 hours
        </div>
        <h1>
          Get in <span>Touch</span>
        </h1>
        <p>Questions, feedback, or just want to say hi? We'd love to hear from you.</p>
      </section>

      {/* Contact Section */}
      <section className="section">
        <div className="container">
          <div className="content-grid">
            {/* Form */}
            <div className="card" style={{ padding: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: "var(--text)" }}>
                📬 Send us a Message
              </h2>
              <form onSubmit={handleSubmit} id="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-name">Your Name</label>
                    <input
                      id="contact-name"
                      className="form-input"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Rahul Sharma"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-email">Email</label>
                    <input
                      id="contact-email"
                      className="form-input"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-subject">Subject</label>
                  <input
                    id="contact-subject"
                    className="form-input"
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    className="form-input"
                    name="message"
                    rows="5"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us more about your query or feedback..."
                    required
                    style={{ resize: "vertical", minHeight: 120 }}
                  />
                </div>

                <button
                  id="contact-submit"
                  className={`btn btn-block ${submitted ? "btn-success" : "btn-primary"}`}
                  type="submit"
                  disabled={loading}
                  style={{ padding: "13px", fontSize: 15 }}
                >
                  {submitted ? "✅ Message Sent!" : loading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                      <span className="spinner-sm" /> Sending...
                    </span>
                  ) : "Send Message →"}
                </button>
              </form>
            </div>

            {/* Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
                📞 Contact Information
              </h2>
              {contactInfo.map((info) => (
                <div key={info.title} className="info-item">
                  <div className="info-item-icon">{info.icon}</div>
                  <div>
                    <div className="info-item-title">{info.title}</div>
                    <div className="info-item-value">{info.value}</div>
                  </div>
                </div>
              ))}

              <div className="card mt-8" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
                  🌐 Follow RouteFlow
                </h3>
                <div className="chips-row">
                  <a href="#" className="chip" id="social-twitter">🐦 Twitter</a>
                  <a href="#" className="chip" id="social-instagram">📷 Instagram</a>
                  <a href="#" className="chip" id="social-linkedin">💼 LinkedIn</a>
                </div>
              </div>

              {/* Quick Help */}
              <div
                style={{
                  background: "linear-gradient(135deg, var(--primary-muted), var(--accent-muted))",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "20px 22px",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 10 }}>💡</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Quick Help</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  For urgent issues with live tracking, file a complaint directly from the dashboard
                  for faster resolution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" style={{ background: "var(--surface)" }}>
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">FAQ</div>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div className="card-grid anim-stagger" style={{ maxWidth: 860, margin: "0 auto" }}>
            {faqs.map((faq) => (
              <div key={faq.q} className="card" style={{ padding: 22 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "var(--text)", display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--primary)" }}>Q.</span> {faq.q}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.75 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
