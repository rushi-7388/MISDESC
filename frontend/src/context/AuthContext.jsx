import React, { createContext, useContext, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("MISDESC_user");
    return stored ? JSON.parse(stored) : null;
  });

  async function login(email, password) {
    const { data } = await client.post("/auth/login", { email, password });
    localStorage.setItem("MISDESC_token", data.token);
    localStorage.setItem("MISDESC_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("MISDESC_token");
    localStorage.removeItem("MISDESC_user");
    setUser(null);
  }

  async function switchUser(email, password = "password123") {
    return await login(email, password);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
