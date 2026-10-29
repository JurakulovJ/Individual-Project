import React, { useState, useEffect } from 'react';
import {
  BedDouble,
  Plane,
  Bus,
  Car,
  TrainFront,
  Users,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ArrowLeftRight,
  MapPin,
  Plus,
  Minus,
} from 'lucide-react';
import {
  fetchDestinations,
  searchHotelLocations,
  autocompleteFlightPlaces,
} from '../../services/api';
import AITravelAssistant from '../ai-assistant/AITravelAssistant';
import DatePickerPopover from './DatePickerPopover';

const CITIZENSHIPS = [
  { code: 'UZ', label: 'Узбекистан' },
  { code: 'KZ', label: 'Казахстан' },
  { code: 'RU', label: 'Россия' },
  { code: 'US', label: 'США' },
  { code: 'GB', label: 'Великобритания' },
  { code: 'DE', label: 'Германия' },
  { code: 'AE', label: 'ОАЭ' },
];

const TIME_OPTIONS = [
  'Выберите время',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
];

const AIRLINES = [
  'Все авиакомпании',
  'Ryanair',
  'Air Europa',
  'British Airways',
  'Uzbekistan Airways',
  'Turkish Airlines',
  'Emirates',
  'Lufthansa',
];

export default function HeroSearch({
  activeVertical,
  setActiveVertical,
  searchParams,
  setSearchParams,
  onTriggerSearch,
  onApplyAIBundle,
  onApplyAISuggestedFilters,
}) {
  const [destinations, setDestinations] = useState([]);
  const [hotelLocationSuggestions, setHotelLocationSuggestions] = useState([]);
  const [flightOriginSuggestions, setFlightOriginSuggestions] = useState([]);
  const [flightDestSuggestions, setFlightDestSuggestions] = useState([]);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showGuestsPopover, setShowGuestsPopover] = useState(false);
  const [showFlightOriginDropdown, setShowFlightOriginDropdown] = useState(false);
  const [showFlightDestDropdown, setShowFlightDestDropdown] = useState(false);
  const [showFlightPassengers, setShowFlightPassengers] = useState(false);
  const [activeDatePicker, setActiveDatePicker] = useState(null);

  // Load live destinations from GET /api/v1/plan/destinations
  useEffect(() => {
    let mounted = true;
    fetchDestinations()
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setDestinations(data);
        }
      })
      .catch(() => {
        // Fallback if backend is starting up
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Live Hotel Location Lookup via Booking.com Adapter (GET /api/v1/hotels/locations)
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      searchHotelLocations(searchParams.hotelDestination || '')
        .then((items) => {
          if (active && Array.isArray(items) && items.length > 0) {
            setHotelLocationSuggestions(items);
          }
        })
        .catch(() => { });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchParams.hotelDestination]);

  // Live Aviasales Public Autocomplete for Flight Origin (GET /api/v1/flights/autocomplete)
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      autocompleteFlightPlaces(searchParams.flightOrigin || 'Барселона')
        .then((items) => {
          if (active && Array.isArray(items) && items.length > 0) {
            setFlightOriginSuggestions(items);
          }
        })
        .catch(() => { });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchParams.flightOrigin]);

  // Live Aviasales Public Autocomplete for Flight Destination (GET /api/v1/flights/autocomplete)
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      autocompleteFlightPlaces(searchParams.flightDestination || 'Лондон')
        .then((items) => {
          if (active && Array.isArray(items) && items.length > 0) {
            setFlightDestSuggestions(items);
          }
        })
        .catch(() => { });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchParams.flightDestination]);

  const tabs = [
    { id: 'hotels', label: 'Отели и квартиры', icon: BedDouble },
    { id: 'flights', label: 'Авиабилеты', icon: Plane },
    { id: 'transfers', label: 'Трансферы', icon: Bus },
    { id: 'car-rental', label: 'Аренда авто', icon: Car },
    { id: 'trains', label: 'Ж/д билеты', icon: TrainFront },
    { id: 'offline', label: 'Offline-запросы', icon: Users, external: true },
  ];

  const starOptions = [
    { value: 0, label: 'Без звёзд' },
    { value: 2, label: '2 звезды' },
    { value: 3, label: '3 звезды' },
    { value: 4, label: '4 звезды' },
    { value: 5, label: '5 звёзд' },
  ];

  const mealOptions = ['RO', 'BB', 'HB', 'FB', 'AI'];

  const toggleStar = (val) => {
    setSearchParams((prev) => {
      const exists = prev.stars.includes(val);
      return {
        ...prev,
        stars: exists
          ? prev.stars.filter((s) => s !== val)
          : [...prev.stars, val],
      };
    });
  };

  const toggleMeal = (meal) => {
    setSearchParams((prev) => {
      const exists = prev.meals.includes(meal);
      return {
        ...prev,
        meals: exists
          ? prev.meals.filter((m) => m !== meal)
          : [...prev.meals, meal],
      };
    });
  };

  const swapFlightLocations = () => {
    setSearchParams((prev) => ({
      ...prev,
      flightOrigin: prev.flightDestination || 'Лондон, Великобритания',
      flightDestination: prev.flightOrigin || 'Барселона, Испания',
    }));
  };

  const swapTransferLocations = () => {
    setSearchParams((prev) => ({
      ...prev,
      transferFrom: prev.transferTo,
      transferTo: prev.transferFrom,
    }));
  };

  return (
    <section className="relative bg-gradient-to-r from-[#FFD000] via-[#FFE033] to-[#FFF078] border-b-[4px] border-[#7C3AED] overflow-visible">
      {/* Subtle diagonal geometric vector lines matching Screenshots 1-3 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="w-full h-full opacity-35"
          viewBox="0 0 1440 400"
          fill="none"
          preserveAspectRatio="none"
        >
          <path d="M-100 380 L600 -50" stroke="#FFF9B0" strokeWidth="2" />
          <path d="M-50 400 L750 -50" stroke="#FFF9B0" strokeWidth="1.5" />
          <path d="M100 420 L950 -40" stroke="#FFF9B0" strokeWidth="1.5" />
          <path d="M650 420 L1500 -30" stroke="#FFF9B0" strokeWidth="2" />
          <path d="M850 420 L1600 20" stroke="#FFF9B0" strokeWidth="1.5" />
          <polygon
            points="1180,0 1440,0 1440,260"
            fill="rgba(255,255,255,0.22)"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-[1220px] mx-auto px-4 pt-5 pb-8">
        {/* Service Switcher Bar + Signature AI Travel Tab */}
        <div className="flex items-center gap-2.5 flex-wrap mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeVertical === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveVertical(tab.id)}
                className={`h-[44px] px-4 rounded-xl flex items-center gap-2.5 text-[14px] font-medium transition-all shadow-sm ${isActive
                  ? 'bg-[#1C2026] text-white shadow-md'
                  : 'bg-white/90 hover:bg-white text-[#111827]'
                  }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#4B5563]'
                    }`}
                />
                <span>{tab.label}</span>
                {tab.external && (
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
                )}
              </button>
            );
          })}

          {/* Signature Killer Feature: ✨ AI Travel Ассистент */}
          <button
            type="button"
            onClick={() => setActiveVertical('ai-planner')}
            className={`h-[44px] px-4 rounded-xl flex items-center gap-2 text-[14px] font-bold transition-all relative ${activeVertical === 'ai-planner'
              ? 'bg-[#1C2026] text-white ring-2 ring-[#7C3AED] shadow-lg'
              : 'bg-white text-[#111827] hover:bg-purple-50 border-2 border-[#7C3AED]/80 shadow-sm'
              }`}
          >
            <Sparkles
              className={`w-4 h-4 ${activeVertical === 'ai-planner'
                ? 'text-[#F6D04D]'
                : 'text-[#7C3AED]'
                }`}
            />
            <span>AI Поиск / Собрать тур</span>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded bg-[#7C3AED] text-white leading-none">
              AI
            </span>
          </button>
        </div>

        {/* White Search Card Container */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6">
          {/* =============================================================== */}
          {/* STATE 1: ОТЕЛИ И КВАРТИРЫ (SCREENSHOT 1)                        */}
          {/* =============================================================== */}
          {activeVertical === 'hotels' && (
            <div className="space-y-4">
              {/* Row 1: Destination, Dates, Guests, Search CTA */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                {/* Destination Input (5 cols) */}
                <div className="lg:col-span-5 relative">
                  <div
                    onClick={() => setShowDestDropdown(true)}
                    className="h-[52px] px-3.5 py-1.5 rounded-xl border border-[#D1D5DB] hover:border-gray-400 focus-within:border-[#111827] bg-white flex flex-col justify-center cursor-text transition-colors"
                  >
                    <span className="text-[11px] text-[#6B7280] leading-tight">
                      Направление
                    </span>
                    <input
                      type="text"
                      value={searchParams.hotelDestination}
                      onFocus={() => setShowDestDropdown(true)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSearchParams({
                          ...searchParams,
                          hotelDestination: val,
                          selectedCityShort:
                            val.split(',')[0].trim() || 'Нью-Йорк',
                        });
                      }}
                      placeholder="Город, отель или аэропорт"
                      className="w-full text-[14px] text-[#111827] placeholder-[#6B7280] font-normal focus:outline-none bg-transparent leading-tight mt-0.5"
                    />
                  </div>

                  {/* Live Destination Autocomplete from Booking.com Adapter (/api/v1/hotels/locations) */}
                  {showDestDropdown && (
                    <div className="absolute left-0 right-0 top-[56px] bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-40 max-h-72 overflow-y-auto">
                      <div className="px-3.5 py-1 text-[11px] font-semibold text-gray-400 uppercase flex items-center justify-between">
                        <span>
                          Направления (Booking.com /api/v1/hotels/locations)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowDestDropdown(false)}
                          className="text-gray-400 hover:text-gray-600 text-xs lowercase"
                        >
                          закрыть
                        </button>
                      </div>
                      {(hotelLocationSuggestions.length > 0
                        ? hotelLocationSuggestions
                        : destinations.map((d) => ({
                          dest_id: d.id,
                          name: d.city_ru || d.city,
                          country: d.country_ru || d.country,
                          label:
                            d.name_ru ||
                            `${d.city_ru || d.city}, ${d.country_ru || d.country}`,
                          hotels_count: d.hotels_count || 51,
                          source: 'mock_fallback',
                        }))
                      ).map((loc) => {
                        const displayName =
                          loc.label || `${loc.name}, ${loc.country}`;
                        const shortCity = loc.name || 'Нью-Йорк';
                        return (
                          <button
                            key={loc.dest_id || displayName}
                            type="button"
                            onClick={() => {
                              setSearchParams({
                                ...searchParams,
                                hotelDestination: displayName,
                                selectedCityShort: shortCity,
                              });
                              setShowDestDropdown(false);
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-gray-50 flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="font-medium text-[#111827] text-[13px]">
                                  {displayName}
                                </div>
                                <div className="text-[11px] text-gray-400">
                                  {loc.hotels_count || 51} отелей • dest_id: {loc.dest_id}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${loc.source === 'booking_live'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-500'
                                }`}
                            >
                              {loc.source === 'booking_live'
                                ? 'Booking Live'
                                : 'Catalog'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Joined Check-in / Check-out Datepicker (3 cols) */}
                <div className="lg:col-span-3 relative">
                  <div className="grid grid-cols-2 h-[52px] rounded-xl border border-[#D1D5DB] hover:border-gray-400 bg-white overflow-hidden divide-x divide-[#D1D5DB]">
                    <div
                      onClick={() => setActiveDatePicker('hotel-start')}
                      className="px-3.5 py-1.5 flex flex-col justify-center cursor-pointer hover:bg-gray-50/70"
                    >
                      <span className="text-[11px] text-[#6B7280] leading-tight">
                        Заезд
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={searchParams.checkIn}
                        onFocus={() => setActiveDatePicker('hotel-start')}
                        className="text-[14px] text-[#111827] font-normal focus:outline-none bg-transparent leading-tight mt-0.5 w-full cursor-pointer"
                      />
                    </div>
                    <div
                      onClick={() => setActiveDatePicker('hotel-end')}
                      className="px-3.5 py-1.5 flex flex-col justify-center cursor-pointer hover:bg-gray-50/70"
                    >
                      <span className="text-[11px] text-[#6B7280] leading-tight">
                        Выезд
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={searchParams.checkOut}
                        onFocus={() => setActiveDatePicker('hotel-end')}
                        className="text-[14px] text-[#111827] font-normal focus:outline-none bg-transparent leading-tight mt-0.5 w-full cursor-pointer"
                      />
                    </div>
                  </div>

                  {(activeDatePicker === 'hotel-start' ||
                    activeDatePicker === 'hotel-end') && (
                    <DatePickerPopover
                      mode="hotel"
                      activeField={
                        activeDatePicker === 'hotel-end' ? 'end' : 'start'
                      }
                      onSelectRange={(checkInStr, checkOutStr, nightsCount) => {
                        setSearchParams((prev) => ({
                          ...prev,
                          checkIn: checkInStr,
                          checkOut: checkOutStr,
                          nights: nightsCount || 7,
                        }));
                      }}
                      onClose={() => setActiveDatePicker(null)}
                    />
                  )}
                </div>

                {/* Guests & Rooms Selector (2 cols) */}
                <div className="lg:col-span-2 relative">
                  <button
                    type="button"
                    onClick={() => setShowGuestsPopover(!showGuestsPopover)}
                    className="w-full h-[52px] px-3.5 py-1.5 rounded-xl border border-[#D1D5DB] hover:border-gray-400 bg-white flex items-center justify-between text-left"
                  >
                    <div>
                      <span className="text-[11px] text-[#6B7280] block leading-tight">
                        {searchParams.rooms} номер для
                      </span>
                      <span className="text-[14px] text-[#111827] font-normal leading-tight mt-0.5 block">
                        {searchParams.adults + searchParams.children} гостей
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                  </button>

                  {showGuestsPopover && (
                    <div className="absolute right-0 top-[56px] w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-40 space-y-3">
                      <div className="text-xs font-bold text-gray-900">
                        Номер 1
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-gray-800">
                            Взрослые
                          </div>
                          <div className="text-[11px] text-gray-400">
                            От 18 лет
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSearchParams((p) => ({
                                ...p,
                                adults: Math.max(1, p.adults - 1),
                              }))
                            }
                            className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold">
                            {searchParams.adults}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSearchParams((p) => ({
                                ...p,
                                adults: Math.min(6, p.adults + 1),
                              }))
                            }
                            className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-gray-800">
                            Дети
                          </div>
                          <div className="text-[11px] text-gray-400">
                            До 17 лет
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSearchParams((p) => ({
                                ...p,
                                children: Math.max(0, p.children - 1),
                              }))
                            }
                            className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold">
                            {searchParams.children}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSearchParams((p) => ({
                                ...p,
                                children: Math.min(4, p.children + 1),
                              }))
                            }
                            className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            setSearchParams((p) => ({
                              ...p,
                              rooms: p.rooms + 1,
                            }))
                          }
                          className="text-xs font-medium text-[#2563EB] hover:underline"
                        >
                          + Добавить номер
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowGuestsPopover(false)}
                          className="px-3 py-1.5 rounded-lg bg-[#F6D04D] text-[#111827] text-xs font-semibold"
                        >
                          Готово
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary CTA Button Найти (2 cols) */}
                <div className="lg:col-span-2">
                  <button
                    type="button"
                    onClick={() => onTriggerSearch('hotels')}
                    className="w-full h-[52px] rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] active:scale-[0.99] text-[#111827] font-semibold text-[15px] transition-all shadow-sm"
                  >
                    Найти
                  </button>
                </div>
              </div>

              {/* Label: Дополнительные параметры */}
              <div className="pt-1">
                <span className="text-[13px] text-[#6B7280]">
                  Дополнительные параметры
                </span>
              </div>

              {/* Row 2: Citizenship Dropdown + Star Rating Segmented Multi-Select */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                {/* Citizenship Dropdown (4 cols) */}
                <div className="lg:col-span-4">
                  <div className="h-[48px] px-3.5 py-1 rounded-xl border border-[#D1D5DB] bg-white flex items-center justify-between">
                    <div className="w-full">
                      <span className="text-[10px] text-[#6B7280] block leading-tight">
                        Гражданство гостей (обязательно для этого направления)
                      </span>
                      <select
                        value={searchParams.citizenship}
                        onChange={(e) =>
                          setSearchParams({
                            ...searchParams,
                            citizenship: e.target.value,
                          })
                        }
                        className="w-full text-[13px] text-[#111827] bg-transparent focus:outline-none cursor-pointer mt-0.5"
                      >
                        <option value="">Выберите гражданство</option>
                        {CITIZENSHIPS.map((c) => (
                          <option key={c.code} value={c.label}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Star Rating Segmented Multi-select Bar (8 cols) */}
                <div className="lg:col-span-8">
                  <div className="h-[48px] rounded-xl border border-[#D1D5DB] bg-white grid grid-cols-5 divide-x divide-[#E5E7EB] overflow-hidden">
                    {starOptions.map((star) => {
                      const active = searchParams.stars.includes(star.value);
                      return (
                        <button
                          key={star.value}
                          type="button"
                          onClick={() => toggleStar(star.value)}
                          className={`relative h-full text-[13px] font-normal transition-colors flex items-center justify-center ${active
                            ? 'bg-[#FFFBEB] font-semibold text-[#111827]'
                            : 'text-[#111827] hover:bg-gray-50'
                            }`}
                        >
                          <span>{star.label}</span>
                          {active && (
                            <span className="absolute bottom-1 left-4 right-4 h-[3px] bg-[#F5C400] rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 3: Meal plan (RO, BB, HB, FB, AI), Early check-in, Late check-out, Free cancellation */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Meal Plan Segmented Multi-select */}
                <div className="h-[48px] rounded-xl border border-[#D1D5DB] bg-white inline-flex divide-x divide-[#E5E7EB] overflow-hidden">
                  {mealOptions.map((meal) => {
                    const active = searchParams.meals.includes(meal);
                    return (
                      <button
                        key={meal}
                        type="button"
                        onClick={() => toggleMeal(meal)}
                        className={`relative w-[54px] h-full text-[13px] transition-colors flex items-center justify-center ${active
                          ? 'bg-[#FFFBEB] font-semibold text-[#111827]'
                          : 'text-[#111827] hover:bg-gray-50'
                          }`}
                      >
                        <span>{meal}</span>
                        {active && (
                          <span className="absolute bottom-1 left-2.5 right-2.5 h-[3px] bg-[#F5C400] rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Early Check-in Dropdown */}
                <div className="h-[48px] w-[195px] px-3.5 py-1 rounded-xl border border-[#D1D5DB] bg-white flex flex-col justify-center">
                  <span className="text-[10px] text-[#6B7280] leading-tight">
                    Ранний заезд
                  </span>
                  <select
                    value={searchParams.earlyCheckIn}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        earlyCheckIn: e.target.value,
                      })
                    }
                    className="w-full text-[13px] text-[#6B7280] bg-transparent focus:outline-none cursor-pointer mt-0.5"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Late Check-out Dropdown */}
                <div className="h-[48px] w-[195px] px-3.5 py-1 rounded-xl border border-[#D1D5DB] bg-white flex flex-col justify-center">
                  <span className="text-[10px] text-[#6B7280] leading-tight">
                    Поздний выезд
                  </span>
                  <select
                    value={searchParams.lateCheckOut}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        lateCheckOut: e.target.value,
                      })
                    }
                    className="w-full text-[13px] text-[#6B7280] bg-transparent focus:outline-none cursor-pointer mt-0.5"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Бесплатная отмена Checkbox */}
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none ml-1">
                  <input
                    type="checkbox"
                    checked={searchParams.freeCancellation}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        freeCancellation: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-[#F5C400] focus:ring-[#F5C400]"
                  />
                  <span className="text-[13px] text-[#374151]">
                    Бесплатная отмена
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STATE 2: АВИАБИЛЕТЫ (SCREENSHOT 2)                              */}
          {/* =============================================================== */}
          {activeVertical === 'flights' && (
            <div className="space-y-4">
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
                        setSearchParams({
                          ...searchParams,
                          flightTripType: r.id,
                        })
                      }
                      className="flex items-center gap-2 text-[14px] text-[#111827] focus:outline-none"
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

              {/* Middle Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                {/* Origin & Destination Dual Input with Swap Button */}
                <div className="lg:col-span-6 relative grid grid-cols-2 h-[52px] rounded-xl border border-[#D1D5DB] bg-white divide-x divide-[#E5E7EB]">
                  <div className="px-3.5 py-1.5 flex flex-col justify-center relative">
                    <span className="text-[11px] text-[#6B7280] leading-tight">
                      Откуда
                    </span>
                    <input
                      type="text"
                      value={searchParams.flightOrigin}
                      onFocus={() => setShowFlightOriginDropdown(true)}
                      onBlur={() =>
                        setTimeout(
                          () => setShowFlightOriginDropdown(false),
                          180
                        )
                      }
                      onChange={(e) =>
                        setSearchParams({
                          ...searchParams,
                          flightOrigin: e.target.value,
                        })
                      }
                      placeholder="Город или аэропорт"
                      className="text-[14px] text-[#111827] placeholder-[#6B7280] focus:outline-none bg-transparent leading-tight mt-0.5 w-full"
                    />
                    {showFlightOriginDropdown && (
                      <div className="absolute left-0 top-[54px] w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-40 max-h-64 overflow-y-auto">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50/70 flex items-center justify-between">
                          <span>Aviasales IATA Autocomplete</span>
                          <span className="font-mono">places2</span>
                        </div>
                        {(flightOriginSuggestions.length > 0
                          ? flightOriginSuggestions
                          : destinations.map((d) => ({
                            code: d.airport_code,
                            name: d.city_ru || d.city,
                            country_name: d.country_ru || d.country,
                            type: 'city',
                            label: `${d.city_ru || d.city}, ${d.country_ru || d.country} (${d.airport_code})`,
                          }))
                        ).map((item, idx) => (
                          <button
                            key={`${item.code}-${idx}`}
                            type="button"
                            onClick={() =>
                              setSearchParams({
                                ...searchParams,
                                flightOrigin: `${item.name}, ${item.country_name}`,
                              })
                            }
                            className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center justify-between gap-2"
                          >
                            <span className="truncate">
                              <strong className="text-[#111827]">
                                {item.name}
                              </strong>
                              {item.country_name
                                ? `, ${item.country_name}`
                                : ''}
                            </span>
                            <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0">
                              {item.code}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Swap Button in Center */}
                  <button
                    type="button"
                    onClick={swapFlightLocations}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 z-10"
                    title="Поменять местами"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-gray-500" />
                  </button>

                  <div className="px-5 py-1.5 flex flex-col justify-center relative">
                    <span className="text-[11px] text-[#6B7280] leading-tight">
                      Куда
                    </span>
                    <input
                      type="text"
                      value={searchParams.flightDestination}
                      onFocus={() => setShowFlightDestDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowFlightDestDropdown(false), 180)
                      }
                      onChange={(e) =>
                        setSearchParams({
                          ...searchParams,
                          flightDestination: e.target.value,
                        })
                      }
                      placeholder="Город или аэропорт"
                      className="text-[14px] text-[#111827] placeholder-[#6B7280] focus:outline-none bg-transparent leading-tight mt-0.5 w-full"
                    />
                    {showFlightDestDropdown && (
                      <div className="absolute left-0 top-[54px] w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-40 max-h-64 overflow-y-auto">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50/70 flex items-center justify-between">
                          <span>Aviasales IATA Autocomplete</span>
                          <span className="font-mono">places2</span>
                        </div>
                        {(flightDestSuggestions.length > 0
                          ? flightDestSuggestions
                          : destinations.map((d) => ({
                            code: d.airport_code,
                            name: d.city_ru || d.city,
                            country_name: d.country_ru || d.country,
                            type: 'city',
                            label: `${d.city_ru || d.city}, ${d.country_ru || d.country} (${d.airport_code})`,
                          }))
                        ).map((item, idx) => (
                          <button
                            key={`${item.code}-${idx}`}
                            type="button"
                            onClick={() =>
                              setSearchParams({
                                ...searchParams,
                                flightDestination: `${item.name}, ${item.country_name}`,
                              })
                            }
                            className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center justify-between gap-2"
                          >
                            <span className="truncate">
                              <strong className="text-[#111827]">
                                {item.name}
                              </strong>
                              {item.country_name
                                ? `, ${item.country_name}`
                                : ''}
                            </span>
                            <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0">
                              {item.code}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Departure & Return Dates (3 cols) */}
                <div className="lg:col-span-3 relative">
                  <div className="grid grid-cols-2 h-[52px] rounded-xl border border-[#D1D5DB] bg-white divide-x divide-[#E5E7EB] overflow-hidden">
                    <div
                      onClick={() => setActiveDatePicker('flight-start')}
                      className="px-3.5 py-1.5 flex flex-col justify-center cursor-pointer hover:bg-gray-50/70"
                    >
                      <span className="text-[11px] text-[#6B7280] leading-tight">
                        Туда
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={searchParams.flightDepDate}
                        onFocus={() => setActiveDatePicker('flight-start')}
                        className="text-[14px] text-[#111827] focus:outline-none bg-transparent leading-tight mt-0.5 w-full cursor-pointer"
                      />
                    </div>
                    <div
                      onClick={() => {
                        if (searchParams.flightTripType !== 'one-way') {
                          setActiveDatePicker('flight-end');
                        }
                      }}
                      className="px-3.5 py-1.5 flex flex-col justify-center cursor-pointer hover:bg-gray-50/70"
                    >
                      <span className="text-[11px] text-[#6B7280] leading-tight">
                        Обратно
                      </span>
                      <input
                        type="text"
                        readOnly
                        disabled={searchParams.flightTripType === 'one-way'}
                        value={
                          searchParams.flightTripType === 'one-way'
                            ? '—'
                            : searchParams.flightRetDate
                        }
                        onFocus={() => {
                          if (searchParams.flightTripType !== 'one-way') {
                            setActiveDatePicker('flight-end');
                          }
                        }}
                        className="text-[14px] text-[#111827] focus:outline-none bg-transparent leading-tight mt-0.5 w-full disabled:text-gray-300 cursor-pointer"
                      />
                    </div>
                  </div>

                  {(activeDatePicker === 'flight-start' ||
                    activeDatePicker === 'flight-end') && (
                    <DatePickerPopover
                      mode="flight"
                      activeField={
                        activeDatePicker === 'flight-end' ? 'end' : 'start'
                      }
                      onSelectRange={(depStr, retStr) => {
                        setSearchParams((prev) => ({
                          ...prev,
                          flightDepDate: depStr,
                          flightRetDate: retStr,
                        }));
                      }}
                      onClose={() => setActiveDatePicker(null)}
                    />
                  )}
                </div>

                {/* Passengers Selector (3 cols) */}
                <div className="lg:col-span-3 relative">
                  <button
                    type="button"
                    onClick={() =>
                      setShowFlightPassengers(!showFlightPassengers)
                    }
                    className="w-full h-[52px] px-3.5 py-1.5 rounded-xl border border-[#D1D5DB] bg-white flex items-center justify-between text-left"
                  >
                    <div>
                      <span className="text-[11px] text-[#6B7280] block leading-tight">
                        Пассажиры
                      </span>
                      <span className="text-[14px] text-[#111827] leading-tight mt-0.5 block">
                        {searchParams.flightPassengers} взрослый
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  {showFlightPassengers && (
                    <div className="absolute right-0 top-[56px] w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-3.5 z-40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-800">
                          Взрослые (12+ лет)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSearchParams((p) => ({
                                ...p,
                                flightPassengers: Math.max(
                                  1,
                                  p.flightPassengers - 1
                                ),
                              }))
                            }
                            className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">
                            {searchParams.flightPassengers}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSearchParams((p) => ({
                                ...p,
                                flightPassengers: Math.min(
                                  9,
                                  p.flightPassengers + 1
                                ),
                              }))
                            }
                            className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowFlightPassengers(false)}
                        className="w-full py-1.5 rounded-lg bg-[#F6D04D] text-xs font-semibold text-[#111827]"
                      >
                        Применить
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                <div className="lg:col-span-6 h-[50px] rounded-xl border border-[#D1D5DB] bg-white grid grid-cols-4 divide-x divide-[#E5E7EB] overflow-hidden">
                  {['Эконом', 'Премиум', 'Бизнес', 'Первый'].map((cabin) => {
                    const active = searchParams.cabinClass === cabin;
                    return (
                      <button
                        key={cabin}
                        type="button"
                        onClick={() =>
                          setSearchParams({
                            ...searchParams,
                            cabinClass: cabin,
                          })
                        }
                        className="relative h-full text-[14px] text-[#111827] hover:bg-gray-50 flex items-center justify-center transition-colors"
                      >
                        <span className={active ? 'font-medium' : 'font-normal'}>
                          {cabin}
                        </span>
                        {active && (
                          <span className="absolute bottom-1.5 left-4 right-4 h-[3px] bg-[#F5C400] rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="lg:col-span-3 h-[50px] px-3.5 py-1 rounded-xl border border-[#D1D5DB] bg-white flex flex-col justify-center">
                  <span className="text-[11px] text-[#6B7280] leading-tight">
                    Авиакомпания
                  </span>
                  <select
                    value={searchParams.airline}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        airline: e.target.value,
                      })
                    }
                    className="w-full text-[14px] text-[#111827] bg-transparent focus:outline-none cursor-pointer mt-0.5"
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
                    onClick={() => onTriggerSearch('flights')}
                    className="w-full h-[50px] rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] font-semibold text-[15px] transition-all shadow-sm"
                  >
                    Найти
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STATE 3: ТРАНСФЕРЫ (SCREENSHOT 3)                               */}
          {/* =============================================================== */}
          {activeVertical === 'transfers' && (
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                {[
                  { id: 'one-way', label: 'Только туда' },
                  { id: 'round-trip', label: 'Туда-обратно' },
                ].map((r) => {
                  const isSelected = searchParams.transferTripType === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() =>
                        setSearchParams({
                          ...searchParams,
                          transferTripType: r.id,
                        })
                      }
                      className="flex items-center gap-2 text-[14px] text-[#111827]"
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

              <div className="relative grid grid-cols-1 md:grid-cols-2 h-auto md:h-[52px] rounded-xl border border-[#D1D5DB] bg-white divide-y md:divide-y-0 md:divide-x divide-[#E5E7EB]">
                <div className="px-3.5 py-2 flex flex-col justify-center">
                  <span className="text-[11px] text-[#6B7280] leading-tight">
                    Откуда
                  </span>
                  <input
                    type="text"
                    value={searchParams.transferFrom}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        transferFrom: e.target.value,
                      })
                    }
                    placeholder="Аэропорт, вокзал, отель или адрес"
                    className="text-[14px] text-[#111827] placeholder-[#6B7280] focus:outline-none bg-transparent leading-tight mt-0.5 w-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={swapTransferLocations}
                  className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center hover:bg-gray-50 z-10"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-gray-500" />
                </button>

                <div className="px-5 py-2 flex flex-col justify-center">
                  <span className="text-[11px] text-[#6B7280] leading-tight">
                    Куда
                  </span>
                  <input
                    type="text"
                    value={searchParams.transferTo}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        transferTo: e.target.value,
                      })
                    }
                    placeholder="Аэропорт, вокзал, отель или адрес"
                    className="text-[14px] text-[#111827] placeholder-[#6B7280] focus:outline-none bg-transparent leading-tight mt-0.5 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                <div className="lg:col-span-3 relative">
                  <div className="grid grid-cols-2 h-[52px] rounded-xl border border-[#D1D5DB] bg-white divide-x divide-[#E5E7EB] overflow-hidden">
                    <div
                      onClick={() => setActiveDatePicker('transfer-date')}
                      className="px-3.5 py-1.5 flex flex-col justify-center cursor-pointer hover:bg-gray-50/70"
                    >
                      <span className="text-[11px] text-[#6B7280] leading-tight">
                        Когда
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={searchParams.transferDate}
                        onFocus={() => setActiveDatePicker('transfer-date')}
                        className="text-[14px] text-[#111827] focus:outline-none bg-transparent leading-tight mt-0.5 w-full cursor-pointer"
                      />
                    </div>
                    <div className="px-3.5 py-1.5 flex flex-col justify-center">
                      <span className="text-[11px] text-[#6B7280] leading-tight">
                        Время подачи
                      </span>
                      <input
                        type="text"
                        value={searchParams.transferTime}
                        onChange={(e) =>
                          setSearchParams({
                            ...searchParams,
                            transferTime: e.target.value,
                          })
                        }
                        className="text-[14px] text-[#111827] focus:outline-none bg-transparent leading-tight mt-0.5 w-full"
                      />
                    </div>
                  </div>

                  {activeDatePicker === 'transfer-date' && (
                    <DatePickerPopover
                      mode="transfer"
                      onSelectSingle={(dateStr) => {
                        setSearchParams((prev) => ({
                          ...prev,
                          transferDate: dateStr,
                        }));
                      }}
                      onClose={() => setActiveDatePicker(null)}
                    />
                  )}
                </div>

                <div className="lg:col-span-3 h-[52px] px-3.5 py-1.5 rounded-xl border border-[#D1D5DB] bg-white flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#6B7280] block leading-tight">
                      Пассажиры
                    </span>
                    <span className="text-[14px] text-[#111827] leading-tight mt-0.5 block">
                      {searchParams.transferPassengers} взрослых
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                <div className="lg:col-span-6">
                  <button
                    type="button"
                    onClick={() => onTriggerSearch('transfers')}
                    className="w-full h-[52px] rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] font-semibold text-[15px] transition-all shadow-sm"
                  >
                    Найти
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STATE 4: АРЕНДА АВТО / Ж/Д БИЛЕТЫ / OFFLINE                     */}
          {/* =============================================================== */}
          {(activeVertical === 'car-rental' ||
            activeVertical === 'trains' ||
            activeVertical === 'offline') && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                  <div className="lg:col-span-5 h-[52px] px-3.5 py-1.5 rounded-xl border border-[#D1D5DB] bg-white flex flex-col justify-center">
                    <span className="text-[11px] text-[#6B7280]">
                      {activeVertical === 'car-rental'
                        ? 'Место получения автомобиля'
                        : activeVertical === 'trains'
                          ? 'Станция отправления и прибытия'
                          : 'Описание корпоративного или VIP-запроса'}
                    </span>
                    <input
                      type="text"
                      defaultValue={
                        activeVertical === 'car-rental'
                          ? 'Барселона — Аэропорт Эль-Прат (BCN)'
                          : activeVertical === 'trains'
                            ? 'Мадрид (Atocha) → Барселона (Sants)'
                            : 'Групповой тур 15 человек, конференц-зал 5*'
                      }
                      className="text-[14px] text-[#111827] focus:outline-none"
                    />
                  </div>
                  <div className="lg:col-span-4 grid grid-cols-2 h-[52px] rounded-xl border border-[#D1D5DB] bg-white divide-x divide-[#E5E7EB]">
                    <div className="px-3.5 py-1.5 flex flex-col justify-center">
                      <span className="text-[11px] text-[#6B7280]">Начало</span>
                      <span className="text-[14px] text-[#111827]">
                        12 нояб. 2026
                      </span>
                    </div>
                    <div className="px-3.5 py-1.5 flex flex-col justify-center">
                      <span className="text-[11px] text-[#6B7280]">
                        Окончание
                      </span>
                      <span className="text-[14px] text-[#111827]">
                        19 нояб. 2026
                      </span>
                    </div>
                  </div>
                  <div className="lg:col-span-3">
                    <button
                      type="button"
                      onClick={() => onTriggerSearch('hotels')}
                      className="w-full h-[52px] rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] font-semibold text-[15px] transition-all"
                    >
                      Найти предложения
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* =============================================================== */}
          {/* STATE 5: ✨ AI TRAVEL MODE (LIVE BACKEND INTEGRATION)            */}
          {/* =============================================================== */}
          {activeVertical === 'ai-planner' && (
            <AITravelAssistant
              onApplyBundle={onApplyAIBundle}
              onApplyFiltersToSearch={onApplyAISuggestedFilters}
              onJumpToHotels={() => onTriggerSearch('hotels')}
              onJumpToFlights={() => onTriggerSearch('flights')}
            />
          )}
        </div>
      </div>
    </section>
  );
}
