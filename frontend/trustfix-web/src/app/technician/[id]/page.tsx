'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Star,
  ArrowLeft,
  Shield,
  Clock,
  Briefcase,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MessageCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Bot,
  Sparkles,
  Award,
} from 'lucide-react';
import { api, Technician, Review, AuthenticityReport } from '@/lib/api';
import { AuthenticityBot } from '@/components/AuthenticityBot';

export default function TechnicianDetailPage() {
  const router = useRouter();
  const params = useParams();
  const technicianId = params.id as string;
  
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [authenticityReport, setAuthenticityReport] = useState<AuthenticityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBot, setShowBot] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'verification'>('overview');

  useEffect(() => {
    loadTechnicianData();
  }, [technicianId]);

  const loadTechnicianData = async () => {
    setLoading(true);
    try {
      const [techData, reviewsData] = await Promise.all([
        api.getTechnicianDetail(technicianId),
        api.getTechnicianReviews(technicianId),
      ]);
      setTechnician(techData);
      setReviews(reviewsData);
    } catch (err) {
      console.error('Failed to load technician:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyWithBot = async () => {
    if (!authenticityReport) {
      try {
        const report = await api.verifyTechnician(technicianId);
        setAuthenticityReport(report);
      } catch (err) {
        console.error('Failed to verify:', err);
      }
    }
    setShowBot(true);
  };

  const handleBookNow = () => {
    router.push(`/book/${technicianId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Technician not found</p>
          <button
            onClick={() => router.push('/search')}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex gap-4">
            <img
              src={technician.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(technician.name)}&background=random&size=128`}
              alt={technician.name}
              className="w-24 h-24 rounded-2xl object-cover"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{technician.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-amber-500">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-bold text-lg">{technician.rating}</span>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">{technician.total_reviews} reviews</span>
                {technician.verification_status === 'verified' && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Shield className="w-4 h-4" />
                      Verified
                    </span>
                  </>
                )}
              </div>
              <p className="text-slate-600 mt-2 line-clamp-2">{technician.bio}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{technician.experience_years}</p>
              <p className="text-sm text-slate-500">Years Exp</p>
            </div>
            <div className="text-center border-x border-slate-100">
              <p className="text-2xl font-bold text-slate-900">{technician.completed_jobs}</p>
              <p className="text-sm text-slate-500">Jobs Done</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{technician.total_reviews}</p>
              <p className="text-sm text-slate-500">Reviews</p>
            </div>
          </div>
        </div>

        {/* AI Verify Button */}
        <motion.button
          onClick={handleVerifyWithBot}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-4 mb-6 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Bot className="w-6 h-6" />
          <div className="text-left">
            <p className="font-semibold">Verify with AI Bot</p>
            <p className="text-sm text-indigo-100">Check authenticity before booking</p>
          </div>
          <Sparkles className="w-5 h-5 ml-auto" />
        </motion.button>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-slate-200">
            {(['overview', 'reviews', 'verification'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-semibold capitalize ${
                  activeTab === tab
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Skills */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {technician.skills?.map((skill) => (
                      <span
                        key={skill.id}
                        className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Service Area */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Service Area</h3>
                  <p className="text-slate-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Within {technician.service_radius_km} km radius
                  </p>
                </div>

                {/* Availability */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Availability</h3>
                  <p className={`flex items-center gap-2 ${technician.is_available ? 'text-emerald-600' : 'text-slate-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${technician.is_available ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {technician.is_available ? 'Available now' : 'Currently offline'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No reviews yet</p>
                ) : (
                  <>
                    {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                      <div key={review.id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-900">{review.customer_name}</span>
                          <span className="flex items-center gap-1 text-amber-500">
                            <Star className="w-4 h-4 fill-current" />
                            {review.rating}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm mb-2">{review.review_text}</p>
                        <p className="text-slate-400 text-xs">{review.service_name} • {new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {reviews.length > 3 && (
                      <button
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="w-full py-2 text-indigo-600 font-semibold text-sm flex items-center justify-center gap-1"
                      >
                        {showAllReviews ? (
                          <>Show Less <ChevronUp className="w-4 h-4" /></>
                        ) : (
                          <>Show All {reviews.length} Reviews <ChevronDown className="w-4 h-4" /></>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-900">Identity Verified</p>
                    <p className="text-sm text-emerald-700">Government ID checked</p>
                  </div>
                </div>
                
                {technician.police_verified && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-900">Police Verified</p>
                      <p className="text-sm text-emerald-700">Background check cleared</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Award className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">Platform Verified</p>
                    <p className="text-sm text-blue-700">Skills and documents verified by TrustFix</p>
                  </div>
                </div>

                <p className="text-sm text-slate-500 mt-4">
                  TrustFix verifies all technicians through a rigorous process including identity verification, 
                  background checks, and skill assessment.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Book Button */}
        <button
          onClick={handleBookNow}
          disabled={!technician.is_available}
          className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          {technician.is_available ? 'Book Now' : 'Currently Unavailable'}
        </button>
      </main>

      {/* AI Authenticity Bot Modal */}
      <AnimatePresence>
        {showBot && (
          <AuthenticityBot
            report={authenticityReport}
            technician={technician}
            onClose={() => setShowBot(false)}
            onBook={handleBookNow}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
