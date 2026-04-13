"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBooking, updateBookingStatus, createReview } from "@/lib/api";
import { getUser } from "@/lib/auth";
import Link from "next/link";

interface BookingDetail {
  id: string;
  status: string;
  service_category: { name: string };
  description: string;
  address: string;
  final_price: number;
  visiting_charge: number;
  scheduled_date: string;
  scheduled_time: string;
  is_emergency: boolean;
  technician?: {
    id: string;
    user: { name: string; phone: string };
    rating: number;
    profile_photo: string;
  };
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
  created_at: string;
}

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, review_text: "" });

  useEffect(() => {
    setUser(getUser());
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    const { data, error } = await getBooking(bookingId);
    if (data) {
      setBooking(data);
    } else {
      setError(error || "Failed to load booking");
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (status: string) => {
    const { success, error } = await updateBookingStatus(bookingId, status);
    if (success) {
      loadBooking();
    } else {
      alert(error || "Failed to update status");
    }
  };

  const handleSubmitReview = async () => {
    if (!booking) return;
    const { success, error } = await createReview({
      booking_id: bookingId,
      rating: reviewData.rating,
      review_text: reviewData.review_text,
    });
    if (success) {
      setShowReviewModal(false);
      loadBooking();
    } else {
      alert(error || "Failed to submit review");
    }
  };

  const getStatusStep = (status: string) => {
    const steps = [
      "searching",
      "quoted",
      "confirmed",
      "technician_arrived",
      "in_progress",
      "completed",
      "paid",
    ];
    return steps.indexOf(status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Booking not found"}</p>
          <Link href="/dashboard/customer" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isCustomer = user?.id === booking.customer?.id;
  const isTechnician = user?.id === booking.technician?.user?.name;
  const currentStep = getStatusStep(booking.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/customer" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
          <p className="text-gray-600">Booking ID: {booking.id}</p>
        </div>

        {/* Status Tracker */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Status</h2>
          <div className="flex items-center justify-between">
            {["Searching", "Quoted", "Confirmed", "Arrived", "In Progress", "Completed", "Paid"].map(
              (step, index) => (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs mt-1 text-gray-600">{step}</span>
                </div>
              )
            )}
          </div>
          <div className="mt-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                booking.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : booking.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {booking.status.replace("_", " ").toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Service Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Service Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Service</label>
                <p className="font-medium">{booking.service_category.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Description</label>
                <p className="font-medium">{booking.description}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Address</label>
                <p className="font-medium">{booking.address}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Scheduled</label>
                <p className="font-medium">
                  {booking.scheduled_date} at {booking.scheduled_time}
                </p>
              </div>
              {booking.is_emergency && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                  Emergency
                </span>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Payment</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Visiting Charge</span>
                <span className="font-medium">₹{booking.visiting_charge}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service Charge</span>
                <span className="font-medium">₹{booking.final_price || "Pending"}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>
                  ₹{(booking.visiting_charge || 0) + (booking.final_price || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Technician Info */}
        {booking.technician && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Technician</h2>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                {booking.technician.profile_photo ? (
                  <img
                    src={booking.technician.profile_photo}
                    alt={booking.technician.user.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-lg">{booking.technician.user.name}</p>
                <p className="text-gray-600">⭐ {booking.technician.rating} rating</p>
                <Link
                  href={`/technician/${booking.technician.id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {isCustomer && booking.status === "completed" && !showReviewModal && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Write Review
              </button>
            )}
            {isTechnician && booking.status === "confirmed" && (
              <button
                onClick={() => handleStatusUpdate("technician_arrived")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Mark as Arrived
              </button>
            )}
            {isTechnician && booking.status === "technician_arrived" && (
              <button
                onClick={() => handleStatusUpdate("in_progress")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Start Work
              </button>
            )}
            {isTechnician && booking.status === "in_progress" && (
              <button
                onClick={() => handleStatusUpdate("completed")}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Complete Job
              </button>
            )}
            {booking.status === "completed" && (
              <button
                onClick={() => handleStatusUpdate("paid")}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Release Payment
              </button>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className={`text-2xl ${
                        star <= reviewData.rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Review</label>
                <textarea
                  value={reviewData.review_text}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, review_text: e.target.value })
                  }
                  className="w-full border rounded-lg p-2 h-24"
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSubmitReview}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Submit Review
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
