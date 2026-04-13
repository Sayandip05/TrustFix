'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  X,
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Star,
  Award,
  Zap,
  Heart,
  Crown,
  IdCard,
  Loader2,
  Sparkles,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
} from 'lucide-react';
import { AuthenticityReport, Technician, Badge, Check, RedFlag } from '@/lib/api';

interface AuthenticityBotProps {
  report: AuthenticityReport | null;
  technician: Technician;
  onClose: () => void;
  onBook: () => void;
}

export function AuthenticityBot({ report, technician, onClose, onBook }: AuthenticityBotProps) {
  const [loading, setLoading] = useState(!report);
  const [currentStep, setCurrentStep] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Simulate loading animation if report is being fetched
  useEffect(() => {
    if (!report) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
    setLoading(false);
  }, [report]);

  const getTrustColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getTrustLabel = (score: number) => {
    if (score >= 85) return 'Highly Trusted';
    if (score >= 70) return 'Trusted';
    if (score >= 60) return 'Moderate Trust';
    return 'Low Trust';
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'highly_recommended':
        return <ThumbsUp className="w-6 h-6 text-emerald-600" />;
      case 'recommended':
        return <ThumbsUp className="w-6 h-6 text-blue-600" />;
      case 'caution':
        return <AlertCircle className="w-6 h-6 text-amber-600" />;
      case 'not_recommended':
        return <ThumbsDown className="w-6 h-6 text-red-600" />;
      default:
        return <Sparkles className="w-6 h-6 text-indigo-600" />;
    }
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield': return <Shield className="w-4 h-4" />;
      case 'id-card': return <IdCard className="w-4 h-4" />;
      case 'award': return <Award className="w-4 h-4" />;
      case 'star': return <Star className="w-4 h-4" />;
      case 'zap': return <Zap className="w-4 h-4" />;
      case 'crown': return <Crown className="w-4 h-4" />;
      case 'heart': return <Heart className="w-4 h-4" />;
      case 'check-circle': return <CheckCircle className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const getBadgeColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      gold: 'bg-amber-100 text-amber-700 border-amber-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      red: 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
            />
            <Bot className="absolute inset-0 m-auto w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">AI Verification in Progress</h3>
          <p className="text-slate-600">Analyzing {technician.name}&apos;s profile...</p>
          <div className="mt-4 space-y-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5 }}
              className="h-2 bg-indigo-100 rounded-full overflow-hidden"
            >
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="h-full w-1/2 bg-indigo-600 rounded-full"
              />
            </motion.div>
          </div>
          <p className="text-sm text-slate-500 mt-2">Checking identity, reviews, and work history</p>
        </motion.div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Verification Failed</h3>
          <p className="text-slate-600 mb-4">Could not verify this technician. Please try again.</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">TrustFix AI Bot</h3>
                <p className="text-indigo-100 text-sm">Authenticity Verification</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Overall Score */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center border-2 ${getTrustColor(report.overall_score)}`}>
                <div className="text-center">
                  <span className="text-3xl font-bold">{report.overall_score}</span>
                  <span className="text-sm">/100</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-lg">{getTrustLabel(report.overall_score)}</h4>
                <p className="text-slate-600 text-sm mt-1">{report.summary}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getRecommendationIcon(report.recommendation)}
                  <span className={`text-sm font-semibold ${
                    report.recommendation === 'highly_recommended' ? 'text-emerald-600' :
                    report.recommendation === 'recommended' ? 'text-blue-600' :
                    report.recommendation === 'caution' ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {report.recommendation_reason}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          {report.badges.length > 0 && (
            <div className="p-6 border-b border-slate-100">
              <h4 className="font-semibold text-slate-900 mb-3">Achievement Badges</h4>
              <div className="flex flex-wrap gap-2">
                {report.badges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getBadgeColor(badge.color)}`}
                    title={badge.description}
                  >
                    {getBadgeIcon(badge.icon)}
                    <span className="text-sm font-medium">{badge.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Red Flags */}
          {report.red_flags.length > 0 && (
            <div className="p-6 border-b border-slate-100 bg-red-50/50">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Attention Needed
              </h4>
              <div className="space-y-2">
                {report.red_flags.map((flag, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      flag.severity === 'high' ? 'bg-red-100 border-red-200 text-red-900' :
                      flag.severity === 'medium' ? 'bg-amber-100 border-amber-200 text-amber-900' :
                      'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <p className="font-medium text-sm">{flag.message}</p>
                    <p className="text-xs mt-1 opacity-80">{flag.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Analysis */}
          <div className="p-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="font-semibold text-slate-900">Detailed Analysis</h4>
              {showDetails ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </button>
            
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-4 space-y-4"
              >
                {/* Identity */}
                <AnalysisSection
                  title="Identity Verification"
                  score={report.identity_verification.score}
                  checks={report.identity_verification.checks}
                />
                
                {/* Work Quality */}
                <AnalysisSection
                  title="Work Quality"
                  score={report.work_quality.score}
                  checks={report.work_quality.checks}
                />
                
                {/* Reliability */}
                <AnalysisSection
                  title="Reliability"
                  score={report.reliability.score}
                  checks={report.reliability.checks}
                />
                
                {/* Customer Satisfaction */}
                <AnalysisSection
                  title="Customer Satisfaction"
                  score={report.customer_satisfaction.score}
                  checks={report.customer_satisfaction.checks}
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
            >
              Close
            </button>
            <button
              onClick={onBook}
              disabled={report.recommendation === 'not_recommended'}
              className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {report.recommendation === 'not_recommended' ? 'Not Recommended' : 'Book Now'}
            </button>
          </div>
          <p className="text-xs text-slate-500 text-center mt-3">
            This verification is powered by AI and based on available data. Always exercise your own judgment.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Analysis Section Component
function AnalysisSection({ title, score, checks }: { title: string; score: number; checks: Check[] }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-semibold text-slate-900">{title}</h5>
        <span className={`font-bold ${getScoreColor(score)}`}>{score}/100</span>
      </div>
      <div className="space-y-2">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {check.status === 'pass' ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : check.status === 'partial' ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-slate-700">{check.name}</span>
            {check.detail && (
              <span className="text-slate-400 text-xs">({check.detail})</span>
            )}
            <span className="ml-auto text-slate-500">+{check.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
