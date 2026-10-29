import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ArrowLeftRight,
  Luggage,
  Briefcase,
  RefreshCw,
  Ban,
  Moon,
  Clock,
  Check,
  Loader2,
} from 'lucide-react';
import { searchFlights } from '../../services/api';
import DatePickerPopover from '../search/DatePickerPopover';

const AIRLINES = [
  'Все авиакомпании',
  'Ryanair',
  'Air Europa',
  'British Airways',
  'Uzbekistan Airways',
  'Turkish Airlines',
];

export default function FlightResultsView({
  searchParams,
  setSearchParams,
  onSelectFlightTariff,
}) {
  // Left Sidebar Filters State
  const [stopsFilter, setStopsFilter] = useState('all'); // 'all' | 'direct' | 'max_1'
  const [noAirportChange, setNoAirportChange] = useState(false);
  const [baggageOnly, setBaggageOnly] = useState(false);
  const [activeDatePicker, setActiveDatePicker] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Time Range Sliders State (0 to 1435 minutes => 00:00 to 23:55)
  const [outDepMax, setOutDepMax] = useState(1435);
  const [outArrMax, setOutArrMax] = useState(1435);
  const [inDepMax, setInDepMax] = useState(1435);
  const [inArrMax, setInArrMax] = useState(1435);

  // Sorting Tab State ('cheapest' | 'fastest' | 'optimal' | 'time_limit')
  const [activeSort, setActiveSort] = useState('cheapest');

  // Dynamic Backend Data State
  const [flights, setFlights] = useState([]);
  const [providerSource, setProviderSource] = useState('mock_fallback');
  const [brokenLogos, setBrokenLogos] = useState({});
  const [sortSummaries, setSortSummaries] = useState({
    cheapest_price_label: 'от 273,63 $',
    cheapest_duration_label: '4 ч 35 мин',
    fastest_price_label: 'от 798,71 $',
    fastest_duration_label: '4 ч 20 мин',
    optimal_price_label: 'от 273,63 $',
    optimal_duration_label: '4 ч 35 мин',
    time_limit_label: 'до 21 дня',
  });
  const [loading, setLoading] = useState(true);

  // Selected tariff per flight card & expanded details state
  const [selectedTariffs, setSelectedTariffs] = useState({});
  const [expandedFlightDetails, setExpandedFlightDetails] = useState({});
  const [expandedTariffPopover, setExpandedTariffPopover] = useState(null);

  const formatMinutesToTime = (mins) => {
    const h = Math.floor(mins / 60)
      .toString()
      .padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const fetchFlightResults = useCallback(async () => {
    setLoading(true);
    try {
      const data = await searchFlights({
        tripType: searchParams.flightTripType,
        origin: searchParams.flightOrigin,
        destination: searchParams.flightDestination,
        departureDate: searchParams.flightDepDate,
        returnDate: searchParams.flightRetDate,
        passengers: searchParams.flightPassengers,
        cabinClass: searchParams.cabinClass,
        airline: searchParams.airline,
        stops: stopsFilter,
        noAirportChange,
        baggageIncluded: baggageOnly,
        outboundDepMax: outDepMax,
        outboundArrMax: outArrMax,
        returnDepMax: inDepMax,
        returnArrMax: inArrMax,
        sortBy: activeSort,
      });
      setFlights(data.items || []);
      setProviderSource(data.source || 'mock_fallback');
      if (data.sort_summaries) {
        setSortSummaries(data.sort_summaries);
      }
    } catch {
      // Keep existing list on transient error
    } finally {
      setLoading(false);
    }
  }, [
    searchParams.flightTripType,
    searchParams.flightOrigin,
    searchParams.flightDestination,
    searchParams.flightDepDate,
    searchParams.flightRetDate,
    searchParams.flightPassengers,
    searchParams.cabinClass,
    searchParams.airline,
    stopsFilter,
    noAirportChange,
    baggageOnly,
    outDepMax,
    outArrMax,
    inDepMax,
    inArrMax,
    activeSort,
  ]);

  useEffect(() => {
    fetchFlightResults();
  }, [fetchFlightResults]);

  const swapLocations = () => {
    setSearchParams((prev) => ({
      ...prev,
      flightOrigin: prev.flightDestination || 'Лондон, Великобритания',
      flightDestination: prev.flightOrigin || 'Барселона, Испания',
    }));
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-16">
      {/* ===================================================================== */}
      {/* COMPACT TOP FLIGHT SEARCH HEADER (SCREENSHOT 4)                       */}
      {/* ===================================================================== */}
      <div className="bg-white border-b border-gray-200 py-4 px-4 shadow-sm">
        <div className="max-w-[1220px] mx-auto space-y-3">
          {/* Top Radio Group */}
          <div className="flex items-center gap-6">
            {[
              { id: 'one-way', label: 'Только туда' },
              { id: 'round-trip', label: 'Туда-обратно' },
              { id: 'multi-city', label: 'Сложный маршрут' },
            ].map((r) => {
              const isSelected = searchParams.flightTripType === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() =>
                    setSearchParams({ ...searchParams, flightTripType: r.id })
                  }
                  className="flex items-center gap-2 text-[13px] text-[#111827]"
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center border ${isSelected
                      ? 'border-[#F5C400] bg-[#F5C400]'
                      : 'border-gray-300 bg-white'
                      }`}
                  >
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#111827]" />
                    )}
                  </span>
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Middle Row: Origin ⇄ Destination, Dates, Passengers */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-6 relative grid grid-cols-2 h-[48px] rounded-xl border border-[#D1D5DB] bg-white divide-x divide-[#E5E7EB]">
              <div className="px-3.5 py-1 flex flex-col justify-center">
                <span className="text-[10px] text-[#6B7280] leading-tight">
                  Откуда
                </span>
                <input
                  type="text"
                  value={searchParams.flightOrigin || 'Барселона, Испания'}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      flightOrigin: e.target.value,
                    })
                  }
                  className="text-[13px] text-[#111827] font-normal focus:outline-none bg-transparent leading-tight"
                />
              </div>

              <button
                type="button"
                onClick={swapLocations}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 z-10"
              >
                <ArrowLeftRight className="w-3 h-3 text-gray-500" />
              </button>

              <div className="px-4 py-1 flex flex-col justify-center">
                <span className="text-[10px] text-[#6B7280] leading-tight">
                  Куда
                </span>
                <input
                  type="text"
                  value={
                    searchParams.flightDestination || 'Лондон, Великобритания'
                  }
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      flightDestination: e.target.value,
                    })
                  }
                  className="text-[13px] text-[#111827] font-normal focus:outline-none bg-transparent leading-tight"
                />
              </div>
            </div>

            <div
              className="lg:col-span-3 relative"
              data-datepicker-trigger="true"
            >
              <div className="grid grid-cols-2 h-[48px] rounded-xl border border-[#D1D5DB] bg-white divide-x divide-[#E5E7EB]">
                <div
                  onClick={() => setActiveDatePicker('dep')}
                  className={`px-3 py-1 flex flex-col justify-center cursor-pointer transition-all rounded-l-xl ${activeDatePicker === 'dep'
                      ? 'border border-[#F6D04D] ring-2 ring-[#F6D04D]/40 bg-[#FFFDF5] z-10'
                      : 'hover:bg-gray-50'
                    }`}
                >
                  <span className="text-[10px] text-[#6B7280] leading-tight">
                    Туда
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={searchParams.flightDepDate || '19 Нояб, Чт'}
                    onFocus={() => setActiveDatePicker('dep')}
                    className="text-[13px] text-[#111827] focus:outline-none bg-transparent leading-tight cursor-pointer"
                  />
                </div>
                <div
                  onClick={() => setActiveDatePicker('ret')}
                  className={`px-3 py-1 flex flex-col justify-center cursor-pointer transition-all rounded-r-xl ${activeDatePicker === 'ret'
                      ? 'border border-[#F6D04D] ring-2 ring-[#F6D04D]/40 bg-[#FFFDF5] z-10'
                      : 'hover:bg-gray-50'
                    }`}
                >
                  <span className="text-[10px] text-[#6B7280] leading-tight">
                    Обратно
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={searchParams.flightRetDate || '20 Нояб, Пт'}
                    onFocus={() => setActiveDatePicker('ret')}
                    className="text-[13px] text-[#111827] focus:outline-none bg-transparent leading-tight cursor-pointer"
                  />
                </div>
              </div>

              {activeDatePicker && (
                <DatePickerPopover
                  mode="flight"
                  activeField={activeDatePicker === 'ret' ? 'end' : 'start'}
                  initialStartIso={searchParams.flightDepIso || '2026-11-19'}
                  initialEndIso={searchParams.flightRetIso || '2026-11-20'}
                  onSwitchField={(nextField) =>
                    setActiveDatePicker(nextField === 'end' ? 'ret' : 'dep')
                  }
                  onSelectCheckIn={(depStr, depIso) => {
                    setSearchParams((prev) => ({
                      ...prev,
                      flightDepDate: depStr,
                      flightDepIso: depIso,
                    }));
                  }}
                  onSelectCheckOut={(retStr, retIso) => {
                    setSearchParams((prev) => ({
                      ...prev,
                      flightRetDate: retStr,
                      flightRetIso: retIso,
                    }));
                  }}
                  onClose={() => setActiveDatePicker(null)}
                />
              )}
            </div>

            <div className="lg:col-span-3 h-[48px] px-3.5 py-1 rounded-xl border border-[#D1D5DB] bg-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#6B7280] block leading-tight">
                  Пассажиры
                </span>
                <span className="text-[13px] text-[#111827] leading-tight">
                  {searchParams.flightPassengers} взрослый
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
          </div>

          {/* Bottom Row: Cabin Class, Airline, Найти */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-6 h-[46px] rounded-xl border border-[#D1D5DB] bg-white grid grid-cols-4 divide-x divide-[#E5E7EB] overflow-hidden">
              {['Эконом', 'Премиум', 'Бизнес', 'Первый'].map((cabin) => {
                const active = searchParams.cabinClass === cabin;
                return (
                  <button
                    key={cabin}
                    type="button"
                    onClick={() =>
                      setSearchParams({ ...searchParams, cabinClass: cabin })
                    }
                    className="relative h-full text-[13px] text-[#111827] hover:bg-gray-50 flex items-center justify-center"
                  >
                    <span className={active ? 'font-medium' : 'font-normal'}>
                      {cabin}
                    </span>
                    {active && (
                      <span className="absolute bottom-1 left-4 right-4 h-[3px] bg-[#F5C400] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-3 h-[46px] px-3.5 py-1 rounded-xl border border-[#D1D5DB] bg-white flex flex-col justify-center">
              <span className="text-[10px] text-[#6B7280] leading-tight">
                Авиакомпания
              </span>
              <select
                value={searchParams.airline}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, airline: e.target.value })
                }
                className="w-full text-[13px] text-[#111827] bg-transparent focus:outline-none"
              >
                {AIRLINES.map((air) => (
                  <option key={air} value={air}>
                    {air}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3">
              <button
                type="button"
                onClick={fetchFlightResults}
                className="w-full h-[46px] rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] font-semibold text-[14px] transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Найти</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MAIN CONTENT: LEFT SIDEBAR FILTERS + RIGHT TICKET CARDS               */}
      {/* ===================================================================== */}
      <div className="max-w-[1220px] mx-auto px-4 pt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Mobile/Tablet Filters Drawer Toggle (<1024px) */}
        <div className="lg:hidden flex items-center justify-between bg-white rounded-xl p-3 shadow-xs border border-gray-200">
          <span className="text-xs font-semibold text-[#111827]">
            Найдено вариантов: {flights.length}
          </span>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="px-3.5 py-1.5 rounded-lg bg-[#F6D04D] text-[#111827] text-xs font-bold"
          >
            {mobileFiltersOpen ? 'Скрыть фильтры' : 'Фильтры рейсов'}
          </button>
        </div>

        {/* LEFT SIDEBAR FILTERS (3 COLS) */}
        <aside
          className={`${mobileFiltersOpen ? 'block' : 'hidden'
            } lg:block lg:col-span-3 space-y-3`}
        >
          {/* Card 1: Пересадки */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-bold text-[#111827]">
                Пересадки
              </h4>
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </div>

            <div className="space-y-2.5 text-[13px] text-[#111827]">
              {[
                { id: 'all', label: 'Все рейсы' },
                { id: 'direct', label: 'Без пересадок' },
                { id: 'max_1', label: 'До 1 пересадки' },
              ].map((opt) => {
                const selected = stopsFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStopsFilter(opt.id)}
                    className="w-full flex items-center gap-2.5 text-left"
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center border ${selected
                        ? 'border-[#F5C400] bg-[#F5C400]'
                        : 'border-gray-300 bg-white'
                        }`}
                    >
                      {selected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#111827]" />
                      )}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[12px] text-[#6B7280]">
                Без смены аэропорта
              </span>
              <button
                type="button"
                onClick={() => setNoAirportChange(!noAirportChange)}
                className={`w-9 h-5 rounded-full transition-colors p-0.5 ${noAirportChange ? 'bg-[#F5C400]' : 'bg-gray-300'
                  }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${noAirportChange ? 'translate-x-4' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>

          {/* Card 2: Багаж */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-bold text-[#111827]">Багаж</h4>
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </div>

            <label className="flex items-center gap-2.5 text-[13px] text-[#111827] cursor-pointer">
              <input
                type="checkbox"
                checked={baggageOnly}
                onChange={(e) => setBaggageOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#F5C400] focus:ring-[#F5C400]"
              />
              <span>Багаж включен</span>
            </label>
          </div>

          {/* Card 3: Outbound Time Sliders */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[13px] font-bold text-[#111827]">
                Барселона → Лондон
              </h4>
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </div>

            {/* Вылет */}
            <div className="space-y-1.5">
              <span className="text-[12px] text-[#6B7280] block">Вылет</span>
              <div className="flex items-center justify-between text-[12px] text-[#111827] font-medium">
                <span>00:00</span>
                <span>{formatMinutesToTime(outDepMax)}</span>
              </div>
              <div className="relative flex items-center pt-1">
                <div className="w-4 h-4 rounded-full border-[3px] border-[#F6D04D] bg-white shrink-0 z-10" />
                <input
                  type="range"
                  min={300}
                  max={1435}
                  step={5}
                  value={outDepMax}
                  onChange={(e) => setOutDepMax(Number(e.target.value))}
                  className="w-full h-1 bg-[#F6D04D] appearance-none cursor-pointer accent-[#F6D04D] -mx-1"
                />
              </div>
            </div>

            {/* Прилёт */}
            <div className="space-y-1.5">
              <span className="text-[12px] text-[#6B7280] block">Прилёт</span>
              <div className="flex items-center justify-between text-[12px] text-[#111827] font-medium">
                <span>00:00</span>
                <span>{formatMinutesToTime(outArrMax)}</span>
              </div>
              <div className="relative flex items-center pt-1">
                <div className="w-4 h-4 rounded-full border-[3px] border-[#F6D04D] bg-white shrink-0 z-10" />
                <input
                  type="range"
                  min={300}
                  max={1435}
                  step={5}
                  value={outArrMax}
                  onChange={(e) => setOutArrMax(Number(e.target.value))}
                  className="w-full h-1 bg-[#F6D04D] appearance-none cursor-pointer accent-[#F6D04D] -mx-1"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Return Time Sliders */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[13px] font-bold text-[#111827]">
                Лондон → Барселона
              </h4>
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[12px] text-[#6B7280] block">Вылет</span>
              <div className="flex items-center justify-between text-[12px] text-[#111827] font-medium">
                <span>00:00</span>
                <span>{formatMinutesToTime(inDepMax)}</span>
              </div>
              <div className="relative flex items-center pt-1">
                <div className="w-4 h-4 rounded-full border-[3px] border-[#F6D04D] bg-white shrink-0 z-10" />
                <input
                  type="range"
                  min={300}
                  max={1435}
                  step={5}
                  value={inDepMax}
                  onChange={(e) => setInDepMax(Number(e.target.value))}
                  className="w-full h-1 bg-[#F6D04D] appearance-none cursor-pointer accent-[#F6D04D] -mx-1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[12px] text-[#6B7280] block">Прилёт</span>
              <div className="flex items-center justify-between text-[12px] text-[#111827] font-medium">
                <span>00:00</span>
                <span>{formatMinutesToTime(inArrMax)}</span>
              </div>
              <div className="relative flex items-center pt-1">
                <div className="w-4 h-4 rounded-full border-[3px] border-[#F6D04D] bg-white shrink-0 z-10" />
                <input
                  type="range"
                  min={300}
                  max={1435}
                  step={5}
                  value={inArrMax}
                  onChange={(e) => setInArrMax(Number(e.target.value))}
                  className="w-full h-1 bg-[#F6D04D] appearance-none cursor-pointer accent-[#F6D04D] -mx-1"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT: SORTING TABS + FLIGHT CARDS (9 COLS) */}
        <div className="lg:col-span-9 space-y-4">
          {/* Sorting Tabs Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 grid grid-cols-2 sm:grid-cols-4 overflow-hidden">
            {[
              {
                id: 'cheapest',
                title: 'Дешевле',
                sub: `${sortSummaries.cheapest_price_label} • ${sortSummaries.cheapest_duration_label}`,
              },
              {
                id: 'fastest',
                title: 'Быстрее',
                sub: `${sortSummaries.fastest_price_label} • ${sortSummaries.fastest_duration_label}`,
              },
              {
                id: 'optimal',
                title: 'Оптимальные',
                sub: `${sortSummaries.optimal_price_label} • ${sortSummaries.optimal_duration_label}`,
              },
              {
                id: 'time_limit',
                title: 'По тайм-лимиту',
                sub: sortSummaries.time_limit_label,
              },
            ].map((tab) => {
              const isActive = activeSort === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSort(tab.id)}
                  className="relative py-3 px-4 text-center hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`text-[14px] ${isActive
                      ? 'font-bold text-[#111827]'
                      : 'font-semibold text-[#374151]'
                      }`}
                  >
                    {tab.title}
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-0.5">
                    {tab.sub}
                  </div>
                  {isActive && (
                    <span className="absolute bottom-0 left-6 right-6 h-[3px] bg-[#F5C400] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Flight Ticket Cards from API */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((sk) => (
                <div
                  key={sk}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 animate-pulse space-y-4"
                >
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-gray-100 rounded-xl" />
                    <div className="h-24 bg-gray-100 rounded-xl" />
                  </div>
                  <div className="h-28 bg-gray-100 rounded-xl w-1/2" />
                </div>
              ))}
            </div>
          ) : flights.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 space-y-2">
              <div className="text-base font-bold text-[#111827]">
                Рейсы по заданным фильтрам не найдены
              </div>
              <p className="text-xs text-[#6B7280]">
                Попробуйте расширить диапазон времени вылета или отключить фильтр «Багаж включен».
              </p>
              <button
                type="button"
                onClick={() => {
                  setStopsFilter('all');
                  setBaggageOnly(false);
                  setOutDepMax(1435);
                  setOutArrMax(1435);
                  setInDepMax(1435);
                  setInArrMax(1435);
                }}
                className="px-4 py-2 rounded-xl bg-[#F6D04D] text-[#111827] text-xs font-bold"
              >
                Сбросить фильтры рейсов
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {flights.map((flight) => {
                const activeTariffId =
                  selectedTariffs[flight.id] || flight.tariffs[0]?.id;
                const isDetailsOpen = expandedFlightDetails[flight.id];
                const out = flight.outbound_leg;
                const ret = flight.return_leg;

                return (
                  <div
                    key={flight.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden"
                  >
                    {/* Dark Slate Header Bar */}
                    <div className="bg-[#3B424C] text-white px-5 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          style={{ backgroundColor: flight.airline_logo_bg }}
                          className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-[#F6D04D]"
                        >
                          {flight.carrier_symbol === 'harp'
                            ? '🦅'
                            : flight.airline_logo_text}
                        </div>
                        <span className="text-[13px] font-semibold tracking-tight">
                          {flight.validating_carrier}
                        </span>
                      </div>

                      {flight.ticketing_time_limit && (
                        <span className="text-[12px] font-semibold text-white">
                          {flight.ticketing_time_limit}
                        </span>
                      )}
                    </div>

                    {/* 2-Column Outbound (Туда) & Return (Обратно) Leg Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 border-b border-gray-200">
                      {/* Outbound Leg */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[17px] font-bold text-[#111827]">
                              Туда{' '}
                              <span className="text-gray-300 mx-0.5">·</span>{' '}
                              {out.date_label}
                            </div>
                            <p className="text-[12px] text-[#6B7280] mt-0.5 leading-snug">
                              {out.route_subtext}
                            </p>
                          </div>

                          <div
                            style={{ backgroundColor: flight.airline_logo_bg }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm overflow-hidden"
                          >
                            {flight.airline_logo_url &&
                              !brokenLogos[`out-${flight.id}`] ? (
                              <img
                                src={flight.airline_logo_url}
                                alt={flight.validating_carrier}
                                onError={() =>
                                  setBrokenLogos((p) => ({
                                    ...p,
                                    [`out-${flight.id}`]: true,
                                  }))
                                }
                                className="w-8 h-8 object-contain bg-white rounded-lg p-0.5"
                              />
                            ) : flight.carrier_symbol === 'harp' ? (
                              <span className="text-[#F6D04D] text-lg">🪉</span>
                            ) : (
                              <span className="italic font-serif text-lg">
                                {flight.airline_logo_text}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-xl bg-[#FDF9EE] p-3 flex items-center justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <span className="mt-1 w-4 h-4 rounded-full bg-[#F5C400] flex items-center justify-center shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#111827]" />
                            </span>
                            <div>
                              <div className="text-[14px] text-[#111827]">
                                <span className="font-bold">
                                  {out.departure_time}
                                </span>
                                <span className="text-gray-400 mx-1">—</span>
                                <span className="text-[#4B5563]">
                                  {out.arrival_time}
                                </span>
                                {out.next_day && (
                                  <span className="ml-1 px-1 py-0.2 rounded bg-white text-[10px] font-bold text-gray-600 border border-gray-200">
                                    {out.next_day}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#6B7280] mt-0.5">
                                {out.duration_label}
                              </div>
                            </div>
                          </div>

                          <div className="text-left">
                            <div className="text-[12px] text-[#374151] flex items-center gap-1">
                              <span>{out.stops_label}</span>
                              {out.stops_night && (
                                <>
                                  <Moon className="w-3 h-3 text-gray-500" />
                                  <Clock className="w-3 h-3 text-gray-500" />
                                </>
                              )}
                            </div>
                            {out.stops_subtext && (
                              <div className="text-[11px] text-[#6B7280]">
                                {out.stops_subtext}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-[#6B7280] whitespace-pre-line text-right leading-tight">
                              {out.flight_number}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedFlightDetails((p) => ({
                                  ...p,
                                  [flight.id]: !p[flight.id],
                                }))
                              }
                              className="w-7 h-7 rounded-lg bg-[#F6D04D] hover:bg-[#F5C400] flex items-center justify-center text-[#111827]"
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${isDetailsOpen ? 'rotate-180' : ''
                                  }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Return Leg (Обратно) */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[17px] font-bold text-[#111827]">
                              Обратно{' '}
                              <span className="text-gray-300 mx-0.5">·</span>{' '}
                              {ret.date_label}
                            </div>
                            <p className="text-[12px] text-[#6B7280] mt-0.5 leading-snug">
                              {ret.route_subtext}
                            </p>
                          </div>

                          <div
                            style={{ backgroundColor: flight.airline_logo_bg }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm overflow-hidden"
                          >
                            {flight.airline_logo_url &&
                              !brokenLogos[`out-${flight.id}`] ? (
                              <img
                                src={flight.airline_logo_url}
                                alt={flight.validating_carrier}
                                onError={() =>
                                  setBrokenLogos((p) => ({
                                    ...p,
                                    [`out-${flight.id}`]: true,
                                  }))
                                }
                                className="w-8 h-8 object-contain bg-white rounded-lg p-0.5"
                              />
                            ) : flight.carrier_symbol === 'harp' ? (
                              <span className="text-[#F6D04D] text-lg">🪉</span>
                            ) : (
                              <span className="italic font-serif text-lg">
                                {flight.airline_logo_text}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-xl bg-[#FDF9EE] p-3 flex items-center justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <span className="mt-1 w-4 h-4 rounded-full bg-[#F5C400] flex items-center justify-center shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#111827]" />
                            </span>
                            <div>
                              <div className="text-[14px] text-[#111827]">
                                <span className="font-bold">
                                  {ret.departure_time}
                                </span>
                                <span className="text-gray-400 mx-1">—</span>
                                <span className="text-[#4B5563]">
                                  {ret.arrival_time}
                                </span>
                                {ret.next_day && (
                                  <span className="ml-1 px-1 py-0.2 rounded bg-white text-[10px] font-bold text-gray-600 border border-gray-200">
                                    {ret.next_day}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#6B7280] mt-0.5">
                                {ret.duration_label}
                              </div>
                            </div>
                          </div>

                          <div className="text-left">
                            <div className="text-[12px] text-[#374151] flex items-center gap-1">
                              <span>{ret.stops_label}</span>
                              {ret.stops_night && (
                                <>
                                  <Moon className="w-3 h-3 text-gray-500" />
                                  <Clock className="w-3 h-3 text-gray-500" />
                                </>
                              )}
                            </div>
                            {ret.stops_subtext && (
                              <div className="text-[11px] text-[#6B7280]">
                                {ret.stops_subtext}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-[#6B7280] whitespace-pre-line text-right leading-tight">
                              {ret.flight_number}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedFlightDetails((p) => ({
                                  ...p,
                                  [flight.id]: !p[flight.id],
                                }))
                              }
                              className="w-7 h-7 rounded-lg bg-[#F6D04D] hover:bg-[#F5C400] flex items-center justify-center text-[#111827]"
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${isDetailsOpen ? 'rotate-180' : ''
                                  }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isDetailsOpen && (
                      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs text-gray-600 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-gray-900">
                            Тип ВС:
                          </span>{' '}
                          Boeing 737-800 / Airbus A320 • Класс бронирования: Эконом (Y)
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">
                            Норма провоза ручной клади:
                          </span>{' '}
                          1 место (40×20×25 см) гарантированно в салоне
                        </div>
                      </div>
                    )}

                    {/* Bottom Section: Tariff Sub-cards + Выбрать CTA */}
                    <div className="p-5 flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-4">
                      <div className="flex flex-wrap items-stretch gap-3">
                        {flight.tariffs.map((tariff) => {
                          const isTariffSelected = activeTariffId === tariff.id;
                          return (
                            <div
                              key={tariff.id}
                              onClick={() =>
                                setSelectedTariffs((prev) => ({
                                  ...prev,
                                  [flight.id]: tariff.id,
                                }))
                              }
                              className={`w-[190px] rounded-xl p-3.5 cursor-pointer transition-all relative ${isTariffSelected
                                ? 'bg-[#FDF9EE] border border-[#F6D04D]'
                                : 'bg-[#F4F5F7] hover:bg-gray-200/70 border border-transparent'
                                }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`relative text-xs ${tariff.baggage_included
                                      ? 'text-[#16A34A]'
                                      : 'text-gray-400'
                                      }`}
                                  >
                                    <Luggage className="w-4 h-4" />
                                  </span>

                                  <span className="text-[#16A34A]">
                                    <Briefcase className="w-4 h-4" />
                                  </span>

                                  <span
                                    className={
                                      tariff.exchangeable
                                        ? 'text-[#16A34A]'
                                        : 'text-gray-400'
                                    }
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </span>

                                  <span
                                    className={
                                      tariff.refundable
                                        ? 'text-[#16A34A]'
                                        : 'text-gray-400'
                                    }
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedTariffPopover(
                                      expandedTariffPopover === tariff.id
                                        ? null
                                        : tariff.id
                                    );
                                  }}
                                  className="w-5 h-5 rounded bg-[#F6D04D] flex items-center justify-center text-[#111827]"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="text-[12px] text-[#6B7280]">
                                {tariff.name}
                              </div>

                              <div className="text-[11px] text-[#3B82F6] line-through mt-0.5">
                                {tariff.old_price_label}
                              </div>

                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[18px] font-bold text-[#2563EB] leading-none">
                                  {tariff.price_label}
                                </span>
                                <span className="w-4 h-4 rounded bg-gray-200/80 text-gray-500 flex items-center justify-center text-[10px] font-serif italic">
                                  i
                                </span>
                              </div>

                              {tariff.few_tickets && (
                                <div className="mt-2.5 flex items-center gap-1 text-[11px] text-[#D97706] font-medium">
                                  <span className="w-3.5 h-3.5 rounded-full bg-[#D97706] text-white flex items-center justify-center text-[9px] font-bold">
                                    !
                                  </span>
                                  <span>Мало билетов</span>
                                </div>
                              )}

                              {expandedTariffPopover === tariff.id && (
                                <div className="mt-2 pt-2 border-t border-gray-200 space-y-1 text-[11px] text-gray-700">
                                  {tariff.features.map((feat, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-start gap-1"
                                    >
                                      <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                                      <span>{feat}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0 self-end sm:self-start">
                        <button
                          type="button"
                          onClick={() => {
                            const chosen = flight.tariffs.find(
                              (t) => t.id === activeTariffId
                            );
                            onSelectFlightTariff(
                              flight,
                              chosen || flight.tariffs[0]
                            );
                          }}
                          className="h-[40px] px-7 rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] font-medium text-[14px] transition-all"
                        >
                          Выбрать
                        </button>
                        {flight.deep_link && (
                          <a
                            href={flight.deep_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#2563EB] hover:underline font-medium"
                          >
                            Aviasales Deep-Link ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
