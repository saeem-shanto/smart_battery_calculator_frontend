"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { LoginTwoFactorStep } from "@/components/LoginTwoFactorStep";
import { loginAdmin } from "@/lib/admin-api";
import { hasAuthSession } from "@/lib/backend-client";
import { ApiRequestError, getApiFieldMessage } from "@/lib/api";
import { resendTwoFactorCode, verifyLoginTwoFactor, type TwoFactorChallengeInfo } from "@/lib/security-api";

type AdminField = "username" | "password";
type AdminErrors = Partial<Record<AdminField, string>>;

function focusAdminField(field: AdminField) {
  const id = field === "username" ? "admin-username" : "admin-password";
  window.requestAnimationFrame(() => {
    const element = document.getElementById(id) as HTMLInputElement | null;
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => element.focus({ preventScroll: true }), 220);
  });
}

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AdminErrors>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState(false);
  const [challenge, setChallenge] = useState<TwoFactorChallengeInfo | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("loggedOut") === "1") setNotice("You have been signed out.");
    if (params.get("passwordChanged") === "1") setNotice("Password changed successfully. Sign in again with the new password.");
    if (hasAuthSession("admin")) window.location.replace("/admin");
  }, []);

  function clearField(field: AdminField) {
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
    if (working) return;
    setError("");
    const cleanUsername = username.trim();
    const next: AdminErrors = {};
    if (!cleanUsername) next.username = "Enter the admin username.";
    else if (cleanUsername.length > 150) next.username = "Username is too long.";
    if (!password) next.password = "Enter the admin password.";
    else if (password.length > 200) next.password = "Password is too long.";
    if (Object.keys(next).length) {
      setFieldErrors(next);
      focusAdminField(next.username ? "username" : "password");
      return;
    }

    setFieldErrors({});
    setWorking(true);
    try {
      const result = await loginAdmin(cleanUsername, password);
      if (result.twoFactorRequired) {
        setChallenge(result.challenge);
        setPassword("");
        return;
      }
      window.location.replace("/admin");
    } catch (caught) {
      if (caught instanceof ApiRequestError) {
        const backendErrors: AdminErrors = {
          username: getApiFieldMessage(caught, "username") || undefined,
          password: getApiFieldMessage(caught, "password") || undefined,
        };
        const cleaned = Object.fromEntries(Object.entries(backendErrors).filter(([, value]) => Boolean(value))) as AdminErrors;
        if (Object.keys(cleaned).length) {
          setFieldErrors(cleaned);
          focusAdminField(cleaned.username ? "username" : "password");
        } else {
          const securityMessage = getApiFieldMessage(caught, "email") || getApiFieldMessage(caught, "non_field_errors");
          setError(caught.status === 401 ? "The admin username or password is incorrect." : securityMessage || caught.message);
        }
      } else {
        setError(caught instanceof Error ? caught.message : "Admin login failed. Please try again.");
      }
    } finally {
      setWorking(false);
    }
  }

  async function verifyOtp(code: string) {
    if (!challenge) return;
    setWorking(true);
    try {
      await verifyLoginTwoFactor("admin", challenge.challengeId, code);
      window.location.replace("/admin");
    } finally {
      setWorking(false);
    }
  }

  async function resendOtp() {
    if (!challenge) throw new Error("No active verification challenge.");
    const next = await resendTwoFactorCode(challenge.challengeId);
    setChallenge(next);
    return next;
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <BrandLogo />
        {challenge ? (
          <LoginTwoFactorStep
            challenge={challenge}
            working={working}
            onVerify={verifyOtp}
            onResend={resendOtp}
            onBack={() => { setChallenge(null); setError(""); }}
          />
        ) : <>
        <div className="admin-login-icon"><ShieldCheck size={30} /></div>
        <h1>Admin Login</h1>
        <p>Sign in with a Django staff account to manage calculation records and stored files.</p>
        {notice && <div className="success-box" role="status">{notice}</div>}
        {error && <div className="error-box" role="alert"><strong>Could not sign in</strong><span>{error}</span></div>}
        <form onSubmit={submit} noValidate className="admin-login-form">
          <div className={`field${fieldErrors.username ? " has-error" : ""}`}>
            <label htmlFor="admin-username">Username <span className="required-label">Required</span></label>
            <div className="login-input-wrap"><UserRound size={18} /><input id="admin-username" className={`input${fieldErrors.username ? " input-error" : ""}`} value={username} onChange={(e) => { setUsername(e.target.value); clearField("username"); }} autoComplete="username" placeholder="Admin username" disabled={working} autoFocus aria-invalid={Boolean(fieldErrors.username)} aria-describedby={fieldErrors.username ? "admin-username-error" : undefined}/></div>
            {fieldErrors.username && <div id="admin-username-error" className="field-message error" role="alert">{fieldErrors.username}</div>}
          </div>
          <div className={`field${fieldErrors.password ? " has-error" : ""}`}>
            <label htmlFor="admin-password">Password <span className="required-label">Required</span></label>
            <div className="login-input-wrap"><LockKeyhole size={18} /><input id="admin-password" className={`input${fieldErrors.password ? " input-error" : ""}`} type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); clearField("password"); }} autoComplete="current-password" placeholder="Password" disabled={working} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "admin-password-error" : undefined}/><button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} disabled={working}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
            {fieldErrors.password && <div id="admin-password-error" className="field-message error" role="alert">{fieldErrors.password}</div>}
          </div>
          <button className="btn btn-primary btn-lg admin-login-button" type="submit" disabled={working}>{working ? "Signing in…" : "Sign In"}</button>
        </form>
        <div className="admin-security-note"><LockKeyhole size={16}/><span>Credentials are verified directly by Django. The admin session is kept only in the current browser tab and sent to the backend in Authorization headers.</span></div>
        <div className="account-form-footer"><a href="/account/forgot-password">Forgot password?</a></div>
        <a className="admin-back-link" href="/">← Back to user dashboard</a>
        </>}
      </section>
    </main>
  );
}
