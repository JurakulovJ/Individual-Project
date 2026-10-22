import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Sparkles,
  Layers,
  Database,
  ExternalLink,
  Code2,
  Cpu,
  Plane,
  ShieldCheck,
  Check,
  Activity,
  Send,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Hotel,
  Utensils,
  Camera,
  Coffee,
  ChevronRight,
  ChevronDown,
  Download,
  Share2,
  Tag,
  Luggage,
} from 'lucide-react';
import {
  checkHealth,
  extractConstraints,
  generateItinerary,
  quickGenerateItinerary,
  fetchDestinations,
} from './services/api';
import { formatCurrency, formatDateRange } from './utils/formatters';

export default function App() {
  // Navigation tab: 'planner' or 'telemetry'
  const [activeTab, setActiveTab] = useState('planner');

  // Backend Health & Telemetry State
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState(null);
  const [latency, setLatency] = useState(null);
  const [copied, setCopied] = useState(false);

  // Travel Planner State
  const [prompt, setPrompt] = useState(
    'I want a 5-day romantic trip to Tokyo with moderate budget in April'
  );
  const [destinations, setDestinations] = useState([]);
  const [extractedConstraints, setExtractedConstraints] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [planningError, setPlanningError] = useState(null);
  const [expandedDays, setExpandedDays] = useState({ 1: true });

  const testConnection = async () => {
    setHealthLoading(true);
    setHealthError(null);
    const start = performance.now();
    try {
      const data = await checkHealth();
      const end = performance.now();
      setLatency(Math.round(end - start));
      setHealthData(data);
    } catch (err) {
      setHealthError(err.message || 'Could not connect to FastAPI server');
      setHealthData(null);
    } finally {
      setHealthLoading(false);
    }
  };

  const loadDestinations = async () => {
    try {
      const data = await fetchDestinations();
      setDestinations(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    testConnection();
    loadDestinations();
  }, []);

  const handleExtractConstraints = async () => {
    if (!prompt.trim()) return;
    setPlanningLoading(true);
    setPlanningError(null);
    try {
      const constraints = await extractConstraints(prompt);
      setExtractedConstraints(constraints);
    } catch (err) {
      setPlanningError(
        err.response?.data?.detail || err.message || 'Constraint extraction failed'
      );
    } finally {
      setPlanningLoading(false);
    }
  };

  const handleGenerateItinerary = async (constraintsToUse = null) => {
    const c = constraintsToUse || extractedConstraints;
    setPlanningLoading(true);
    setPlanningError(null);
    try {
      let result;
      if (c) {
        result = await generateItinerary(c);
      } else {
        result = await quickGenerateItinerary(prompt);
        if (result.constraints) {
          setExtractedConstraints(result.constraints);
        }
      }
      setItinerary(result);
      // Expand all days by default
      const exp = {};
      result.days?.forEach((d) => {
        exp[d.day_number] = true;
      });
      setExpandedDays(exp);
    } catch (err) {
      setPlanningError(
        err.response?.data?.detail || err.message || 'Itinerary generation failed'
      );
    } finally {
      setPlanningLoading(false);
    }
  };

  const toggleDay = (dayNum) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayNum]: !prev[dayNum],
    }));
  };

  const copyCommand = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportItineraryJson = () => {
    if (!itinerary) return;
    const blob = new Blob([JSON.stringify(itinerary, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `itinerary-${itinerary.itinerary_id || 'trip'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'hotel':
        return <Hotel className="w-4 h-4 text-purple-400" />;
      case 'flight':
        return <Plane className="w-4 h-4 text-cyan-400" />;
      case 'dining':
        return <Utensils className="w-4 h-4 text-amber-400" />;
      case 'leisure':
        return <Coffee className="w-4 h-4 text-emerald-400" />;
      default:
        return <Camera className="w-4 h-4 text-rose-400" />;
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category?.toLowerCase()) {
      case 'hotel':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'flight':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
      case 'dining':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'leisure':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      default:
        return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    }
  };

  const samplePrompts = [
    {
      title: '🗼 Tokyo Romance',
      text: 'I want a 5-day romantic trip to Tokyo with moderate budget in April',
    },
    {
      title: '🥐 Paris Culture & Art',
      text: '3-day luxury cultural escape in Paris with art museums and wine tasting',
    },
    {
      title: '🌴 Bali Relaxation',
      text: '7-day budget relaxation and beach trip to Bali for 2 people with spa and nature',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background ambient decorative glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-white/5 bg-[#070b14]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
              <Compass className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  TravelAI
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Platform
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AI Travel Planning & Decision-Support System
              </p>
            </div>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10">
            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'planner'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Luggage className="w-3.5 h-3.5" />
              <span>AI Trip Planner</span>
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'telemetry'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>System Telemetry</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 transition-all"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>API Docs</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    healthError ? 'bg-rose-400' : 'bg-emerald-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    healthError ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                />
              </span>
              <span className="text-slate-300">
                {healthLoading
                  ? 'Probing...'
                  : healthError
                  ? 'Offline'
                  : `${latency ?? 0}ms`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'planner' ? (
          /* ========================================================================= */
          /*                       AI TRAVEL PLANNER INTERFACE                         */
          /* ========================================================================= */
          <div className="space-y-8">
            {/* Hero Banner */}
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-300 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Conversational Trip Planning & Multimodal Ranking</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Where would you like to travel? <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Describe your dream itinerary
                </span>
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-2xl mx-auto">
                Speak naturally. TravelAI extracts budget, dates, and interests,
                then ranks flights, hotels, and generates a personalized day-by-day plan.
              </p>
            </div>

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: Input & Extracted Constraints (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Conversational Input Card */}
                <div className="rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Natural Language Prompt</span>
                    </span>
                    <span className="text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      AI Extractor
                    </span>
                  </div>

                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. 5-day romantic trip to Tokyo with moderate budget in April..."
                      rows={3}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 resize-none transition-all"
                    />
                  </div>

                  {/* Sample prompt chips */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-slate-400">Quick Inspiration Presets:</p>
                    <div className="flex flex-wrap gap-2">
                      {samplePrompts.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPrompt(p.text)}
                          className="text-xs text-slate-300 hover:text-cyan-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-cyan-500/30 px-2.5 py-1 rounded-lg transition-all text-left"
                        >
                          {p.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleExtractConstraints}
                      disabled={planningLoading || !prompt.trim()}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50"
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Extract Entities</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerateItinerary()}
                      disabled={planningLoading || !prompt.trim()}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {planningLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      ) : (
                        <Send className="w-3.5 h-3.5 text-slate-950" />
                      )}
                      <span>Synthesize Itinerary</span>
                    </button>
                  </div>

                  {planningError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{planningError}</span>
                    </div>
                  )}
                </div>

                {/* Structured Travel Constraints Card */}
                {extractedConstraints ? (
                  <div className="rounded-2xl bg-white/[0.03] border border-cyan-500/30 p-5 space-y-4 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-bold text-white">
                          Extracted Travel Constraints
                        </h3>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Pydantic Validated
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Destination
                        </span>
                        <div className="flex items-center gap-1.5 font-bold text-cyan-300 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{extractedConstraints.destination}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Departure (Origin)
                        </span>
                        <div className="flex items-center gap-1.5 font-bold text-indigo-300 mt-0.5">
                          <Plane className="w-3.5 h-3.5" />
                          <span>{extractedConstraints.origin}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Dates
                        </span>
                        <div className="flex items-center gap-1.5 font-medium text-slate-200 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          <span>
                            {formatDateRange(
                              extractedConstraints.start_date,
                              extractedConstraints.end_date
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Party Size & Style
                        </span>
                        <div className="flex items-center gap-1.5 font-medium text-slate-200 mt-0.5">
                          <Users className="w-3.5 h-3.5 text-cyan-400" />
                          <span>
                            {extractedConstraints.travelers_count} traveler(s) •{' '}
                            <span className="capitalize">{extractedConstraints.trip_type}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interest Badges */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Identified Interests:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {extractedConstraints.interests?.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 capitalize"
                          >
                            #{tag}
                          </span>
                        ))}
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 capitalize">
                          Tier: {extractedConstraints.budget_level}
                        </span>
                      </div>
                    </div>

                    {!itinerary && (
                      <button
                        type="button"
                        onClick={() => handleGenerateItinerary(extractedConstraints)}
                        disabled={planningLoading}
                        className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Full Itinerary from These Constraints</span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Destination Catalog preview */
                  <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Available Destination Catalog</span>
                      </h4>
                      <span className="text-[10px] text-slate-400">Offline Resilient</span>
                    </div>

                    <div className="space-y-2">
                      {destinations.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => {
                            setPrompt(
                              `I want a 5-day ${d.tags?.[0] || 'cultural'} trip to ${d.city}, ${d.country} with moderate budget`
                            );
                          }}
                          className="group p-3 rounded-xl bg-black/20 hover:bg-white/[0.05] border border-white/5 hover:border-cyan-500/30 cursor-pointer transition-all flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-xs group-hover:text-cyan-300 transition-colors">
                                {d.city}, {d.country}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 font-mono">
                                {d.airport_code}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              {d.tags?.slice(0, 3).map((t, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] text-slate-400 bg-white/[0.02] px-1.5 py-0.5 rounded"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-semibold text-emerald-400 block font-mono">
                              ${d.avg_daily_budget}/day
                            </span>
                            <span className="text-[10px] text-slate-500">Tap to plan</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Synthesized Ranked Itinerary (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {itinerary ? (
                  <div className="space-y-6">
                    {/* Itinerary Header Banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/40 border border-cyan-500/30 p-6 shadow-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              Itinerary #{itinerary.itinerary_id}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300">
                              {itinerary.days?.length} Days Total
                            </span>
                          </div>
                          <h2 className="text-2xl font-black text-white mt-1.5 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-cyan-400" />
                            <span>{itinerary.destination}</span>
                          </h2>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-xs text-slate-400 block">Total Estimated Cost</span>
                          <span className="text-2xl font-black text-emerald-400 font-mono">
                            {formatCurrency(itinerary.total_estimated_cost, itinerary.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Flight & Hotel Cards Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {itinerary.flight_summary && (
                          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                                <Plane className="w-3.5 h-3.5" />
                                <span>Recommended Flight</span>
                              </span>
                              <span className="font-mono text-emerald-400 font-bold text-xs">
                                ${itinerary.flight_summary.price}
                              </span>
                            </div>
                            <p className="text-xs text-white font-medium">
                              {itinerary.flight_summary.carrier}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {itinerary.flight_summary.origin} → {itinerary.flight_summary.destination} • {itinerary.flight_summary.duration || 'Direct'}
                            </p>
                          </div>
                        )}

                        {itinerary.hotel_summary && (
                          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                                <Hotel className="w-3.5 h-3.5" />
                                <span>Ranked Accommodation</span>
                              </span>
                              <span className="font-mono text-emerald-400 font-bold text-xs">
                                ${itinerary.hotel_summary.price_per_night}/night
                              </span>
                            </div>
                            <p className="text-xs text-white font-medium">
                              {itinerary.hotel_summary.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Rating: ★ {itinerary.hotel_summary.rating || '4.5'} • {itinerary.hotel_summary.city}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions toolbar */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-slate-400">
                          Timeline generated with multi-criteria optimization
                        </span>
                        <button
                          type="button"
                          onClick={exportItineraryJson}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all"
                        >
                          <Download className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Export JSON</span>
                        </button>
                      </div>
                    </div>

                    {/* Day-by-day Itinerary Timeline */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                          <span>Day-by-Day Detailed Schedule</span>
                        </h3>
                        <span className="text-xs text-slate-400">
                          {itinerary.days?.length} cohesive daily plans
                        </span>
                      </div>

                      <div className="space-y-3">
                        {itinerary.days?.map((day) => {
                          const isExpanded = expandedDays[day.day_number] ?? true;
                          return (
                            <div
                              key={day.day_number}
                              className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden transition-all hover:border-white/20"
                            >
                              {/* Day Header Accordion Toggle */}
                              <button
                                type="button"
                                onClick={() => toggleDay(day.day_number)}
                                className="w-full p-4 flex items-center justify-between text-left bg-black/20 hover:bg-black/40 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-300 text-xs">
                                    D{day.day_number}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm text-white">
                                      {day.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-400">{day.date}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-slate-400">
                                    {day.activities?.length || 0} activities
                                  </span>
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                              </button>

                              {/* Day Activities List */}
                              {isExpanded && (
                                <div className="p-4 space-y-3 border-t border-white/5 bg-black/10">
                                  {day.activities?.map((act, actIdx) => (
                                    <div
                                      key={actIdx}
                                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.04] transition-all"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="mt-0.5 w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                          {getCategoryIcon(act.category)}
                                        </div>

                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-mono text-cyan-300 font-semibold">
                                              {act.time}
                                            </span>
                                            <span
                                              className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                                                act.category
                                              )}`}
                                            >
                                              {act.category}
                                            </span>
                                            {act.location && (
                                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-slate-500" />
                                                <span>{act.location}</span>
                                              </span>
                                            )}
                                          </div>

                                          <h5 className="font-semibold text-xs text-white">
                                            {act.title}
                                          </h5>
                                          {act.description && (
                                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                              {act.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                        <span className="text-xs font-mono font-bold text-emerald-400">
                                          {act.cost > 0 ? formatCurrency(act.cost) : 'Included'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty state when no itinerary is yet generated */
                  <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/10 p-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400 shadow-lg shadow-cyan-500/10">
                      <Luggage className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h3 className="text-lg font-bold text-white">No Itinerary Generated Yet</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Select one of the inspiration prompts or type your desired trip on the left, then click{' '}
                        <strong className="text-cyan-300">"Synthesize Itinerary"</strong> to see a complete flight, hotel, and daily activity schedule.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGenerateItinerary()}
                      disabled={planningLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Default Tokyo Trip</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /*                       SYSTEM TELEMETRY & HEALTH TAB                       */
          /* ========================================================================= */
          <div className="space-y-8">
            <div className="text-center space-y-3 max-w-3xl mx-auto pt-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-300 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Full-Stack Health & DevOps Environment Telemetry</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                System Status & Verification <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Monorepo Services Operational
                </span>
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Live heartbeat monitoring, CORS configuration, latency checks, and test runner integration.
              </p>
            </div>

            {/* Primary Health & Connectivity Status Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      healthError
                        ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                    }`}
                  >
                    {healthLoading ? (
                      <RefreshCw className="w-7 h-7 animate-spin text-cyan-400" />
                    ) : healthError ? (
                      <AlertCircle className="w-7 h-7" />
                    ) : (
                      <CheckCircle2 className="w-7 h-7" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {healthLoading
                          ? 'Checking FastAPI Health Check...'
                          : healthError
                          ? 'Backend Connection Error'
                          : 'TravelAI Environment Ready — Backend Connected'}
                      </h2>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                          healthError
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {healthError ? 'Fail' : 'Passed'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      Target Endpoint:{' '}
                      <code className="text-cyan-300 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40 font-mono text-xs">
                        GET /api/v1/health
                      </code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={testConnection}
                    disabled={healthLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all duration-200 shadow-lg shadow-cyan-500/25 active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
                    <span>Re-check Health</span>
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
                <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>FastAPI Status</span>
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {healthData?.status ? (
                      <span className="text-emerald-400 uppercase font-mono">
                        {healthData.status}
                      </span>
                    ) : (
                      <span className="text-slate-500">Offline</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Provider Mode</span>
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {healthData ? (
                      <span className="text-indigo-300 font-mono">
                        {healthData.mock_mode
                          ? 'Mock Mode (Offline Resilient)'
                          : 'Live API Mode'}
                      </span>
                    ) : (
                      <span className="text-slate-500">N/A</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Round-Trip Latency</span>
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {latency !== null ? (
                      <span className="text-emerald-400 font-mono">{latency} ms</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>CORS & Security</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-lg font-semibold text-emerald-400">
                    Active & Allowed
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Stack Summary */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>Full-Stack Architecture Verification</span>
                </h3>
                <span className="text-xs text-slate-400">
                  All modules scaffolded in monorepo root
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Backend Stack Card */}
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-5 space-y-4 hover:border-white/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Python Backend</h4>
                      <p className="text-xs text-slate-400">FastAPI + Uvicorn + SQLAlchemy</p>
                    </div>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Python 3.13 venv isolated</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>FastAPI CORS Middleware enabled</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pydantic v2 validation models</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pytest test suite verified (7 tests passed)</span>
                    </li>
                  </ul>
                </div>

                {/* Frontend Stack Card */}
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-5 space-y-4 hover:border-white/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">React Frontend</h4>
                      <p className="text-xs text-slate-400">React 18 + Vite + Tailwind CSS</p>
                    </div>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Vite HMR fast dev server</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tailwind CSS custom color tokens</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Axios API client connection</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Lucide React & clsx/tailwind-merge</span>
                    </li>
                  </ul>
                </div>

                {/* AI & Integration Card */}
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-5 space-y-4 hover:border-white/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">AI & Travel Adapters</h4>
                      <p className="text-xs text-slate-400">LLM SDKs & Pluggable APIs</p>
                    </div>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>OpenAI & Google GenAI SDKs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mock travel dataset for offline testing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Amadeus & Google Maps adapters ready</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SQLite / PostgreSQL config structure</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quickstart Reference Terminal */}
            <div className="rounded-xl bg-[#030712] border border-white/10 p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 border-b border-white/5 pb-2">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="text-slate-300 ml-1">Terminal Setup Reference</span>
                </span>
                <button
                  onClick={() =>
                    copyCommand('.\\run.ps1 -Command all')
                  }
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy Launch Command'}
                </button>
              </div>
              <div className="space-y-1.5 text-slate-300">
                <p>
                  <span className="text-slate-500"># Start both servers via PowerShell:</span>
                </p>
                <p className="text-cyan-300">.\run.ps1 -Command all</p>
                <p className="pt-2">
                  <span className="text-slate-500"># Or start both servers via Batch launcher:</span>
                </p>
                <p className="text-emerald-300">run.bat all</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-4 text-center text-xs text-slate-500">
        TravelAI Platform • Final-Year Project • Monorepo Scaffolding & Setup Verified
      </footer>
    </div>
  );
}
