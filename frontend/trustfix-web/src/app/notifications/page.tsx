"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell, CheckCheck, Trash2, Loader2,
  Info, AlertCircle, CheckCircle, Zap, Calendar,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  booking:      { icon: Calendar,     color: "text-indigo-600", bg: "bg-indigo-50" },
  payment:      { icon: CheckCircle,  color: "text-emerald-600",bg: "bg-emerald-50" },
  alert:        { icon: AlertCircle,  color: "text-red-500",    bg: "bg-red-50" },
  system:       { icon: Info,         color: "text-slate-500",  bg: "bg-slate-50" },
  job:          { icon: Zap,          color: "text-amber-600",  bg: "bg-amber-50" },
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const { data } = await apiFetch<any>("/api/notifications/");
    if (data) {
      const list = Array.isArray(data) ? data : data.results || [];
      setNotifications(list);
    }
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await apiFetch(`/api/notifications/${id}/read/`, { method: "PATCH" });
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await apiFetch("/api/notifications/mark-all-read/", { method: "POST" });
    setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await apiFetch(`/api/notifications/${id}/delete/`, { method: "DELETE" });
    setNotifications(ns => ns.filter(n => n.id !== id));
  };

  const displayed = filter === "unread" ? notifications.filter(n => !n.is_read) : notifications;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        {(["all", "unread"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              filter === f ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {f === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-indigo-300" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </h3>
          <p className="text-slate-400 text-sm">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((notif, i) => {
            const cfg = TYPE_CONFIG[notif.notification_type] || TYPE_CONFIG.system;
            const Icon = cfg.icon;
            return (
              <motion.div key={notif.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !notif.is_read && markRead(notif.id)}
                className={`flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer group ${
                  notif.is_read
                    ? "bg-white border-slate-100 hover:border-slate-200"
                    : "bg-indigo-50/40 border-indigo-200 hover:bg-indigo-50"
                }`}>

                {/* Unread dot */}
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                )}

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${!notif.is_read ? "" : "opacity-70"}`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold text-sm ${notif.is_read ? "text-slate-700" : "text-slate-900"}`}>
                      {notif.title}
                    </p>
                    <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(notif.created_at)}</span>
                  </div>
                  <p className="text-slate-500 text-sm mt-0.5 line-clamp-2">{notif.message}</p>
                </div>

                <button onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                  className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
