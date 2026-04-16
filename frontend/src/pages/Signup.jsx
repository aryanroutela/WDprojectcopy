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
      toast.success("Account created! 🎉");
      if (user.role === "admin") navigate("/admin-dashboard");
      else if (user.role === "driver") navigate("/driver-dashboard");
      else navigate("/user-dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join RouteFlow for free</p>

        <form onSubmit={handleSignup}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-input" type="text" name="firstName"
                value={form.firstName} onChange={handleChange}
                placeholder="John" required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" type="text" name="lastName"
                value={form.lastName} onChange={handleChange}
                placeholder="Doe" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" name="email"
              value={form.email} onChange={handleChange}
              placeholder="your@email.com" required />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" type="tel" name="phone"
              value={form.phone} onChange={handleChange}
              placeholder="+91 9876543210" />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" name="password"
              value={form.password} onChange={handleChange}
              placeholder="Minimum 6 characters" required />
          </div>

          <div className="form-group">
            <label className="form-label">I am a</label>
            <select className="form-input" name="role"
              value={form.role} onChange={handleChange}>
              <option value="user">👤 Passenger</option>
              <option value="driver">🚌 Driver / Conductor</option>
              <option value="admin">🛡️ Admin</option>
            </select>
          </div>

          <button className="btn btn-primary btn-block mt-8" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
