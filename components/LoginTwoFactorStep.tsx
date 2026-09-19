"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import type { TwoFactorChallengeInfo } from "@/lib/security-api";
import { ApiRequestError, getApiFieldMessage } from "@/lib/api";

export function LoginTwoFactorStep({
  challenge,
  working,
  onVerify,
  onResend,
  onBack,
}: {
  challenge: TwoFactorChallengeInfo;
  working: boolean;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<TwoFactorChallengeInfo>;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendRemaining, setResendRemaining] = useState(challenge.resendAfter);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setResendRemaining(challenge.resendAfter);
  }, [challenge.challengeId, challenge.resendAfter]);

  useEffect(() => {
    if (resendRemaining <= 0) return;
    const timer = window.setInterval(() => setResendRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendRemaining]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    try {
      await onVerify(code);
    } catch (caught) {
      if (caught instanceof ApiRequestError) {
        setError(getApiFieldMessage(caught, "code") || caught.message);
      } else {
        setError(caught instanceof Error ? caught.message : "The verification code could not be checked.");
      }
    }
  }

  async function resend() {
    setError("");
    setNotice("");
    setResending(true);
    try {
      const next = await onResend();
      setCode("");
      setResendRemaining(next.resendAfter);
      setNotice(`A new code was sent to ${next.maskedEmail}.`);
    } catch (caught) {
      if (caught instanceof ApiRequestError) setError(getApiFieldMessage(caught, "non_field_errors") || caught.message);
      else setError(caught instanceof Error ? caught.message : "A new code could not be sent.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="two-factor-login-step">
      <div className="account-form-icon"><ShieldCheck size={28}/></div>
      <h2>Check your email</h2>
      <p className="account-form-intro">We sent a 6-digit verification code to <strong>{challenge.maskedEmail}</strong>. Enter it below to finish signing in.</p>
      {notice && <div className="success-box" role="status"><Mail size={16}/>{notice}</div>}
      {error && <div className="error-box" role="alert"><strong>Verification failed</strong><span>{error}</span></div>}
      <form className="account-form" onSubmit={submit} noValidate>
        <div className={`field${error ? " has-error" : ""}`}>
          <label htmlFor="login-otp">Verification code <span className="required-label">Required</span></label>
          <input
            id="login-otp"
            className={`input otp-input${error ? " input-error" : ""}`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
            placeholder="000000"
            autoFocus
            disabled={working}
          />
          <div className="field-help">The code expires in about {Math.max(1, Math.ceil(challenge.expiresIn / 60))} minutes.</div>
        </div>
        <button className="btn btn-primary btn-lg account-form-submit" type="submit" disabled={working || code.length !== 6}>{working ? "Verifying…" : "Verify & Sign In"}</button>
        <div className="two-factor-actions">
          <button className="btn" type="button" onClick={onBack} disabled={working || resending}><ArrowLeft size={16}/> Back</button>
          <button className="btn" type="button" onClick={() => void resend()} disabled={working || resending || resendRemaining > 0}><RefreshCw size={16}/>{resending ? "Sending…" : resendRemaining > 0 ? `Resend in ${resendRemaining}s` : "Resend Code"}</button>
        </div>
      </form>
    </div>
  );
}
