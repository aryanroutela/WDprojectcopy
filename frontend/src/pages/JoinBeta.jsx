import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const JoinBeta = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    school: "",
    grade: "",
    referral: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.school || !form.grade) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/preregister/preregister`,
        form
      );
      toast.success("You're on the waitlist 🚀");
      setSubmitted(true);
      setForm({ firstName: "", lastName: "", email: "", school: "", grade: "", referral: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    { icon: "⚡", text: "Early access before public launch" },
    { icon: "🎁", text: "Exclusive beta tester badge" },
    { icon: "🗺️", text: "Real-time tracking from day one" },
    { icon: "💬", text: "Direct feedback channel to the team" },
  ];

  return (
    <div className="page">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-badge" style={{ margin: "0 auto 24px" }}>
          <span className="hero-badge-dot" />
          Limited beta spots available
        </div>
        <h1>
          Join the <span>RouteFlow</span> Beta
        </h1>
        <p>
          Get early access to real-time bus tracking and smarter commuting — before anyone else.
        </p>
      </section>

      {/* ── Body ─────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="content-grid" style={{ alignItems: "start" }}>

            {/* ── Form Card ──────────────────────────────────── */}
            <div className="card" style={{ padding: "32px 28px" }}>
              {submitted ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🚀</div>
                  <h2 style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 26, fontWeight: 900,
                    color: "var(--text)", marginBottom: 10,
                  }}>
                    You're In!
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 24 }}>
                    We'll email you when it's your turn. Get ready to transform your commute 🎉
                  </p>
                  <Link to="/" className="btn btn-primary">
                    Back to Home
                  </Link>
                </div>
              ) : (
                <>
                  <h2 style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 22, fontWeight: 800,
                    marginBottom: 6, color: "var(--text)",
                  }}>
                    Request Beta Access
                  </h2>
                  <p className="text-sm text-muted" style={{ marginBottom: 24 }}>
                    All fields marked * are required.
                  </p>

                  <form onSubmit={handleSubmit} id="beta-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="beta-firstname">First Name *</label>
                        <input
                          id="beta-firstname"
                          className="form-input"
                          type="text"
                          name="firstName"
                          value={form.firstName}
                          onChange={handleChange}
                          placeholder="Rahul"
                          required
                          autoFocus
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="beta-lastname">Last Name</label>
                        <input
                          id="beta-lastname"
                          className="form-input"
                          type="text"
                          name="lastName"
                          value={form.lastName}
                          onChange={handleChange}
                          placeholder="Sharma"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="beta-email">Email Address *</label>
                      <input
                        id="beta-email"
                        className="form-input"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="rahul@email.com"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="beta-school">School / Institution *</label>
                        <input
                          id="beta-school"
                          className="form-input"
                          type="text"
                          name="school"
                          value={form.school}
                          onChange={handleChange}
                          placeholder="DIT University"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="beta-grade">Grade / Course *</label>
                        <input
                          id="beta-grade"
                          className="form-input"
                          type="text"
                          name="grade"
                          value={form.grade}
                          onChange={handleChange}
                          placeholder="B.Tech 2nd Year"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="beta-referral">How did you hear about us?</label>
                      <textarea
                        id="beta-referral"
                        className="form-input"
                        name="referral"
                        value={form.referral}
                        onChange={handleChange}
                        placeholder="Friend, social media, college notice board..."
                        style={{ minHeight: 80, resize: "vertical" }}
                      />
                    </div>

                    <button
                      id="beta-submit"
                      className="btn btn-primary btn-block"
                      disabled={loading}
                      style={{ padding: 14, fontSize: 15, marginTop: 4 }}
                    >
                      {loading ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                          <span className="spinner-sm" /> Submitting...
                        </span>
                      ) : (
                        "Join Beta →"
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* ── Perks Panel ────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div className="section-eyebrow">What you'll get</div>
                <h2 className="section-title" style={{ marginBottom: 20 }}>
                  Beta Perks
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {perks.map((perk) => (
                    <div key={perk.text} className="info-item">
                      <div className="info-item-icon">{perk.icon}</div>
                      <div>
                        <div className="info-item-value" style={{ fontSize: 14, color: "var(--text)" }}>
                          {perk.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live status */}
              <div className="card" style={{
                background: "linear-gradient(135deg, var(--primary-muted), var(--accent-muted))",
                padding: "22px 20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span className="live-dot-large" />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Beta is Live in Limited Cities</span>
                </div>
                <p className="text-sm text-muted" style={{ lineHeight: 1.7 }}>
                  Dehradun, Uttarakhand is now active. More cities coming every month.
                  Your spot in line is reserved when you sign up.
                </p>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { num: "2,400+", label: "Waitlist" },
                  { num: "7", label: "Cities Soon" },
                  { num: "Free", label: "Forever" },
                ].map((s) => (
                  <div key={s.label} className="stat-card" style={{ flex: 1, padding: "14px 10px" }}>
                    <div className="stat-card-num" style={{ fontSize: 20 }}>{s.num}</div>
                    <div className="stat-card-label">{s.label}</div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted" style={{ textAlign: "center" }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>
                  Sign in →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default JoinBeta;