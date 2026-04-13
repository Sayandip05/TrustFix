"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Phone, MapPin, Mail, Save, Loader2,
  CheckCircle, AlertCircle, Camera, Shield,
} from "lucide-react";
import { getUser, apiFetch, setUser, TrustFixUser } from "@/lib/auth";

export default function CustomerProfilePage() {
  const [user, setUserState] = useState<TrustFixUser | null>(null);
  const [form, setForm] = useState({
    name: "", city: "", address: "", email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getUser();
    setUserState(u);
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const { data } = await apiFetch<any>("/api/users/profile/");
    if (data) {
      setForm({
        name: data.name || "",
        city: data.city || "",
        address: data.customer_profile?.address || "",
        email: data.email || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(""); setSuccess("");
    const { data, error: err } = await apiFetch<TrustFixUser>("/api/users/profile/complete/", {
      method: "PATCH",
      body: JSON.stringify({ name: form.name, city: form.city, address: form.address }),
    });
    if (data) {
      setUser(data);
      setUserState(data);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(err || "Failed to save profile");
    }
    setSaving(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 placeholder:text-slate-400 bg-white";

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your personal information</p>
      </div>

      {/* Avatar Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-3xl font-bold">
              {(form.name || "U")[0].toUpperCase()}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">{form.name || "Customer"}</h2>
            <p className="text-slate-500 text-sm flex items-center gap-1 mt-0.5">
              <Phone className="w-3.5 h-3.5" /> {user?.phone || "—"}
            </p>
            <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
              <Shield className="w-3 h-3" /> Customer
            </span>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
        <h3 className="font-bold text-slate-800">Personal Information</h3>

        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Your full name" value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className={`${inputClass} pl-10`} />
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" placeholder="your@email.com" value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className={`${inputClass} pl-10`} />
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Kolkata" value={form.city}
                onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                className={`${inputClass} pl-10`} />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <textarea rows={3} placeholder="Your home address" value={form.address}
                onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                className={`${inputClass} pl-10 resize-none`} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-400">Phone number cannot be changed</p>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </motion.div>

      {/* Account Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">Account Details</h3>
        <div className="space-y-3 text-sm">
          {[
            { label: "Phone", value: user?.phone || "—", icon: Phone },
            { label: "City", value: form.city || "Not set", icon: MapPin },
            { label: "Account Type", value: "Customer", icon: Shield },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-2 text-slate-500">
                <Icon className="w-4 h-4" /> {label}
              </div>
              <span className="font-medium text-slate-700">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
