"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, UserPlus, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser, registerUser } from "@/lib/account-api";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", firstName: "", lastName: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => { getCurrentUser().then((u)=>{ if(u) window.location.replace("/account/profile"); }).catch(()=>undefined); }, []);

  function update(key: keyof typeof form, value: string) { setForm((current)=>({ ...current, [key]: value })); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (form.username.trim().length < 3) return setError("Username must be at least 3 characters.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    setWorking(true);
    try {
      await registerUser({
        username: form.username.trim(), email: form.email.trim(), first_name: form.firstName.trim(), last_name: form.lastName.trim(), password: form.password,
      });
      window.dispatchEvent(new Event("smart-battery:user-changed"));
      window.location.replace("/account/profile?welcome=1");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed.");
    } finally { setWorking(false); }
  }

  return (
    <AppShell>
      <div className="page-header"><h1>Create Account</h1><p>Optional account for cross-session access to retained calculations.</p></div>
      <section className="account-form-card account-form-card-wide">
        <div className="account-form-icon"><UserPlus size={28}/></div>
        <h2>Your account</h2>
        <p className="account-form-intro">You can continue using the calculator as a guest. An account is only needed to own retained calculations and manage a profile picture.</p>
        {error && <div className="error-box" role="alert"><strong>Registration error</strong><span>{error}</span></div>}
        <form onSubmit={submit} className="account-form" noValidate>
          <div className="form-grid">
            <div className="field"><label htmlFor="reg-first">First name</label><input id="reg-first" className="input" value={form.firstName} onChange={(e)=>update("firstName",e.target.value)} autoComplete="given-name"/></div>
            <div className="field"><label htmlFor="reg-last">Last name</label><input id="reg-last" className="input" value={form.lastName} onChange={(e)=>update("lastName",e.target.value)} autoComplete="family-name"/></div>
            <div className="field"><label htmlFor="reg-username">Username</label><div className="login-input-wrap"><UserRound size={18}/><input id="reg-username" className="input" value={form.username} onChange={(e)=>update("username",e.target.value)} autoComplete="username" required/></div></div>
            <div className="field"><label htmlFor="reg-email">Email</label><input id="reg-email" className="input" type="email" value={form.email} onChange={(e)=>update("email",e.target.value)} autoComplete="email"/></div>
            <div className="field"><label htmlFor="reg-password">Password</label><div className="login-input-wrap"><LockKeyhole size={18}/><input id="reg-password" className="input" type={showPassword?"text":"password"} value={form.password} onChange={(e)=>update("password",e.target.value)} autoComplete="new-password" required/><button className="password-toggle" type="button" onClick={()=>setShowPassword((v)=>!v)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
            <div className="field"><label htmlFor="reg-confirm">Confirm password</label><input id="reg-confirm" className="input" type={showPassword?"text":"password"} value={form.confirm} onChange={(e)=>update("confirm",e.target.value)} autoComplete="new-password" required/></div>
          </div>
          <button className="btn btn-primary btn-lg account-form-submit" type="submit" disabled={working}>{working?"Creating account…":"Create Account"}</button>
        </form>
        <div className="account-form-footer">Already registered? <a href="/account/login">Sign in</a></div>
      </section>
    </AppShell>
  );
}
