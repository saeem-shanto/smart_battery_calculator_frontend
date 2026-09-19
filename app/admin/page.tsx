"use client";

import { useEffect, useState } from "react";
import AdminDashboardClient from "./AdminDashboardClient";
import { hasAuthSession } from "@/lib/backend-client";

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!hasAuthSession("admin")) {
      window.location.replace("/admin/login");
      return;
    }
    setReady(true);
  }, []);
  if (!ready) return <main className="admin-login-page"><div className="loading-inline"><span className="spinner-dark"/> Checking administrator session…</div></main>;
  return <AdminDashboardClient/>;
}
