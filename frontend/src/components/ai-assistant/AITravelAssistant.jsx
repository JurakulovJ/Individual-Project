import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plane,
  BedDouble,
  Bus,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  Loader2,
  Wand2,
  Calendar,
  MapPin,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  extractConstraints,
  generateItinerary,
  quickGenerateItinerary,
} from '../../services/api';

const PRESET_PROMPTS = [
  {
    id: 'nyc-lux',
    badge: '🗽 Премиум США',
    title: 'Нью-Йорк: Манхэттен 5* на 7 ночей',
    prompt:
      'Подбери отель 5 звёзд в центре Нью-Йорка возле Таймс-сквер или Центрального парка с 12 по 19 ноября для 2 взрослых, бюджет до $4500, бесплатная отмена',
  },
  {
    id: 'bcn-lon',
    badge: '🔥 Хит B2B тура',
    title: 'Барселона + Лондон (7 ночей)',
    prompt:
      'Собери тур в Барселону и Лондон на 7 дней в ноябре для 2 взрослых: отель 5* с завтраком BB, прямой перелет и трансфер из аэропорта, бюджет до $3500',
  },
  {
    id: 'dubai-family',
    badge: '🌴 Семейный отдых',
    title: 'Дубай: Всё включено (AI) + Прямой рейс',
    prompt:
      'Семейный тур в Дубай на 7 ночей для 2 взрослых: отель 5* на первой линии с питанием AI, прямой перелет и индивидуальный трансфер',
  },
];

