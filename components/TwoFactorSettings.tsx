"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, Mail, ShieldCheck, ShieldOff } from "lucide-react";
import type { AuthRole } from "@/lib/backend-client";
import type { UserSummary } from "@/lib/types";
import { ApiRequestError, getApiFieldMessage } from "@/lib/api";
import {
  beginTwoFactorEnable,
  disableTwoFactor,
  resendTwoFactorCode,
  verifyTwoFactorEnable,
  type TwoFactorChallengeInfo,
} from "@/lib/security-api";

export function TwoFactorSettings({
  role,
  user,
  onUserChanged,
}: {
  role: AuthRole;
  user: UserSummary;
  onUserChanged: (user: UserSummary) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<TwoFactorChallengeInfo | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function startEnable(event: FormEvent) {
    event.preventDefault();
    setError(""); setNotice("");
    if (!user.email) return setError("Add an email address to your profile before enabling two-factor authentication.");
    if (!currentPassword) return setError("Enter your current password to continue.");
    setWorking(true);
    try {
      const next = await beginTwoFactorEnable(role, currentPassword);
      setChallenge(next);
      setCurrentPassword("");
      setNotice(`A 6-digit confirmation code was sent to ${next.maskedEmail}.`);
    } catch (caught) {
      if (caught instanceof ApiRequestError) setError(getApiFieldMessage(caught, "current_password") || getApiFieldMessage(caught, "email") || getApiFieldMessage(caught, "non_field_errors") || caught.message);
      else setError(caught instanceof Error ? caught.message : "Could not start two-factor setup.");
    } finally { setWorking(false); }
  }

  async function verifyEnable(event: FormEvent) {
    event.preventDefault();
    if (!challenge) return;
    setError(""); setNotice("");
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from your email.");
    setWorking(true);
    try {
      const nextUser = await verifyTwoFactorEnable(role, challenge.challengeId, code);
      onUserChanged(nextUser);
      setChallenge(null);
      setCode("");
      setNotice("Two-factor authentication is now enabled. Future logins will require an email code.");
    } catch (caught) {
      if (caught instanceof ApiRequestError) setError(getApiFieldMessage(caught, "code") || caught.message);
      else setError(caught instanceof Error ? caught.message : "Could not enable two-factor authentication.");
    } finally { setWorking(false); }
  }

  async function disable(event: FormEvent) {
    event.preventDefault();
    setError(""); setNotice("");
    if (!currentPassword) return setError("Enter your current password to disable two-factor authentication.");
    setWorking(true);
    try {
      const nextUser = await disableTwoFactor(role, currentPassword);
      onUserChanged(nextUser);
      setCurrentPassword("");
      setNotice("Two-factor authentication has been disabled.");
    } catch (caught) {
      if (caught instanceof ApiRequestError) setError(getApiFieldMessage(caught, "current_password") || caught.message);
      else setError(caught instanceof Error ? caught.message : "Could not disable two-factor authentication.");
    } finally { setWorking(false); }
  }

  async function resend() {
    if (!challenge) return;
    setWorking(true); setError(""); setNotice("");
    try {
      const next = await resendTwoFactorCode(challenge.challengeId);
      setChallenge(next); setCode("");
      setNotice(`A new code was sent to ${next.maskedEmail}.`);
    } catch (caught) {
      if (caught instanceof ApiRequestError) setError(getApiFieldMessage(caught, "non_field_errors") || caught.message);
      else setError(caught instanceof Error ? caught.message : "Could not resend the code.");
    } finally { setWorking(false); }
  }

  return (
    <section className="card page-card-space profile-card security-card">
      <div className="card-header">
        <div>
          <h2>Two-Factor Authentication</h2>
          <p className="admin-card-subtitle">Optional email verification for every login.</p>
        </div>
        {user.two_factor_enabled ? <ShieldCheck size={22}/> : <ShieldOff size={22}/>} 
      </div>
      <div className="security-status-row">
        <span className={`status-badge ${user.two_factor_enabled ? "success" : "muted"}`}>{user.two_factor_enabled ? "Enabled" : "Disabled"}</span>
        <span>{user.two_factor_enabled ? `Login codes are sent to ${user.email}.` : user.email ? "Your password alone is currently used for login." : "Add an email address to your profile before enabling email 2FA."}</span>
      </div>
      {notice && <div className="success-box profile-inner-alert" role="status"><Mail size={16}/>{notice}</div>}
      {error && <div className="error-box profile-inner-alert" role="alert"><strong>Security setting error</strong><span>{error}</span></div>}

      {challenge ? (
        <form className="account-form profile-form" onSubmit={verifyEnable} noValidate>
          <div className="field">
            <label htmlFor={`${role}-2fa-code`}>Confirmation code <span className="required-label">Required</span></label>
            <input id={`${role}-2fa-code`} className="input otp-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event)=>setCode(event.target.value.replace(/\D/g, "").slice(0,6))} placeholder="000000" autoFocus disabled={working}/>
            <div className="field-help">Enter the code sent to {challenge.maskedEmail}. It can only be used once.</div>
          </div>
          <div className="profile-form-actions security-actions">
            <button className="btn" type="button" onClick={()=>void resend()} disabled={working}>Resend Code</button>
            <button className="btn" type="button" onClick={()=>{setChallenge(null);setCode("");setError("");}} disabled={working}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={working || code.length !== 6}><ShieldCheck size={17}/>{working?"Verifying…":"Verify & Enable"}</button>
          </div>
        </form>
      ) : (
        <form className="account-form profile-form" onSubmit={user.two_factor_enabled ? disable : startEnable} noValidate>
          <div className="field">
            <label htmlFor={`${role}-2fa-password`}>Current password <span className="required-label">Required</span></label>
            <div className="login-input-wrap"><LockKeyhole size={18}/><input id={`${role}-2fa-password`} className="input" type="password" autoComplete="current-password" value={currentPassword} onChange={(event)=>{setCurrentPassword(event.target.value);setError("");}} disabled={working}/></div>
            <div className="field-help">Your current password is required before changing this security setting.</div>
          </div>
          <div className="profile-form-actions security-actions">
            <button className={user.two_factor_enabled ? "btn btn-danger" : "btn btn-primary"} type="submit" disabled={working || !currentPassword || (!user.two_factor_enabled && !user.email)}>{user.two_factor_enabled ? <ShieldOff size={17}/> : <ShieldCheck size={17}/>} {working ? "Working…" : user.two_factor_enabled ? "Disable 2FA" : "Enable 2FA"}</button>
          </div>
        </form>
      )}
    </section>
  );
}
