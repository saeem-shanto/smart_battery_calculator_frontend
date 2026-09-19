import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";
export default async function AdminPage(){const store=await cookies();if(!store.get("smart_battery_admin_access")?.value&&!store.get("smart_battery_admin_refresh")?.value)redirect("/admin/login");return <AdminDashboardClient/>;}
