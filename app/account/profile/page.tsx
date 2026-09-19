"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Eye, EyeOff, KeyRound, LogOut, Save, Trash2, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedAvatar } from "@/components/ProtectedAvatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TwoFactorSettings } from "@/components/TwoFactorSettings";
import {
  changePassword,
  getCurrentUser,
  logoutUser,
  removeAvatar,
  updateProfile,
  uploadAvatar,
} from "@/lib/account-api";
import { ApiRequestError, getApiFieldMessage } from "@/lib/api";
import type { UserSummary } from "@/lib/types";

const MAX_AVATAR_MB = 5;
type ProfileField = "username" | "email" | "first_name" | "last_name";
type PasswordField = "current" | "next" | "confirm";
type ProfileErrors = Partial<Record<ProfileField, string>>;
type PasswordErrors = Partial<Record<PasswordField, string>>;

const PROFILE_IDS: Record<ProfileField, string> = {
  first_name: "profile-first",
  last_name: "profile-last",
  username: "profile-username",
  email: "profile-email",
};
const PASSWORD_IDS: Record<PasswordField, string> = {
  current: "password-current",
  next: "password-next",
  confirm: "password-confirm",
};

function focusById(id: string) {
  window.requestAnimationFrame(() => {
    const element = document.getElementById(id) as HTMLInputElement | null;
    if (!element) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ username: "", email: "", first_name: "", last_name: "" });
  const [savedProfile, setSavedProfile] = useState({ username: "", email: "", first_name: "", last_name: "" });
  const [profileFieldErrors, setProfileFieldErrors] = useState<ProfileErrors>({});
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(Date.now());
  const [avatarWorking, setAvatarWorking] = useState(false);
  const [confirmAvatarRemoval, setConfirmAvatarRemoval] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<PasswordErrors>({});
  const [passwordError, setPasswordError] = useState("");
  const [passwordWorking, setPasswordWorking] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCurrentUser().then((current) => {
      if (!current) {
        window.location.replace("/account/login?next=/account/profile");
        return;
      }
      applyUser(current);
      if (new URLSearchParams(window.location.search).get("welcome") === "1") setProfileSuccess("Account created successfully.");
    }).catch(() => window.location.replace("/account/login?next=/account/profile")).finally(() => setLoading(false));
  }, []);

  function applyUser(current: UserSummary) {
    setUser(current);
    const next = { username: current.username, email: current.email || "", first_name: current.first_name || "", last_name: current.last_name || "" };
    setProfile(next);
    setSavedProfile(next);
  }

  function updateProfileField(field: ProfileField, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
    setProfileFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setProfileError("");
  }

  function updatePasswordField(field: PasswordField, value: string) {
    setPasswords((current) => ({ ...current, [field]: value }));
    setPasswordFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setPasswordError("");
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setProfileError(""); setProfileSuccess(""); setProfileFieldErrors({});
    if (!profile.username.trim()) {
      setProfileFieldErrors({ username: "Username is required." });
      focusById(PROFILE_IDS.username);
      return;
    }
    if (profile.email.trim() && !/^\S+@\S+\.\S+$/.test(profile.email.trim())) {
      setProfileFieldErrors({ email: "Enter a valid email address." });
      focusById(PROFILE_IDS.email);
      return;
    }

    setSavingProfile(true);
    try {
      const current = await updateProfile({
        username: profile.username.trim(), email: profile.email.trim(), first_name: profile.first_name.trim(), last_name: profile.last_name.trim(),
      });
      applyUser(current);
      setProfileSuccess("Profile updated.");
      window.dispatchEvent(new Event("smart-battery:user-changed"));
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
          setProfileFieldErrors(cleaned);
          const first = (["first_name", "last_name", "username", "email"] as ProfileField[]).find((field) => cleaned[field]);
          if (first) focusById(PROFILE_IDS[first]);
          setProfileError("Please correct the highlighted fields.");
        } else {
          setProfileError("Could not update your profile. Please try again.");
        }
      } else {
        setProfileError(caught instanceof Error ? caught.message : "Could not update profile.");
      }
    } finally { setSavingProfile(false); }
  }

  async function avatarChanged(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setProfileError(""); setProfileSuccess("");
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) return setProfileError("Profile picture must be JPEG, PNG, or WebP.");
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) return setProfileError(`Profile picture must be ${MAX_AVATAR_MB} MB or smaller.`);
    setAvatarWorking(true);
    try {
      const current = await uploadAvatar(file);
      applyUser(current); setAvatarVersion(Date.now()); setProfileSuccess("Profile picture updated.");
      window.dispatchEvent(new Event("smart-battery:user-changed"));
    } catch (caught) { setProfileError(caught instanceof Error ? caught.message : "Could not upload profile picture."); }
    finally { setAvatarWorking(false); }
  }

  async function deleteAvatar() {
    setConfirmAvatarRemoval(false);
    setAvatarWorking(true); setProfileError(""); setProfileSuccess("");
    try {
      const current = await removeAvatar();
      applyUser(current); setAvatarVersion(Date.now()); setProfileSuccess("Profile picture removed.");
      window.dispatchEvent(new Event("smart-battery:user-changed"));
    } catch (caught) { setProfileError(caught instanceof Error ? caught.message : "Could not remove profile picture."); }
    finally { setAvatarWorking(false); }
  }

  async function passwordSubmit(event: FormEvent) {
    event.preventDefault(); setPasswordError(""); setPasswordFieldErrors({});
    const next: PasswordErrors = {};
    if (!passwords.current) next.current = "Enter your current password.";
    if (passwords.next.length < 8) next.next = "New password must be at least 8 characters.";
    if (!passwords.confirm) next.confirm = "Confirm the new password.";
    else if (passwords.next !== passwords.confirm) next.confirm = "New passwords do not match.";
    if (Object.keys(next).length) {
      setPasswordFieldErrors(next);
      const first = (["current", "next", "confirm"] as PasswordField[]).find((field) => next[field]);
      if (first) focusById(PASSWORD_IDS[first]);
      return;
    }

    setPasswordWorking(true);
    try {
      await changePassword(passwords.current, passwords.next);
      window.location.replace("/account/login?passwordChanged=1");
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
          setPasswordFieldErrors(cleaned);
          const first = (["current", "next", "confirm"] as PasswordField[]).find((field) => cleaned[field]);
          if (first) focusById(PASSWORD_IDS[first]);
          setPasswordError("Please correct the highlighted password field.");
        } else {
          setPasswordError(nonField || "Could not change your password. Please try again.");
        }
      } else {
        setPasswordError(caught instanceof Error ? caught.message : "Could not change password.");
      }
    } finally { setPasswordWorking(false); }
  }

  async function signOut() {
    await logoutUser().catch(() => undefined);
    window.dispatchEvent(new Event("smart-battery:user-changed"));
    window.location.replace("/dashboard");
  }

  if (loading || !user) return <AppShell><div className="loading-inline"><span className="spinner-dark"/> Loading account…</div></AppShell>;

  const pError = (field: ProfileField) => profileFieldErrors[field];
  const pwError = (field: PasswordField) => passwordFieldErrors[field];
  const profileChanged = JSON.stringify(profile) !== JSON.stringify(savedProfile);
  const nextPasswordLongEnough = passwords.next.length >= 8;
  const nextPasswordNotNumeric = Boolean(passwords.next) && !/^\d+$/.test(passwords.next);
  const nextPasswordsMatch = Boolean(passwords.confirm) && passwords.next === passwords.confirm;

  return (
    <AppShell>
      <div className="page-top-row">
        <div className="page-header"><h1>My Profile</h1><p>Manage your account identity and optional profile picture.</p></div>
        <button className="btn" type="button" onClick={signOut}><LogOut size={18}/> Sign Out</button>
      </div>

      <section className="card page-card-space profile-card">
        <div className="profile-avatar-panel">
          <div className="profile-avatar-large">
            <ProtectedAvatar role="user" enabled={Boolean(user.avatar_download_path)} version={avatarVersion} alt="Profile" fallback={<UserRound size={42}/>} />
          </div>
          <div><h2>{user.name}</h2><p>@{user.username}{user.is_staff ? " · Staff account" : ""}</p><span className="field-help">JPEG, PNG or WebP · up to {MAX_AVATAR_MB} MB</span></div>
          <div className="profile-avatar-actions">
            <input ref={avatarInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={avatarChanged}/>
            <button className="btn" type="button" disabled={avatarWorking} onClick={()=>avatarInput.current?.click()}><Camera size={17}/> {avatarWorking?"Working…":"Change Picture"}</button>
            {user.avatar_download_path && <button className="btn btn-danger" type="button" disabled={avatarWorking} onClick={()=>setConfirmAvatarRemoval(true)}><Trash2 size={17}/> Remove</button>}
          </div>
        </div>
        {(profileError || profileSuccess) && <div className={profileError?"error-box":"success-box"} role={profileError?"alert":"status"}>{profileError || <><CheckCircle2 size={16}/> {profileSuccess}</>}</div>}
        <form className="account-form profile-form" onSubmit={saveProfile} noValidate>
          <div className="form-grid">
            <div className={`field${pError("first_name") ? " has-error" : ""}`}><label htmlFor="profile-first">First name</label><input id="profile-first" className={`input${pError("first_name") ? " input-error" : ""}`} value={profile.first_name} onChange={(e)=>updateProfileField("first_name",e.target.value)} aria-invalid={Boolean(pError("first_name"))}/>{pError("first_name") && <div className="field-message error">{pError("first_name")}</div>}</div>
            <div className={`field${pError("last_name") ? " has-error" : ""}`}><label htmlFor="profile-last">Last name</label><input id="profile-last" className={`input${pError("last_name") ? " input-error" : ""}`} value={profile.last_name} onChange={(e)=>updateProfileField("last_name",e.target.value)} aria-invalid={Boolean(pError("last_name"))}/>{pError("last_name") && <div className="field-message error">{pError("last_name")}</div>}</div>
            <div className={`field${pError("username") ? " has-error" : ""}`}><label htmlFor="profile-username">Username</label><input id="profile-username" className={`input${pError("username") ? " input-error" : ""}`} value={profile.username} onChange={(e)=>updateProfileField("username",e.target.value)} required aria-invalid={Boolean(pError("username"))}/>{pError("username") && <div className="field-message error">{pError("username")}</div>}</div>
            <div className={`field${pError("email") ? " has-error" : ""}`}><label htmlFor="profile-email">Email</label><input id="profile-email" className={`input${pError("email") ? " input-error" : ""}`} type="email" value={profile.email} onChange={(e)=>updateProfileField("email",e.target.value)} aria-invalid={Boolean(pError("email"))}/>{pError("email") && <div className="field-message error">{pError("email")}</div>}</div>
          </div>
          <div className="profile-form-actions"><span className="profile-save-state">{profileChanged ? "Unsaved changes" : "Profile is up to date"}</span><button className="btn btn-primary" type="submit" disabled={savingProfile || !profileChanged}><Save size={17}/> {savingProfile?"Saving…":"Save Profile"}</button></div>
        </form>
      </section>

      <TwoFactorSettings role="user" user={user} onUserChanged={(next)=>{ setUser(next); setProfile((current)=>({...current, email: next.email || ""})); setSavedProfile((current)=>({...current, email: next.email || ""})); }} />

      <section className="card page-card-space profile-card">
        <div className="card-header"><div><h2>Change Password</h2><p className="admin-card-subtitle">Changing your password signs out all existing account sessions.</p></div><KeyRound size={22}/></div>
        {passwordError && <div className="error-box profile-inner-alert">{passwordError}</div>}
        <form className="account-form profile-form" onSubmit={passwordSubmit} noValidate>
          <div className="form-grid">
            <div className={`field${pwError("current") ? " has-error" : ""}`}><label htmlFor="password-current">Current password</label><div className="login-input-wrap no-leading-icon"><input id="password-current" className={`input${pwError("current") ? " input-error" : ""}`} type={showPasswords?"text":"password"} autoComplete="current-password" value={passwords.current} onChange={(e)=>updatePasswordField("current",e.target.value)} required aria-invalid={Boolean(pwError("current"))}/><button className="password-toggle" type="button" onClick={()=>setShowPasswords(v=>!v)} aria-label={showPasswords?"Hide passwords":"Show passwords"}>{showPasswords?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{pwError("current") && <div className="field-message error">{pwError("current")}</div>}</div>
            <div className={`field${pwError("next") ? " has-error" : ""}`}><label htmlFor="password-next">New password</label><input id="password-next" className={`input${pwError("next") ? " input-error" : ""}`} type={showPasswords?"text":"password"} autoComplete="new-password" value={passwords.next} onChange={(e)=>updatePasswordField("next",e.target.value)} required aria-invalid={Boolean(pwError("next"))}/><div className="password-guidance"><span className={nextPasswordLongEnough?"met":""}>8+ characters</span><span className={nextPasswordNotNumeric?"met":""}>Not entirely numeric</span><span>Avoid common passwords</span></div>{pwError("next") && <div className="field-message error">{pwError("next")}</div>}</div>
            <div className={`field${pwError("confirm") ? " has-error" : ""}`}><label htmlFor="password-confirm">Confirm new password</label><input id="password-confirm" className={`input${pwError("confirm") ? " input-error" : ""}`} type={showPasswords?"text":"password"} autoComplete="new-password" value={passwords.confirm} onChange={(e)=>updatePasswordField("confirm",e.target.value)} required aria-invalid={Boolean(pwError("confirm"))}/><div className={`field-help ${nextPasswordsMatch?"field-help-success":""}`}>{passwords.confirm ? (nextPasswordsMatch ? "Passwords match." : "Must match the new password.") : "Enter the new password again."}</div>{pwError("confirm") && <div className="field-message error">{pwError("confirm")}</div>}</div>
          </div>
          <div className="profile-form-actions"><button className="btn btn-outline-green" type="submit" disabled={passwordWorking}><KeyRound size={17}/> {passwordWorking?"Changing…":"Change Password"}</button></div>
        </form>
      </section>
      <ConfirmDialog
        open={confirmAvatarRemoval}
        title="Remove profile picture?"
        message="Your current profile picture will be deleted from your account. You can upload another picture at any time."
        confirmLabel="Remove Picture"
        busy={avatarWorking}
        onCancel={()=>setConfirmAvatarRemoval(false)}
        onConfirm={()=>void deleteAvatar()}
      />
    </AppShell>
  );
}
