"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Star,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  TrendingUp,
  Zap,
  ArrowRight,
  Phone,
  MessageCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { getUser, apiFetch, TrustFixUser } from "@/lib/auth";

interface Job {
  id: string;
  service_title: string;
  customer_name?: string;
  customer_phone?: string;
  status: string;
  scheduled_time?: string;
  address?: string;
  price?: number;
  created_at: string;
  description?: string;
}

interface TechProfile {
  is_available: boolean;
  rating: number;
  total_reviews: number;
  completed_jobs: number;
  cancelled_jobs: number;
  verification_status: string;
  experience_years: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "New Job", color: "bg-amber-100 text-amber-700", icon: Clock },
  quote_sent: { label: "Quote Sent", color: "bg-blue-100 text-blue-700", icon: ArrowRight },
  confirmed: { label: "Confirmed", color: "bg-indigo-100 text-indigo-700", icon: CheckCircle },
  in_progress: { label: "In Progress", color: "bg-violet-100 text-violet-700", icon: Zap },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
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

export default function TechnicianDashboard() {
  const [user, setUser] = useState<TrustFixUser | null>(null);
  const [profile, setProfile] = useState<TechProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);

  useEffect(() => {
    setUser(getUser());
    loadProfile();
    loadJobs();
  }, []);

  const loadProfile = async () => {
    const { data } = await apiFetch<{ technician_profile: TechProfile }>("/api/users/profile/");
    if (data?.technician_profile) {
      setProfile(data.technician_profile);
    }
  };

  const loadJobs = async () => {
    setLoadingJobs(true);
    const { data } = await apiFetch<{ results?: Job[] } | Job[]>("/api/technicians/me/nearby-jobs/");
    if (data) {
      const list = Array.isArray(data) ? data : (data as any).results || [];
      setJobs(list);
    }
    setLoadingJobs(false);
  };

  const toggleAvailability = async () => {
    if (!profile) return;
    setTogglingAvail(true);
    const { data } = await apiFetch<{ is_available: boolean }>(
      "/api/technicians/me/toggle-availability/",
      { method: "POST" }
    );
    if (data) {
      setProfile((p) => p ? { ...p, is_available: data.is_available } : p);
    }
    setTogglingAvail(false);
  };

  const isAvailable = profile?.is_available ?? false;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const activeJobs = jobs.filter((j) =>
    ["confirmed", "in_progress"].includes(j.status)
  );
  const pendingJobs = jobs.filter((j) => j.status === "pending");

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Greeting + Availability Toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {user?.name?.split(" ")[0] || "Pro"} 👷
          </h1>
          <p className="text-slate-500 mt-1">
            {isAvailable
              ? "You're online — new jobs are coming your way"
              : "You're offline — toggle to start receiving jobs"}
          </p>
        </div>

        {/* Availability Toggle */}
        <motion.button
          onClick={toggleAvailability}
          disabled={togglingAvail}
          whileTap={{ scale: 0.97 }}
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold text-sm transition-all shadow-sm ${
            isAvailable
              ? "bg-emerald-500 text-white hover:bg-emerald-600"
              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
          } disabled:opacity-60`}
        >
          {togglingAvail ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isAvailable ? (
            <ToggleRight className="w-5 h-5" />
          ) : (
            <ToggleLeft className="w-5 h-5" />
          )}
          {isAvailable ? "Online" : "Offline"}
        </motion.button>
      </div>

      {/* Verification Banner */}
      {profile && profile.verification_status !== "verified" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`flex items-center gap-4 p-5 rounded-2xl border ${
            profile.verification_status === "pending"
              ? "bg-amber-50 border-amber-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <AlertCircle
            className={`w-5 h-5 flex-shrink-0 ${
              profile.verification_status === "pending"
                ? "text-amber-500"
                : "text-blue-500"
            }`}
          />
          <div>
            <p
              className={`font-semibold text-sm ${
                profile.verification_status === "pending"
                  ? "text-amber-800"
                  : "text-blue-800"
              }`}
            >
              Verification Status:{" "}
              {profile.verification_status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
            <p
              className={`text-xs mt-0.5 ${
                profile.verification_status === "pending"
                  ? "text-amber-600"
                  : "text-blue-600"
              }`}
            >
              {profile.verification_status === "pending"
                ? "Your profile is under review. You'll start receiving job requests once verified."
                : "Your documents are being reviewed. This usually takes 24-48 hours."}
            </p>
          </div>
          <ShieldCheck className="w-8 h-8 text-slate-300 ml-auto flex-shrink-0" />
        </motion.div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Completed Jobs"
          value={profile?.completed_jobs ?? 0}
          icon={CheckCircle}
          color="bg-emerald-500"
        />
        <StatCard
          label="Rating"
          value={profile ? `${Number(profile.rating).toFixed(1)} ⭐` : "—"}
          sub={`${profile?.total_reviews ?? 0} reviews`}
          icon={Star}
          color="bg-amber-500"
        />
        <StatCard
          label="Active Jobs"
          value={activeJobs.length}
          icon={Zap}
          color="bg-indigo-500"
        />
        <StatCard
          label="Experience"
          value={`${profile?.experience_years ?? 0}yr`}
          sub="Professional"
          icon={Briefcase}
          color="bg-violet-500"
        />
      </div>

      {/* Earnings Quick Summary */}
      <section id="earnings">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Earnings Overview</h2>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-white/70 text-sm">This Month</p>
              <p className="text-3xl font-bold mt-1">₹0</p>
              <p className="text-white/60 text-xs mt-1">0 jobs completed</p>
            </div>
            <div>
              <p className="text-white/70 text-sm">Pending</p>
              <p className="text-3xl font-bold mt-1">₹0</p>
              <p className="text-white/60 text-xs mt-1">awaiting completion</p>
            </div>
            <div>
              <p className="text-white/70 text-sm">Total Earned</p>
              <p className="text-3xl font-bold mt-1">₹0</p>
              <p className="text-white/60 text-xs mt-1">all time</p>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <TrendingUp className="w-4 h-4" />
              Weekly payout every Monday
            </div>
            <button className="text-white text-sm font-semibold flex items-center gap-1 hover:underline">
              View detailed <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Job Queue */}
      <section id="jobs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Job Queue</h2>
          {pendingJobs.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {pendingJobs.length} new request{pendingJobs.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loadingJobs ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-slate-700 font-semibold mb-2">No jobs yet</h3>
            <p className="text-slate-400 text-sm">
              {isAvailable
                ? "You're online! Job requests will appear here as customers book."
                : "Go online to start receiving job requests in your area."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const cfg = statusConfig[job.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-800">
                          {job.service_title || "Service Request"}
                        </h3>
                        <span
                          className={`${cfg.color} text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>

                      {job.description && (
                        <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                          {job.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-3">
                        {job.address && (
                          <span className="text-slate-400 text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.address}
                          </span>
                        )}
                        {job.scheduled_time && (
                          <span className="text-slate-400 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(job.scheduled_time).toLocaleDateString("en-IN")}
                          </span>
                        )}
                        {job.price && (
                          <span className="text-emerald-600 font-semibold text-xs">
                            ₹{job.price}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons for new jobs */}
                      {job.status === "pending" && (
                        <div className="flex gap-2 mt-4">
                          <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors">
                            <CheckCircle className="w-4 h-4" />
                            Accept
                          </button>
                          <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                            <ArrowRight className="w-4 h-4" />
                            Send Quote
                          </button>
                          <button className="flex items-center gap-1.5 px-4 py-2 text-red-400 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors">
                            <XCircle className="w-4 h-4" />
                            Decline
                          </button>
                        </div>
                      )}

                      {/* In Progress Actions */}
                      {job.status === "in_progress" && (
                        <div className="flex gap-2 mt-4">
                          <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors">
                            <CheckCircle className="w-4 h-4" />
                            Mark Complete
                          </button>
                          {job.customer_phone && (
                            <a
                              href={`tel:${job.customer_phone}`}
                              className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-100 transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                              Call Customer
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
