"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { exchangeGoogleCode, setTokens, setUser, TrustFixUser, AuthTokens } from "@/lib/auth";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing Google sign-in...");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setStatus("error");
        setMessage("Google sign-in was cancelled");
        setDetail("You cancelled the Google sign-in. Please try again.");
        setTimeout(() => router.push("/"), 3000);
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("Invalid callback");
        setDetail("No authorization code received from Google.");
        setTimeout(() => router.push("/"), 3000);
        return;
      }

      // Get user_type from state param or sessionStorage
      let userType: "customer" | "technician" = "customer";
      try {
        if (state) {
          const parsed = JSON.parse(decodeURIComponent(state));
          userType = parsed.user_type || "customer";
        } else {
          const stored = sessionStorage.getItem("tf_oauth_role");
          if (stored === "customer" || stored === "technician") {
            userType = stored;
          }
        }
      } catch {
        // Default to customer
      }

      setMessage("Verifying with Google...");

      const result = await exchangeGoogleCode(code, userType);

      if (result) {
        setTokens(result.tokens as AuthTokens);
        setUser(result.user as TrustFixUser);
        sessionStorage.removeItem("tf_oauth_role");

        setStatus("success");
        setMessage(result.is_new_user ? "Account created successfully!" : "Welcome back!");
        setDetail(
          result.is_new_user
            ? `Your ${userType} account has been set up. Redirecting to your dashboard...`
            : `Signed in as ${result.user.name}. Redirecting...`
        );

        setTimeout(() => {
          router.push(`/dashboard/${result.user.user_type}`);
        }, 1500);
      } else {
        setStatus("error");
        setMessage("Sign-in failed");
        setDetail("We could not complete the Google sign-in. The authorization code may have expired. Please try again.");
        setTimeout(() => router.push("/"), 4000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center"
      >
        {/* TrustFix Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">TrustFix</span>
        </div>

        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{message}</h2>
            <p className="text-slate-500 text-sm">
              Please wait while we verify your Google account...
            </p>
            <div className="flex gap-1.5 justify-center mt-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-indigo-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{message}</h2>
            <p className="text-slate-500 text-sm">{detail}</p>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{message}</h2>
            <p className="text-slate-500 text-sm">{detail}</p>
            <p className="text-slate-400 text-xs">Redirecting you back...</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
