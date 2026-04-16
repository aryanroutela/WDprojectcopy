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
      setTimeout(() => setSubmitted(false), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <section className="hero-section">
        <div className="container">
          <h1>Get in <span>Touch</span></h1>
          <p>Have questions? We'd love to hear from you.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="content-grid">
            {/* Form */}
            <div className="card" style={{ padding: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-input" type="text" name="name"
                      value={form.name} onChange={handleChange} placeholder="Your name" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" name="email"
                      value={form.email} onChange={handleChange} placeholder="your@email.com" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" type="text" name="subject"
                    value={form.subject} onChange={handleChange} placeholder="How can we help?" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-input" name="message" rows="4"
                    value={form.message} onChange={handleChange}
                    placeholder="Tell us more..." required
                    style={{ resize: "vertical", minHeight: 100 }} />
                </div>
                <button className={`btn btn-block ${submitted ? "btn-success" : "btn-primary"}`}
                  type="submit" disabled={loading}>
                  {submitted ? "✓ Message Sent!" : loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>

            {/* Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Contact Information</h2>
              <InfoCard icon="📧" title="Email" value="support@routeflow.com" />
              <InfoCard icon="📞" title="Phone" value="+91 98765 43210" />
              <InfoCard icon="📍" title="Address" value="Dehradun, Uttarakhand, India" />
              <InfoCard icon="🕐" title="Hours" value="Mon - Fri: 9 AM - 6 PM IST" />

              <div className="card mt-8" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Follow Us</h3>
                <div className="flex gap-8 flex-wrap">
                  <a href="#" className="chip">🐦 Twitter</a>
                  <a href="#" className="chip">📷 Instagram</a>
                  <a href="#" className="chip">💼 LinkedIn</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" style={{ background: "var(--white)" }}>
        <div className="container">
          <h2 className="section-title text-center">FAQs</h2>
          <div className="card-grid" style={{ maxWidth: 800, margin: "0 auto" }}>
            <FAQ q="How accurate is the tracking?" a="Our GPS tracking updates every 5 seconds with 99.8% accuracy." />
            <FAQ q="Is my data secure?" a="Yes, all data is encrypted. We never store personal info longer than necessary." />
            <FAQ q="Which cities do you cover?" a="We're expanding across India. Check the app for available cities." />
            <FAQ q="Is RouteFlow free?" a="Yes, RouteFlow is completely free for all users." />
          </div>
        </div>
      </section>
    </div>
  );
};

const InfoCard = ({ icon, title, value }) => (
  <div className="card" style={{ display: "flex", gap: 14, alignItems: "center", padding: 16 }}>
    <span style={{ fontSize: 24 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
      <div className="text-sm text-muted">{value}</div>
    </div>
  </div>
);

const FAQ = ({ q, a }) => (
  <div className="card" style={{ padding: 20 }}>
    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{q}</h3>
    <p className="text-sm text-muted" style={{ lineHeight: 1.6 }}>{a}</p>
  </div>
);

export default Contact;
