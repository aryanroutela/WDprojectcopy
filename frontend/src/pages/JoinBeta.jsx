import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const JoinBeta = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.reason) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/preregister`,
        form
      );

      toast.success("You're on the waitlist 🚀");
      setSubmitted(true);

      setForm({
        name: "",
        email: "",
        reason: "",
      });

    } catch (err) {
      toast.error(
        err.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      
      {/* HERO */}
      <section style={styles.heroSection}>
        <h1 style={styles.title}>Join RouteFlow Beta</h1>
        <p style={styles.subtitle}>
          Get early access to real-time bus tracking and smarter commuting 🚍
        </p>
      </section>

      {/* FORM */}
      <section style={styles.formSection}>
        <div style={styles.container}>

          <div style={styles.formCard}>

            {submitted ? (
              <div style={styles.successBox}>
                <div style={styles.successIcon}>✓</div>
                <h2>You're In!</h2>
                <p>We'll notify you when we launch 🚀</p>
              </div>
            ) : (
              <>
                <h2 style={styles.formTitle}>Request Beta Access</h2>

                <form onSubmit={handleSubmit} style={styles.form}>

                  <input
                    style={styles.input}
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={handleChange}
                  />

                  <input
                    style={styles.input}
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={handleChange}
                  />

                  <textarea
                    style={styles.textarea}
                    name="reason"
                    placeholder="Why do you want early access?"
                    value={form.reason}
                    onChange={handleChange}
                  />

                  <button
                    style={{
                      ...styles.button,
                      ...(loading && styles.buttonDisabled),
                    }}
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Join Beta →"}
                  </button>

                </form>
              </>
            )}

          </div>
        </div>
      </section>
    </div>
  );
};

export default JoinBeta;

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
    fontSize: "52px",
    fontWeight: "800",
    marginBottom: "16px",
    background: "linear-gradient(135deg, #ff7a18 0%, #d946ef 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  subtitle: {
    fontSize: "18px",
    color: "#666",
    maxWidth: "600px",
    margin: "0 auto",
  },

  formSection: {
    padding: "40px 60px 80px",
  },

  container: {
    maxWidth: "500px",
    margin: "0 auto",
  },

  formCard: {
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,122,24,0.15)",
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
  },

  formTitle: {
    fontSize: "26px",
    fontWeight: "700",
    marginBottom: "20px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  input: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,122,24,0.2)",
    fontSize: "15px",
    outline: "none",
  },

  textarea: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,122,24,0.2)",
    minHeight: "100px",
    resize: "vertical",
    outline: "none",
  },

  button: {
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #ff7a18 0%, #ff9c42 100%)",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "10px",
    transition: "0.3s",
  },

  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  successBox: {
    textAlign: "center",
    padding: "40px 20px",
  },

  successIcon: {
    fontSize: "40px",
    color: "#10b981",
    marginBottom: "10px",
  },
};