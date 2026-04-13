"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  CreditCard,
  Shield,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";
import TechnicianSearch from "./TechnicianSearch";

type BookingStep = "service" | "location" | "technician" | "schedule" | "payment" | "confirm";

interface Service {
  id: string;
  name: string;
  icon: string;
  description: string;
  basePrice: number;
}

interface BookingData {
  serviceId: string;
  serviceName: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  technicianId: string | null;
  scheduledDate: string;
  scheduledTime: string;
  isEmergency: boolean;
  aiQuoteMin: number | null;
  aiQuoteMax: number | null;
}

interface RazorpayOrderData {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  booking_id: string;
}

const services: Service[] = [
  { id: "1", name: "Plumbing", icon: "🔧", description: "Leak repairs, pipe fitting, tap installation", basePrice: 299 },
  { id: "2", name: "Electrical", icon: "⚡", description: "Wiring, switches, fan installation", basePrice: 249 },
  { id: "3", name: "AC Service", icon: "❄️", description: "AC repair, gas refill, servicing", basePrice: 499 },
  { id: "4", name: "Carpentry", icon: "🪚", description: "Furniture repair, door fitting", basePrice: 399 },
  { id: "5", name: "Cleaning", icon: "🧹", description: "Deep clean, sofa cleaning", basePrice: 599 },
];

