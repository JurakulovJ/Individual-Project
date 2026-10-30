import React, { useState } from 'react';
import {
  Sparkles,
  Plane,
  BedDouble,
  Bus,
  CheckCircle2,
  Loader2,
  Star,
  ChevronDown,
  ChevronUp,
  Send,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

const LOADING_STEPS = [
  'Подбираем оптимальные авиарейсы...',
  'Ищем отели по вашим критериям...',
  'Формируем готовый тур...',
];

export default function AITravelAssistant({
  isGenerating,
  loadingStep,
  itineraryData,
  aiSummaryText,
  onSendFollowUp,
  onApplyBundle,
  onApplyFiltersToSearch,
  onJumpToHotels,
  onJumpToFlights,
}) {
  const [followUpText, setFollowUpText] = useState('');
  const [expandedBundleDays, setExpandedBundleDays] = useState({});

  const toggleDaysAccordion = (bundleId) => {
    setExpandedBundleDays((prev) => ({
      ...prev,
      [bundleId]: !prev[bundleId],
    }));
  };

  const handleFollowUpSubmit = (e) => {
    e.preventDefault();
    if (!followUpText.trim() || isGenerating) return;
    onSendFollowUp(followUpText.trim());
    setFollowUpText('');
  };

  const bundles = itineraryData?.recommended_bundles || [];
  const days = itineraryData?.days || [];

  return (
    <section className="max-w-[1220px] mx-auto px-4 pt-8 pb-2">
      {/* ================================================================= */}
      {/* STEP B: INTERACTIVE LOADING STATE BELOW YELLOW HERO BANNER        */}
      {/* ================================================================= */}
      {isGenerating && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LOADING_STEPS.map((label, idx) => {
                const isDone = idx < loadingStep;
                const isCurrent = idx === loadingStep;
                return (
                  <div
                    key={label}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'border-[#F6D04D] bg-[#FFFDF5]'
                        : isDone
                        ? 'border-gray-200 bg-gray-50/70'
                        : 'border-gray-100 bg-white opacity-50'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-[#111827] animate-spin shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
                    )}
                    <span className="text-[13px] font-medium text-[#111827]">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clean RateHawk-style Skeleton Package Cards */}
          {[1, 2].map((sk) => (
            <div
              key={sk}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-9 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-14 bg-gray-100 rounded-lg" />
                  <div className="h-14 bg-gray-100 rounded-lg" />
                  <div className="h-12 bg-gray-100 rounded-lg" />
                </div>
                <div className="lg:col-span-3 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
                  <div className="space-y-2">
                    <div className="h-7 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                  </div>
                  <div className="h-10 bg-gray-200 rounded-xl w-full mt-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP C: CLEAN RESULTS & AI CHAT RESPONSE BELOW YELLOW HERO BANNER */}
      {/* ================================================================= */}
      {!isGenerating && bundles.length > 0 && (
        <div className="space-y-5">
          {/* 1. AI Concierge Summary Bar (Compact Chat Bubble) */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFF8DB] border border-[#F6D04D] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-[#111827]" />
              </div>
              <p className="text-[14px] text-[#111827] leading-relaxed">
                {aiSummaryText}
              </p>
            </div>

            <form
              onSubmit={handleFollowUpSubmit}
              className="flex items-center gap-2 w-full lg:w-[360px] shrink-0"
            >
              <input
                type="text"
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="Уточнить детали в чате..."
                className="flex-1 h-[38px] px-3.5 rounded-xl border border-gray-300 focus:border-[#F6D04D] focus:outline-none text-[13px] text-[#111827] placeholder-gray-400 bg-white"
              />
              <button
                type="submit"
                className="h-[38px] px-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#111827] text-[12px] font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Отправить</span>
              </button>
            </form>
          </div>

          {/* 2. Ready-Made Tour Package Cards (RateHawk Visual Consistency) */}
          <div className="space-y-4">
            {bundles.map((bundle, idx) => {
              const isExpanded = Boolean(expandedBundleDays[bundle.id]);
              const ratingLabel = idx === 0 ? '9,2' : '8,8';
              const totalFormatted = Number(
                bundle.total_price || 3670
              ).toLocaleString('ru-RU');
              const oldFormatted = bundle.old_total_price
                ? Number(bundle.old_total_price).toLocaleString('ru-RU')
                : null;

              return (
                <div
                  key={bundle.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 transition-shadow hover:shadow-md"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left/Center Column: Package Breakdown (8 cols) */}
                    <div className="lg:col-span-8 space-y-4">
                      {/* Card Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="px-2.5 py-0.5 rounded-md bg-gray-100 text-[#374151] text-[11px] font-semibold">
                              {bundle.badge || 'Оптимальный выбор'}
                            </span>
                            {bundle.is_refundable !== false && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#16A34A]">
                                <RotateCcw className="w-3 h-3" />
                                Бесплатная отмена
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] text-[11px] font-semibold">
                              до {bundle.loyalty_points || 112} P
                            </span>
                          </div>
                          <h3 className="text-[18px] font-bold text-[#111827]">
                            {bundle.title}
                          </h3>
                        </div>
                      </div>

                      {/* 3 Included Services: Flight, Hotel, Transfer */}
                      <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                        {/* 1. Flight Row */}
                        <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/60">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[#111827] shrink-0 mt-0.5">
                              <Plane className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                  Перелёт
                                </span>
                                <span className="text-[14px] font-semibold text-[#111827]">
                                  {bundle.flight.route}
                                </span>
                                <span className="text-[12px] text-[#6B7280]">
                                  • {bundle.flight.carrier}
                                </span>
                              </div>
                              <div className="text-[12px] text-[#6B7280] mt-0.5">
                                {bundle.flight.dates} • {bundle.flight.tariff}
                              </div>
                            </div>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                            <div className="text-[13px] font-semibold text-[#111827]">
                              {Number(bundle.flight.price).toLocaleString('ru-RU')} $
                            </div>
                            {bundle.flight.provider_offers?.[0]?.deep_link && (
                              <a
                                href={bundle.flight.provider_offers[0].deep_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline"
                              >
                                <span>Билет без наценки</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* 2. Hotel Row (with yellow stars & green rating badge like 9,2) */}
                        <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/60">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[#111827] shrink-0 mt-0.5">
                              <BedDouble className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                  Отель
                                </span>
                                <span className="text-[14px] font-semibold text-[#2563EB]">
                                  {bundle.hotel.name}
                                </span>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({
                                    length: bundle.hotel.stars || 5,
                                  }).map((_, sIdx) => (
                                    <Star
                                      key={sIdx}
                                      className="w-3 h-3 text-[#F59E0B] fill-current"
                                    />
                                  ))}
                                </div>
                                <span className="px-1.5 py-0.5 rounded bg-[#16A34A] text-white text-[11px] font-bold leading-none">
                                  {ratingLabel}
                                </span>
                              </div>
                              <div className="text-[12px] text-[#6B7280] mt-0.5">
                                {bundle.hotel.room} •{' '}
                                <span className="text-[#16A34A] font-medium">
                                  {bundle.hotel.perks}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                            <div className="text-[13px] font-semibold text-[#111827]">
                              {Number(bundle.hotel.price).toLocaleString('ru-RU')} $
                            </div>
                            {bundle.hotel.provider_offers?.[0]?.deep_link && (
                              <a
                                href={bundle.hotel.provider_offers[0].deep_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline"
                              >
                                <span>{bundle.hotel.provider_offers[0].provider}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* 3. Transfer Row */}
                        <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/60">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[#111827] shrink-0 mt-0.5">
                              <Bus className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                  Трансфер
                                </span>
                                <span className="text-[14px] font-semibold text-[#111827]">
                                  {bundle.transfer.type}
                                </span>
                              </div>
                              <div className="text-[12px] text-[#6B7280] mt-0.5">
                                {bundle.transfer.details}
                              </div>
                            </div>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                            <div className="text-[13px] font-semibold text-[#111827]">
                              {Number(bundle.transfer.price).toLocaleString('ru-RU')} $
                            </div>
                            {bundle.transfer.provider_offers?.[0]?.deep_link && (
                              <a
                                href={bundle.transfer.provider_offers[0].deep_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline"
                              >
                                <span>{bundle.transfer.provider_offers[0].provider}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expandable "Показать план по дням" Accordion */}
                      {days.length > 0 && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => toggleDaysAccordion(bundle.id)}
                            className="text-[13px] font-medium text-[#2563EB] hover:underline flex items-center gap-1"
                          >
                            <span>
                              {isExpanded
                                ? 'Скрыть план по дням'
                                : `Показать план по дням (${days.length} дн.)`}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                              {days.map((day) => (
                                <div
                                  key={day.day_number}
                                  className="rounded-xl bg-[#F4F5F7] p-3.5 border border-gray-200/70 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between text-[12px]">
                                    <span className="font-bold text-[#111827]">
                                      День {day.day_number} • {day.date}
                                    </span>
                                  </div>
                                  <div className="text-[13px] font-medium text-[#374151]">
                                    {day.title}
                                  </div>
                                  <div className="space-y-1 pt-1">
                                    {day.activities?.map((act, aIdx) => (
                                      <div
                                        key={aIdx}
                                        className="text-[12px] text-[#6B7280] flex items-start justify-between gap-2"
                                      >
                                        <span>
                                          <strong className="text-[#111827] font-medium">
                                            {act.time}
                                          </strong>{' '}
                                          — {act.title}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Price & RateHawk Yellow CTA (4 cols) */}
                    <div className="lg:col-span-4 lg:border-l lg:border-gray-100 lg:pl-6 flex flex-col justify-between h-full space-y-4">
                      <div className="space-y-1 lg:text-right">
                        {oldFormatted && (
                          <div className="text-[13px] text-gray-400 line-through">
                            {oldFormatted} $
                          </div>
                        )}
                        <div className="text-[24px] font-bold text-[#111827] leading-tight">
                          {totalFormatted} ${' '}
                          <span className="text-[14px] font-normal text-[#6B7280]">
                            за весь пакет
                          </span>
                        </div>
                        <p className="text-[12px] text-[#6B7280]">
                          Перелёт + Отель 7 ночей + Трансфер
                        </p>
                        <p className="text-[11px] text-[#6B7280]">
                          Для 2 взрослых, включая налоги и сборы
                        </p>
                      </div>

                      <div className="space-y-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => onApplyBundle(bundle)}
                          className="w-full h-[44px] rounded-xl bg-[#F6D04D] hover:bg-[#f5c400] text-[#111827] font-semibold text-[14px] transition-all shadow-2xs"
                        >
                          Выбрать тур
                        </button>

                        <div className="flex items-center justify-center lg:justify-end gap-4 pt-1 text-[12px] text-[#6B7280]">
                          <button
                            type="button"
                            onClick={() => {
                              if (bundle.target_search_state) {
                                onApplyFiltersToSearch(bundle.target_search_state);
                              } else {
                                onJumpToHotels();
                              }
                            }}
                            className="hover:text-[#111827] hover:underline"
                          >
                            Смотреть в отелях
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={onJumpToFlights}
                            className="hover:text-[#111827] hover:underline"
                          >
                            Смотреть рейсы
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
