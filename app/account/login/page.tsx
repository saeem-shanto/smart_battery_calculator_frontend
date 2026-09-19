"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, LogIn, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser, loginUser } from "@/lib/account-api";

export default function UserLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("passwordChanged") === "1") setNotice("Password changed successfully. Sign in again with your new password.");
    getCurrentUser().then((user) => { if (user) window.location.replace("/account/profile"); }).catch(() => undefined);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!username.trim()) return setError("Enter your username.");
    if (!password) return setError("Enter your password.");
    setWorking(true);
    try {
      await loginUser(username.trim(), password);
      window.dispatchEvent(new Event("smart-battery:user-changed"));
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <AppShell>
      <div className="page-header"><h1>Sign In</h1><p>Optional account access for saved calculations and your profile.</p></div>
      <section className="account-form-card">
        <div className="account-form-icon"><LogIn size={28}/></div>
        <h2>Welcome back</h2>
        <p className="account-form-intro">Guest calculations still work without signing in. Sign in when you want retained calculations linked to your account.</p>
        {notice && <div className="success-box" role="status">{notice}</div>}
        {error && <div className="error-box" role="alert"><strong>Sign-in error</strong><span>{error}</span></div>}
        <form onSubmit={submit} className="account-form" noValidate>
          <div className="field"><label htmlFor="user-login-username">Username</label><div className="login-input-wrap"><UserRound size={18}/><input id="user-login-username" className="input" autoComplete="username" value={username} onChange={(e)=>setUsername(e.target.value)} disabled={working}/></div></div>
          <div className="field"><label htmlFor="user-login-password">Password</label><div className="login-input-wrap"><LockKeyhole size={18}/><input id="user-login-password" className="input" type={showPassword?"text":"password"} autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} disabled={working}/><button className="password-toggle" type="button" onClick={()=>setShowPassword((v)=>!v)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
          <button className="btn btn-primary btn-lg account-form-submit" type="submit" disabled={working}>{working?"Signing in…":"Sign In"}</button>
        </form>
        <div className="account-form-footer">No account yet? <a href="/account/register">Create one</a></div>
      </section>
    </AppShell>
  );
}
