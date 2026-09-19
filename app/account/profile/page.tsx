"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, KeyRound, LogOut, Save, Trash2, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  changePassword,
  getCurrentUser,
  logoutUser,
  removeAvatar,
  updateProfile,
  uploadAvatar,
} from "@/lib/account-api";
import type { UserSummary } from "@/lib/types";

const MAX_AVATAR_MB = 5;

export default function ProfilePage() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ username: "", email: "", first_name: "", last_name: "" });
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(Date.now());
  const [avatarWorking, setAvatarWorking] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordWorking, setPasswordWorking] = useState(false);
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
    setProfile({ username: current.username, email: current.email || "", first_name: current.first_name || "", last_name: current.last_name || "" });
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setProfileError(""); setProfileSuccess(""); setSavingProfile(true);
    try {
      const current = await updateProfile({
        username: profile.username.trim(), email: profile.email.trim(), first_name: profile.first_name.trim(), last_name: profile.last_name.trim(),
      });
      applyUser(current);
      setProfileSuccess("Profile updated.");
      window.dispatchEvent(new Event("smart-battery:user-changed"));
    } catch (caught) {
      setProfileError(caught instanceof Error ? caught.message : "Could not update profile.");
    } finally { setSavingProfile(false); }
  }

  async function avatarChanged(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setProfileError(""); setProfileSuccess("");
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) return setProfileError("Profile picture must be JPEG, PNG, or WebP.");
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
    setAvatarWorking(true); setProfileError(""); setProfileSuccess("");
    try {
      const current = await removeAvatar();
      applyUser(current); setAvatarVersion(Date.now()); setProfileSuccess("Profile picture removed.");
      window.dispatchEvent(new Event("smart-battery:user-changed"));
    } catch (caught) { setProfileError(caught instanceof Error ? caught.message : "Could not remove profile picture."); }
    finally { setAvatarWorking(false); }
  }

  async function passwordSubmit(event: FormEvent) {
    event.preventDefault(); setPasswordError("");
    if (passwords.next.length < 8) return setPasswordError("New password must be at least 8 characters.");
    if (passwords.next !== passwords.confirm) return setPasswordError("New passwords do not match.");
    setPasswordWorking(true);
    try {
      await changePassword(passwords.current, passwords.next);
      window.location.replace("/account/login?passwordChanged=1");
    } catch (caught) { setPasswordError(caught instanceof Error ? caught.message : "Could not change password."); }
    finally { setPasswordWorking(false); }
  }

  async function signOut() {
    await logoutUser().catch(() => undefined);
    window.dispatchEvent(new Event("smart-battery:user-changed"));
    window.location.replace("/dashboard");
  }

  if (loading || !user) return <AppShell><div className="loading-inline"><span className="spinner-dark"/> Loading account…</div></AppShell>;

  return (
    <AppShell>
      <div className="page-top-row">
        <div className="page-header"><h1>My Profile</h1><p>Manage your account identity and optional profile picture.</p></div>
        <button className="btn" type="button" onClick={signOut}><LogOut size={18}/> Sign Out</button>
      </div>

      <section className="card page-card-space profile-card">
        <div className="profile-avatar-panel">
          <div className="profile-avatar-large">
            {user.avatar_download_path ? <img src={`/api/account/me/avatar?v=${avatarVersion}`} alt="Profile"/> : <UserRound size={42}/>} 
          </div>
          <div><h2>{user.name}</h2><p>@{user.username}{user.is_staff ? " · Staff account" : ""}</p></div>
          <div className="profile-avatar-actions">
            <input ref={avatarInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={avatarChanged}/>
            <button className="btn" type="button" disabled={avatarWorking} onClick={()=>avatarInput.current?.click()}><Camera size={17}/> {avatarWorking?"Working…":"Change Picture"}</button>
            {user.avatar_download_path && <button className="btn btn-danger" type="button" disabled={avatarWorking} onClick={deleteAvatar}><Trash2 size={17}/> Remove</button>}
          </div>
        </div>
        {(profileError || profileSuccess) && <div className={profileError?"error-box":"success-box"}>{profileError || <><CheckCircle2 size={16}/> {profileSuccess}</>}</div>}
        <form className="account-form profile-form" onSubmit={saveProfile}>
          <div className="form-grid">
            <div className="field"><label htmlFor="profile-first">First name</label><input id="profile-first" className="input" value={profile.first_name} onChange={(e)=>setProfile((v)=>({...v,first_name:e.target.value}))}/></div>
            <div className="field"><label htmlFor="profile-last">Last name</label><input id="profile-last" className="input" value={profile.last_name} onChange={(e)=>setProfile((v)=>({...v,last_name:e.target.value}))}/></div>
            <div className="field"><label htmlFor="profile-username">Username</label><input id="profile-username" className="input" value={profile.username} onChange={(e)=>setProfile((v)=>({...v,username:e.target.value}))} required/></div>
            <div className="field"><label htmlFor="profile-email">Email</label><input id="profile-email" className="input" type="email" value={profile.email} onChange={(e)=>setProfile((v)=>({...v,email:e.target.value}))}/></div>
          </div>
          <div className="profile-form-actions"><button className="btn btn-primary" type="submit" disabled={savingProfile}><Save size={17}/> {savingProfile?"Saving…":"Save Profile"}</button></div>
        </form>
      </section>

      <section className="card page-card-space profile-card">
        <div className="card-header"><div><h2>Change Password</h2><p className="admin-card-subtitle">Changing your password signs out all existing account sessions.</p></div><KeyRound size={22}/></div>
        {passwordError && <div className="error-box profile-inner-alert">{passwordError}</div>}
        <form className="account-form profile-form" onSubmit={passwordSubmit}>
          <div className="form-grid">
            <div className="field"><label htmlFor="password-current">Current password</label><input id="password-current" className="input" type="password" autoComplete="current-password" value={passwords.current} onChange={(e)=>setPasswords((v)=>({...v,current:e.target.value}))} required/></div>
            <div className="field"><label htmlFor="password-next">New password</label><input id="password-next" className="input" type="password" autoComplete="new-password" value={passwords.next} onChange={(e)=>setPasswords((v)=>({...v,next:e.target.value}))} required/></div>
            <div className="field"><label htmlFor="password-confirm">Confirm new password</label><input id="password-confirm" className="input" type="password" autoComplete="new-password" value={passwords.confirm} onChange={(e)=>setPasswords((v)=>({...v,confirm:e.target.value}))} required/></div>
          </div>
          <div className="profile-form-actions"><button className="btn btn-outline-green" type="submit" disabled={passwordWorking}><KeyRound size={17}/> {passwordWorking?"Changing…":"Change Password"}</button></div>
        </form>
      </section>
    </AppShell>
  );
}
