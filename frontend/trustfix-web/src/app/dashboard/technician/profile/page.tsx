"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Wrench, MapPin, Save, Loader2, CheckCircle,
  AlertCircle, Camera, Star, Briefcase, FileText,
  Upload, Trash2, ShieldCheck, ShieldAlert, Clock,
} from "lucide-react";
import { getUser, apiFetch, setUser, TrustFixUser } from "@/lib/auth";

interface TechProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  bio: string;
  experience_years: number;
  skills: string[];
  rating: number;
  total_reviews: number;
  completed_jobs: number;
  is_available: boolean;
  verification_status: string;
}

interface TechDocument {
  id: string;
  document_type: string;
  file_url: string;
  status: string;
  uploaded_at: string;
}

const VERIFICATION_STYLES: Record<string, { color: string; bg: string; icon: typeof ShieldCheck; label: string }> = {
  verified:         { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: ShieldCheck, label: "Verified" },
  pending:          { color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     icon: Clock,       label: "Under Review" },
  docs_required:    { color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",       icon: FileText,    label: "Docs Required" },
  rejected:         { color: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: ShieldAlert, label: "Rejected" },
};

export default function TechnicianProfilePage() {
  const [profile, setProfile] = useState<TechProfile | null>(null);
  const [documents, setDocuments] = useState<TechDocument[]>([]);
  const [form, setForm] = useState({ name: "", city: "", bio: "", experience_years: 0, skills: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("aadhar");
  const [activeTab, setActiveTab] = useState<"info" | "docs">("info");

  useEffect(() => {
    loadProfile();
    loadDocuments();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const { data } = await apiFetch<any>("/api/technicians/me/profile/");
    if (data) {
      setProfile(data);
      setForm({
        name: data.name || "",
        city: data.city || "",
        bio: data.bio || "",
        experience_years: data.experience_years || 0,
        skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
      });
    }
    setLoading(false);
  };

  const loadDocuments = async () => {
    const { data } = await apiFetch<TechDocument[]>("/api/technicians/me/documents/");
    if (data) setDocuments(Array.isArray(data) ? data : []);
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    const skills = form.skills.split(",").map(s => s.trim()).filter(Boolean);
    const { data, error: err } = await apiFetch<any>("/api/technicians/me/profile/", {
      method: "PATCH",
      body: JSON.stringify({ ...form, skills }),
    });
    if (data) {
      setProfile(data);
      setSuccess("Profile updated!");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(err || "Failed to save");
    }
    setSaving(false);
  };

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("document_type", docType);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/technicians/me/documents/upload/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("tf_access")}` },
      body: fd,
    });
    if (res.ok) loadDocuments();
    setUploading(false);
    e.target.value = "";
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    await apiFetch(`/api/technicians/me/documents/${id}/`, { method: "DELETE" });
    loadDocuments();
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-slate-800 placeholder:text-slate-400 bg-white";

  const verificationCfg = VERIFICATION_STYLES[profile?.verification_status || "pending"];
  const VerifIcon = verificationCfg?.icon || Clock;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your professional information</p>
      </div>

      {/* Profile Header Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-3xl font-bold">
              {(form.name || "T")[0].toUpperCase()}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-colors">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-800 text-lg">{form.name || "Technician"}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile?.rating && (
                <span className="flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                  <Star className="w-3 h-3" /> {Number(profile.rating).toFixed(1)} ({profile.total_reviews} reviews)
                </span>
              )}
              {verificationCfg && (
                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${verificationCfg.bg} ${verificationCfg.color}`}>
                  <VerifIcon className="w-3 h-3" /> {verificationCfg.label}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs font-semibold bg-slate-50 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
                <Briefcase className="w-3 h-3" /> {profile?.completed_jobs || 0} jobs done
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
        {(["info", "docs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {tab === "info" ? "Professional Info" : "Documents"}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {activeTab === "info" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">

          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
              <CheckCircle className="w-4 h-4" /> {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
              <input type="text" placeholder="Your name" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
              <input type="text" placeholder="Kolkata" value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Experience (years)</label>
              <input type="number" min={0} max={50} value={form.experience_years || ""}
                onChange={e => setForm(f => ({ ...f, experience_years: parseInt(e.target.value) || 0 }))}
                className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Skills (comma separated)</label>
              <input type="text" placeholder="Plumbing, AC Repair, Wiring" value={form.skills}
                onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Bio</label>
              <textarea rows={3} placeholder="Describe your expertise..." value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                className={`${inputClass} resize-none`} />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </motion.div>
      )}

      {/* Documents Tab */}
      {activeTab === "docs" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-4">

          {/* Upload */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Upload Document</h3>
            <div className="flex gap-3">
              <select value={docType} onChange={e => setDocType(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-100 focus:outline-none focus:border-emerald-400 text-sm font-medium text-slate-700 bg-white">
                <option value="aadhar">Aadhar Card</option>
                <option value="pan">PAN Card</option>
                <option value="license">Trade License</option>
                <option value="photo">Profile Photo</option>
                <option value="certificate">Certificate</option>
              </select>
              <label className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl cursor-pointer transition-colors text-sm">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUploadDoc} />
              </label>
            </div>
          </div>

          {/* Document List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <h3 className="font-bold text-slate-800">Uploaded Documents</h3>
            </div>
            {documents.length === 0 ? (
              <div className="p-10 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No documents uploaded yet.</p>
                <p className="text-slate-400 text-xs mt-1">Upload your Aadhar, PAN, or trade certificate to get verified.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 capitalize text-sm">{doc.document_type.replace("_", " ")}</p>
                        <p className="text-slate-400 text-xs">{new Date(doc.uploaded_at).toLocaleDateString("en-IN")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${
                        doc.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        doc.status === "rejected" ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>{doc.status}</span>
                      <button onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
