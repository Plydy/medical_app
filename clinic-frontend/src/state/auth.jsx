import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "../api/client.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    const access = getAccessToken();
    if (!access) {
      setMe(null);
      setLoading(false);
      return;
    }
    try {
      const r = await api.get("me/");
      setMe(r.data);
    } catch (e) {
      setMe(null);
      clearAuthTokens();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchMe(); }, []);

  async function login(username, password) {
    // obtain tokens
    const r = await api.post("auth/token/", { username, password });
    setAuthTokens(r.data);
    // load profile
    const meRes = await api.get("me/");
    setMe(meRes.data);
  }

  async function register(payload) {
    const r = await api.post("auth/register/", payload);
    setAuthTokens(r.data);
    setMe(r.data.user);
  }

  function logout() {
    clearAuthTokens();
    setMe(null);
  }

  const value = useMemo(() => ({ me, loading, login, register, logout, refreshMe: fetchMe }), [me, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
