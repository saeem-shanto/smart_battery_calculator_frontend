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
import { hasAuthSession } from "@/lib/backend-client";
import type { UserSummary } from "@/lib/types";

const MAX_AVATAR_MB = 5;

export default function AdminProfilePage() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [form, setForm] = useState({ username: "", email: "", first_name: "", last_name: "" });
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

  async function save(event: FormEvent) {
    event.preventDefault();
    setWorking(true); setError(""); setMessage("");
    try {
      const next = await updateAdminProfile(form);
      apply(next); setMessage("Admin profile updated.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not update profile."); }
    finally { setWorking(false); }
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
    event.preventDefault(); setError("");
    if (passwords.next.length < 8) return setError("New password must be at least 8 characters.");
    if (passwords.next !== passwords.confirm) return setError("New passwords do not match.");
    setPasswordWorking(true);
    try {
      await changeAdminPassword(passwords.current, passwords.next);
      window.location.replace("/admin/login?passwordChanged=1");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not change password."); }
    finally { setPasswordWorking(false); }
  }

  async function logout() {
    await logoutAdmin().catch(() => undefined);
    window.location.replace("/admin/login?loggedOut=1");
  }

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
        <form className="account-form profile-form" onSubmit={save}>
          <div className="form-grid">
            <div className="field"><label>First name</label><input className="input" value={form.first_name} onChange={e => setForm(v => ({...v, first_name:e.target.value}))}/></div>
            <div className="field"><label>Last name</label><input className="input" value={form.last_name} onChange={e => setForm(v => ({...v, last_name:e.target.value}))}/></div>
            <div className="field"><label>Username</label><input className="input" value={form.username} onChange={e => setForm(v => ({...v, username:e.target.value}))}/></div>
            <div className="field"><label>Email</label><input className="input" type="email" value={form.email} onChange={e => setForm(v => ({...v, email:e.target.value}))}/></div>
          </div>
          <div className="profile-form-actions"><button className="btn btn-primary" disabled={working}><Save size={17}/> {working ? "Saving…" : "Save Profile"}</button></div>
        </form>
      </section>
      <section className="card page-card-space profile-card">
        <div className="card-header"><div><h2>Change Password</h2><p className="admin-card-subtitle">Changing your password revokes existing backend refresh tokens.</p></div><KeyRound size={22}/></div>
        <form className="account-form profile-form" onSubmit={change}>
          <div className="form-grid">
            <div className="field"><label>Current password</label><input className="input" type="password" value={passwords.current} onChange={e=>setPasswords(v=>({...v,current:e.target.value}))} required/></div>
            <div className="field"><label>New password</label><input className="input" type="password" value={passwords.next} onChange={e=>setPasswords(v=>({...v,next:e.target.value}))} required/></div>
            <div className="field"><label>Confirm new password</label><input className="input" type="password" value={passwords.confirm} onChange={e=>setPasswords(v=>({...v,confirm:e.target.value}))} required/></div>
          </div>
          <div className="profile-form-actions"><button className="btn btn-outline-green" type="submit" disabled={passwordWorking}><KeyRound size={17}/> {passwordWorking ? "Changing…" : "Change Password"}</button></div>
        </form>
      </section>
    </>}
  </AdminShell>;
}
