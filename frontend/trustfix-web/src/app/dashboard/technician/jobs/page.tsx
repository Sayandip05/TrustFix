"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, CheckCircle, Clock, Zap, XCircle,
  Loader2, MapPin, Phone, ArrowRight, Calendar,
  Filter, RefreshCw, ChevronDown,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";

interface Job {
  id: string;
  service_title: string;
  status: string;
  scheduled_time?: string;
  created_at: string;
  address?: string;
  price?: number;
  customer_name?: string;
  customer_phone?: string;
  description?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending:     { label: "New",         color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   icon: Clock },
  confirmed:   { label: "Confirmed",   color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: CheckCircle },
  in_progress: { label: "In Progress", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", icon: Zap },
  completed:   { label: "Completed",   color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200",icon: CheckCircle },
  cancelled:   { label: "Cancelled",   color: "text-red-700",    bg: "bg-red-50 border-red-200",       icon: XCircle },
  quote_sent:  { label: "Quote Sent",  color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: ArrowRight },
};

const FILTERS = ["all", "pending", "confirmed", "in_progress", "completed", "cancelled"] as const;
type FilterType = typeof FILTERS[number];
type ViewType = "nearby" | "today" | "upcoming";

export default function TechnicianJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [view, setView] = useState<ViewType>("nearby");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const ENDPOINT_MAP: Record<ViewType, string> = {
    nearby:   "/api/technicians/me/nearby-jobs/",
    today:    "/api/technicians/me/jobs/today/",
    upcoming: "/api/technicians/me/jobs/upcoming/",
  };

  useEffect(() => { loadJobs(); }, [view]);

  const loadJobs = async () => {
    setLoading(true);
    const { data } = await apiFetch<any>(ENDPOINT_MAP[view]);
    if (data) {
      const list = Array.isArray(data) ? data : data.results || [];
      setJobs(list);
    }
    setLoading(false);
  };

  const handleAction = async (jobId: string, action: "accept" | "decline" | "complete") => {
    setActioning(jobId);
    const statusMap = { accept: "confirmed", decline: "cancelled", complete: "completed" };
    await apiFetch(`/api/bookings/${jobId}/status/`, {
      method: "PATCH",
      body: JSON.stringify({ status: statusMap[action] }),
    });
    loadJobs();
    setActioning(null);
  };

  const filtered = filter === "all" ? jobs : jobs.filter(j => j.status === filter);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Queue</h1>
          <p className="text-slate-500 mt-1">{jobs.length} job{jobs.length !== 1 ? "s" : ""} found</p>
        </div>
        <button onClick={loadJobs}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* View Selector */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
        {(["nearby", "today", "upcoming"] as ViewType[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              view === v ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {v === "nearby" ? "New Requests" : v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
              filter === f
                ? "bg-emerald-500 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}>
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">No jobs here</h3>
          <p className="text-slate-400 text-sm">
            {view === "nearby" ? "No new job requests nearby. Make sure you're online." :
             view === "today" ? "No jobs scheduled for today." : "No upcoming jobs yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job, i) => {
            const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === job.id;
            const isActioning = actioning === job.id;

            return (
              <motion.div key={job.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                {/* Job Header */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-800">
                          {job.service_title || "Service Request"}
                        </h3>
                        <span className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-2">
                        {job.customer_name && (
                          <span className="text-slate-500 text-xs">👤 {job.customer_name}</span>
                        )}
                        {job.scheduled_time && (
                          <span className="text-slate-400 text-xs flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(job.scheduled_time).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        {job.address && (
                          <span className="text-slate-400 text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {job.address}
                          </span>
                        )}
                        {job.price && (
                          <span className="text-emerald-600 font-bold text-sm">₹{job.price}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <button onClick={() => setExpandedId(isExpanded ? null : job.id)}
                    className="flex items-center gap-1 mt-3 text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors">
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    {isExpanded ? "Less details" : "More details"}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-50 px-5 py-4 bg-slate-50/50 space-y-3">
                    {job.description && (
                      <p className="text-slate-600 text-sm">{job.description}</p>
                    )}
                    {job.customer_phone && (
                      <a href={`tel:${job.customer_phone}`}
                        className="flex items-center gap-2 text-blue-600 text-sm font-semibold hover:underline">
                        <Phone className="w-4 h-4" /> {job.customer_phone}
                      </a>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {(["pending", "confirmed", "in_progress"].includes(job.status)) && (
                  <div className="border-t border-slate-100 px-5 py-3 flex gap-2">
                    {job.status === "pending" && (
                      <>
                        <button onClick={() => handleAction(job.id, "accept")} disabled={isActioning}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
                          {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Accept
                        </button>
                        <button onClick={() => handleAction(job.id, "decline")} disabled={isActioning}
                          className="flex items-center gap-1.5 px-4 py-2 text-red-500 hover:bg-red-50 text-sm font-semibold rounded-xl transition-colors">
                          <XCircle className="w-3.5 h-3.5" /> Decline
                        </button>
                      </>
                    )}
                    {job.status === "in_progress" && (
                      <button onClick={() => handleAction(job.id, "complete")} disabled={isActioning}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
                        {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Mark Complete
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
