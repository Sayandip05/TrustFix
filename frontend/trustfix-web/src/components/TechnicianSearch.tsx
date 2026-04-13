"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Star,
  Clock,
  CheckCircle,
  Filter,
  X,
  Loader2,
  Navigation,
  Phone,
  Briefcase,
  Award,
  TrendingUp,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";

interface Technician {
  id: string;
  name: string;
  phone: string;
  profile_image: string | null;
  experience_years: number;
  bio: string;
  skills: { id: string; name: string }[];
  rating: number;
  total_reviews: number;
  completed_jobs: number;
  latitude: number;
  longitude: number;
  service_radius_km: number;
  is_available: boolean;
  distance_km: number;
  pricing_config: Record<string, { base_rate: number; hourly_rate: number }>;
  recommendation_score: number;
}

interface SearchFilters {
  radius: number;
  minRating: number;
  maxPrice: number | null;
  sortBy: "distance" | "rating" | "experience" | "score";
  emergency: boolean;
}

interface TechnicianSearchProps {
  serviceId?: string;
  serviceName?: string;
  onSelectTechnician: (technician: Technician) => void;
  customerLocation: { lat: number; lng: number } | null;
}

export default function TechnicianSearch({
  serviceId,
  serviceName,
  onSelectTechnician,
  customerLocation,
}: TechnicianSearchProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    radius: 10,
    minRating: 0,
    maxPrice: null,
    sortBy: "score",
    emergency: false,
  });

  const searchTechnicians = useCallback(async () => {
    if (!customerLocation) {
      setError("Please enable location access to find nearby technicians");
      return;
    }

    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      lat: customerLocation.lat.toString(),
      lng: customerLocation.lng.toString(),
      radius: filters.radius.toString(),
      min_rating: filters.minRating.toString(),
      sort_by: filters.sortBy,
      emergency: filters.emergency.toString(),
      available_only: "true",
    });

    if (serviceId) {
      params.append("service_id", serviceId);
    }

    if (filters.maxPrice) {
      params.append("max_price", filters.maxPrice.toString());
    }

    const { data, error: apiError } = await apiFetch<{
      count: number;
      technicians: Technician[];
    }>(`/api/technicians/search/?${params}`);

    if (apiError) {
      setError(apiError);
    } else if (data) {
      setTechnicians(data.technicians);
    }

    setLoading(false);
  }, [customerLocation, filters, serviceId]);

  useEffect(() => {
    if (customerLocation) {
      searchTechnicians();
    }
  }, [customerLocation, searchTechnicians]);

  const getPriceForService = (tech: Technician) => {
    if (!serviceId) return null;
    const pricing = tech.pricing_config[serviceId];
    if (!pricing) return { base: 300, hourly: 200 };
    
    let baseRate = pricing.base_rate;
    if (filters.emergency) {
      baseRate = Math.round(baseRate * 1.4);
    }
    return { base: baseRate, hourly: pricing.hourly_rate };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {serviceName ? `${serviceName} Technicians` : "Available Technicians"}
          </h2>
          <p className="text-sm text-slate-500">
            {customerLocation ? (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Searching within {filters.radius}km radius
              </span>
            ) : (
              "Getting your location..."
            )}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            showFilters
              ? "bg-indigo-100 text-indigo-700"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 rounded-xl p-4 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Radius */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Search Radius: {filters.radius}km
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={filters.radius}
                  onChange={(e) =>
                    setFilters({ ...filters, radius: parseInt(e.target.value) })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Min Rating: {filters.minRating}+
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.minRating}
                  onChange={(e) =>
                    setFilters({ ...filters, minRating: parseFloat(e.target.value) })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters({ ...filters, sortBy: e.target.value as any })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                >
                  <option value="score">Recommended</option>
                  <option value="distance">Nearest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="experience">Most Experienced</option>
                </select>
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Max Budget (₹)
                </label>
                <input
                  type="number"
                  placeholder="No limit"
                  value={filters.maxPrice || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      maxPrice: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
            </div>

            {/* Emergency Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.emergency}
                onChange={(e) =>
                  setFilters({ ...filters, emergency: e.target.checked })
                }
                className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
              />
              <span className="text-sm text-slate-700">
                Emergency Service (15 min response, +40% charge)
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={searchTechnicians}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={() =>
                  setFilters({
                    radius: 10,
                    minRating: 0,
                    maxPrice: null,
                    sortBy: "score",
                    emergency: false,
                  })
                }
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={searchTechnicians}
            className="mt-2 text-red-600 font-medium hover:underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {!loading && !error && technicians.length === 0 && (
        <div className="bg-slate-50 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Navigation className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-slate-700 font-semibold mb-2">
            No technicians found
          </h3>
          <p className="text-slate-500 text-sm">
            Try increasing your search radius or adjusting filters
          </p>
        </div>
      )}

      {/* Technician Cards */}
      <div className="space-y-3">
        {technicians.map((tech, index) => {
          const price = getPriceForService(tech);
          return (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {tech.profile_image ? (
                    <img
                      src={tech.profile_image}
                      alt={tech.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl font-bold text-indigo-600">
                        {tech.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{tech.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-amber-500 text-sm font-semibold">
                          <Star className="w-4 h-4 fill-amber-500" />
                          {tech.rating.toFixed(1)}
                        </span>
                        <span className="text-slate-400 text-sm">
                          ({tech.total_reviews} reviews)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                        <MapPin className="w-3 h-3" />
                        {tech.distance_km} km
                      </span>
                      {tech.recommendation_score > 80 && (
                        <span className="block mt-1 text-xs text-indigo-600 font-medium">
                          <TrendingUp className="w-3 h-3 inline mr-1" />
                          Top Rated
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-3 mt-3">
                    <span className="flex items-center gap-1 text-slate-600 text-sm">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      {tech.experience_years} years exp
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 text-sm">
                      <CheckCircle className="w-4 h-4 text-slate-400" />
                      {tech.completed_jobs} jobs done
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 text-sm">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {Math.round(tech.distance_km * 5)} min away
                    </span>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {tech.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill.id}
                        className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs"
                      >
                        {skill.name}
                      </span>
                    ))}
                    {tech.skills.length > 4 && (
                      <span className="px-2 py-1 text-slate-400 text-xs">
                        +{tech.skills.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    {price ? (
                      <div>
                        <span className="text-2xl font-bold text-slate-900">
                          ₹{price.base}
                        </span>
                        <span className="text-slate-400 text-sm ml-1">
                          onwards
                        </span>
                        {filters.emergency && (
                          <span className="block text-xs text-red-500">
                            Emergency rate (+40%)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">
                        Contact for pricing
                      </span>
                    )}
                    <button
                      onClick={() => onSelectTechnician(tech)}
                      className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
