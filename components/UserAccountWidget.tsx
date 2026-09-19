"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { getCurrentUser, logoutUser } from "@/lib/account-api";
import type { UserSummary } from "@/lib/types";

export function UserAccountWidget() {
  const [user, setUser] = useState<UserSummary | null | undefined>(undefined);
  const [avatarVersion, setAvatarVersion] = useState(0);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
    const refresh = () => {
      getCurrentUser().then((next) => {
        setUser(next);
        setAvatarVersion((value) => value + 1);
      }).catch(() => setUser(null));
    };
    window.addEventListener("smart-battery:user-changed", refresh);
    return () => window.removeEventListener("smart-battery:user-changed", refresh);
  }, []);

  async function signOut() {
    await logoutUser().catch(() => undefined);
    setUser(null);
    window.dispatchEvent(new Event("smart-battery:user-changed"));
    window.location.assign("/dashboard");
  }

  if (user === undefined) {
    return <div className="account-widget account-widget-loading" aria-label="Checking account"><span className="account-avatar-placeholder"><UserRound size={17}/></span><span>Checking account…</span></div>;
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
    <div className="account-widget">
      <a className="account-avatar" href="/account/profile" aria-label="Open profile">
        {user.avatar_download_path
          ? <img src={`/api/account/me/avatar?v=${avatarVersion}`} alt="" />
          : <UserRound size={18}/>
        }
      </a>
      <a className="account-widget-copy" href="/account/profile">
        <strong>{user.name}</strong>
        <span>@{user.username}</span>
      </a>
      <button className="account-icon-link" type="button" onClick={signOut} title="Sign out" aria-label="Sign out"><LogOut size={18}/></button>
    </div>
  );
}
