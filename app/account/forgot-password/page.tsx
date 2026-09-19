"use client";

import { FormEvent, useState } from "react";
import { Mail, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ApiRequestError, getApiFieldMessage } from "@/lib/api";
import { requestPasswordReset } from "@/lib/security-api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [working, setWorking] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(""); setSuccess("");
    const cleanEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Enter the email address linked to your account.");
      return;
    }
    setWorking(true);
    try {
      const response = await requestPasswordReset(cleanEmail);
      setSuccess(response.detail || "If an account uses that email address, a reset link has been sent.");
    } catch (caught) {
      if (caught instanceof ApiRequestError) setError(getApiFieldMessage(caught, "email") || caught.message);
      else setError(caught instanceof Error ? caught.message : "The reset email could not be requested.");
    } finally { setWorking(false); }
  }

  return (
    <AppShell>
      <div className="page-header"><h1>Forgot Password</h1><p>Request a secure password reset link by email.</p></div>
      <section className="account-form-card">
        <div className="account-form-icon"><Mail size={28}/></div>
        <h2>Reset your password</h2>
        <p className="account-form-intro">Enter the email address linked to your account. For privacy, the response is the same whether or not an account exists.</p>
        {success && <div className="success-box" role="status"><Mail size={16}/>{success}</div>}
        {error && <div className="error-box" role="alert"><strong>Could not send reset email</strong><span>{error}</span></div>}
        <form className="account-form" onSubmit={submit} noValidate>
          <div className={`field${error ? " has-error" : ""}`}>
            <label htmlFor="forgot-email">Email <span className="required-label">Required</span></label>
            <div className="login-input-wrap"><Mail size={18}/><input id="forgot-email" className={`input${error ? " input-error" : ""}`} type="email" autoComplete="email" value={email} onChange={(event)=>{setEmail(event.target.value);setError("");}} placeholder="you@example.com" autoFocus disabled={working}/></div>
          </div>
          <button className="btn btn-primary btn-lg account-form-submit" type="submit" disabled={working}>{working ? "Sending…" : <><Send size={17}/> Send Reset Link</>}</button>
        </form>
        <div className="account-form-footer"><a href="/account/login">Back to sign in</a> · <a href="/admin/login">Admin sign in</a></div>
      </section>
    </AppShell>
  );
}
