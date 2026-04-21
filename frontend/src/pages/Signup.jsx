import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    password: "", phone: "", role: "user"
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const { loginAuth } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.password) {
      toast.error("Please fill all required fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`,
        form
      );
      const { token, user } = response.data;
      loginAuth(user, token);
      toast.success("Account created! Welcome aboard 🎉");
      if (user.role === "admin") navigate("/admin-dashboard");
      else if (user.role === "driver") navigate("/driver-dashboard");
      else navigate("/user-dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: "user",   icon: "👤", label: "Passenger", desc: "Track buses & get ETAs" },
    { value: "driver", icon: "🚌", label: "Driver",    desc: "Broadcast your location" },
  ];

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 500 }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🚍</div>
          <span className="auth-logo-text">RouteFlow</span>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join 50K+ commuters on RouteFlow — it's free</p>

        <form onSubmit={handleSignup} id="signup-form">
          {/* Name Row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="signup-firstname">First Name *</label>
              <input
                id="signup-firstname"
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
              <label className="form-label" htmlFor="signup-lastname">Last Name</label>
              <input
                id="signup-lastname"
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
            <label className="form-label" htmlFor="signup-email">Email *</label>
            <input
              id="signup-email"
              className="form-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-phone">Phone (optional)</label>
            <input
              id="signup-phone"
              className="form-input"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 9876543210"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password *</label>
            <div style={{ position: "relative" }}>
              <input
                id="signup-password"
                className="form-input"
                type={showPass ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  cursor: "pointer", fontSize: 16, color: "var(--text-muted)",
                }}
                aria-label="Toggle password visibility"
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            <div className="form-hint">At least 6 characters</div>
          </div>

          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">I am a</label>
            <div style={{ display: "flex", gap: 10 }}>
              {roles.map((r) => (
                <label
                  key={r.value}
                  id={`role-${r.value}`}
                  style={{
                    flex: 1,
                    padding: "12px", borderRadius: "var(--radius-sm)",
                    border: `2px solid ${form.role === r.value ? "var(--primary)" : "var(--border-strong)"}`,
                    background: form.role === r.value ? "var(--primary-muted)" : "var(--surface2)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={form.role === r.value}
                    onChange={handleChange}
                    style={{ display: "none" }}
                  />
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{r.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: form.role === r.value ? "var(--primary)" : "var(--text)" }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{r.desc}</div>
                </label>
              ))}
              {/* Admin kept as select option only */}
              <select
                style={{ display: "none" }}
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="user">User</option>
                <option value="driver">Driver</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button
            id="signup-submit"
            className="btn btn-primary btn-block mt-8"
            disabled={loading}
            style={{ padding: "13px", fontSize: 15, borderRadius: "var(--radius-sm)" }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <span className="spinner-sm" /> Creating account...
              </span>
            ) : (
              "Create Account →"
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" id="signup-goto-login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
