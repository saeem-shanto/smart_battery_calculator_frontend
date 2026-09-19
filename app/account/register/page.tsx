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
    element.focus({ preventScroll: true });
    element.scrollIntoView({ behavior: "smooth", block: "center" });
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

  useEffect(() => { getCurrentUser().then((u)=>{ if(u) window.location.replace("/account/profile"); }).catch(()=>undefined); }, []);

  function update(key: RegisterField, value: string) {
    setForm((current)=>({ ...current, [key]: value }));
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
    if (!form.confirm) next.confirm = "Confirm your password.";
    else if (form.password !== form.confirm) next.confirm = "Passwords do not match.";
    return next;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
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
        const next: FieldErrors = {};
        next.firstName = getApiFieldMessage(caught, "first_name") || undefined;
        next.lastName = getApiFieldMessage(caught, "last_name") || undefined;
        next.username = getApiFieldMessage(caught, "username") || undefined;
        next.email = getApiFieldMessage(caught, "email") || undefined;
        next.password = getApiFieldMessage(caught, "password") || undefined;
        next.confirm = getApiFieldMessage(caught, "confirm_password") || getApiFieldMessage(caught, "password_confirm") || undefined;

        const nonField = getApiFieldMessage(caught, "non_field_errors");
        if (nonField && looksLikePasswordValidation(nonField)) {
          next.password = [next.password, nonField].filter(Boolean).join(" ");
        }

        const cleaned = Object.fromEntries(Object.entries(next).filter(([, value]) => Boolean(value))) as FieldErrors;
        if (Object.keys(cleaned).length > 0) {
          applyErrors(cleaned, "Please correct the highlighted fields and try again.");
        } else {
          setGeneralError(nonField || "We could not create your account. Please review your details and try again.");
        }
      } else {
        setGeneralError(caught instanceof Error ? caught.message : "We could not create your account. Please try again.");
      }
    } finally { setWorking(false); }
  }

  const errorFor = (field: RegisterField) => fieldErrors[field];
  const inputClass = (field: RegisterField) => `input${errorFor(field) ? " input-error" : ""}`;

  return (
    <AppShell>
      <div className="page-header"><h1>Create Account</h1><p>Optional account for cross-session access to retained calculations.</p></div>
      <section className="account-form-card account-form-card-wide">
        <div className="account-form-icon"><UserPlus size={28}/></div>
        <h2>Your account</h2>
        <p className="account-form-intro">You can continue using the calculator as a guest. An account is only needed to own retained calculations and manage a profile picture.</p>
        {generalError && <div className="error-box" role="alert"><strong>Check your details</strong><span>{generalError}</span></div>}
        <form onSubmit={submit} className="account-form" noValidate>
          <div className="form-grid">
            <div className={`field${errorFor("firstName") ? " has-error" : ""}`}>
              <label htmlFor="reg-first">First name</label>
              <input id="reg-first" className={inputClass("firstName")} value={form.firstName} onChange={(e)=>update("firstName",e.target.value)} autoComplete="given-name" aria-invalid={Boolean(errorFor("firstName"))} aria-describedby={errorFor("firstName") ? "reg-first-error" : undefined}/>
              {errorFor("firstName") && <div id="reg-first-error" className="field-message error" role="alert">{errorFor("firstName")}</div>}
            </div>
            <div className={`field${errorFor("lastName") ? " has-error" : ""}`}>
              <label htmlFor="reg-last">Last name</label>
              <input id="reg-last" className={inputClass("lastName")} value={form.lastName} onChange={(e)=>update("lastName",e.target.value)} autoComplete="family-name" aria-invalid={Boolean(errorFor("lastName"))} aria-describedby={errorFor("lastName") ? "reg-last-error" : undefined}/>
              {errorFor("lastName") && <div id="reg-last-error" className="field-message error" role="alert">{errorFor("lastName")}</div>}
            </div>
            <div className={`field${errorFor("username") ? " has-error" : ""}`}>
              <label htmlFor="reg-username">Username</label>
              <div className="login-input-wrap"><UserRound size={18}/><input id="reg-username" className={inputClass("username")} value={form.username} onChange={(e)=>update("username",e.target.value)} autoComplete="username" required aria-invalid={Boolean(errorFor("username"))} aria-describedby={errorFor("username") ? "reg-username-error" : undefined}/></div>
              {errorFor("username") && <div id="reg-username-error" className="field-message error" role="alert">{errorFor("username")}</div>}
            </div>
            <div className={`field${errorFor("email") ? " has-error" : ""}`}>
              <label htmlFor="reg-email">Email</label>
              <input id="reg-email" className={inputClass("email")} type="email" value={form.email} onChange={(e)=>update("email",e.target.value)} autoComplete="email" aria-invalid={Boolean(errorFor("email"))} aria-describedby={errorFor("email") ? "reg-email-error" : undefined}/>
              {errorFor("email") && <div id="reg-email-error" className="field-message error" role="alert">{errorFor("email")}</div>}
            </div>
            <div className={`field${errorFor("password") ? " has-error" : ""}`}>
              <label htmlFor="reg-password">Password</label>
              <div className="login-input-wrap"><LockKeyhole size={18}/><input id="reg-password" className={inputClass("password")} type={showPassword?"text":"password"} value={form.password} onChange={(e)=>update("password",e.target.value)} autoComplete="new-password" required aria-invalid={Boolean(errorFor("password"))} aria-describedby={errorFor("password") ? "reg-password-error" : undefined}/><button className="password-toggle" type="button" onClick={()=>setShowPassword((v)=>!v)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
              {errorFor("password") && <div id="reg-password-error" className="field-message error" role="alert">{errorFor("password")}</div>}
            </div>
            <div className={`field${errorFor("confirm") ? " has-error" : ""}`}>
              <label htmlFor="reg-confirm">Confirm password</label>
              <input id="reg-confirm" className={inputClass("confirm")} type={showPassword?"text":"password"} value={form.confirm} onChange={(e)=>update("confirm",e.target.value)} autoComplete="new-password" required aria-invalid={Boolean(errorFor("confirm"))} aria-describedby={errorFor("confirm") ? "reg-confirm-error" : undefined}/>
              {errorFor("confirm") && <div id="reg-confirm-error" className="field-message error" role="alert">{errorFor("confirm")}</div>}
            </div>
          </div>
          <button className="btn btn-primary btn-lg account-form-submit" type="submit" disabled={working}>{working?"Creating account…":"Create Account"}</button>
        </form>
        <div className="account-form-footer">Already registered? <a href="/account/login">Sign in</a></div>
      </section>
    </AppShell>
  );
}
