"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  LayoutDashboard,
  Calendar,
  Search,
  User,
  LogOut,
  Menu,
  Bell,
  Wrench,
  DollarSign,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { getUser, logout, isAuthenticated, TrustFixUser } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<TrustFixUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
      return;
    }
    const u = getUser();
    setUser(u);

    // Redirect to correct dashboard based on user_type
    if (u && pathname === "/dashboard") {
      router.push(`/dashboard/${u.user_type}`);
    }
  }, [pathname, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isCustomer = user.user_type === "customer";

  const customerNav = [
    { icon: LayoutDashboard, label: "Overview",      href: "/dashboard/customer" },
    { icon: Search,          label: "Find Services", href: "/search" },
    { icon: Calendar,        label: "My Bookings",   href: "/dashboard/customer/bookings" },
    { icon: User,            label: "Profile",       href: "/dashboard/customer/profile" },
  ];

  const technicianNav = [
    { icon: LayoutDashboard, label: "Overview",  href: "/dashboard/technician" },
    { icon: Calendar,        label: "Job Queue", href: "/dashboard/technician/jobs" },
    { icon: DollarSign,      label: "Earnings",  href: "/dashboard/technician/earnings" },
    { icon: User,            label: "Profile",   href: "/dashboard/technician/profile" },
  ];

  const navItems = isCustomer ? customerNav : technicianNav;
  const accentColor = isCustomer ? "indigo" : "emerald";
  const gradientClass = isCustomer
    ? "from-indigo-600 to-violet-700"
    : "from-emerald-500 to-teal-700";

  const Sidebar = () => (
    <div className={`flex flex-col h-full bg-gradient-to-b ${gradientClass}`}>
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">TrustFix</span>
        </Link>
      </div>

      {/* User Card */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {user.profile_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user.name || "User"}</p>
            <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" />
              {isCustomer ? "Customer" : "Professional"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href.split("#")[0];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col flex-shrink-0 shadow-xl">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            className="relative w-64 flex flex-col"
          >
            <Sidebar />
          </motion.aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <h2 className="font-semibold text-slate-800 text-lg">
              {isCustomer ? "Customer Dashboard" : "Professional Dashboard"}
            </h2>
            {user.city && (
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {user.city}
              </p>
            )}
          </div>

          <Link href="/notifications" className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors inline-flex">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Link>

          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center overflow-hidden">
            {user.profile_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">
                {(user.name || "U")[0].toUpperCase()}
              </span>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
