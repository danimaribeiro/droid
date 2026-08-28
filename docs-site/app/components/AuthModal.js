"use client";

import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function AuthModal({ isOpen, onClose, onSuccess, initialTab = "login" }) {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialTab === "login" ? "admin@droid.dev" : "");
  const [password, setPassword] = useState(initialTab === "login" ? "admin" : "");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const switchTab = (t) => {
    setTab(t);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={handleClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
          </svg>
        </button>

        <div className="auth-modal-header">
          <span className="auth-modal-icon">🗄️</span>
          <h2 className="auth-modal-title">
            {tab === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="auth-modal-subtitle">
            {tab === "login"
              ? "Log in to submit code and track progress"
              : "Sign up to save your tutorial progress"}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => switchTab("login")}
          >
            Log In
          </button>
          <button
            className={`auth-tab ${tab === "signup" ? "active" : ""}`}
            onClick={() => switchTab("signup")}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {tab === "signup" && (
            <div className="auth-field">
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                type="text"
                className="auth-input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="auth-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={tab === "login" ? "current-password" : "new-password"}
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : tab === "login"
              ? "Log In"
              : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          {tab === "login" ? (
            <>
              Don't have an account?{" "}
              <button onClick={() => switchTab("signup")}>Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => switchTab("login")}>Log in</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