export default function AITravelAssistant({
  onApplyBundle,
  onApplyFiltersToSearch,
  onJumpToHotels,
  onJumpToFlights,
}) {
  const [prompt, setPrompt] = useState(PRESET_PROMPTS[0].prompt);
  const [budget, setBudget] = useState(4000);
  const [vibe, setVibe] = useState('Премиум + Комфорт');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reasoningStep, setReasoningStep] = useState(0);
  const [constraints, setConstraints] = useState(null);
  const [itineraryData, setItineraryData] = useState(null);
  const [selectedBundleId, setSelectedBundleId] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const reasoningMessages = [
    'POST /api/v1/plan/extract-constraints — Извлечение локации, дат, звёздности и бюджета...',
    'POST /api/v1/itinerary/generate — Поиск рейсов и ранжирование отелей из базы RateHawk...',
    'Синхронизация тарифов (Авиа + Отель + Трансфер) и расчёт B2B баллов лояльности...',
    'Формирование готовых пакетных предложений и дневного расписания...',
  ];

  const handleRunAISearch = async (customPrompt = null) => {
    const activePrompt = customPrompt ?? prompt;
    if (!activePrompt.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setReasoningStep(0);

    try {
      // Step 1: Extract structured constraints via FastAPI
      const extracted = await extractConstraints(activePrompt);
      setConstraints(extracted);
      setReasoningStep(1);

      // Step 2: Generate full itinerary + real inventory bundles via FastAPI
      const generated = await generateItinerary(extracted);
      setReasoningStep(2);

      setTimeout(() => {
        setReasoningStep(3);
        setItineraryData(generated);
        if (generated.recommended_bundles?.length > 0) {
          setSelectedBundleId(generated.recommended_bundles[0].id);
        }
        setIsGenerating(false);
      }, 300);
    } catch (err) {
      // Fallback to quickGenerateItinerary if needed
      try {
        const quick = await quickGenerateItinerary(activePrompt);
        setConstraints(quick.constraints || null);
        setItineraryData(quick);
        if (quick.recommended_bundles?.length > 0) {
          setSelectedBundleId(quick.recommended_bundles[0].id);
        }
      } catch (e2) {
        setErrorMsg(
          e2?.response?.data?.detail ||
          'Не удалось связаться с FastAPI сервером (localhost:8000)'
        );
      } finally {
        setIsGenerating(false);
      }
    }
  };

  // Auto-run initial AI synthesis on mount so bundles are immediately populated from backend
  useEffect(() => {
    handleRunAISearch(PRESET_PROMPTS[0].prompt);
  }, []);

  const bundles = itineraryData?.recommended_bundles || [];

  return (
    <div className="space-y-5">
      {/* Top Header Banner inside Search Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5 text-[#F6D04D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-bold text-[#111827]">
                AI Travel Ассистент — Умная сборка тура за 1 клик
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-purple-100 text-[#7C3AED]">
                FastAPI Live Engine
              </span>
            </div>
            <p className="text-[12px] text-[#6B7280]">
              Запрос обрабатывается через <code className="text-[#7C3AED]">/api/v1/plan/extract-constraints</code> и <code className="text-[#7C3AED]">/api/v1/itinerary/generate</code>
            </p>
          </div>
        </div>

        {/* Vibe selector pills */}
        <div className="flex items-center gap-1.5 bg-[#F4F5F7] p-1 rounded-xl self-start">
          {['Оптимальный', 'Премиум + Комфорт', 'Бизнес-поездка'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVibe(v)}
              className={`px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all ${vibe === v
                  ? 'bg-[#1C2026] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input + Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Conversational Prompt Box + Quick Chips (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative rounded-xl border-2 border-[#7C3AED]/40 focus-within:border-[#7C3AED] bg-[#FAFAFF] p-3.5 transition-all">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#7C3AED] flex items-center gap-1.5 mb-1">
              <Wand2 className="w-3.5 h-3.5" />
              <span>Ваш запрос на естественном языке</span>
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Например: Собери тур в Барселону или Нью-Йорк на 7 дней в ноябре для 2 взрослых..."
              className="w-full bg-transparent text-[14px] text-[#111827] placeholder-gray-400 focus:outline-none resize-none leading-relaxed font-normal"
            />
          </div>

          {/* Interactive Quick-Prompt Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-[#6B7280] font-medium">
              Быстрые шаблоны:
            </span>
            {PRESET_PROMPTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setPrompt(item.prompt);
                  handleRunAISearch(item.prompt);
                }}
                className="px-3 py-1 rounded-full bg-[#F4F5F7] hover:bg-purple-50 border border-gray-200 hover:border-[#7C3AED]/40 text-[12px] text-[#111827] flex items-center gap-1.5 transition-all"
              >
                <span className="font-semibold text-[#7C3AED]">
                  {item.badge}
                </span>
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Budget Slider + CTA Button (4 cols) */}
        <div className="lg:col-span-4 bg-[#F4F5F7] rounded-xl p-4 space-y-3 border border-gray-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#374151] flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Лимит бюджета на пакет:</span>
            </span>
            <span className="text-[15px] font-extrabold text-[#111827]">
              до {budget.toLocaleString('ru-RU')} $
            </span>
          </div>

          <input
            type="range"
            min={1200}
            max={8000}
            step={100}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full accent-[#7C3AED] cursor-pointer h-1.5 bg-gray-300 rounded-lg"
          />

          <div className="flex justify-between text-[11px] text-gray-500">
            <span>1 200 $ (Эконом)</span>
            <span>4 000 $ (Оптимум)</span>
            <span>8 000 $ (VIP)</span>
          </div>

          <button
            type="button"
            onClick={() => handleRunAISearch()}
            disabled={isGenerating}
            className="w-full h-[46px] rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#111827]" />
                <span>AI собирает пакет...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                <span>Сгенерировать AI-тур</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Extracted Pydantic TravelConstraints Pill Bar */}
      {constraints && !isGenerating && (
        <div className="bg-[#FAFAFF] border border-[#7C3AED]/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#7C3AED] text-white font-bold text-[10px] uppercase">
              Распознано AI
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 font-semibold text-[#111827] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#7C3AED]" />
              {constraints.destination}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[#374151] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
              {constraints.start_date} → {constraints.end_date}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[#374151]">
              Гостей: <strong>{constraints.travelers_count}</strong> • Класс:{' '}
              <strong className="uppercase">{constraints.budget_level}</strong>
            </span>
          </div>

          {itineraryData?.suggested_manual_filters && (
            <button
              type="button"
              onClick={() =>
                onApplyFiltersToSearch(itineraryData.suggested_manual_filters)
              }
              className="px-3 py-1.5 rounded-lg bg-[#1C2026] hover:bg-black text-white font-semibold text-[11px] flex items-center gap-1.5 transition-all"
            >
              <Filter className="w-3.5 h-3.5 text-[#F6D04D]" />
              <span>Применить фильтры к ручному поиску</span>
            </button>
          )}
        </div>
      )}

      {/* Live AI Reasoning / Building Itinerary Skeleton State */}
      {isGenerating && (
        <div className="rounded-xl bg-[#1C2026] text-white p-5 space-y-3 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F6D04D]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>FastAPI AI Reasoning Engine в процессе сборки...</span>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">
              Шаг {reasoningStep + 1} из 4
            </span>
          </div>
          <div className="space-y-1.5">
            {reasoningMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-xs transition-opacity ${index <= reasoningStep
                    ? 'opacity-100 text-gray-100'
                    : 'opacity-30 text-gray-500'
                  }`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 ${index < reasoningStep
                      ? 'text-emerald-400'
                      : index === reasoningStep
                        ? 'text-[#F6D04D] animate-pulse'
                        : 'text-gray-600'
                    }`}
                />
                <span>{msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structured Selectable AI Bundles (Flight + Hotel + Transfer) */}
      {!isGenerating && bundles.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#111827] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Готовые пакетные решения из базы (Авиа + Отель + Трансфер):
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowTimeline(!showTimeline)}
              className="text-[12px] font-semibold text-[#7C3AED] hover:underline flex items-center gap-1"
            >
              <span>
                {showTimeline
                  ? 'Скрыть план по дням'
                  : `Показать план по дням (${itineraryData?.days?.length || 0} дн.)`}
              </span>
              {showTimeline ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {bundles.map((bundle) => {
              const isSelected = selectedBundleId === bundle.id;
              return (
                <div
                  key={bundle.id}
                  onClick={() => setSelectedBundleId(bundle.id)}
                  className={`rounded-xl border p-4 transition-all cursor-pointer flex flex-col justify-between ${isSelected
                      ? 'border-2 border-[#7C3AED] bg-purple-50/20 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <div className="space-y-3">
                    {/* Bundle Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            {bundle.match_score}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#FFF8DB] text-[#92400E] border border-[#F6D04D] text-[11px] font-semibold">
                            {bundle.badge}
                          </span>
                        </div>
                        <h4 className="text-[15px] font-bold text-[#111827] mt-1.5">
                          {bundle.title}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[11px] text-gray-400 line-through">
                          {bundle.old_total_price} $
                        </div>
                        <div className="text-[20px] font-extrabold text-[#2563EB] leading-none">
                          {bundle.total_price} $
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          за весь пакет
                        </div>
                      </div>
                    </div>

                    {/* 3 Component Pills: Flight, Hotel, Transfer */}
                    <div className="space-y-2 text-[12px]">
                      {/* Flight item */}
                      <div className="p-2.5 rounded-lg bg-[#F4F5F7] flex items-center justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Plane className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-[#111827]">
                              {bundle.flight.route} • {bundle.flight.carrier}
                            </div>
                            <div className="text-[11px] text-[#6B7280]">
                              {bundle.flight.dates} • {bundle.flight.tariff}
                            </div>
                          </div>
                        </div>
                        <span className="font-bold text-[#111827] shrink-0">
                          {bundle.flight.price} $
                        </span>
                      </div>

                      {/* Hotel item */}
                      <div className="p-2.5 rounded-lg bg-[#F4F5F7] flex items-center justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <BedDouble className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-[#111827]">
                              {bundle.hotel.name}
                            </div>
                            <div className="text-[11px] text-[#6B7280]">
                              {bundle.hotel.room} • {bundle.hotel.perks}
                            </div>
                          </div>
                        </div>
                        <span className="font-bold text-[#111827] shrink-0">
                          {bundle.hotel.price} $
                        </span>
                      </div>

                      {/* Transfer item */}
                      <div className="p-2.5 rounded-lg bg-[#F4F5F7] flex items-center justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Bus className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-[#111827]">
                              {bundle.transfer.type}
                            </div>
                            <div className="text-[11px] text-[#6B7280]">
                              {bundle.transfer.details}
                            </div>
                          </div>
                        </div>
                        <span className="font-bold text-[#111827] shrink-0">
                          {bundle.transfer.price} $
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 mt-3 border-t border-gray-200/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (bundle.target_search_state) {
                            onApplyFiltersToSearch(bundle.target_search_state);
                          } else {
                            onJumpToHotels();
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-[12px] font-medium text-[#111827]"
                      >
                        Открыть в отелях
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToFlights();
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-[12px] font-medium text-[#111827]"
                      >
                        Смотреть авиарейсы
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyBundle(bundle);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] font-semibold text-[12px] flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Забронировать пакет</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day-by-Day Synthesized Itinerary Schedule from /api/v1/itinerary/generate */}
          {showTimeline && itineraryData?.days && (
            <div className="mt-4 rounded-xl bg-[#F4F5F7] p-4 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
                  Посуточная программа тура (#{itineraryData.itinerary_id})
                </h4>
                <span className="text-xs text-[#6B7280]">
                  Синтезировано FastAPI Itinerary Builder
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {itineraryData.days.map((day) => (
                  <div
                    key={day.day_number}
                    className="bg-white rounded-xl p-3 border border-gray-200/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                      <span className="font-bold text-[#7C3AED]">
                        День {day.day_number} • {day.date}
                      </span>
                    </div>
                    <div className="font-semibold text-[#111827]">
                      {day.title}
                    </div>
                    <div className="space-y-1.5">
                      {day.activities?.map((act, idx) => (
                        <div
                          key={idx}
                          className="text-[11px] text-[#4B5563] flex items-start justify-between gap-2"
                        >
                          <span>
                            <strong className="text-[#111827]">
                              {act.time}
                            </strong>{' '}
                            {act.title}
                          </span>
                          <span className="font-mono text-emerald-700 font-semibold shrink-0">
                            ${act.cost}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
