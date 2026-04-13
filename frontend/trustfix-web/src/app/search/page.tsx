'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MapPin,
  Star,
  Search,
  Filter,
  Navigation,
  Clock,
  Briefcase,
  ChevronRight,
  Shield,
  Loader2,
} from 'lucide-react';
import { api, Technician, ServiceCategory } from '@/lib/api';
import { useLocation } from '@/hooks/useLocation';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { city, latitude, longitude, hasLocation } = useLocation();
  
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedService, setSelectedService] = useState(searchParams.get('service') || '');
  const [radius, setRadius] = useState(10);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'experience' | 'score'>('score');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Load services
  useEffect(() => {
    api.getServiceCategories().then(data => {
      setServices(data);
    }).catch(console.error);
  }, []);

  // Search technicians
  useEffect(() => {
    if (!hasLocation || !latitude || !longitude) {
      setLoading(false);
      return;
    }

    searchTechnicians();
  }, [hasLocation, latitude, longitude, selectedService, radius, minRating, sortBy, emergencyOnly]);

  const searchTechnicians = async () => {
    if (!latitude || !longitude) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await api.searchTechnicians({
        lat: latitude,
        lng: longitude,
        service_id: selectedService || undefined,
        radius,
        min_rating: minRating,
        sort_by: sortBy,
        emergency: emergencyOnly,
        available_only: true,
      });
      
      setTechnicians(data.technicians || []);
    } catch (err: any) {
      setError(err.message || 'Failed to search technicians');
    } finally {
      setLoading(false);
    }
  };

  const handleTechnicianClick = (technicianId: string) => {
    router.push(`/technician/${technicianId}`);
  };

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  if (!hasLocation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Location Required</h2>
          <p className="text-slate-600 mb-4">Please enable location to find technicians near you</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
          >
            Enable Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <Navigation className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">Find Technicians</h1>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {city || 'Your Location'}
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-slate-100 rounded-lg relative"
            >
              <Filter className="w-5 h-5" />
              {(selectedService || minRating > 0 || emergencyOnly) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-white border-b border-slate-200"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
            {/* Service Filter */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Service Type</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedService('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    !selectedService
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Services
                </button>
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                      selectedService === service.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {service.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Minimum Rating</label>
              <div className="flex gap-2">
                {[0, 3, 3.5, 4, 4.5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setMinRating(rating)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                      minRating === rating
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {rating === 0 ? 'Any' : (
                      <>
                        <Star className="w-4 h-4 fill-current" />
                        {rating}+
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort & Emergency */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="score">Best Match</option>
                  <option value="distance">Nearest</option>
                  <option value="rating">Highest Rated</option>
                  <option value="experience">Most Experienced</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Emergency</label>
                <button
                  onClick={() => setEmergencyOnly(!emergencyOnly)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    emergencyOnly
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Emergency Only
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={searchTechnicians}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : technicians.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No technicians found</h3>
            <p className="text-slate-600">Try adjusting your filters or expanding the search radius</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 mb-4">
              Found {technicians.length} technicians near you
            </p>
            
            {technicians.map((tech, index) => (
              <motion.div
                key={tech.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleTechnicianClick(tech.id)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={tech.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tech.name)}&background=random`}
                      alt={tech.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    {tech.is_available && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{tech.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-amber-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="font-semibold">{tech.rating}</span>
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 text-sm">{tech.total_reviews} reviews</span>
                        </div>
                      </div>
                      
                      {/* Score Badge */}
                      {tech.recommendation_score && (
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getTrustColor(tech.recommendation_score)}`}>
                          {tech.recommendation_score}%
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {tech.experience_years} years exp
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {tech.completed_jobs} jobs
                      </span>
                      {tech.distance_km && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {tech.distance_km} km away
                        </span>
                      )}
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tech.skills?.slice(0, 3).map(skill => (
                        <span
                          key={skill.id}
                          className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full"
                        >
                          {skill.name}
                        </span>
                      ))}
                      {tech.skills && tech.skills.length > 3 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                          +{tech.skills.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Verification Badge */}
                    {tech.verification_status === 'verified' && (
                      <div className="flex items-center gap-1 mt-2 text-emerald-600 text-sm">
                        <Shield className="w-4 h-4" />
                        <span>Verified by TrustFix</span>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-slate-400 self-center" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
