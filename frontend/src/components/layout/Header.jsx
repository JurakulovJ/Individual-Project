import React, { useState } from 'react';
import {
  ChevronDown,
  Menu,
  Sparkles,
  Check,
  Phone,
  MessageSquare,
  FileText,
  User,
  LogOut,
  Building2,
  Eye,
  Wifi,
} from 'lucide-react';

export default function Header({
  activeTopNav,
  setActiveTopNav,
  currency,
  setCurrency,
  language,
  setLanguage,
  currentView,
  setCurrentView,
  activeVertical,
  setActiveVertical,
  activeOrdersCount = 1,
  loyaltyPointsTotal = 4,
  apiOnline = true,
  healthStatus = null,
}) {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const navItems = [
    { id: 'search', label: 'Поиск', badge: null },
    { id: 'trips', label: 'Поездки', badge: String(activeOrdersCount) },
    { id: 'orders', label: 'Заказы', badge: null },
    { id: 'reports', label: 'Отчётность', badge: null },
    { id: 'clients', label: 'Клиенты', badge: null },
  ];

  const currencies = ['USD, $', 'EUR, €', 'UZS, сум', 'RUB, ₽'];
  const languages = [
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]">
      {/* Quick-Jump Bar + Live Backend API Status */}
      <div className="bg-[#1C2026] text-white px-4 py-1.5 text-[11px] border-b border-white/10">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-600 text-white font-semibold text-[10px] tracking-wide uppercase">
              <span
                className={`w-1.5 h-1.5 rounded-full ${apiOnline ? 'bg-white animate-pulse' : 'bg-amber-300'
                  }`}
              />
              <span>
                {apiOnline
                  ? 'FastAPI :8000 • Aviasales & Booking.com Adapters Ready'
                  : 'Connecting to API...'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-[10px] text-gray-200 font-medium">
              <span
                className={`w-1.5 h-1.5 rounded-full ${healthStatus?.aviasales_configured ||
                    healthStatus?.booking_configured
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                  }`}
              />
              <span>
                {healthStatus?.aviasales_configured &&
                  healthStatus?.booking_configured
                  ? 'Aviasales + Booking.com Live API'
                  : 'Aviasales Autocomplete Live • Smart Fallback Active'}
              </span>
            </span>
            <span className="text-gray-400 hidden sm:inline">
              Быстрый переход по экранам:
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setActiveTopNav('search');
                setCurrentView('dashboard');
                setActiveVertical('hotels');
              }}
              className={`px-2.5 py-0.5 rounded transition-all font-medium ${currentView === 'dashboard' && activeVertical === 'hotels'
                ? 'bg-[#F6D04D] text-[#111827] font-bold'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
            >
              1. Отели (Главная)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTopNav('search');
                setCurrentView('dashboard');
                setActiveVertical('flights');
              }}
              className={`px-2.5 py-0.5 rounded transition-all font-medium ${currentView === 'dashboard' && activeVertical === 'flights'
                ? 'bg-[#F6D04D] text-[#111827] font-bold'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
            >
              2. Авиа (Главная)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTopNav('search');
                setCurrentView('dashboard');
                setActiveVertical('transfers');
              }}
              className={`px-2.5 py-0.5 rounded transition-all font-medium ${currentView === 'dashboard' && activeVertical === 'transfers'
                ? 'bg-[#F6D04D] text-[#111827] font-bold'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
            >
              3. Трансферы (Главная)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTopNav('search');
                setActiveVertical('flights');
                setCurrentView('flights-results');
              }}
              className={`px-2.5 py-0.5 rounded transition-all font-medium ${currentView === 'flights-results'
                ? 'bg-[#F6D04D] text-[#111827] font-bold'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
            >
              4. Выдача Авиабилетов
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTopNav('search');
                setActiveVertical('hotels');
                setCurrentView('hotels-results');
              }}
              className={`px-2.5 py-0.5 rounded transition-all font-medium ${currentView === 'hotels-results'
                ? 'bg-[#F6D04D] text-[#111827] font-bold'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
            >
              5. Выдача Отелей + Карта
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTopNav('search');
                setCurrentView('dashboard');
                setActiveVertical('ai-planner');
              }}
              className={`px-2.5 py-0.5 rounded transition-all font-medium flex items-center gap-1 ${activeVertical === 'ai-planner' && currentView === 'dashboard'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#F5C400] text-white font-bold shadow-sm'
                : 'bg-[#7C3AED]/40 text-purple-200 hover:bg-[#7C3AED]/70 border border-purple-400/30'
                }`}
            >
              <Sparkles className="w-3 h-3 text-[#F6D04D]" />
              <span>AI Travel Ассистент</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 64px RateHawk Enterprise Header Bar */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 h-[64px] flex items-center justify-between gap-4">
        {/* Left: Brand Logo + Navigation Links */}
        <div className="flex items-center gap-6 lg:gap-8 h-full">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => {
              setActiveTopNav('search');
              setCurrentView('dashboard');
              setActiveVertical('hotels');
            }}
            className="flex items-center gap-1.5 text-left group focus:outline-none shrink-0"
          >
            <div className="flex items-center">
              <div className="relative flex items-center justify-center bg-[#111827] text-white font-black text-lg leading-none px-1.5 py-1.5 rounded-l-md border-r border-yellow-400/40">
                <span className="tracking-tighter text-[18px]">10</span>
                <span className="text-[6px] uppercase tracking-widest absolute -bottom-0.5 left-1.5 text-[#F6D04D]">
                  лет
                </span>
              </div>
              <div className="w-7 h-8 bg-[#111827] flex items-center justify-center rounded-r-md relative overflow-hidden">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-[#F6D04D] fill-current transform -rotate-12"
                >
                  <path d="M12 2L4 7v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V7l-8-5zm-1 14.5l-3.5-3.5 1.41-1.41L11 13.67l5.09-5.09L17.5 10l-6.5 6.5z" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-black text-[18px] tracking-tight text-[#111827] leading-none">
                  RATE HAWK
                </span>
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase text-[#7C3AED] leading-none mt-0.5">
                × TravelAI Enterprise
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-6 h-full">
            {navItems.map((item) => {
              const isActive = activeTopNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTopNav(item.id);
                    if (item.id === 'search') {
                      setCurrentView('dashboard');
                    }
                  }}
                  className={`relative h-full flex items-center gap-1 text-[14px] transition-colors ${isActive
                    ? 'font-medium text-[#111827]'
                    : 'font-normal text-[#4B5563] hover:text-[#111827]'
                    }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-0.5 -mt-3 px-1.5 py-0.2 min-w-[18px] h-[18px] rounded bg-[#DC2626] text-white text-[11px] font-bold flex items-center justify-center leading-none">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#111827] rounded-t-sm" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Controls: Language, Currency, Support, User/Agency Profile, Burger */}
        <div className="flex items-center gap-3 lg:gap-5 text-[13px] text-[#111827]">
          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('lang')}
              className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="inline-flex w-4 h-3 rounded-[2px] overflow-hidden border border-gray-200 shrink-0">
                <svg viewBox="0 0 9 6" className="w-full h-full">
                  <rect fill="#fff" width="9" height="3" />
                  <rect fill="#d52b1e" y="3" width="9" height="3" />
                  <rect fill="#0039a6" y="2" width="9" height="2" />
                </svg>
              </span>
              <span className="hidden sm:inline font-normal text-[#374151]">
                {language}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {openDropdown === 'lang' && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLanguage(l.label);
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span className="font-medium text-gray-800">
                        {l.label}
                      </span>
                    </span>
                    {language === l.label && (
                      <Check className="w-3.5 h-3.5 text-[#7C3AED]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Currency Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('currency')}
              className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="w-5 h-5 rounded-md border border-gray-300 flex items-center justify-center text-[9px] font-bold leading-none text-gray-700 tracking-tighter">
                $€
              </span>
              <span className="font-normal text-[#374151]">{currency}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {openDropdown === 'currency' && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
                {currencies.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCurrency(c);
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-800">{c}</span>
                    {currency === c && (
                      <Check className="w-3.5 h-3.5 text-[#7C3AED]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Support Dropdown */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => toggleDropdown('support')}
              className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="w-4 h-4 rounded-full bg-[#374151] text-white flex items-center justify-center text-[10px] font-bold">
                ?
              </span>
              <span className="font-normal text-[#374151]">Поддержка</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {openDropdown === 'support' && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 space-y-2.5">
                <div className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  Служба поддержки 24/7
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-black cursor-pointer">
                  <Phone className="w-4 h-4 text-[#7C3AED]" />
                  <div>
                    <div className="font-semibold">+998 (71) 205-00-00</div>
                    <div className="text-[11px] text-gray-400">
                      Экстренная линия для агентов
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-black cursor-pointer">
                  <MessageSquare className="w-4 h-4 text-[#7C3AED]" />
                  <div>
                    <div className="font-semibold">Онлайн-чат с куратором</div>
                    <div className="text-[11px] text-gray-400">
                      Среднее время ответа: 2 мин
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-black cursor-pointer pt-1 border-t border-gray-100">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span>OpenAPI Swagger (/docs)</span>
                </div>
              </div>
            )}
          </div>

          {/* User / Agency Profile Badge */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('profile')}
              className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <div className="w-6 h-6 rounded-full bg-[#374151] text-white flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="hidden lg:block leading-tight">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-[#6B7280] max-w-[125px] truncate">
                    shoshprimecontact@...
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-[#2563EB] text-white text-[10px] font-bold leading-none">
                    P {loyaltyPointsTotal}
                  </span>
                </div>
                <div className="text-[12px] font-medium text-[#111827]">
                  ООО &quot;Shosh Prime&quot;
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 hidden lg:block" />
            </button>

            {openDropdown === 'profile' && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 space-y-2">
                <div className="pb-2 border-b border-gray-100">
                  <div className="text-xs font-bold text-gray-900">
                    ООО &quot;Shosh Prime&quot;
                  </div>
                  <div className="text-[11px] text-gray-500">
                    shoshprimecontact@agency.uz
                  </div>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold">
                    Баланс баллов лояльности: {loyaltyPointsTotal} P
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTopNav('orders');
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Building2 className="w-3.5 h-3.5 text-gray-500" />
                  <span>Мои заказы и финансовый кабинет</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(null)}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Выйти из аккаунта</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Hamburger Menu Icon */}
          <button
            type="button"
            onClick={() => toggleDropdown('menu')}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-[#374151] transition-colors"
            title="Меню"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
