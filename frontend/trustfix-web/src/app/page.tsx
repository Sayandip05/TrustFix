"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Search,
  Star,
  Shield,
  Wallet,
  Clock,
  Wrench,
  User,
  Menu,
  X,
  Phone,
  CheckCircle,
  ArrowRight,
  Navigation,
} from "lucide-react";
import { useLocation } from "@/hooks/useLocation";
import LocationPrompt from "@/components/LocationPrompt";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Service data
const services = [
  { name: "Plumbing", icon: "🔧", time: "45 mins", color: "bg-blue-500" },
  { name: "Electrical", icon: "⚡", time: "30 mins", color: "bg-yellow-500" },
  { name: "AC Service", icon: "❄️", time: "60 mins", color: "bg-cyan-500" },
  { name: "Carpentry", icon: "🪚", time: "90 mins", color: "bg-amber-600" },
  { name: "Cleaning", icon: "🧹", time: "120 mins", color: "bg-green-500" },
  { name: "Emergency", icon: "🚨", time: "15 mins", color: "bg-red-500", urgent: true },
];

const categories = [
  {
    name: "Plumbing",
    image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop",
    rating: 4.82,
    price: "From ₹299",
    description: "Leak repairs, pipe fitting, tap installation",
  },
  {
    name: "Electrical",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop",
    rating: 4.85,
    price: "From ₹249",
    description: "Wiring, switches, fan installation",
  },
  {
    name: "AC Service",
    image: "https://images.unsplash.com/photo-1631545308772-81a0e0a3a6ae?w=400&h=300&fit=crop",
    rating: 4.79,
    price: "From ₹499",
    description: "AC repair, gas refill, servicing",
  },
  {
    name: "Carpentry",
    image: "https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?w=400&h=300&fit=crop",
    rating: 4.81,
    price: "From ₹399",
    description: "Furniture repair, door fitting",
  },
];

