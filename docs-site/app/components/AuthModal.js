"use client";

import { useState } from "react";
import { useAuth } from "./AuthContext";
import { useTheme } from "./ThemeContext";
import { Database, Eye, EyeOff, X } from "lucide-react";

export default function AuthModal({ isOpen, onClose, onSuccess, initialTab = "login" }) {
  const { login, signup } = useAuth();
  const { isGlass } = useTheme();
  const [tab, setTab] = useState(initialTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialTab === "login" ? "admin@droid.dev" : "");
  const [password, setPassword] = useState(initialTab === "login" ? "admin" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
    setSubmitting(false);
    setShowPassword(false);
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

  const inputCls = isGlass
    ? "w-full px-4 py-3 rounded-lg bg-white/[0.06] border border-white/[0.12] text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-colors"
    : "w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-colors";

  const labelCls = `block text-sm font-medium mb-1.5 ${
    isGlass ? "text-gray-200" : "text-gray-700 dark:text-gray-300"
  }`;

  return (
    <div
      data-testid="auth-overlay"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal card */}
      <div
        data-testid="auth-modal"
        className={`relative w-full max-w-md rounded-2xl p-8 shadow-2xl ${
          isGlass
            ? "bg-gray-900/90 backdrop-blur-2xl border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
            : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          data-testid="auth-close"
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
            isGlass
              ? "text-gray-400 hover:text-white hover:bg-white/[0.08]"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          onClick={handleClose}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <Database className={`w-8 h-8 mx-auto ${isGlass ? "text-purple-400" : "text-blue-600 dark:text-purple-400"}`} />
          <h2 data-testid="auth-title" className={`text-xl font-bold mt-2 ${
            isGlass ? "text-white" : "text-gray-900 dark:text-white"
          }`}>
            {tab === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className={`text-sm mt-1 ${
            isGlass ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
          }`}>
            {tab === "login"
              ? "Enter your credentials to sign in."
              : "Sign up to save your tutorial progress."}
          </p>
        </div>

        {/* Tabs */}
        <div className={`flex rounded-lg p-1 mb-6 ${
          isGlass ? "bg-white/[0.06]" : "bg-gray-100 dark:bg-gray-800"
        }`}>
          {["login", "signup"].map((t) => (
            <button
              key={t}
              data-testid={`auth-tab-${t}`}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                tab === t
                  ? isGlass
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : isGlass
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              onClick={() => switchTab(t)}
            >
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div data-testid="auth-error" className={`rounded-lg px-4 py-3 mb-4 text-sm ${
            isGlass
              ? "bg-red-500/15 border border-red-500/20 text-red-300"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400"
          }`}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "signup" && (
            <div>
              <label htmlFor="auth-name" className={labelCls}>Name</label>
              <input
                id="auth-name"
                type="text"
                className={inputCls}
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className={labelCls}>Email</label>
            <input
              id="auth-email"
              type="email"
              className={inputCls}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className={labelCls}>Password</label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                className={inputCls}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={tab === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${
                  isGlass ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                }`}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            data-testid="auth-submit"
            disabled={submitting}
            className={`w-full py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
              isGlass
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25"
            }`}
          >
            {submitting
              ? "Please wait..."
              : tab === "login"
                ? "Continue"
                : "Create Account"}
          </button>
        </form>

        {/* Switch prompt */}
        <p className={`text-center text-sm mt-5 ${
          isGlass ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
        }`}>
          {tab === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => switchTab("signup")}
                className={`font-medium ${
                  isGlass ? "text-purple-300 hover:text-purple-200" : "text-blue-600 dark:text-blue-400 hover:underline"
                }`}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => switchTab("login")}
                className={`font-medium ${
                  isGlass ? "text-purple-300 hover:text-purple-200" : "text-blue-600 dark:text-blue-400 hover:underline"
                }`}
              >
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
