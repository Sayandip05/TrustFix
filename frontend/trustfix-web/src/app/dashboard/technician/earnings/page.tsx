"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, Loader2, ArrowUpRight,
  ArrowDownRight, Calendar, Wallet, CreditCard,
  CheckCircle, Clock, AlertCircle, Save,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";

interface EarningsSummary {
  total_earned: number;
  this_month: number;
  this_week: number;
  pending_payout: number;
  completed_jobs: number;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  period_start: string;
  period_end: string;
}

interface BankAccount {
  account_holder: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
}

function StatCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string; sub?: string;
  icon: typeof DollarSign; color: string; trend?: "up" | "down";
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-slate-400 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
          {trend === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {trend === "up" ? "Higher than last month" : "Lower than last month"}
        </div>
      )}
    </motion.div>
  );
}

export default function TechnicianEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [bank, setBank] = useState<BankAccount>({ account_holder: "", account_number: "", ifsc_code: "", bank_name: "" });
  const [loading, setLoading] = useState(true);
  const [savingBank, setSavingBank] = useState(false);
  const [bankSuccess, setBankSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "payouts" | "bank">("overview");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [earningsRes, payoutsRes, bankRes] = await Promise.all([
      apiFetch<EarningsSummary>("/api/technicians/me/earnings/"),
      apiFetch<Payout[]>("/api/payments/payouts/my/"),
      apiFetch<BankAccount>("/api/payments/bank-account/"),
    ]);
    if (earningsRes.data) setSummary(earningsRes.data);
    if (payoutsRes.data) setPayouts(Array.isArray(payoutsRes.data) ? payoutsRes.data : []);
    if (bankRes.data) setBank(bankRes.data);
    setLoading(false);
  };

  const saveBank = async () => {
    setSavingBank(true);
    const method = bank.account_number ? "PUT" : "POST";
    await apiFetch("/api/payments/bank-account/", {
      method,
      body: JSON.stringify(bank),
    });
    setBankSuccess("Bank account saved!");
    setTimeout(() => setBankSuccess(""), 3000);
    setSavingBank(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-slate-800 placeholder:text-slate-400";

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
        <p className="text-slate-500 mt-1">Track your income and payouts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Earned" value={`₹${summary?.total_earned?.toLocaleString("en-IN") || 0}`}
          icon={DollarSign} color="bg-emerald-500" />
        <StatCard label="This Month" value={`₹${summary?.this_month?.toLocaleString("en-IN") || 0}`}
          icon={TrendingUp} color="bg-indigo-500" trend="up" />
        <StatCard label="This Week" value={`₹${summary?.this_week?.toLocaleString("en-IN") || 0}`}
          icon={Calendar} color="bg-violet-500" />
        <StatCard label="Pending Payout" value={`₹${summary?.pending_payout?.toLocaleString("en-IN") || 0}`}
          sub="next Monday" icon={Wallet} color="bg-amber-500" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
        {(["overview", "payouts", "bank"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {tab === "bank" ? "Bank Account" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <p className="text-white/70 text-sm font-medium mb-1">Lifetime Earnings</p>
          <p className="text-4xl font-bold">₹{summary?.total_earned?.toLocaleString("en-IN") || "0"}</p>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
            {[
              { label: "Jobs Completed", value: summary?.completed_jobs || 0 },
              { label: "Avg per Job", value: `₹${summary?.completed_jobs ? Math.round((summary.total_earned || 0) / summary.completed_jobs) : 0}` },
              { label: "Pending", value: `₹${summary?.pending_payout?.toLocaleString("en-IN") || 0}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-white/60 text-xs">{label}</p>
                <p className="text-white font-bold text-lg mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Payouts Tab */}
      {activeTab === "payouts" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <h3 className="font-bold text-slate-800">Payout History</h3>
          </div>
          {payouts.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No payouts yet</p>
              <p className="text-slate-400 text-xs mt-1">Payouts are processed every Monday</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {payouts.map(payout => (
                <div key={payout.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      payout.status === "paid" ? "bg-emerald-50" : payout.status === "failed" ? "bg-red-50" : "bg-amber-50"
                    }`}>
                      {payout.status === "paid" ? <CheckCircle className="w-5 h-5 text-emerald-500" /> :
                       payout.status === "failed" ? <AlertCircle className="w-5 h-5 text-red-500" /> :
                       <Clock className="w-5 h-5 text-amber-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">
                        {new Date(payout.period_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} –{" "}
                        {new Date(payout.period_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-slate-400 text-xs">{new Date(payout.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">₹{payout.amount.toLocaleString("en-IN")}</p>
                    <span className={`text-xs font-semibold capitalize ${
                      payout.status === "paid" ? "text-emerald-600" : payout.status === "failed" ? "text-red-500" : "text-amber-600"
                    }`}>{payout.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Bank Account Tab */}
      {activeTab === "bank" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Bank Account</h3>
              <p className="text-slate-400 text-xs">Payouts will be sent to this account</p>
            </div>
          </div>

          {bankSuccess && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
              <CheckCircle className="w-4 h-4" /> {bankSuccess}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Account Holder Name</label>
              <input type="text" placeholder="Full name on account" value={bank.account_holder}
                onChange={e => setBank(b => ({ ...b, account_holder: e.target.value }))} className={inputClass} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Account Number</label>
              <input type="text" placeholder="1234567890" value={bank.account_number}
                onChange={e => setBank(b => ({ ...b, account_number: e.target.value }))} className={inputClass} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">IFSC Code</label>
              <input type="text" placeholder="SBIN0001234" value={bank.ifsc_code}
                onChange={e => setBank(b => ({ ...b, ifsc_code: e.target.value.toUpperCase() }))} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Bank Name</label>
              <input type="text" placeholder="State Bank of India" value={bank.bank_name}
                onChange={e => setBank(b => ({ ...b, bank_name: e.target.value }))} className={inputClass} />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button onClick={saveBank} disabled={savingBank}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all disabled:opacity-60">
              {savingBank ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Account
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
