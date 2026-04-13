"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, X, Loader2, Search } from "lucide-react";

interface LocationPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onAllow: () => void;
  onSkip: () => void;
  onManualCity: (city: string) => void;
  loading: boolean;
}

export default function LocationPrompt({
  isOpen,
  onClose,
  onAllow,
  onSkip,
  onManualCity,
  loading,
}: LocationPromptProps) {
  const [showManualInput, setShowManualInput] = useState(false);
  const [cityInput, setCityInput] = useState("");

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cityInput.trim()) {
      onManualCity(cityInput.trim());
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Enable Location</h2>
                <p className="text-indigo-100">
                  Allow access to your location to find verified technicians near you
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {!showManualInput ? (
                  <>
                    {/* Benefits */}
                    <div className="space-y-3 mb-6">
                      {[
                        "Find technicians within 10km radius",
                        "See accurate arrival time estimates",
                        "Get location-based pricing",
                        "Filter by emergency availability",
                      ].map((benefit, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Navigation className="w-3 h-3 text-emerald-600" />
                          </div>
                          <span className="text-slate-600 text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <button
                      onClick={onAllow}
                      disabled={loading}
                      className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Getting location...
                        </>
                      ) : (
                        <>
                          <Navigation className="w-5 h-5" />
                          Allow Location Access
                        </>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowManualInput(true)}
                        className="py-3 px-4 border-2 border-slate-200 text-slate-700 font-medium rounded-xl hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        Enter City
                      </button>
                      <button
                        onClick={onSkip}
                        className="py-3 px-4 text-slate-500 font-medium rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        Skip for Now
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 text-center">
                      Your location is only used to find nearby services. We never share it with third parties.
                    </p>
                  </>
                ) : (
                  <>
                    {/* Manual City Input */}
                    <button
                      onClick={() => setShowManualInput(false)}
                      className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
                    >
                      ← Back
                    </button>

                    <form onSubmit={handleManualSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Enter your city
                        </label>
                        <input
                          type="text"
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          placeholder="e.g., Kolkata, Mumbai, Delhi"
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                          autoFocus
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!cityInput.trim()}
                        className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
                      >
                        Continue
                      </button>
                    </form>

                    {/* Popular Cities */}
                    <div className="pt-4">
                      <p className="text-sm text-slate-500 mb-3">Popular cities:</p>
                      <div className="flex flex-wrap gap-2">
                        {["Kolkata", "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad"].map(
                          (city) => (
                            <button
                              key={city}
                              onClick={() => onManualCity(city)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                            >
                              {city}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
