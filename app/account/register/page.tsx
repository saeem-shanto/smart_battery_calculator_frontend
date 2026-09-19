"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, UserPlus, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser, registerUser } from "@/lib/account-api";
import { ApiRequestError, getApiFieldMessage } from "@/lib/api";

type RegisterField = "firstName" | "lastName" | "username" | "email" | "password" | "confirm";
type FieldErrors = Partial<Record<RegisterField, string>>;

const FIELD_IDS: Record<RegisterField, string> = {
  firstName: "reg-first",
  lastName: "reg-last",
  username: "reg-username",
  email: "reg-email",
  password: "reg-password",
  confirm: "reg-confirm",
};

function focusField(field: RegisterField) {
  window.requestAnimationFrame(() => {
    const element = document.getElementById(FIELD_IDS[field]) as HTMLInputElement | null;
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => element.focus({ preventScroll: true }), 220);
  });
}

function looksLikePasswordValidation(message: string) {
  return /password|common|numeric|similar|short|character/i.test(message);
}

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", firstName: "", lastName: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => { getCurrentUser().then((u) => { if (u) window.location.replace("/account/profile"); }).catch(() => undefined); }, []);

  function update(key: RegisterField, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setGeneralError("");
  }

  function applyErrors(next: FieldErrors, general = "") {
    setFieldErrors(next);
    setGeneralError(general);
    const first = (["firstName", "lastName", "username", "email", "password", "confirm"] as RegisterField[]).find((field) => Boolean(next[field]));
    if (first) focusField(first);
  }

  function validateClientSide(): FieldErrors {
    const next: FieldErrors = {};
    const username = form.username.trim();
    const email = form.email.trim();
    if (username.length < 3) next.username = "Username must be at least 3 characters.";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
    else if (/^\d+$/.test(form.password)) next.password = "Password cannot be entirely numeric.";
    if (!form.confirm) next.confirm = "Confirm your password.";
    else if (form.password !== form.confirm) next.confirm = "Passwords do not match.";
    return next;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (working) return;
    setGeneralError("");
    const localErrors = validateClientSide();
    if (Object.keys(localErrors).length > 0) {
      applyErrors(localErrors, "Please correct the highlighted fields and try again.");
      return;
    }

    setFieldErrors({});
    setWorking(true);
    try {
      await registerUser({
        username: form.username.trim(),
        email: form.email.trim(),
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        password: form.password,
      });
      window.dispatchEvent(new Event("smart-battery:user-changed"));
      window.location.replace("/account/profile?welcome=1");
    } catch (caught) {
      if (caught instanceof ApiRequestError) {
        const next: FieldErrors = {
          firstName: getApiFieldMessage(caught, "first_name") || undefined,
          lastName: getApiFieldMessage(caught, "last_name") || undefined,
          username: getApiFieldMessage(caught, "username") || undefined,
          email: getApiFieldMessage(caught, "email") || undefined,
          password: getApiFieldMessage(caught, "password") || undefined,
          confirm: getApiFieldMessage(caught, "confirm_password") || getApiFieldMessage(caught, "password_confirm") || undefined,
        };
        const nonField = getApiFieldMessage(caught, "non_field_errors");
        if (nonField && looksLikePasswordValidation(nonField)) next.password = [next.password, nonField].filter(Boolean).join(" ");
        const cleaned = Object.fromEntries(Object.entries(next).filter(([, value]) => Boolean(value))) as FieldErrors;
        if (Object.keys(cleaned).length > 0) applyErrors(cleaned, "Please correct the highlighted fields and try again.");
        else setGeneralError(nonField || "We could not create your account. Please review your details and try again.");
      } else {
        setGeneralError(caught instanceof Error ? caught.message : "We could not create your account. Please try again.");
      }
    } finally {
      setWorking(false);
    }
  }

  const errorFor = (field: RegisterField) => fieldErrors[field];
  const inputClass = (field: RegisterField) => `input${errorFor(field) ? " input-error" : ""}`;
  const passwordLongEnough = form.password.length >= 8;
  const passwordNotNumeric = Boolean(form.password) && !/^\d+$/.test(form.password);
  const passwordsMatch = Boolean(form.confirm) && form.password === form.confirm;

  return (
    <AppShell>
      <div className="page-header"><h1>Create Account</h1><p>Optional account for cross-session access to retained calculations, password recovery and email security.</p></div>
      <section className="account-form-card account-form-card-wide">
        <div className="account-form-icon"><UserPlus size={28}/></div>
        <h2>Your account</h2>
        <p className="account-form-intro">You can continue using the calculator as a guest. Add an email if you want password recovery or optional email two-factor authentication.</p>
        {generalError && <div className="error-box" role="alert"><strong>Check your details</strong><span>{generalError}</span></div>}
        <form onSubmit={submit} className="account-form" noValidate>
          <div className="form-grid">
            <div className={`field${errorFor("firstName") ? " has-error" : ""}`}>
              <label htmlFor="reg-first">First name <span className="optional-label">Optional</span></label>
              <input id="reg-first" className={inputClass("firstName")} value={form.firstName} onChange={(e) => update("firstName", e.target.value)} autoComplete="given-name" maxLength={150} aria-invalid={Boolean(errorFor("firstName"))} aria-describedby={errorFor("firstName") ? "reg-first-error" : undefined}/>
              {errorFor("firstName") && <div id="reg-first-error" className="field-message error" role="alert">{errorFor("firstName")}</div>}
            </div>
            <div className={`field${errorFor("lastName") ? " has-error" : ""}`}>
              <label htmlFor="reg-last">Last name <span className="optional-label">Optional</span></label>
              <input id="reg-last" className={inputClass("lastName")} value={form.lastName} onChange={(e) => update("lastName", e.target.value)} autoComplete="family-name" maxLength={150} aria-invalid={Boolean(errorFor("lastName"))} aria-describedby={errorFor("lastName") ? "reg-last-error" : undefined}/>
              {errorFor("lastName") && <div id="reg-last-error" className="field-message error" role="alert">{errorFor("lastName")}</div>}
            </div>
            <div className={`field${errorFor("username") ? " has-error" : ""}`}>
              <label htmlFor="reg-username">Username <span className="required-label">Required</span></label>
              <div className="login-input-wrap"><UserRound size={18}/><input id="reg-username" className={inputClass("username")} value={form.username} onChange={(e) => update("username", e.target.value)} autoComplete="username" maxLength={150} required aria-invalid={Boolean(errorFor("username"))} aria-describedby={errorFor("username") ? "reg-username-error" : "reg-username-help"}/></div>
              <div id="reg-username-help" className="field-help">At least 3 characters. This is used to sign in.</div>
              {errorFor("username") && <div id="reg-username-error" className="field-message error" role="alert">{errorFor("username")}</div>}
            </div>
            <div className={`field${errorFor("email") ? " has-error" : ""}`}>
              <label htmlFor="reg-email">Email <span className="optional-label">Recommended</span></label>
              <input id="reg-email" className={inputClass("email")} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" maxLength={254} aria-invalid={Boolean(errorFor("email"))} aria-describedby={errorFor("email") ? "reg-email-error" : "reg-email-help"}/>
              <div id="reg-email-help" className="field-help">Used for password recovery and optional login verification codes.</div>
              {errorFor("email") && <div id="reg-email-error" className="field-message error" role="alert">{errorFor("email")}</div>}
            </div>
            <div className={`field${errorFor("password") ? " has-error" : ""}`}>
              <label htmlFor="reg-password">Password <span className="required-label">Required</span></label>
              <div className="login-input-wrap"><LockKeyhole size={18}/><input id="reg-password" className={inputClass("password")} type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} autoComplete="new-password" required aria-invalid={Boolean(errorFor("password"))} aria-describedby={errorFor("password") ? "reg-password-error" : "reg-password-help"}/><button className="password-toggle" type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
              <div id="reg-password-help" className="password-guidance" aria-live="polite"><span className={passwordLongEnough ? "met" : ""}>8+ characters</span><span className={passwordNotNumeric ? "met" : ""}>Not entirely numeric</span><span>Avoid common or easily guessed passwords</span></div>
              {errorFor("password") && <div id="reg-password-error" className="field-message error" role="alert">{errorFor("password")}</div>}
            </div>
            <div className={`field${errorFor("confirm") ? " has-error" : ""}`}>
              <label htmlFor="reg-confirm">Confirm password <span className="required-label">Required</span></label>
              <input id="reg-confirm" className={inputClass("confirm")} type={showPassword ? "text" : "password"} value={form.confirm} onChange={(e) => update("confirm", e.target.value)} autoComplete="new-password" required aria-invalid={Boolean(errorFor("confirm"))} aria-describedby={errorFor("confirm") ? "reg-confirm-error" : "reg-confirm-help"}/>
              <div id="reg-confirm-help" className={`field-help ${passwordsMatch ? "field-help-success" : ""}`}>{form.confirm ? (passwordsMatch ? "Passwords match." : "Must match the password above.") : "Enter the same password again."}</div>
              {errorFor("confirm") && <div id="reg-confirm-error" className="field-message error" role="alert">{errorFor("confirm")}</div>}
            </div>
          </div>
          <button className="btn btn-primary btn-lg account-form-submit" type="submit" disabled={working}>{working ? "Creating account…" : "Create Account"}</button>
        </form>
        <div className="account-form-footer">Already registered? <a href="/account/login">Sign in</a> · <a href="/dashboard">Continue as guest</a></div>
      </section>
    </AppShell>
  );
}
