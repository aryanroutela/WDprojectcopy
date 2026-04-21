import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const { loginAuth } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        form
      );
      const { token, user } = response.data;
      loginAuth(user, token);
      toast.success("Welcome back! 🎉");
      if (user.role === "admin") navigate("/admin-dashboard");
      else if (user.role === "driver") navigate("/driver-dashboard");
      else navigate("/user-dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🚍</div>
          <span className="auth-logo-text">RouteFlow</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to track buses in real-time</p>

        <form onSubmit={handleLogin} id="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                className="form-input"
                type={showPass ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  color: "var(--text-muted)",
                }}
                aria-label="Toggle password visibility"
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            className="btn btn-primary btn-block mt-8"
            disabled={loading}
            style={{ padding: "13px", fontSize: 15, borderRadius: "var(--radius-sm)" }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <span className="spinner-sm" /> Signing in...
              </span>
            ) : (
              "Sign In →"
            )}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <Link to="/track" className="btn btn-outline btn-block" style={{ marginBottom: 4 }}>
          🗺️ Track buses without login
        </Link>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/signup" id="login-goto-signup">Sign up free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
