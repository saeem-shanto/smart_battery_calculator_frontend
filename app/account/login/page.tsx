"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, LogIn, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser, loginUser } from "@/lib/account-api";
import { ApiRequestError, getApiFieldMessage } from "@/lib/api";

type LoginField = "username" | "password";
type LoginErrors = Partial<Record<LoginField, string>>;

function focusField(field: LoginField) {
  const id = field === "username" ? "user-login-username" : "user-login-password";
  window.requestAnimationFrame(() => {
    const element = document.getElementById(id) as HTMLInputElement | null;
    if (!element) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export default function UserLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginErrors>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("passwordChanged") === "1") setNotice("Password changed successfully. Sign in again with your new password.");
    getCurrentUser().then((user) => { if (user) window.location.replace("/account/profile"); }).catch(() => undefined);
  }, []);

  function clearField(field: LoginField) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const next: LoginErrors = {};
    if (!username.trim()) next.username = "Enter your username.";
    if (!password) next.password = "Enter your password.";
    if (Object.keys(next).length) {
      setFieldErrors(next);
      focusField(next.username ? "username" : "password");
      return;
    }

    setFieldErrors({});
    setWorking(true);
    try {
      await loginUser(username.trim(), password);
      window.dispatchEvent(new Event("smart-battery:user-changed"));
      const nextPath = new URLSearchParams(window.location.search).get("next");
      window.location.replace(nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard");
    } catch (caught) {
      if (caught instanceof ApiRequestError) {
        const backendErrors: LoginErrors = {
          username: getApiFieldMessage(caught, "username") || undefined,
          password: getApiFieldMessage(caught, "password") || undefined,
        };
        const cleaned = Object.fromEntries(Object.entries(backendErrors).filter(([, value]) => Boolean(value))) as LoginErrors;
        if (Object.keys(cleaned).length) {
          setFieldErrors(cleaned);
          focusField(cleaned.username ? "username" : "password");
        } else {
          setError("The username or password is incorrect. Please try again.");
        }
      } else {
        setError(caught instanceof Error ? caught.message : "Sign in failed. Please try again.");
      }
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
        {error && <div className="error-box" role="alert"><strong>Could not sign in</strong><span>{error}</span></div>}
        <form onSubmit={submit} className="account-form" noValidate>
          <div className={`field${fieldErrors.username ? " has-error" : ""}`}>
            <label htmlFor="user-login-username">Username</label>
            <div className="login-input-wrap"><UserRound size={18}/><input id="user-login-username" className={`input${fieldErrors.username ? " input-error" : ""}`} autoComplete="username" value={username} onChange={(e)=>{setUsername(e.target.value); clearField("username");}} disabled={working} aria-invalid={Boolean(fieldErrors.username)} aria-describedby={fieldErrors.username ? "user-login-username-error" : undefined}/></div>
            {fieldErrors.username && <div id="user-login-username-error" className="field-message error" role="alert">{fieldErrors.username}</div>}
          </div>
          <div className={`field${fieldErrors.password ? " has-error" : ""}`}>
            <label htmlFor="user-login-password">Password</label>
            <div className="login-input-wrap"><LockKeyhole size={18}/><input id="user-login-password" className={`input${fieldErrors.password ? " input-error" : ""}`} type={showPassword?"text":"password"} autoComplete="current-password" value={password} onChange={(e)=>{setPassword(e.target.value); clearField("password");}} disabled={working} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "user-login-password-error" : undefined}/><button className="password-toggle" type="button" onClick={()=>setShowPassword((v)=>!v)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
            {fieldErrors.password && <div id="user-login-password-error" className="field-message error" role="alert">{fieldErrors.password}</div>}
          </div>
          <button className="btn btn-primary btn-lg account-form-submit" type="submit" disabled={working}>{working?"Signing in…":"Sign In"}</button>
        </form>
        <div className="account-form-footer">No account yet? <a href="/account/register">Create one</a></div>
      </section>
    </AppShell>
  );
}
