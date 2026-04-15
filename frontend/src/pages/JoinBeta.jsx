import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

import React, { useState } from "react";

const JoinBeta = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    reason: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setForm({ name: "", email: "", reason: "" });
      setSubmitted(false);
    }, 2500);
  };

  return (
    <div style={styles.page}>
      {/* Hero Section */}
      <section style={styles.heroSection}>
        <h1 style={styles.title}>Join the RouteFlow Beta</h1>
        <p style={styles.subtitle}>
          Be the first to experience real-time bus tracking and smart commuting. Sign up for our exclusive beta program!
        </p>
      </section>

      {/* Beta Signup Form */}
      <section style={styles.formSection}>
        <div style={styles.container}>
          <div style={styles.formContainer}>
            <h2 style={styles.formTitle}>Request Beta Access</h2>
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
                <label style={styles.label}>Why do you want to join?</label>
                <textarea
                  style={styles.textarea}
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  placeholder="Tell us why you're interested..."
                  required
                />
              </div>
              <button
                style={{
                  ...styles.submitButton,
                  ...(submitted && styles.submitButtonSuccess),
                }}
                type="submit"
                disabled={submitted}
              >
                {submitted ? "✓ Request Sent!" : "Request Access"}
              </button>
            </form>
            {submitted && (
              <div style={styles.successMessage}>
                Thank you for joining the beta! We'll be in touch soon.
              </div>
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
    background: "linear-gradient(135deg, #fff7f0 0%, #f0f9ff 100%)",
  },
  heroSection: {
    padding: "80px 60px 40px 60px",
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
  formSection: {
    padding: "40px 0 80px 0",
  },
  container: {
    maxWidth: "500px",
    margin: "0 auto",
  },
  formContainer: {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 122, 24, 0.15)",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
    marginTop: "0",
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
    minHeight: "80px",
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
  successMessage: {
    marginTop: "24px",
    padding: "18px 0",
    color: "#10b981",
    fontWeight: "700",
    fontSize: "18px",
    textAlign: "center",
    background: "rgba(16, 185, 129, 0.08)",
    borderRadius: "10px",
  },
};
function JoinBeta() {
  const [form, setForm] = useState(
    {firstName: "",
    lastName:  "",
    email:     "",
    school:    "",
    grade:     "",
    referral:  "",});

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit() {
    // if (!form.firstName || !form.email || !form.school || !form.grade) {
    //   setError("Fill all the fields.");
    //   return;
    // }

    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(form.email)) {
    //   setError("Sahi email daalo.");
    //   return;
    // }

    setLoading(true);
    setError("");

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/preregister`, form);
      toast.success("You're on the waitlist! ");
      setSubmitted(true);
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong!";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fadeUp max-w-[540px] mx-auto px-8 py-20">

      <div className="text-[0.7rem] font-medium tracking-[2px] uppercase text-acc mb-2">
        Pre-register
      </div>

      <h2 className="font-display text-[clamp(2.5rem,6vw,4rem)] tracking-[2px] leading-[1] mb-2 text-t1">
        JOIN THE<br />WAITLIST
      </h2>
      <p className="text-t2 text-[0.92rem] leading-[1.8] mb-8">
        Be among the first to access AI Debate Arena. We'll reach out as soon as we launch.
      </p>

      <div className="bg-s2 border border-white/[0.07] rounded-[14px] p-8">
        {submitted ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-acc3/10 flex items-center
                            justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] stroke-acc3"
                   fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h4 className="font-display text-[1.5rem] tracking-[1px] mb-1 text-t1">YOU'RE IN!</h4>
            <p className="text-[0.82rem] text-t2">
              We'll email you the moment AI Debate Arena is live. Get ready to argue.
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-[0.9rem] font-medium mb-6 text-t1">Registration form</h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[0.72rem] font-medium text-t3
                                  uppercase tracking-[0.5px] mb-1">
                  First Name *
                </label>
                <input
                  name="firstName"
                  type="text"
                  placeholder="Rahul"
                  value={form.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-[0.72rem] font-medium text-t3
                                  uppercase tracking-[0.5px] mb-1">
                  Last Name
                </label>
                <input
                  name="lastName"
                  type="text"
                  placeholder="Sharma"
                  value={form.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[0.72rem] font-medium text-t3
                                uppercase tracking-[0.5px] mb-1">
                Email *
              </label>
              <input
                name="email"
                type="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="mb-4">
              <label className="block text-[0.72rem] font-medium text-t3
                                uppercase tracking-[0.5px] mb-1">
                School / College *
              </label>
              <input
                name="school"
                type="text"
                placeholder="Delhi Public School"
                value={form.school}
                onChange={handleChange}
              />
            </div>

            <div className="mb-4">
              <label className="block text-[0.72rem] font-medium text-t3
                                uppercase tracking-[0.5px] mb-1">
                Grade *
              </label>
              <select
                name="grade"
                value={form.grade}
                onChange={handleChange}
              >
                <option value="">Select grade</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
                <option value="College / University">College / University</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-[0.72rem] font-medium text-t3
                                uppercase tracking-[0.5px] mb-1">
                Referral Code (optional)
              </label>
              <input
                name="referral"
                type="text"
                placeholder="Friend ka code daalo"
                value={form.referral}
                onChange={handleChange}
              />
            </div>

            {error && (
              <p className="text-acc2 text-[0.82rem] mb-3">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-2 bg-acc text-black border-none rounded-[7px]
                         py-3 text-[0.88rem] font-medium cursor-pointer tracking-[0.3px]
                         transition-all duration-200 hover:bg-[#6d60ff] hover:text-white
                         active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Reserve My Spot →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default JoinBeta;