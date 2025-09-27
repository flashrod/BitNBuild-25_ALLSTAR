import React, { useState } from "react";
import { supabase } from "../supabase";

const Auth = ({ onAuth }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    setError("");
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError(loginError.message);
      setUser(null);
      if (onAuth) onAuth(null);
    } else {
      setUser(data.user);
      if (onAuth) onAuth(data.user);
    }
  };

  const handleRegister = async () => {
    setError("");
    const { data, error: registerError } = await supabase.auth.signUp({ email, password });
    if (registerError) {
      setError(registerError.message);
      setUser(null);
      if (onAuth) onAuth(null);
    } else {
      setUser(data.user);
      if (onAuth) onAuth(data.user);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    if (onAuth) onAuth(null);
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded shadow w-full max-w-sm mx-auto">
      <h2 className="text-xl font-bold">Login / Register</h2>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        className="border p-2 w-full rounded"
      />
      <input
        value={password}
        onChange={e => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
        className="border p-2 w-full rounded"
      />
      <div className="flex gap-2">
        <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
        <button onClick={handleRegister} className="bg-green-600 text-white px-4 py-2 rounded">Register</button>
      </div>
      {user && (
        <div className="mt-2 text-sm text-gray-700">
          Logged in as: {user.email}
          <button onClick={handleLogout} className="ml-2 text-red-600 underline">Logout</button>
        </div>
      )}
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
};

export default Auth;