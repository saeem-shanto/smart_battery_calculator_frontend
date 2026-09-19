"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ApiRequestError, getApiFieldMessage } from "@/lib/api";
import { confirmPasswordReset } from "@/lib/security-api";
import { clearAuthSession } from "@/lib/backend-client";

export default function ResetPasswordPage() {
  const [uid, setUid] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [working, setWorking] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUid(params.get("uid") || "");
    setToken(params.get("token") || "");
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(""); setPasswordError(""); setConfirmError("");
    if (!uid || !token) return setError("This password reset link is incomplete. Request a new reset email.");
    if (password.length < 8) return setPasswordError("Password must be at least 8 characters.");
    if (/^\d+$/.test(password)) return setPasswordError("Password cannot be entirely numeric.");
    if (password !== confirm) return setConfirmError("Passwords do not match.");
    setWorking(true);
    try {
      await confirmPasswordReset({ uid, token, newPassword: password, confirmPassword: confirm });
      clearAuthSession("user");
      clearAuthSession("admin");
      setComplete(true);
      setPassword(""); setConfirm("");
    } catch (caught) {
      if (caught instanceof ApiRequestError) {
        setPasswordError(getApiFieldMessage(caught, "new_password") || "");
        setConfirmError(getApiFieldMessage(caught, "confirm_password") || "");
        setError(getApiFieldMessage(caught, "token") || (getApiFieldMessage(caught, "non_field_errors") || caught.message));
      } else setError(caught instanceof Error ? caught.message : "The password could not be reset.");
    } finally { setWorking(false); }
  }

  const longEnough = password.length >= 8;
  const notNumeric = Boolean(password) && !/^\d+$/.test(password);
  const matches = Boolean(confirm) && password === confirm;

  return (
    <AppShell>
      <div className="page-header"><h1>Reset Password</h1><p>Choose a new password for your account.</p></div>
      <section className="account-form-card">
        <div className="account-form-icon"><KeyRound size={28}/></div>
        <h2>{complete ? "Password updated" : "Choose a new password"}</h2>
        {complete ? <>
          <div className="success-box" role="status">Your password has been changed. Existing refresh sessions have been revoked.</div>
          <div className="account-form-footer"><a href="/account/login?passwordChanged=1">Sign in</a> · <a href="/admin/login?passwordChanged=1">Admin sign in</a></div>
        </> : <>
          <p className="account-form-intro">Use a strong password you do not use elsewhere. The reset link can only be used while it is valid.</p>
          {error && <div className="error-box" role="alert"><strong>Reset link error</strong><span>{error}</span></div>}
          <form className="account-form" onSubmit={submit} noValidate>
            <div className={`field${passwordError ? " has-error" : ""}`}>
              <label htmlFor="reset-password">New password <span className="required-label">Required</span></label>
              <div className="login-input-wrap no-leading-icon"><input id="reset-password" className={`input${passwordError ? " input-error" : ""}`} type={show?"text":"password"} autoComplete="new-password" value={password} onChange={(event)=>{setPassword(event.target.value);setPasswordError("");setError("");}} autoFocus disabled={working}/><button className="password-toggle" type="button" onClick={()=>setShow((v)=>!v)} aria-label={show?"Hide passwords":"Show passwords"}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
              <div className="password-guidance"><span className={longEnough?"met":""}>8+ characters</span><span className={notNumeric?"met":""}>Not entirely numeric</span><span>Avoid common passwords</span></div>
              {passwordError && <div className="field-message error" role="alert">{passwordError}</div>}
            </div>
            <div className={`field${confirmError ? " has-error" : ""}`}>
              <label htmlFor="reset-confirm">Confirm new password <span className="required-label">Required</span></label>
              <input id="reset-confirm" className={`input${confirmError ? " input-error" : ""}`} type={show?"text":"password"} autoComplete="new-password" value={confirm} onChange={(event)=>{setConfirm(event.target.value);setConfirmError("");}} disabled={working}/>
              <div className={`field-help ${matches?"field-help-success":""}`}>{confirm ? (matches ? "Passwords match." : "Must match the new password.") : "Enter the new password again."}</div>
              {confirmError && <div className="field-message error" role="alert">{confirmError}</div>}
            </div>
            <button className="btn btn-primary btn-lg account-form-submit" type="submit" disabled={working}>{working?"Updating…":"Reset Password"}</button>
          </form>
          <div className="account-form-footer"><a href="/account/forgot-password">Request a new reset link</a></div>
        </>}
      </section>
    </AppShell>
  );
}
