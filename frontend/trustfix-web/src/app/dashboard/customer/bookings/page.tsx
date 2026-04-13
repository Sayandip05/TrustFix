"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar, CheckCircle, Clock, Zap, XCircle,
  AlertCircle, Package, ChevronRight, Filter,
  Loader2, Star, RefreshCw, MapPin,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";
import Link from "next/link";

interface Booking {
  id: string;
  service_title: string;
  status: string;
  scheduled_time: string;
  created_at: string;
  price?: number;
  technician_name?: string;
  address?: string;
  service_category?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending:     { label: "Pending",     color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   icon: Clock },
  confirmed:   { label: "Confirmed",   color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: CheckCircle },
  in_progress: { label: "In Progress", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", icon: Zap },
  completed:   { label: "Completed",   color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200",icon: CheckCircle },
  cancelled:   { label: "Cancelled",   color: "text-red-700",    bg: "bg-red-50 border-red-200",       icon: XCircle },
};

const FILTERS = ["all", "pending", "confirmed", "in_progress", "completed", "cancelled"] as const;
type FilterType = typeof FILTERS[number];

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [reviewModal, setReviewModal] = useState<{ bookingId: string; open: boolean }>({ bookingId: "", open: false });
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => { loadBookings(); }, []);

  const loadBookings = async () => {
    setLoading(true);
    const { data } = await apiFetch<any>("/api/bookings/my-bookings/");
    if (data) {
      const list = Array.isArray(data) ? data : data.results || [];
      setBookings(list);
    }
    setLoading(false);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;
    await apiFetch(`/api/bookings/${id}/cancel/`, { method: "POST" });
    loadBookings();
  };

  const submitReview = async () => {
    setSubmittingReview(true);
    await apiFetch("/api/bookings/reviews/create/", {
      method: "POST",
      body: JSON.stringify({ booking: reviewModal.bookingId, rating, comment: reviewText }),
    });
    setReviewModal({ bookingId: "", open: false });
    setRating(5); setReviewText("");
    setSubmittingReview(false);
    loadBookings();
  };

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
          <p className="text-slate-500 mt-1">{bookings.length} total booking{bookings.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={loadBookings}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
              filter === f
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}>
            {f === "all" ? `All (${bookings.length})` : f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">No bookings found</h3>
          <p className="text-slate-400 text-sm">
            {filter === "all" ? "You haven't booked any services yet." : `No ${filter.replace("_", " ")} bookings.`}
          </p>
          <Link href="/search"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
            Browse Services
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking, i) => {
            const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            return (
              <motion.div key={booking.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-800 truncate">
                        {booking.service_title || "Service Booking"}
                      </h3>
                      <span className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2">
                      {booking.scheduled_time && (
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(booking.scheduled_time).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                      {booking.technician_name && (
                        <span className="text-slate-400 text-xs">👨‍🔧 {booking.technician_name}</span>
                      )}
                      {booking.address && (
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {booking.address}
                        </span>
                      )}
                      {booking.price && (
                        <span className="text-emerald-600 font-bold text-sm">₹{booking.price}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <Link href={`/booking/${booking.id}`}
                        className="flex items-center gap-1 text-indigo-600 text-xs font-semibold hover:underline">
                        View Details <ChevronRight className="w-3 h-3" />
                      </Link>
                      {booking.status === "completed" && (
                        <button onClick={() => setReviewModal({ bookingId: booking.id, open: true })}
                          className="flex items-center gap-1 text-amber-600 text-xs font-semibold hover:underline ml-3">
                          <Star className="w-3 h-3" /> Rate Service
                        </button>
                      )}
                      {["pending", "confirmed"].includes(booking.status) && (
                        <button onClick={() => handleCancel(booking.id)}
                          className="flex items-center gap-1 text-red-500 text-xs font-semibold hover:underline ml-3">
                          <XCircle className="w-3 h-3" /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Rate Your Experience</h3>
            <div className="flex gap-2 mb-4">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)}
                  className={`text-2xl transition-transform hover:scale-110 ${s <= rating ? "opacity-100" : "opacity-30"}`}>
                  ⭐
                </button>
              ))}
            </div>
            <textarea rows={3} placeholder="Share your experience (optional)..." value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-indigo-400 text-sm resize-none" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setReviewModal({ bookingId: "", open: false })}
                className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={submitReview} disabled={submittingReview}
                className="flex-1 py-2.5 bg-indigo-600 rounded-xl text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Review"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
