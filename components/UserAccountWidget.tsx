"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, Settings, UserRound } from "lucide-react";
import { getCurrentUser, logoutUser } from "@/lib/account-api";
import { ProtectedAvatar } from "./ProtectedAvatar";
import { hasAuthSession } from "@/lib/backend-client";
import type { UserSummary } from "@/lib/types";

export function UserAccountWidget() {
  const [user, setUser] = useState<UserSummary | null | undefined>(undefined);
  const [accountUnavailable, setAccountUnavailable] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [working, setWorking] = useState(false);

  async function refresh() {
    try {
      const next = await getCurrentUser();
      setUser(next);
      setAccountUnavailable(false);
      setAvatarVersion((value) => value + 1);
    } catch {
      setAccountUnavailable(hasAuthSession("user"));
      setUser(null);
    }
  }

  useEffect(() => {
    void refresh();
    const changed = () => void refresh();
    window.addEventListener("smart-battery:user-changed", changed);
    return () => window.removeEventListener("smart-battery:user-changed", changed);
  }, []);

  async function signOut() {
    if (working) return;
    setWorking(true);
    await logoutUser().catch(() => undefined);
    setUser(null);
    window.dispatchEvent(new Event("smart-battery:user-changed"));
    window.location.assign("/");
  }

  if (user === undefined) {
    return <div className="account-widget account-widget-loading" aria-label="Checking account"><span className="account-avatar-placeholder"><UserRound size={17}/></span><span>Checking account…</span></div>;
  }

  if (!user && accountUnavailable) {
    return (
      <div className="account-widget guest-account-widget" title="The backend account service is temporarily unavailable.">
        <div className="account-avatar-placeholder"><UserRound size={17}/></div>
        <div className="account-widget-copy"><strong>Account unavailable</strong><span>Your browser session is preserved.</span></div>
        <button className="account-icon-link account-retry" type="button" onClick={() => void refresh()} aria-label="Retry account connection" title="Retry">Retry</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="account-widget guest-account-widget">
        <div className="account-avatar-placeholder"><UserRound size={17}/></div>
        <a className="account-widget-copy" href="/account/login"><strong>Guest mode</strong><span>Sign in or create an account.</span></a>
        <a className="account-icon-link" href="/account/login" title="Sign in" aria-label="Sign in"><LogIn size={18}/></a>
      </div>
    );
  }

  return (
    <div className="account-widget account-widget-signed-in">
      <a className="account-avatar" href="/account/profile" aria-label="Open account settings">
        <ProtectedAvatar role="user" enabled={Boolean(user.avatar_download_path)} version={avatarVersion} alt="" fallback={<UserRound size={18}/>} />
      </a>
      <div className="account-widget-copy">
        <a className="account-identity-link" href="/account/profile"><strong>{user.name}</strong><span>@{user.username}</span></a>
        <a className="account-settings-link" href="/account/profile" aria-label="Open account settings">
          <Settings size={13}/>
          <span>Account Settings</span>
        </a>
      </div>
      <button className="account-icon-link" type="button" onClick={signOut} disabled={working} title="Sign out" aria-label="Sign out"><LogOut size={18}/></button>
    </div>
  );
}