const reviews = [
  {
    name: "Priya Sharma",
    location: "Salt Lake, Kolkata",
    rating: 5,
    text: "Amazing service! The plumber arrived within 30 minutes and fixed the leak perfectly. The upfront pricing was very transparent.",
    service: "Plumbing Service",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Rajesh Kumar",
    location: "Dumdum, Kolkata",
    rating: 4.8,
    text: "Best AC service I've ever had. The technician was professional and explained everything. Will definitely use again!",
    service: "AC Repair",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Sunita Devi",
    location: "Howrah",
    rating: 5,
    text: "The electrician was very skilled and completed the work quickly. Loved the escrow payment - felt very secure!",
    service: "Electrical Work",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

// Auth Modal Component
function AuthModal({
  isOpen,
  onClose,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  type: "customer-login" | "customer-signup" | "technician-login" | "technician-signup";
}) {
  if (!isOpen) return null;

  const isCustomer = type.includes("customer");
  const isLogin = type.includes("login");
  const title = isLogin
    ? isCustomer
      ? "Customer Login"
      : "Professional Login"
    : isCustomer
    ? "Create Customer Account"
    : "Join as a Professional";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
          <p className="text-slate-500 mb-6">
            {isLogin ? "Enter your phone number to continue" : "Fill in your details to get started"}
          </p>

          <form className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
              <div className="flex border border-slate-200 rounded-lg overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200">
                <span className="px-4 py-3 bg-slate-50 text-slate-500 font-semibold border-r border-slate-200">+91</span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  className="flex-1 px-4 py-3 outline-none"
                />
              </div>
            </div>

            {!isLogin && isCustomer && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                  <input
                    type="text"
                    placeholder="Enter your city"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                  <textarea
                    placeholder="Enter your full address"
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                  />
                </div>
              </>
            )}

            {!isLogin && !isCustomer && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                    <input
                      type="text"
                      placeholder="Your city"
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Experience</label>
                    <input
                      type="number"
                      placeholder="Years"
                      min={0}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Your Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {["Plumbing", "Electrical", "AC Service", "Carpentry", "Cleaning"].map((skill) => (
                      <label key={skill} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-full cursor-pointer hover:bg-slate-100 transition-colors">
                        <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" />
                        <span className="text-sm">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg ${
                isCustomer
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {isLogin ? "Send OTP" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-500 text-sm">
            {isLogin ? "New to TrustFix? " : "Already have an account? "}
            <button className="text-indigo-600 font-semibold hover:underline">
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Main Page Component
export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  
  const {
    city,
    address,
    hasLocation,
    permission,
    loading: locationLoading,
    requestLocation,
    useDefaultLocation,
    setManualLocation,
  } = useLocation();

  // Show location prompt on mount if no location
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasLocation && permission === null) {
        setShowLocationPrompt(true);
      }
    }, 2000); // Show after 2 seconds
    return () => clearTimeout(timer);
  }, [hasLocation, permission]);

  const handleAllowLocation = async () => {
    const success = await requestLocation();
    if (success) {
      setShowLocationPrompt(false);
    }
  };

  const handleSkipLocation = () => {
    useDefaultLocation();
    setShowLocationPrompt(false);
  };

  const handleManualCity = (cityName: string) => {
    setManualLocation(cityName, cityName);
    setShowLocationPrompt(false);
  };

  const goToAuth = (role: "customer" | "technician") => {
    router.push(`/auth/${role}`);
    setMobileMenuOpen(false);
  };

  // Keep legacy openAuth for deep parts of page that reference it
  const openAuth = (type: string) => {
    if (type.includes("technician")) goToAuth("technician");
    else goToAuth("customer");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-100 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">TrustFix</span>
            </a>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                Services
              </a>
              <a href="#how-it-works" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                How it Works
              </a>
              <a href="#reviews" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                Reviews
              </a>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => goToAuth("technician")}
                className="flex items-center gap-2 px-4 py-2 text-emerald-600 font-semibold hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <Wrench className="w-4 h-4" />
                Join as Pro
              </button>
              <button
                onClick={() => goToAuth("customer")}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all hover:shadow-md"
              >
                <User className="w-4 h-4" />
                Sign In
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-slate-100"
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#services" className="block py-2 text-slate-600 font-medium">Services</a>
              <a href="#how-it-works" className="block py-2 text-slate-600 font-medium">How it Works</a>
              <a href="#reviews" className="block py-2 text-slate-600 font-medium">Reviews</a>
              <hr className="border-slate-100" />
              <button
                onClick={() => openAuth("technician-login")}
                className="flex items-center gap-2 w-full py-2 text-emerald-600 font-semibold"
              >
                <Wrench className="w-4 h-4" />
                Join as Pro
              </button>
              <button
                onClick={() => openAuth("customer-login")}
                className="flex items-center gap-2 w-full py-2 text-indigo-600 font-semibold"
              >
                <User className="w-4 h-4" />
                Login
              </button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Location Prompt Modal */}
      <LocationPrompt
        isOpen={showLocationPrompt}
        onClose={() => setShowLocationPrompt(false)}
        onAllow={handleAllowLocation}
        onSkip={handleSkipLocation}
        onManualCity={handleManualCity}
        loading={locationLoading}
      />

      {/* Hero Section */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 bg-gradient-to-br from-indigo-50 via-white to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm mb-6">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="text-sm text-slate-600">
                  {hasLocation ? city : "Detecting location..."}
                </span>
                <button
                  onClick={() => setShowLocationPrompt(true)}
                  className="text-xs text-indigo-600 hover:underline ml-1"
                >
                  {hasLocation ? "Change" : "Set location"}
                </button>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6"
              >
                Home services at your{" "}
                <span className="text-indigo-600">doorstep</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-slate-600 mb-8 max-w-lg"
              >
                Verified professionals. Upfront pricing. Pay only when satisfied.
              </motion.p>

              {/* Search Box */}
              <motion.div
                variants={fadeInUp}
                className="bg-white p-2 rounded-2xl shadow-xl mb-10"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-slate-400 ml-3" />
                  <input
                    type="text"
                    placeholder="What service do you need?"
                    className="flex-1 py-3 outline-none text-slate-700 placeholder:text-slate-400"
                  />
                  <button className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                    Search
                  </button>
                </div>
              </motion.div>

              {/* Quick Services */}
              <motion.div variants={fadeInUp}>
                <p className="text-sm font-semibold text-slate-700 mb-4">What are you looking for?</p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {services.map((service, index) => (
                    <motion.button
                      key={service.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => openAuth("customer-login")}
                      className="flex-shrink-0 w-28 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 text-center group"
                    >
                      <div className={`w-12 h-12 ${service.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                        <span className="text-xl">{service.icon}</span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm mb-1">{service.name}</p>
                      <p className={`text-xs flex items-center justify-center gap-1 ${service.urgent ? "text-red-500 font-semibold" : "text-slate-500"}`}>
                        <Clock className="w-3 h-3" />
                        {service.time}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=700&fit=crop"
                  alt="Professional technician"
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Trust Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="absolute -left-8 bottom-20 bg-white rounded-2xl p-5 shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">10,000+</p>
                    <p className="text-slate-500 text-sm">Verified Pros</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: Shield, text: "Verified Professionals" },
              { icon: Wallet, text: "Upfront Pricing" },
              { icon: CheckCircle, text: "Secure Payments" },
              { icon: Star, text: "4.8+ Rating" },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 text-white">
                <item.icon className="w-6 h-6 text-emerald-400" />
                <span className="font-semibold">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Our Services</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Professional home services delivered by verified experts in your area
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 cursor-pointer group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full flex items-center gap-1 text-sm font-semibold">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {category.rating}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{category.name}</h3>
                  <p className="text-slate-500 text-sm mb-3">{category.description}</p>
                  <p className="text-indigo-600 font-semibold">{category.price}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">How TrustFix Works</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Get your home services done in 3 simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                icon: Search,
                title: "Describe Your Problem",
                description: "Tell us what you need. Get an AI-powered price estimate instantly.",
                color: "bg-indigo-500",
              },
              {
                step: 2,
                icon: User,
                title: "Get a Verified Pro",
                description: "We match you with the best nearby verified technician.",
                color: "bg-emerald-500",
              },
              {
                step: 3,
                icon: CheckCircle,
                title: "Service at Your Door",
                description: "Track your pro in real-time. Pay only when satisfied.",
                color: "bg-amber-500",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center relative"
              >
                <div className="relative inline-block mb-6">
                  <div className={`w-24 h-24 ${item.color} rounded-full flex items-center justify-center mx-auto`}>
                    <item.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Customer CTA */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 lg:p-10 shadow-xl flex flex-col lg:flex-row gap-8 items-center"
            >
              <div className="flex-1">
                <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
                  Need Home Services?
                </h3>
                <p className="text-slate-600 mb-6">
                  Book verified professionals for plumbing, electrical, AC service & more.
                </p>
                <ul className="space-y-3 mb-8">
                  {["Verified professionals", "Upfront pricing", "Secure escrow payments", "24/7 emergency service"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-slate-700">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openAuth("customer-signup")}
                  className="w-full lg:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all hover:shadow-lg"
                >
                  <User className="w-5 h-5" />
                  Sign Up as Customer
                </button>
                <p className="mt-4 text-sm text-slate-500">
                  Already have an account?{" "}
                  <button onClick={() => openAuth("customer-login")} className="text-indigo-600 font-semibold hover:underline">
                    Login
                  </button>
                </p>
              </div>
              <div className="w-full lg:w-48 h-48 lg:h-64 rounded-2xl overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop"
                  alt="Happy customer"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Technician CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 lg:p-10 shadow-xl flex flex-col lg:flex-row gap-8 items-center"
            >
              <div className="flex-1">
                <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
                  Are You a Service Professional?
                </h3>
                <p className="text-slate-600 mb-6">
                  Join our network of verified professionals. Get steady work and grow your business.
                </p>
                <ul className="space-y-3 mb-8">
                  {["Steady job flow", "Weekly payments", "Zero registration fee", "Only 10% commission"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-slate-700">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openAuth("technician-signup")}
                  className="w-full lg:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all hover:shadow-lg"
                >
                  <Wrench className="w-5 h-5" />
                  Join as Technician
                </button>
                <p className="mt-4 text-sm text-slate-500">
                  Already registered?{" "}
                  <button onClick={() => openAuth("technician-login")} className="text-emerald-600 font-semibold hover:underline">
                    Login
                  </button>
                </p>
              </div>
              <div className="w-full lg:w-48 h-48 lg:h-64 rounded-2xl overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=500&fit=crop"
                  alt="Professional technician"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">What Our Customers Say</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Trusted by thousands of happy customers across India
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{review.name}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {review.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
                    <Star className="w-4 h-4 fill-white" />
                    {review.rating}
                  </div>
                </div>
                <p className="text-slate-600 mb-4 leading-relaxed">{review.text}</p>
                <span className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm">
                  {review.service}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <a href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">TrustFix</span>
              </a>
              <p className="text-slate-400 mb-6">
                Verified home services at your doorstep. Professional, reliable, and transparent.
              </p>
              <div className="flex gap-4">
                {["facebook", "twitter", "instagram", "linkedin"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors"
                  >
                    <span className="sr-only">{social}</span>
                    <ArrowRight className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">For Customers</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => openAuth("customer-signup")} className="hover:text-white transition-colors">Sign Up</button></li>
                <li><button onClick={() => openAuth("customer-login")} className="hover:text-white transition-colors">Login</button></li>
                <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Professionals</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => openAuth("technician-signup")} className="hover:text-white transition-colors">Join as Pro</button></li>
                <li><button onClick={() => openAuth("technician-login")} className="hover:text-white transition-colors">Pro Login</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Partner Resources</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400">&copy; 2025 TrustFix. All rights reserved.</p>
            <p className="text-slate-500 italic">Built for Bharat. One tap. Verified tech. Paid when done.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
