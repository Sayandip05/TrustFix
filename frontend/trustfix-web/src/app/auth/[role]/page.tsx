"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Wrench,
  User,
  Phone,
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  setTokens,
  setUser,
  getGoogleAuthUrl,
  apiUrl,
  TrustFixUser,
  AuthTokens,
} from "@/lib/auth";

type Role = "customer" | "technician";
type AuthStep = "method" | "phone" | "otp" | "signup";

interface OTPState {
  phone: string;
  otp: string;
  otpSent: boolean;
  isNewUser: boolean;
}

interface SignupState {
  name: string;
  city: string;
  address: string;
  experience_years: number;
  bio: string;
}

// ─── Google OAuth Button ─────────────────────────────────────────────────────

function GoogleButton({
  role,
  loading,
  onStart,
}: {
  role: Role;
  loading: boolean;
  onStart: () => void;
}) {
  return (
    <button
      onClick={onStart}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all font-semibold text-gray-700 group disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      Continue with Google
    </button>
  );
}

// ─── Main Auth Page ──────────────────────────────────────────────────────────

export default function AuthPage() {
  const params = useParams();
  const router = useRouter();
  const role = (params.role as Role) || "customer";

  const isCustomer = role === "customer";

  const [step, setStep] = useState<AuthStep>("method");
  const [otpState, setOtpState] = useState<OTPState>({
    phone: "",
    otp: "",
    otpSent: false,
    isNewUser: false,
  });
  const [signup, setSignup] = useState<SignupState>({
    name: "",
    city: "",
    address: "",
    experience_years: 0,
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const accentColor = isCustomer
    ? "from-indigo-600 to-violet-600"
    : "from-emerald-500 to-teal-600";
  const accentSolid = isCustomer ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-500 hover:bg-emerald-600";
  const accentText = isCustomer ? "text-indigo-600" : "text-emerald-600";
  const accentBorder = isCustomer ? "border-indigo-500 ring-indigo-200" : "border-emerald-500 ring-emerald-200";

  // ── OTP: Send ──────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!otpState.phone || otpState.phone.length < 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/users/auth/otp/send/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${otpState.phone}`, user_type: role }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpState((s) => ({ ...s, otpSent: true }));
        setStep("otp");
        setResendTimer(60);
        setSuccess(`OTP sent to +91${otpState.phone}${data.otp ? ` (Dev: ${data.otp})` : ""}`);
      } else {
        setError(data.error || data.detail || "Failed to send OTP");
      }
    } catch {
      setError("Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP: Verify ────────────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (!otpState.otp || otpState.otp.length !== 6) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/users/auth/otp/verify/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${otpState.phone}`, otp: otpState.otp }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.is_new_user) {
          setOtpState((s) => ({ ...s, isNewUser: true }));
          setStep("signup");
        } else {
          // Existing user — save tokens and redirect
          setTokens(data.tokens as AuthTokens);
          setUser(data.user as TrustFixUser);
          router.push(`/dashboard/${data.user.user_type}`);
        }
      } else {
        setError(data.error || data.detail || "Invalid OTP");
      }
    } catch {
      setError("Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // ── Signup: Complete ───────────────────────────────────────────────────────
  const handleSignup = async () => {
    if (!signup.name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!isCustomer && !signup.city.trim()) {
      setError("Please enter your city");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const endpoint = isCustomer
        ? "/api/users/auth/signup/customer/"
        : "/api/users/auth/signup/technician/";

      const payload: Record<string, unknown> = {
        phone: `+91${otpState.phone}`,
        name: signup.name,
        city: signup.city,
        address: signup.address,
      };

      if (!isCustomer) {
        payload.experience_years = signup.experience_years;
        payload.bio = signup.bio;
        payload.latitude = 22.5726;
        payload.longitude = 88.3639;
      }

      const res = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setTokens(data.tokens as AuthTokens);
        setUser(data.user as TrustFixUser);
        router.push(`/dashboard/${role}`);
      } else {
        setError(data.error || data.detail || "Signup failed");
      }
    } catch {
      setError("Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    // Store role in sessionStorage so callback page knows
    sessionStorage.setItem("tf_oauth_role", role);
    const url = await getGoogleAuthUrl(role);
    if (url) {
      window.location.href = url;
    } else {
      setError("Failed to initiate Google login. Please check backend is running.");
      setGoogleLoading(false);
    }
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-${
    isCustomer ? "indigo" : "emerald"
  }-500 focus:ring-2 focus:ring-${
    isCustomer ? "indigo" : "emerald"
  }-100 transition-all text-gray-800 placeholder:text-gray-400`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div
        className={`absolute top-0 left-0 right-0 h-64 bg-gradient-to-br ${accentColor} opacity-5`}
      />

      <div className="w-full max-w-md relative">
        {/* Back button */}
        <button
          onClick={() => {
            if (step === "otp") setStep("phone");
            else if (step === "phone" || step === "method") router.push("/");
            else if (step === "signup") setStep("otp");
          }}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${accentColor} p-8 text-white`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                {isCustomer ? (
                  <User className="w-6 h-6 text-white" />
                ) : (
                  <Wrench className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium">
                  {isCustomer ? "Customer" : "Professional"} Portal
                </p>
                <h1 className="text-2xl font-bold">
                  {step === "method" && "Welcome to TrustFix"}
                  {step === "phone" && "Enter your phone"}
                  {step === "otp" && "Verify OTP"}
                  {step === "signup" && "Complete your profile"}
                </h1>
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex gap-2 mt-2">
              {(["method", "phone", "otp", "signup"] as AuthStep[]).map((s, i) => (
                <div
                  key={s}
                  className={`h-1 rounded-full transition-all ${
                    ["method", "phone", "otp", "signup"].indexOf(step) >= i
                      ? "bg-white flex-1"
                      : "bg-white/30 flex-1"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            {/* Error / Success Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-red-700"
                >
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-5 text-green-700"
                >
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Step: Method Selection ── */}
            {step === "method" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <p className="text-gray-500 text-sm mb-6">
                  {isCustomer
                    ? "Sign in to book verified home services"
                    : "Sign in to manage your jobs and earnings"}
                </p>

                <GoogleButton
                  role={role}
                  loading={googleLoading}
                  onStart={handleGoogleLogin}
                />

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-gray-400 text-sm">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <button
                  onClick={() => {
                    setStep("phone");
                    setError("");
                    setSuccess("");
                  }}
                  className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 ${accentSolid} text-white rounded-xl font-semibold transition-all hover:shadow-md`}
                >
                  <Phone className="w-5 h-5" />
                  Continue with Phone OTP
                </button>

                <p className="text-center text-xs text-gray-400 mt-4">
                  By continuing, you agree to TrustFix&apos;s Terms & Privacy Policy
                </p>
              </motion.div>
            )}

            {/* ── Step: Phone Number ── */}
            {step === "phone" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <p className="text-gray-500 text-sm">
                  We&apos;ll send you a 6-digit OTP to verify your number
                </p>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div
                    className={`flex border-2 rounded-xl overflow-hidden transition-all ${
                      otpState.phone ? `border-${isCustomer ? "indigo" : "emerald"}-400` : "border-gray-200"
                    } focus-within:border-${isCustomer ? "indigo" : "emerald"}-500 focus-within:ring-2 focus-within:ring-${isCustomer ? "indigo" : "emerald"}-100`}
                  >
                    <span className="px-4 py-3 bg-gray-50 text-gray-600 font-bold border-r border-gray-200 text-sm flex items-center">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      value={otpState.phone}
                      onChange={(e) => {
                        setError("");
                        setOtpState((s) => ({
                          ...s,
                          phone: e.target.value.replace(/\D/g, ""),
                        }));
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                      className="flex-1 px-4 py-3 outline-none text-gray-800 text-lg tracking-widest"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={loading || otpState.phone.length < 10}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 ${accentSolid} text-white rounded-xl font-semibold transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Send OTP</>
                  )}
                </button>
              </motion.div>
            )}

            {/* ── Step: OTP Verify ── */}
            {step === "otp" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <p className="text-gray-500 text-sm">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-semibold text-gray-700">
                    +91 {otpState.phone}
                  </span>
                </p>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    OTP Code
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={otpState.otp}
                    onChange={(e) => {
                      setError("");
                      setOtpState((s) => ({
                        ...s,
                        otp: e.target.value.replace(/\D/g, ""),
                      }));
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                    className={`${inputClass} text-center text-3xl font-bold tracking-[0.5em]`}
                  />
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otpState.otp.length !== 6}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 ${accentSolid} text-white rounded-xl font-semibold transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Verify & Continue"
                  )}
                </button>

                <p className="text-center text-sm text-gray-500">
                  {resendTimer > 0 ? (
                    <>Resend OTP in <span className={`font-semibold ${accentText}`}>{resendTimer}s</span></>
                  ) : (
                    <button
                      onClick={() => {
                        setOtpState((s) => ({ ...s, otp: "" }));
                        setStep("phone");
                        setSuccess("");
                      }}
                      className={`font-semibold ${accentText} hover:underline`}
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </motion.div>
            )}

            {/* ── Step: Signup (New User) ── */}
            {step === "signup" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <p className="text-gray-500 text-sm">
                  Almost there! Tell us a bit about yourself.
                </p>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Ravi Kumar"
                    value={signup.name}
                    onChange={(e) =>
                      setSignup((s) => ({ ...s, name: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className={`grid ${!isCustomer ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      placeholder="Kolkata"
                      value={signup.city}
                      onChange={(e) =>
                        setSignup((s) => ({ ...s, city: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </div>

                  {!isCustomer && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Experience (years)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        placeholder="3"
                        value={signup.experience_years || ""}
                        onChange={(e) =>
                          setSignup((s) => ({
                            ...s,
                            experience_years: parseInt(e.target.value) || 0,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                {isCustomer && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      placeholder="123, Main Street, Salt Lake"
                      rows={2}
                      value={signup.address}
                      onChange={(e) =>
                        setSignup((s) => ({ ...s, address: e.target.value }))
                      }
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                )}

                {!isCustomer && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bio (optional)
                    </label>
                    <textarea
                      placeholder="Brief description of your skills and experience..."
                      rows={2}
                      value={signup.bio}
                      onChange={(e) =>
                        setSignup((s) => ({ ...s, bio: e.target.value }))
                      }
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                )}

                <button
                  onClick={handleSignup}
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 ${accentSolid} text-white rounded-xl font-semibold transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Create Account & Continue"
                  )}
                </button>
              </motion.div>
            )}

            {/* Switch role link */}
            <p className="mt-6 text-center text-sm text-gray-500">
              {isCustomer ? (
                <>
                  Are you a professional?{" "}
                  <button
                    onClick={() => router.push("/auth/technician")}
                    className="font-semibold text-emerald-600 hover:underline"
                  >
                    Join as Technician
                  </button>
                </>
              ) : (
                <>
                  Looking for services?{" "}
                  <button
                    onClick={() => router.push("/auth/customer")}
                    className="font-semibold text-indigo-600 hover:underline"
                  >
                    Sign in as Customer
                  </button>
                </>
              )}
            </p>
          </div>
        </motion.div>

        {/* Brand footer */}
        <div className="flex items-center justify-center gap-2 mt-6 text-gray-400">
          <Shield className="w-4 h-4" />
          <span className="text-sm">TrustFix — Verified services, secured payments</span>
        </div>
      </div>
    </div>
  );
}
