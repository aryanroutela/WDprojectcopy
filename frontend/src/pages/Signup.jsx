import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Signup = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "user"
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

      // Store token and user
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Signup successful! 🎉");

      // Redirect based on role
      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else if (user.role === "driver") {
        navigate("/driver-dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🚍 RouteFlow Sign Up</h1>
        <p style={styles.subtitle}>Join our community</p>

        <form onSubmit={handleSignup} style={styles.form}>
          <div style={styles.row}>
            <div style={{ ...styles.group, flex: 1 }}>
              <label style={styles.label}>First Name *</label>
              <input
                style={styles.input}
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="John"
                required
              />
            </div>

            <div style={{ ...styles.group, flex: 1 }}>
              <label style={styles.label}>Last Name</label>
              <input
                style={styles.input}
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Doe"
              />
            </div>
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Email *</label>
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

          <div style={styles.group}>
            <label style={styles.label}>Phone</label>
            <input
              style={styles.input}
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1234567890"
            />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Password *</label>
            <input
              style={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>I am a:</label>
            <select
              style={styles.select}
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="user">👤 User (Passenger)</option>
              <option value="driver">🚗 Driver/Conductor</option>
              <option value="admin">🔧 Admin</option>
            </select>
          </div>

          <button
            style={{
              ...styles.button,
              ...(loading && styles.buttonDisabled)
            }}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have account?{" "}
          <a href="/login" style={styles.link}>
            Login here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)",
    padding: "20px"
  },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "40px",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 10px 40px rgba(255, 107, 53, 0.2)"
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#333",
    textAlign: "center"
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    textAlign: "center",
    marginBottom: "30px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  row: {
    display: "flex",
    gap: "12px"
  },
  group: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#333"
  },
  input: {
    padding: "12px",
    border: "2px solid #f0f0f0",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
    transition: "all 0.3s",
    outline: "none"
  },
  select: {
    padding: "12px",
    border: "2px solid #f0f0f0",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
    background: "white",
    cursor: "pointer",
    transition: "all 0.3s"
  },
  button: {
    padding: "12px",
    background: "linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s",
    marginTop: "10px",
    boxShadow: "0 4px 12px rgba(255, 107, 53, 0.3)"
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed"
  },
  footer: {
    textAlign: "center",
    fontSize: "14px",
    color: "#666",
    marginTop: "20px"
  },
  link: {
    color: "#ff6b35",
    textDecoration: "none",
    fontWeight: "600",
    cursor: "pointer"
  }
};