export default function BookingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<BookingStep>("service");
  const [bookingData, setBookingData] = useState<BookingData>({
    serviceId: "",
    serviceName: "",
    description: "",
    address: "",
    latitude: 0,
    longitude: 0,
    technicianId: null,
    scheduledDate: "",
    scheduledTime: "",
    isEmergency: false,
    aiQuoteMin: null,
    aiQuoteMax: null,
  });
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);

  // Get customer location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCustomerLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setBookingData((prev: BookingData) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
        },
        (err) => {
          console.error("Location error:", err);
          // Default to Kolkata
          setCustomerLocation({ lat: 22.5726, lng: 88.3639 });
        }
      );
    }
  }, []);

  const handleServiceSelect = (service: Service) => {
    setBookingData({
      ...bookingData,
      serviceId: service.id,
      serviceName: service.name,
    });
    setStep("location");
  };

  const handleLocationSubmit = () => {
    if (!bookingData.address.trim()) {
      setError("Please enter your address");
      return;
    }
    setError("");
    setStep("technician");
  };

  const handleTechnicianSelect = (technician: any) => {
    setBookingData({
      ...bookingData,
      technicianId: technician.id,
    });
    setStep("schedule");
  };

  const handleScheduleSubmit = async () => {
    if (!bookingData.scheduledDate) {
      setError("Please select a date");
      return;
    }
    setError("");
    
    // Create booking first
    setLoading(true);
    const { data, error: apiError } = await apiFetch("/api/bookings/create/", {
      method: "POST",
      body: JSON.stringify({
        service_category_id: bookingData.serviceId,
        description: bookingData.description || `Booking for ${bookingData.serviceName}`,
        address: bookingData.address,
        latitude: bookingData.latitude,
        longitude: bookingData.longitude,
        is_emergency: bookingData.isEmergency,
        scheduled_date: bookingData.scheduledDate,
        scheduled_time: bookingData.scheduledTime,
        preferred_technician_id: bookingData.technicianId,
      }),
    });

    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    // Get AI quote (mock for now)
    const basePrice = services.find((s) => s.id === bookingData.serviceId)?.basePrice || 300;
    setBookingData((prev: BookingData) => ({
      ...prev,
      aiQuoteMin: basePrice,
      aiQuoteMax: basePrice + 200,
    }));

    setLoading(false);
    setStep("payment");
  };

  const handlePayment = async () => {
    setLoading(true);
    
    // Create Razorpay order
    const { data, error: apiError } = await apiFetch("/api/payments/order/create/", {
      method: "POST",
      body: JSON.stringify({
        booking_id: razorpayOrder?.booking_id,
      }),
    });

    if (apiError || !data) {
      setError(apiError || "Failed to create payment");
      setLoading(false);
      return;
    }

    setRazorpayOrder(data);

    // Load Razorpay checkout
    const orderData = data as RazorpayOrderData;
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "TrustFix",
      description: `${bookingData.serviceName} Service`,
      order_id: orderData.order_id,
      handler: async (response: any) => {
        // Verify payment
        const { error: verifyError } = await apiFetch("/api/payments/verify/", {
          method: "POST",
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        if (verifyError) {
          setError(verifyError);
          setLoading(false);
          return;
        }

        setStep("confirm");
        setLoading(false);
      },
      prefill: {
        name: "",
        email: "",
        contact: "",
      },
      theme: {
        color: "#4f46e5",
      },
    };

    // @ts-ignore
    const rzp = new window.Razorpay(options);
    rzp.open();
    setLoading(false);
  };

  const renderStep = () => {
    switch (step) {
      case "service":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-slate-900">Select a Service</h2>
            <div className="grid grid-cols-2 gap-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all text-left"
                >
                  <span className="text-3xl mb-2 block">{service.icon}</span>
                  <h3 className="font-bold text-slate-900">{service.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{service.description}</p>
                  <p className="text-indigo-600 font-semibold mt-2">From ₹{service.basePrice}</p>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case "location":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <button
              onClick={() => setStep("service")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h2 className="text-xl font-bold text-slate-900">Service Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Describe your problem
                </label>
                <textarea
                  value={bookingData.description}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, description: e.target.value })
                  }
                  placeholder={`What ${bookingData.serviceName?.toLowerCase()} service do you need?`}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Your Address
                </label>
                <textarea
                  value={bookingData.address}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, address: e.target.value })
                  }
                  placeholder="Enter your full address"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                onClick={handleLocationSubmit}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </motion.div>
        );

      case "technician":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <button
              onClick={() => setStep("location")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <TechnicianSearch
              serviceId={bookingData.serviceId}
              serviceName={bookingData.serviceName}
              customerLocation={customerLocation}
              onSelectTechnician={handleTechnicianSelect}
            />
          </motion.div>
        );

      case "schedule":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <button
              onClick={() => setStep("technician")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h2 className="text-xl font-bold text-slate-900">Schedule Service</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={bookingData.scheduledDate}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, scheduledDate: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Preferred Time
                </label>
                <select
                  value={bookingData.scheduledTime}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, scheduledTime: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                >
                  <option value="">Any time</option>
                  <option value="morning">Morning (8 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                  <option value="evening">Evening (4 PM - 8 PM)</option>
                </select>
              </div>

              <label className="flex items-center gap-3 p-4 bg-red-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={bookingData.isEmergency}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, isEmergency: e.target.checked })
                  }
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                />
                <div>
                  <span className="font-semibold text-red-700">Emergency Service</span>
                  <p className="text-sm text-red-600">Get help within 15 minutes (+40% charge)</p>
                </div>
              </label>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                onClick={handleScheduleSubmit}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Continue to Payment"
                )}
              </button>
            </div>
          </motion.div>
        );

      case "payment":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-slate-900">Payment</h2>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Service</span>
                <span className="font-medium">{bookingData.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Estimated Price</span>
                <span className="font-medium">
                  ₹{bookingData.aiQuoteMin} - ₹{bookingData.aiQuoteMax}
                </span>
              </div>
              {bookingData.isEmergency && (
                <div className="flex justify-between text-red-600">
                  <span>Emergency Surcharge</span>
                  <span>+40%</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="font-bold">Total (Max)</span>
                <span className="font-bold text-xl">
                  ₹
                  {bookingData.aiQuoteMax
                    ? Math.round(bookingData.aiQuoteMax * (bookingData.isEmergency ? 1.4 : 1))
                    : 0}
                </span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-800">Secure Escrow Payment</h4>
                  <p className="text-sm text-emerald-700 mt-1">
                    Your payment is held securely. We release it to the technician only after you confirm the job is complete.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              {loading ? "Processing..." : "Pay Securely"}
            </button>
          </motion.div>
        );

      case "confirm":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
            <p className="text-slate-600 mb-6">
              Your {bookingData.serviceName} service has been booked. The technician will arrive at the scheduled time.
            </p>
            <button
              onClick={onComplete}
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              View My Bookings
            </button>
          </motion.div>
        );
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress Bar */}
      {step !== "confirm" && (
        <div className="flex gap-1 mb-6">
          {["service", "location", "technician", "schedule", "payment"].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                ["service", "location", "technician", "schedule", "payment"].indexOf(step) >= i
                  ? "bg-indigo-600"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      )}

      {renderStep()}
    </div>
  );
}
