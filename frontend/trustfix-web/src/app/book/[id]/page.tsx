'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Shield,
  Loader2,
} from 'lucide-react';
import { api, Technician, ServiceCategory } from '@/lib/api';
import { useLocation } from '@/hooks/useLocation';

export default function BookPage() {
  const router = useRouter();
  const params = useParams();
  const technicianId = params.id as string;
  const { city, address, latitude, longitude } = useLocation();
  
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [description, setDescription] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [customerAddress, setCustomerAddress] = useState(address || '');
  const [budget, setBudget] = useState('');
  
  // AI Quote
  const [aiQuote, setAiQuote] = useState<any>(null);
  const [gettingQuote, setGettingQuote] = useState(false);

  useEffect(() => {
    loadData();
  }, [technicianId]);

  const loadData = async () => {
    try {
      const [techData, servicesData] = await Promise.all([
        api.getTechnicianDetail(technicianId),
        api.getServiceCategories(),
      ]);
      setTechnician(techData);
      setServices(servicesData);
      
      // Pre-select service if technician has specific skill
      if (techData.skills?.length > 0) {
        const matchingService = servicesData.find(s => 
          techData.skills.some((skill: any) => 
            skill.name.toLowerCase().includes(s.name.toLowerCase())
          )
        );
        if (matchingService) {
          setSelectedService(matchingService.id);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAIQuote = async () => {
    if (!selectedService || !description || !city) return;
    
    setGettingQuote(true);
    try {
      const data = await api.generateQuote({
        description,
        service_category_id: selectedService,
        city,
        is_emergency: isEmergency,
      });
      setAiQuote(data.quote);
    } catch (err) {
      console.error('Failed to get quote:', err);
    } finally {
      setGettingQuote(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (description.length > 20 && selectedService) {
        getAIQuote();
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [description, selectedService, isEmergency]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const booking = await api.createBooking({
        service_category_id: selectedService,
        description,
        address: customerAddress,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        is_emergency: isEmergency,
        scheduled_date: scheduledDate || undefined,
        scheduled_time: scheduledTime || undefined,
        customer_budget: budget ? parseInt(budget) : undefined,
        preferred_technician_id: technicianId,
      });
      
      // Redirect to payment or booking confirmation
      router.push(`/dashboard/customer?booking=${booking.booking_id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
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

  const steps = [
    { number: 1, title: 'Service Details' },
    { number: 2, title: 'Schedule' },
    { number: 3, title: 'Confirm' },
  ];

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
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s.number
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s.number ? <CheckCircle className="w-5 h-5" /> : s.number}
              </div>
              <span className={`ml-2 text-sm font-medium hidden sm:block ${
                step >= s.number ? 'text-slate-900' : 'text-slate-500'
              }`}>
                {s.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 sm:w-20 h-1 mx-2 sm:mx-4 ${
                  step > s.number ? 'bg-indigo-600' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Technician Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex items-center gap-4">
          <img
            src={technician.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(technician.name)}&background=random`}
            alt={technician.name}
            className="w-16 h-16 rounded-xl object-cover"
          />
          <div>
            <h2 className="font-semibold text-slate-900">{technician.name}</h2>
            <p className="text-sm text-slate-600">{technician.skills?.map((s: any) => s.name).join(', ')}</p>
          </div>
        </div>

        {/* Step 1: Service Details */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">What service do you need?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedService === service.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{service.name}</p>
                    <p className="text-sm text-slate-500">{service.description?.slice(0, 50)}...</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Describe your problem</h3>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., My kitchen tap is leaking continuously from the handle..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
              />
              
              {/* AI Quote */}
              {gettingQuote ? (
                <div className="mt-4 p-4 bg-indigo-50 rounded-xl flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span className="text-indigo-900">AI is analyzing your request...</span>
                </div>
              ) : aiQuote ? (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-900">AI Price Estimate</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900">
                    ₹{aiQuote.price_min} - ₹{aiQuote.price_max}
                  </p>
                  <p className="text-sm text-emerald-700 mt-1">
                    Estimated time: {aiQuote.estimated_time} • {aiQuote.confidence}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="w-5 h-5 text-red-600 rounded"
                />
                <div>
                  <p className="font-semibold text-slate-900">This is an emergency</p>
                  <p className="text-sm text-slate-500">Get priority service (40% surcharge)</p>
                </div>
                <AlertCircle className="w-5 h-5 text-red-500 ml-auto" />
              </label>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedService || !description}
              className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </motion.div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">When do you need service?</h3>
              
              {!isEmergency && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
                    <select
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                    >
                      <option value="">Select time</option>
                      <option value="morning">Morning (8 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                      <option value="evening">Evening (4 PM - 8 PM)</option>
                    </select>
                  </div>
                </div>
              )}
              
              {isEmergency && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-900 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Emergency Service
                  </p>
                  <p className="text-red-700 text-sm mt-1">
                    Technician will arrive as soon as possible (usually within 1-2 hours)
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Service Address</h3>
              <textarea
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Enter your full address..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none resize-none"
              />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Your Budget (Optional)</h3>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Enter your budget"
                  className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!customerAddress || (!isEmergency && (!scheduledDate || !scheduledTime))}
                className="flex-1 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-slate-300"
              >
                Review Booking
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Booking Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Service</span>
                  <span className="font-medium text-slate-900">
                    {services.find(s => s.id === selectedService)?.name}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Technician</span>
                  <span className="font-medium text-slate-900">{technician.name}</span>
                </div>
                
                <div className="py-2 border-b border-slate-100">
                  <span className="text-slate-600">Problem</span>
                  <p className="font-medium text-slate-900 mt-1">{description}</p>
                </div>
                
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Schedule</span>
                  <span className="font-medium text-slate-900">
                    {isEmergency ? 'Emergency (ASAP)' : `${scheduledDate} at ${scheduledTime}`}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Address</span>
                  <span className="font-medium text-slate-900 text-right max-w-xs">{customerAddress}</span>
                </div>
                
                {aiQuote && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Estimated Price</span>
                    <span className="font-bold text-emerald-600">
                      ₹{aiQuote.price_min} - ₹{aiQuote.price_max}
                    </span>
                  </div>
                )}
                
                {budget && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Your Budget</span>
                    <span className="font-medium text-slate-900">₹{budget}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-emerald-900">Secure Booking</span>
              </div>
              <ul className="text-sm text-emerald-700 space-y-1 ml-8">
                <li>• Payment held in escrow until job completion</li>
                <li>• Verified technician background</li>
                <li>• 7-day service warranty</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Booking...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Confirm & Book
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
