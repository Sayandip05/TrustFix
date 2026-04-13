"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Search,
  Star,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Zap,
  ArrowRight,
  Loader2,
  Package,
  Phone,
} from "lucide-react";
import { getUser, apiFetch, TrustFixUser } from "@/lib/auth";

interface Booking {
  id: string;
  service_title: string;
  status: string;
  scheduled_time: string;
  technician_name?: string;
  price?: number;
  created_at: string;
}

const services = [
  { name: "Plumbing", icon: "🔧", color: "bg-blue-500", desc: "Leaks, taps, drainage", price: "From ₹299" },
  { name: "Electrical", icon: "⚡", color: "bg-yellow-500", desc: "Wiring, switches, fans", price: "From ₹249" },
  { name: "AC Service", icon: "❄️", color: "bg-cyan-500", desc: "Repair, gas refill", price: "From ₹499" },
  { name: "Carpentry", icon: "🪚", color: "bg-amber-600", desc: "Furniture, doors", price: "From ₹399" },
  { name: "Cleaning", icon: "🧹", color: "bg-green-500", desc: "Deep clean, sofa", price: "From ₹599" },
  { name: "Emergency", icon: "🚨", color: "bg-red-500", desc: "15 min response", price: "From ₹499" },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  in_progress: { label: "In Progress", color: "bg-indigo-100 text-indigo-700", icon: Zap },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-slate-400 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export default function CustomerDashboard() {
  const [user, setUser] = useState<TrustFixUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setUser(getUser());
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoadingBookings(true);
    const { data } = await apiFetch<{ results?: Booking[] } | Booking[]>("/api/bookings/my-bookings/");
    if (data) {
      const list = Array.isArray(data) ? data : data.results || [];
      setBookings(list);
    }
    setLoadingBookings(false);
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeBookings = bookings.filter((b) =>
    ["pending", "confirmed", "in_progress"].includes(b.status)
  );
  const completedBookings = bookings.filter((b) => b.status === "completed");

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Greeting Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, {user?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          What home service can we help you with today?
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Bookings" value={activeBookings.length} icon={Calendar} color="bg-indigo-500" />
        <StatCard label="Completed" value={completedBookings.length} icon={CheckCircle} color="bg-emerald-500" />
        <StatCard label="Services Used" value={bookings.length} icon={Package} color="bg-violet-500" />
        <StatCard label="Rating Given" value="4.8" sub="avg across services" icon={Star} color="bg-amber-500" />
      </div>

      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <section id="bookings">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Active Bookings</h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">
              {activeBookings.length} active
            </span>
          </div>
          <div className="space-y-3">
            {activeBookings.map((booking) => {
              const cfg = statusConfig[booking.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">
                      {booking.service_title || "Service Booking"}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {booking.scheduled_time
                          ? new Date(booking.scheduled_time).toLocaleDateString("en-IN")
                          : "Scheduled"}
                      </span>
                      {booking.technician_name && (
                        <span className="text-slate-400 text-xs">
                          with {booking.technician_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 ${cfg.color} px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Service Search */}
      <section id="services">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Book a Service</h2>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 flex items-center gap-3 mb-5">
          <Search className="w-5 h-5 text-slate-400 ml-3" />
          <input
            type="text"
            placeholder="Search for a service (e.g. plumbing, AC repair)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 py-2.5 outline-none text-slate-700 placeholder:text-slate-400 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-2 text-slate-400 hover:text-slate-600 text-sm"
            >
              Clear
            </button>
          )}
        </div>

        {/* Service Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {filteredServices.map((service, i) => (
            <motion.button
              key={service.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all text-left group"
            >
              <div
                className={`w-12 h-12 ${service.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}
              >
                <span className="text-xl">{service.icon}</span>
              </div>
              <p className="font-semibold text-slate-800 text-sm">{service.name}</p>
              <p className="text-slate-400 text-xs mt-0.5">{service.desc}</p>
              <p className="text-indigo-600 font-semibold text-xs mt-2">{service.price}</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Past Bookings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Recent Bookings</h2>
        </div>

        {loadingBookings ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-slate-700 font-semibold mb-2">No bookings yet</h3>
            <p className="text-slate-400 text-sm">
              Book your first home service above and get it done today!
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {bookings.slice(0, 5).map((booking, i) => {
              const cfg = statusConfig[booking.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={booking.id}
                  className={`flex items-center gap-4 p-4 ${
                    i !== bookings.slice(0, 5).length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">
                      {booking.service_title || "Service Booking"}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {new Date(booking.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {booking.price && (
                    <span className="text-slate-700 font-semibold text-sm">
                      ₹{booking.price}
                    </span>
                  )}
                  <span className={`${cfg.color} text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
