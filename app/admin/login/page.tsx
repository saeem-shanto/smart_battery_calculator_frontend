"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { loginAdmin } from "@/lib/admin-api";
import { hasAuthSession } from "@/lib/backend-client";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("loggedOut") === "1") setNotice("You have been signed out.");
    if (params.get("passwordChanged") === "1") setNotice("Password changed successfully. Sign in again with the new password.");
    if (hasAuthSession("admin")) window.location.replace("/admin");
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const cleanUsername = username.trim();
    if (!cleanUsername) return setError("Enter the admin username.");
    if (!password) return setError("Enter the admin password.");
    if (cleanUsername.length > 50) return setError("Username is too long.");
    if (password.length > 100) return setError("Password is too long.");

    setWorking(true);
    try {
      await loginAdmin(cleanUsername, password);
      window.location.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin login failed.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <BrandLogo />
        <div className="admin-login-icon"><ShieldCheck size={30} /></div>
        <h1>Admin Login</h1>
        <p>Sign in with your Django staff account to manage calculation records and stored files.</p>
        {notice && <div className="success-box" role="status">{notice}</div>}
        {error && <div className="error-box" role="alert"><strong>Login error</strong><span>{error}</span></div>}
        <form onSubmit={submit} noValidate className="admin-login-form">
          <div className="field">
            <label htmlFor="admin-username">Username</label>
            <div className="login-input-wrap"><UserRound size={18} /><input id="admin-username" className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="Admin username" disabled={working} /></div>
          </div>
          <div className="field">
            <label htmlFor="admin-password">Password</label>
            <div className="login-input-wrap"><LockKeyhole size={18} /><input id="admin-password" className="input" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Password" disabled={working} /><button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
          </div>
          <button className="btn btn-primary btn-lg admin-login-button" type="submit" disabled={working}>{working ? "Signing in..." : "Sign In"}</button>
        </form>
        <div className="admin-security-note"><LockKeyhole size={16}/><span>Credentials are verified directly by the Django backend. JWTs are kept for the current browser tab and sent only to Django in Authorization headers.</span></div>
        <a className="admin-back-link" href="/dashboard">← Back to user dashboard</a>
      </section>
    </main>
  );
}
