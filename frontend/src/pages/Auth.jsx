import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  LockClosedIcon,
  EnvelopeIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const palette = {
  bg: "bg-gradient-to-br from-white via-gray-50 to-gray-100",
  card: "bg-white",
  accent: "text-indigo-600",
  border: "border border-gray-200",
  input: "border border-gray-300 focus:border-indigo-500 focus:ring-indigo-100",
  button: "bg-indigo-600 hover:bg-indigo-700 text-white",
  error: "text-red-600",
  success: "text-emerald-600"
};

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Welcome back!");
        setTimeout(() => navigate("/dashboard"), 800);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccess("Account created!");
        setTimeout(() => navigate("/dashboard"), 800);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${palette.bg} px-4 py-8`}> 
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-md rounded-2xl shadow-xl ${palette.card} ${palette.border} px-8 py-10`}
      >
        <div className="mb-8 text-center">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex justify-center mb-2">
            {mode === "login" ? (
              <ArrowRightOnRectangleIcon className="w-8 h-8 text-indigo-600" />
            ) : (
              <UserPlusIcon className="w-8 h-8 text-indigo-600" />
            )}
          </motion.div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1 tracking-tight">
            {mode === "login" ? "Sign In" : "Create Account"}
          </h2>
          <p className="text-gray-500 text-sm">
            {mode === "login" ? "Welcome back. Please sign in to continue." : "Create your account to get started."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block mb-1 text-gray-700 text-sm font-medium">Email</label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`pl-10 pr-4 py-2 w-full rounded-lg ${palette.input} bg-gray-50 text-gray-900`}
                autoComplete="email"
                required
              />
            </div>
          </div>
          <div>
            <label className="block mb-1 text-gray-700 text-sm font-medium">Password</label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`pl-10 pr-4 py-2 w-full rounded-lg ${palette.input} bg-gray-50 text-gray-900`}
                autoComplete="current-password"
                required
              />
            </div>
          </div>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`flex items-center gap-2 text-sm ${palette.error} bg-red-50 rounded-lg px-3 py-2 mt-2`}
              >
                <ExclamationTriangleIcon className="w-5 h-5" />
                <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`flex items-center gap-2 text-sm ${palette.success} bg-emerald-50 rounded-lg px-3 py-2 mt-2`}
              >
                <CheckCircleIcon className="w-5 h-5" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="submit"
            className={`w-full py-2.5 rounded-lg font-semibold text-base mt-2 shadow-sm transition ${palette.button}`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2"><ArrowPathIcon className="w-5 h-5 animate-spin" /> Processing...</span>
            ) : (
              mode === "login" ? "Sign In" : "Register"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
              setSuccess("");
            }}
          >
            {mode === "login" ? (
              <UserPlusIcon className="w-5 h-5" />
            ) : (
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            )}
            {mode === "login" ? "Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;