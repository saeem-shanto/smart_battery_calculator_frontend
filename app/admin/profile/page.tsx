"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Camera, KeyRound, Save, Trash2, UserRound } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProtectedAvatar } from "@/components/ProtectedAvatar";
import {
  changeAdminPassword,
  getAdminProfile,
  logoutAdmin,
  removeAdminAvatar,
  updateAdminProfile,
  uploadAdminAvatar,
} from "@/lib/admin-api";
import { ApiRequestError, getApiFieldMessage } from "@/lib/api";
import { hasAuthSession } from "@/lib/backend-client";
import type { UserSummary } from "@/lib/types";

const MAX_AVATAR_MB = 5;
type ProfileField = "username" | "email" | "first_name" | "last_name";
type PasswordField = "current" | "next" | "confirm";
type ProfileErrors = Partial<Record<ProfileField, string>>;
type PasswordErrors = Partial<Record<PasswordField, string>>;

const PROFILE_IDS: Record<ProfileField, string> = {
  first_name: "admin-profile-first",
  last_name: "admin-profile-last",
  username: "admin-profile-username",
  email: "admin-profile-email",
};
const PASSWORD_IDS: Record<PasswordField, string> = {
  current: "admin-password-current",
  next: "admin-password-next",
  confirm: "admin-password-confirm",
};

