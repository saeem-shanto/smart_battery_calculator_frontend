import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("smart_battery_admin")?.value !== "demo-admin") redirect("/admin/login");
  return <AdminDashboardClient />;
}
