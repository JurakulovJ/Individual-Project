import React, { useState, useRef, useEffect } from 'react';
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
  X,
  BedDouble,
  Plane,
  Bus,
  Car,
  Briefcase,
  ClipboardList,
  BarChart3,
  Users,
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
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const [ordersSubFilterOpen, setOrdersSubFilterOpen] = useState(true);
  const headerRef = useRef(null);

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleOpenAIMode = () => {
    setActiveTopNav('search');
    setCurrentView('dashboard');
    setActiveVertical('ai-planner');
    setOpenDropdown(null);
  };

  const handleSelectSearchVertical = (verticalId) => {
    setActiveTopNav('search');
    setCurrentView('dashboard');
    setActiveVertical(verticalId);
    setOpenDropdown(null);
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]"
    >
      {/* 1. TOP AI FEATURE ANNOUNCEMENT BANNER (DISMISSIBLE) */}
      {showPromoBanner && (
        <div className="w-full min-h-[42px] px-4 py-2 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white relative flex items-center justify-center">
          <div className="max-w-[1440px] mx-auto pr-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
            <div className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-medium leading-snug">
              <Sparkles className="w-4 h-4 text-white shrink-0" />
              <span>
                <strong className="font-semibold">
                  Доступен умный AI-помощник!
                </strong>{' '}
                Соберите готовый тур (перелёт + отель + трансфер) за 30 секунд
                под ваш бюджет
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenAIMode}
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1 rounded-full transition shrink-0"
            >
              Попробовать →
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowPromoBanner(false)}
            aria-label="Закрыть баннер"
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-white/20 p-1 rounded text-white/90 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. MAIN 64PX ENTERPRISE HEADER BAR */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 h-[64px] flex items-center justify-between gap-4">
        {/* Left: Desktop Horizontal Navigation Links (lg:flex) & Mobile/Tablet Active Section Indicator (<1024px) */}
        <div className="flex items-center h-full min-w-0">
          {/* Desktop Navigation Links (>= 1024px) */}
          <nav className="hidden lg:flex items-center gap-6 h-full">
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
                  className={`relative h-full flex items-center gap-1 text-[14px] whitespace-nowrap transition-colors ${
                    isActive
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

          {/* Tablet / Mobile Compact Nav Pill (< 1024px) */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTopNav('search');
                setCurrentView('dashboard');
              }}
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-[#111827] text-[13px] font-semibold flex items-center gap-1.5"
            >
              <span>
                {navItems.find((n) => n.id === activeTopNav)?.label || 'Поиск'}
              </span>
              {activeOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-[#DC2626] text-white text-[10px] font-bold">
                  {activeOrdersCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleOpenAIMode}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Собрать тур</span>
            </button>
          </div>
        </div>

        {/* Right Controls: Desktop Selectors (hidden on <1024px) + Burger Menu Dropdown */}
        <div className="flex items-center gap-3 lg:gap-5 text-[13px] text-[#111827] shrink-0">
          {/* Desktop-only Secondary Controls (Language, Currency, Support, Profile) */}
          <div className="hidden lg:flex items-center gap-4">
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
                <span className="font-normal text-[#374151]">{language}</span>
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
            <div className="relative">
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
                <div className="leading-tight">
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
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
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
          </div>

          {/* 3. RIGHT HAMBURGER MENU ICON & REDESIGNED DROPDOWN CARD */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('menu')}
              className={`p-2 rounded-lg transition-colors ${
                openDropdown === 'menu'
                  ? 'bg-gray-100 text-[#111827]'
                  : 'hover:bg-gray-100 text-[#374151]'
              }`}
              title="Меню платформы"
            >
              <Menu className="w-5 h-5" />
            </button>

            {openDropdown === 'menu' && (
              <div className="absolute right-0 mt-2.5 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-3 z-50 max-h-[84vh] overflow-y-auto">
                {/* Subtle Top Pointer Arrow */}
                <div className="absolute -top-1.5 right-3.5 w-3 h-3 bg-white border-t border-l border-gray-100 rotate-45 pointer-events-none" />

                {/* SECTION 1: ПОИСК */}
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-4 py-1.5">
                  Поиск
                </div>
                <div className="space-y-0.5 px-2">
                  <button
                    type="button"
                    onClick={() => handleSelectSearchVertical('hotels')}
                    className={`w-full px-3 py-2 rounded-lg text-left text-[13px] flex items-center gap-3 transition-colors ${
                      activeTopNav === 'search' && activeVertical === 'hotels'
                        ? 'bg-gray-100 font-semibold text-[#111827]'
                        : 'text-[#374151] hover:bg-gray-50'
                    }`}
                  >
                    <BedDouble className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>Отели и квартиры</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectSearchVertical('flights')}
                    className={`w-full px-3 py-2 rounded-lg text-left text-[13px] flex items-center gap-3 transition-colors ${
                      activeTopNav === 'search' && activeVertical === 'flights'
                        ? 'bg-gray-100 font-semibold text-[#111827]'
                        : 'text-[#374151] hover:bg-gray-50'
                    }`}
                  >
                    <Plane className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>Авиабилеты</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectSearchVertical('transfers')}
                    className={`w-full px-3 py-2 rounded-lg text-left text-[13px] flex items-center gap-3 transition-colors ${
                      activeTopNav === 'search' &&
                      activeVertical === 'transfers'
                        ? 'bg-gray-100 font-semibold text-[#111827]'
                        : 'text-[#374151] hover:bg-gray-50'
                    }`}
                  >
                    <Bus className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>Трансферы</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectSearchVertical('car-rental')}
                    className={`w-full px-3 py-2 rounded-lg text-left text-[13px] flex items-center gap-3 transition-colors ${
                      activeTopNav === 'search' &&
                      activeVertical === 'car-rental'
                        ? 'bg-gray-100 font-semibold text-[#111827]'
                        : 'text-[#374151] hover:bg-gray-50'
                    }`}
                  >
                    <Car className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>Аренда авто</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAIMode}
                    className="w-full px-3 py-2 rounded-lg text-left text-[13px] flex items-center justify-between text-purple-600 font-semibold bg-purple-50/70 hover:bg-purple-100/80 transition-colors mt-1"
                  >
                    <span className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Собрать тур с AI</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-600 text-white font-bold uppercase">
                      AI
                    </span>
                  </button>
                </div>

                {/* DIVIDER */}
                <div className="border-t border-gray-100 my-2" />

                {/* SECTION 2: УПРАВЛЕНИЕ И ЗАКАЗЫ */}
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-4 py-1.5">
                  Управление и заказы
                </div>
                <div className="space-y-0.5 px-2">
                  {/* Поездки */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTopNav('trips');
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left text-[13px] flex items-center justify-between transition-colors ${
                      activeTopNav === 'trips'
                        ? 'bg-gray-100 font-semibold text-[#111827]'
                        : 'text-[#374151] hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Briefcase className="w-4 h-4 text-gray-500 shrink-0" />
                      <span>Поездки</span>
                    </span>
                    <span className="px-1.5 py-0.5 min-w-[20px] rounded bg-[#DC2626] text-white text-[11px] font-bold text-center leading-none">
                      {activeOrdersCount}
                    </span>
                  </button>

                  {/* Заказы + Sub-filters */}
                  <div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTopNav('orders');
                          setOpenDropdown(null);
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-left text-[13px] flex items-center gap-3 transition-colors ${
                          activeTopNav === 'orders'
                            ? 'bg-gray-100 font-semibold text-[#111827]'
                            : 'text-[#374151] hover:bg-gray-50'
                        }`}
                      >
                        <ClipboardList className="w-4 h-4 text-gray-500 shrink-0" />
                        <span>Заказы</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setOrdersSubFilterOpen(!ordersSubFilterOpen)
                        }
                        className="p-2 text-gray-400 hover:text-gray-700"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            ordersSubFilterOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {ordersSubFilterOpen && (
                      <div className="pl-9 pr-2 py-1 space-y-0.5 border-l border-gray-100 ml-5">
                        {[
                          { id: 'hotels', label: 'Отели' },
                          { id: 'flights', label: 'Авиабилеты' },
                          { id: 'transfers', label: 'Трансферы' },
                          { id: 'car-rental', label: 'Аренда авто' },
                        ].map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              setActiveTopNav('orders');
                              setOpenDropdown(null);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-md text-left text-[12px] text-[#4B5563] hover:text-[#111827] hover:bg-gray-50 transition-colors block"
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Отчётность и финансы */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTopNav('search');
                      setCurrentView('dashboard');
                      setOpenDropdown(null);
                      setTimeout(() => {
                        window.scrollTo({ top: 420, behavior: 'smooth' });
                      }, 60);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left text-[13px] flex items-center gap-3 transition-colors ${
                      activeTopNav === 'reports'
                        ? 'bg-gray-100 font-semibold text-[#111827]'
                        : 'text-[#374151] hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>Отчётность и финансы</span>
                  </button>

                  {/* Клиенты */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTopNav('clients');
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left text-[13px] flex items-center gap-3 transition-colors ${
                      activeTopNav === 'clients'
                        ? 'bg-gray-100 font-semibold text-[#111827]'
                        : 'text-[#374151] hover:bg-gray-50'
                    }`}
                  >
                    <Users className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>Клиенты</span>
                  </button>
                </div>

                {/* MOBILE / TABLET (<1024px) SETTINGS & PROFILE INSIDE BURGER MENU */}
                <div className="lg:hidden">
                  <div className="border-t border-gray-100 my-2" />
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-4 py-1.5">
                    Настройки и профиль
                  </div>

                  <div className="px-4 py-2 space-y-3 text-xs">
                    {/* Language Pills */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-500">Язык:</span>
                      <div className="flex items-center gap-1">
                        {languages.map((l) => (
                          <button
                            key={l.code}
                            type="button"
                            onClick={() => setLanguage(l.label)}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium ${
                              language === l.label
                                ? 'bg-[#111827] text-white'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {l.flag} {l.code.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Currency Pills */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-500">Валюта:</span>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {currencies.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCurrency(c)}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium ${
                              currency === c
                                ? 'bg-[#F6D04D] text-[#111827] font-bold'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {c.split(',')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Support & Company Profile Summary */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#111827]">
                          ООО &quot;Shosh Prime&quot;
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Поддержка: +998 (71) 205-00-00
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#2563EB] text-white text-[11px] font-bold">
                        P {loyaltyPointsTotal}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