function focusById(id: string) {
  window.requestAnimationFrame(() => {
    const element = document.getElementById(id) as HTMLInputElement | null;
    if (!element) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export default function AdminProfilePage() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [form, setForm] = useState({ username: "", email: "", first_name: "", last_name: "" });
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(Date.now());
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordWorking, setPasswordWorking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasAuthSession("admin")) {
      window.location.replace("/admin/login");
      return;
    }
    getAdminProfile().then(apply).catch((e) => setError(e instanceof Error ? e.message : "Could not load profile."));
  }, []);

  function apply(next: UserSummary) {
    setUser(next);
    setForm({ username: next.username, email: next.email || "", first_name: next.first_name || "", last_name: next.last_name || "" });
  }

  function updateProfileField(field: ProfileField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setProfileErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setError("");
  }

  function updatePasswordField(field: PasswordField, value: string) {
    setPasswords((current) => ({ ...current, [field]: value }));
    setPasswordErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setError("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setWorking(true); setError(""); setMessage(""); setProfileErrors({});
    try {
      const next = await updateAdminProfile({
        ...form,
        username: form.username.trim(),
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });
      apply(next); setMessage("Admin profile updated.");
    } catch (caught) {
      if (caught instanceof ApiRequestError) {
        const next: ProfileErrors = {
          username: getApiFieldMessage(caught, "username") || undefined,
          email: getApiFieldMessage(caught, "email") || undefined,
          first_name: getApiFieldMessage(caught, "first_name") || undefined,
          last_name: getApiFieldMessage(caught, "last_name") || undefined,
        };
        const cleaned = Object.fromEntries(Object.entries(next).filter(([, value]) => Boolean(value))) as ProfileErrors;
        if (Object.keys(cleaned).length) {
          setProfileErrors(cleaned);
          const first = (["first_name", "last_name", "username", "email"] as ProfileField[]).find((field) => cleaned[field]);
          if (first) focusById(PROFILE_IDS[first]);
          setError("Please correct the highlighted fields.");
        } else setError("Could not update the admin profile. Please try again.");
      } else setError(caught instanceof Error ? caught.message : "Could not update profile.");
    } finally { setWorking(false); }
  }

  async function avatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    setError(""); setMessage("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Profile picture must be JPEG, PNG, or WebP.");
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) return setError(`Profile picture must be ${MAX_AVATAR_MB} MB or smaller.`);
    setWorking(true);
    try {
      const next = await uploadAdminAvatar(file); apply(next); setAvatarVersion(Date.now()); setMessage("Profile picture updated.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Avatar upload failed."); }
    finally { setWorking(false); }
  }

  async function removeAvatar() {
    setWorking(true); setError(""); setMessage("");
    try {
      const next = await removeAdminAvatar(); apply(next); setAvatarVersion(Date.now()); setMessage("Profile picture removed.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not remove avatar."); }
    finally { setWorking(false); }
  }

  async function change(event: FormEvent) {
    event.preventDefault(); setError(""); setPasswordErrors({});
    const next: PasswordErrors = {};
    if (!passwords.current) next.current = "Enter the current password.";
    if (passwords.next.length < 8) next.next = "New password must be at least 8 characters.";
    if (!passwords.confirm) next.confirm = "Confirm the new password.";
    else if (passwords.next !== passwords.confirm) next.confirm = "New passwords do not match.";
    if (Object.keys(next).length) {
      setPasswordErrors(next);
      const first = (["current", "next", "confirm"] as PasswordField[]).find((field) => next[field]);
      if (first) focusById(PASSWORD_IDS[first]);
      return;
    }

    setPasswordWorking(true);
    try {
      await changeAdminPassword(passwords.current, passwords.next);
      window.location.replace("/admin/login?passwordChanged=1");
    } catch (caught) {
      if (caught instanceof ApiRequestError) {
        const apiErrors: PasswordErrors = {
          current: getApiFieldMessage(caught, "current_password") || undefined,
          next: getApiFieldMessage(caught, "new_password") || getApiFieldMessage(caught, "password") || undefined,
        };
        const nonField = getApiFieldMessage(caught, "non_field_errors");
        if (nonField && /password|common|numeric|similar|short/i.test(nonField)) apiErrors.next = [apiErrors.next, nonField].filter(Boolean).join(" ");
        const cleaned = Object.fromEntries(Object.entries(apiErrors).filter(([, value]) => Boolean(value))) as PasswordErrors;
        if (Object.keys(cleaned).length) {
          setPasswordErrors(cleaned);
          const first = (["current", "next", "confirm"] as PasswordField[]).find((field) => cleaned[field]);
          if (first) focusById(PASSWORD_IDS[first]);
          setError("Please correct the highlighted password field.");
        } else setError(nonField || "Could not change the password. Please try again.");
      } else setError(caught instanceof Error ? caught.message : "Could not change password.");
    } finally { setPasswordWorking(false); }
  }

  async function logout() {
    await logoutAdmin().catch(() => undefined);
    window.location.replace("/admin/login?loggedOut=1");
  }

  const pError = (field: ProfileField) => profileErrors[field];
  const pwError = (field: PasswordField) => passwordErrors[field];

  return <AdminShell onLogout={logout} active="profile">
    <div className="page-header"><h1>Admin Profile</h1><p>Manage the staff account identity used by the administration portal.</p></div>
    {error && <div className="error-box admin-message">{error}</div>}
    {message && <div className="success-box admin-message">{message}</div>}
    {!user ? <div className="loading-inline"><span className="spinner-dark"/> Loading profile…</div> : <>
      <section className="card page-card-space profile-card">
        <div className="profile-avatar-panel">
          <div className="profile-avatar-large"><ProtectedAvatar role="admin" enabled={Boolean(user.avatar_download_path)} version={avatarVersion} alt="Admin profile" fallback={<UserRound size={42}/>} /></div>
          <div><h2>{user.name}</h2><p>@{user.username} · Administrator</p></div>
          <div className="profile-avatar-actions">
            <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={avatar}/>
            <button className="btn" type="button" onClick={() => fileRef.current?.click()} disabled={working}><Camera size={17}/> Change Picture</button>
            {user.avatar_download_path && <button className="btn btn-danger" type="button" onClick={removeAvatar} disabled={working}><Trash2 size={17}/> Remove</button>}
          </div>
        </div>
        <form className="account-form profile-form" onSubmit={save} noValidate>
          <div className="form-grid">
            <div className={`field${pError("first_name") ? " has-error" : ""}`}><label htmlFor="admin-profile-first">First name</label><input id="admin-profile-first" className={`input${pError("first_name") ? " input-error" : ""}`} value={form.first_name} onChange={e => updateProfileField("first_name",e.target.value)} aria-invalid={Boolean(pError("first_name"))}/>{pError("first_name") && <div className="field-message error">{pError("first_name")}</div>}</div>
            <div className={`field${pError("last_name") ? " has-error" : ""}`}><label htmlFor="admin-profile-last">Last name</label><input id="admin-profile-last" className={`input${pError("last_name") ? " input-error" : ""}`} value={form.last_name} onChange={e => updateProfileField("last_name",e.target.value)} aria-invalid={Boolean(pError("last_name"))}/>{pError("last_name") && <div className="field-message error">{pError("last_name")}</div>}</div>
            <div className={`field${pError("username") ? " has-error" : ""}`}><label htmlFor="admin-profile-username">Username</label><input id="admin-profile-username" className={`input${pError("username") ? " input-error" : ""}`} value={form.username} onChange={e => updateProfileField("username",e.target.value)} aria-invalid={Boolean(pError("username"))}/>{pError("username") && <div className="field-message error">{pError("username")}</div>}</div>
            <div className={`field${pError("email") ? " has-error" : ""}`}><label htmlFor="admin-profile-email">Email</label><input id="admin-profile-email" className={`input${pError("email") ? " input-error" : ""}`} type="email" value={form.email} onChange={e => updateProfileField("email",e.target.value)} aria-invalid={Boolean(pError("email"))}/>{pError("email") && <div className="field-message error">{pError("email")}</div>}</div>
          </div>
          <div className="profile-form-actions"><button className="btn btn-primary" disabled={working}><Save size={17}/> {working ? "Saving…" : "Save Profile"}</button></div>
        </form>
      </section>
      <section className="card page-card-space profile-card">
        <div className="card-header"><div><h2>Change Password</h2><p className="admin-card-subtitle">Changing your password revokes existing backend refresh tokens.</p></div><KeyRound size={22}/></div>
        <form className="account-form profile-form" onSubmit={change} noValidate>
          <div className="form-grid">
            <div className={`field${pwError("current") ? " has-error" : ""}`}><label htmlFor="admin-password-current">Current password</label><input id="admin-password-current" className={`input${pwError("current") ? " input-error" : ""}`} type="password" value={passwords.current} onChange={e=>updatePasswordField("current",e.target.value)} required aria-invalid={Boolean(pwError("current"))}/>{pwError("current") && <div className="field-message error">{pwError("current")}</div>}</div>
            <div className={`field${pwError("next") ? " has-error" : ""}`}><label htmlFor="admin-password-next">New password</label><input id="admin-password-next" className={`input${pwError("next") ? " input-error" : ""}`} type="password" value={passwords.next} onChange={e=>updatePasswordField("next",e.target.value)} required aria-invalid={Boolean(pwError("next"))}/>{pwError("next") && <div className="field-message error">{pwError("next")}</div>}</div>
            <div className={`field${pwError("confirm") ? " has-error" : ""}`}><label htmlFor="admin-password-confirm">Confirm new password</label><input id="admin-password-confirm" className={`input${pwError("confirm") ? " input-error" : ""}`} type="password" value={passwords.confirm} onChange={e=>updatePasswordField("confirm",e.target.value)} required aria-invalid={Boolean(pwError("confirm"))}/>{pwError("confirm") && <div className="field-message error">{pwError("confirm")}</div>}</div>
          </div>
          <div className="profile-form-actions"><button className="btn btn-outline-green" type="submit" disabled={passwordWorking}><KeyRound size={17}/> {passwordWorking ? "Changing…" : "Change Password"}</button></div>
        </form>
      </section>
    </>}
  </AdminShell>;
}
