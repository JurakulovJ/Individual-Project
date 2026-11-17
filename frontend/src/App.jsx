import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/layout/Header';
import HeroSearch from './components/search/HeroSearch';
import AITravelAssistant from './components/ai-assistant/AITravelAssistant';
import DashboardWidgets from './components/dashboard/DashboardWidgets';
import FlightResultsView from './components/results/FlightResultsView';
import HotelResultsView from './components/results/HotelResultsView';
import TransferResultsView from './components/results/TransferResultsView';
import HotelDetailView from './components/results/HotelDetailView';
import FlightDetailView from './components/results/FlightDetailView';
import QuickStartWidget from './components/layout/QuickStartWidget';
import {
  checkHealth,
  getDashboardSummary,
  createOrder,
  extractConstraints,
  generateItinerary,
  quickGenerateItinerary,
} from './services/api';
import {
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Top navigation bar active section ('search' | 'trips' | 'orders' | 'reports' | 'clients')
  const [activeTopNav, setActiveTopNav] = useState('search');
  const [currency, setCurrency] = useState('USD, $');
  const [language, setLanguage] = useState('Русский');
  const [apiOnline, setApiOnline] = useState(true);
  const [healthStatus, setHealthStatus] = useState(null);

  // Main View State:
  // 'dashboard' | 'flights-results' | 'hotels-results' | 'transfers-results'
  const [currentView, setCurrentView] = useState('dashboard');

  // Active Service Vertical inside Hero Search:
  // 'hotels' | 'flights' | 'transfers' | 'car-rental' | 'trains' | 'offline' | 'ai-planner'
  const [activeVertical, setActiveVertical] = useState('hotels');

  // Unified Search Parameters State
  const [searchParams, setSearchParams] = useState({
    hotelDestination: '',
    selectedCityShort: 'Бали',
    checkIn: '3 мар 2027',
    checkOut: '10 мар 2027',
    rooms: 1,
    adults: 2,
    children: 0,
    citizenship: 'Узбекистан',
    stars: [5],
    meals: ['BB'],
    earlyCheckIn: 'Выберите время',
    lateCheckOut: 'Выберите время',
    freeCancellation: false,

    flightTripType: 'round-trip',
    flightOrigin: '',
    flightDestination: '',
    flightDepDate: '5 Нояб, Чт',
    flightRetDate: '12 Нояб, Чт',
    flightPassengers: 1,
    cabinClass: 'Эконом',
    airline: 'Все авиакомпании',

    transferTripType: 'one-way',
    transferFrom: '',
    transferTo: '',
    transferDate: 'пт, 30 окт.',
    transferTime: '12:00',
    transferPassengers: 2,

    aiDestination: '',
    aiBudget: 4000,
  });

  // AI Tour Builder State (rendered below the yellow Hero banner)
  const [aiPrompt, setAiPrompt] = useState(
    'Хочу в Нью-Йорк на 7 ночей в ноябре для 2 взрослых, отель 5★ в Манхэттене с бесплатной отменой и прямой перелёт'
  );
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiLoadingStep, setAiLoadingStep] = useState(0);
  const [aiItineraryData, setAiItineraryData] = useState(null);
  const [aiSummaryText, setAiSummaryText] = useState(
    'Подобрал для вас 2 оптимальных пакета в Нью-Йорк с 12 по 19 ноября (2 взрослых, отели 5★ в Манхэттене + прямой перелёт и трансфер).'
  );

  const handleRunAISearch = useCallback(
    async (customPrompt = null) => {
      const promptToUse = (customPrompt ?? aiPrompt) || '';
      const enrichedPrompt = searchParams.aiDestination
        ? `${promptToUse} (${searchParams.aiDestination}, гостей: ${searchParams.adults + searchParams.children
        }, бюджет до $${searchParams.aiBudget || 4000})`
        : promptToUse;

      if (!enrichedPrompt.trim()) return;

      setIsGeneratingAI(true);
      setAiLoadingStep(0);

      const step1Timer = setTimeout(() => setAiLoadingStep(1), 350);
      const step2Timer = setTimeout(() => setAiLoadingStep(2), 700);

      try {
        const extracted = await extractConstraints(enrichedPrompt);
        const generated = await generateItinerary(extracted);

        setTimeout(() => {
          setAiItineraryData(generated);
          const count = generated.recommended_bundles?.length || 2;
          const destRu =
            searchParams.aiDestination?.split(',')[0] ||
            (extracted?.destination?.toLowerCase().includes('barcelona')
              ? 'Барселону и Лондон'
              : extracted?.destination?.toLowerCase().includes('dubai')
                ? 'Дубай'
                : 'Нью-Йорк');
          setAiSummaryText(
            `Подобрал для вас ${count} оптимальных пакета в ${destRu} (${searchParams.checkIn || '12 нояб. 2026 г.'
            } — ${searchParams.checkOut || '19 нояб. 2026 г.'}, ${searchParams.adults + searchParams.children
            } взрослых, отели 5★ + прямой перелёт и трансфер).`
          );
          setIsGeneratingAI(false);
        }, 950);
      } catch {
        try {
          const quick = await quickGenerateItinerary(enrichedPrompt);
          setAiItineraryData(quick);
          const count = quick.recommended_bundles?.length || 2;
          setAiSummaryText(
            `Подобрал для вас ${count} оптимальных пакета (${searchParams.checkIn || '12 нояб. 2026 г.'
            } — ${searchParams.checkOut || '19 нояб. 2026 г.'}, ${searchParams.adults + searchParams.children
            } взрослых, отели 5★ + прямой перелёт и трансфер).`
          );
        } catch {
          // Keep existing data if offline
        } finally {
          setIsGeneratingAI(false);
        }
      } finally {
        clearTimeout(step1Timer);
        clearTimeout(step2Timer);
      }
    },
    [
      aiPrompt,
      searchParams.aiDestination,
      searchParams.adults,
      searchParams.children,
      searchParams.aiBudget,
      searchParams.checkIn,
      searchParams.checkOut,
    ]
  );

  // Pre-load initial AI tour packages when entering ai-planner tab for the first time
  useEffect(() => {
    if (
      activeVertical === 'ai-planner' &&
      !aiItineraryData &&
      !isGeneratingAI
    ) {
      handleRunAISearch(aiPrompt);
    }
  }, [activeVertical, aiItineraryData, isGeneratingAI, handleRunAISearch, aiPrompt]);

  // Live B2B Financial & Order Dashboard State (from GET /api/v1/dashboard/summary)
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Booking Confirmation Modal & Toast State
  const [bookingModal, setBookingModal] = useState(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedHotelDetail, setSelectedHotelDetail] = useState(null);
  const [selectedFlightDetail, setSelectedFlightDetail] = useState(null);

  const handleOpenHotelDetail = (hotel) => {
    setSelectedHotelDetail(hotel);
    setCurrentView('hotel-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenFlightDetail = (flight, tariff = null) => {
    setSelectedFlightDetail({ flight, tariff });
    setCurrentView('flight-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const refreshDashboard = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const summary = await getDashboardSummary();
      setDashboardSummary(summary);
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    checkHealth()
      .then((data) => {
        setApiOnline(true);
        setHealthStatus(data);
      })
      .catch(() => setApiOnline(false));
    refreshDashboard();
  }, [refreshDashboard]);

  const handleTriggerSearch = (vertical) => {
    if (vertical === 'hotels') {
      if (!searchParams.hotelDestination) {
        setSearchParams((prev) => ({
          ...prev,
          hotelDestination: 'Бали, Индонезия',
          selectedCityShort: 'Бали',
          citizenship: prev.citizenship || 'Узбекистан',
          stars: prev.stars.length ? prev.stars : [5],
          meals: prev.meals.length ? prev.meals : ['BB'],
        }));
      }
      setCurrentView('hotels-results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (vertical === 'flights') {
      if (!searchParams.flightOrigin) {
        setSearchParams((prev) => ({
          ...prev,
          flightOrigin: 'Барселона, Испания',
          flightDestination: 'Лондон, Великобритания',
          flightDepDate: '19 Нояб, Чт',
          flightRetDate: '20 Нояб, Пт',
        }));
      }
      setCurrentView('flights-results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (vertical === 'transfers') {
      setCurrentView('transfers-results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleApplyAISuggestedFilters = (suggested) => {
    if (!suggested) return;
    setSearchParams((prev) => ({
      ...prev,
      hotelDestination: suggested.hotelDestination || prev.hotelDestination,
      selectedCityShort: suggested.selectedCityShort || prev.selectedCityShort,
      stars: suggested.stars || [5],
      meals: suggested.meals || [],
      freeCancellation:
        suggested.freeCancellation ?? prev.freeCancellation,
      flightOrigin: suggested.flightOrigin || prev.flightOrigin,
      flightDestination: suggested.flightDestination || prev.flightDestination,
    }));
    setActiveVertical('hotels');
    setCurrentView('hotels-results');
    showToast(
      `Фильтры AI (${suggested.selectedCityShort || 'Нью-Йорк'}, ${(suggested.stars || [5]).join(',')
      }★) применены к поиску!`
    );
  };

  const handleApplyAIBundle = (bundle) => {
    setBookingModal({
      order_type: 'ai-bundle',
      title: bundle.title,
      numericPrice: Number(bundle.total_price || bundle.totalPrice || 2778),
      priceLabel: `${bundle.total_price || bundle.totalPrice} $`,
      is_refundable: bundle.is_refundable ?? true,
      loyalty_points: bundle.loyalty_points || 112,
      subtitle: bundle.summary,
      details: [
        `Авиаперелет: ${bundle.flight.route} (${bundle.flight.carrier}) — ${bundle.flight.price} $`,
        `Проживание: ${bundle.hotel.name} (${bundle.hotel.room}) — ${bundle.hotel.price} $`,
        `Трансфер: ${bundle.transfer.type} — ${bundle.transfer.price} $`,
      ],
    });
  };

  const handleSelectFlightTariff = (flight, tariff) => {
    const out = flight.outbound_leg || flight.outbound;
    const ret = flight.return_leg || flight.inbound;
    setBookingModal({
      order_type: 'flight',
      title: `${flight.validating_carrier || flight.validatingCarrier} • Тариф ${tariff.name}`,
      numericPrice: Number(tariff.price || tariff.numericPrice || 273.63),
      priceLabel: tariff.price_label || tariff.price,
      is_refundable: Boolean(tariff.refundable),
      loyalty_points: 18,
      subtitle: out.route_subtext || out.routeSubtext,
      details: [
        `Вылет туда: ${out.date_label || out.dateLabel}, ${out.departure_time || out.depTime} — ${out.arrival_time || out.arrTime} (${out.flight_number.replace('\n', ', ')})`,
        `Вылет обратно: ${ret.date_label || ret.dateLabel}, ${ret.departure_time || ret.depTime} — ${ret.arrival_time || ret.arrTime} (${ret.flight_number.replace('\n', ', ')})`,
        ...(tariff.features || []),
      ],
    });
  };

  const handleSelectHotel = (hotel) => {
    const price = Number(hotel.total_price ?? hotel.price ?? 3670);
    setBookingModal({
      order_type: 'hotel',
      title: `${hotel.name} (${hotel.stars}★)`,
      numericPrice: price,
      priceLabel: `${price} $`,
      is_refundable: Boolean(hotel.free_cancellation ?? hotel.freeCancellation),
      loyalty_points: hotel.loyalty_points ?? hotel.loyaltyPoints ?? 112,
      subtitle: `${hotel.address} • Рейтинг ${hotel.rating_label || hotel.rating}/10`,
      details: [
        `Категория номера: ${hotel.room_type || hotel.roomType} (${hotel.bed_type || hotel.bedType})`,
        `Питание: ${hotel.meal_label || hotel.mealLabel}`,
        `Условия отмены: ${hotel.cancellation_label || hotel.cancellationLabel}`,
        `Оплата: ${hotel.payment_type || hotel.paymentLabel} • Начисление бонусов: +${hotel.loyalty_points ?? hotel.loyaltyPoints ?? 112} P`,
      ],
    });
  };

  const handleSelectTransfer = (transfer) => {
    setBookingModal({
      order_type: 'transfer',
      title: `Трансфер: ${transfer.vehicle_class || transfer.vehicleClass}`,
      numericPrice: Number(transfer.price || 68),
      priceLabel: `${transfer.price} $`,
      is_refundable: true,
      loyalty_points: 10,
      subtitle: transfer.models,
      details: [
        `Вместимость: до ${transfer.capacity || transfer.passengers} пассажиров, ${transfer.baggage_allowance || transfer.luggage} мест багажа`,
        transfer.free_waiting_time || transfer.waitIncluded,
        transfer.cancellation_policy || 'Бесплатная отмена за 24 часа до подачи',
      ],
    });
  };

  const handleConfirmBooking = async () => {
    if (!bookingModal) return;
    setSubmittingOrder(true);
    try {
      const created = await createOrder({
        order_type: bookingModal.order_type,
        title: bookingModal.title,
        subtitle: bookingModal.subtitle,
        total_price: bookingModal.numericPrice,
        currency: 'USD',
        is_refundable: bookingModal.is_refundable,
        payment_status: 'payment_required',
        loyalty_points: bookingModal.loyalty_points,
        details: bookingModal.details,
      });
      await refreshDashboard();
      setBookingModal(null);
      setCurrentView('dashboard');
      setActiveTopNav('search');
      showToast(
        `Заказ #${created.order_id} на сумму ${created.total_price} $ создан! Финансовый дашборд обновлён.`
      );
      window.scrollTo({ top: 380, behavior: 'smooth' });
    } catch {
      showToast('Ошибка при сохранении заказа на сервере');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const recentOrders = dashboardSummary?.recent_orders || [];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#111827] flex flex-col font-sans">
      {/* Live Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-5 z-50 bg-[#1C2026] text-white px-4 py-3 rounded-xl shadow-2xl border border-[#F6D04D] flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#F6D04D] shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Enterprise Header Bar */}
      <Header
        activeTopNav={activeTopNav}
        setActiveTopNav={setActiveTopNav}
        currency={currency}
        setCurrency={setCurrency}
        language={language}
        setLanguage={setLanguage}
        currentView={currentView}
        setCurrentView={setCurrentView}
        activeVertical={activeVertical}
        setActiveVertical={setActiveVertical}
        activeOrdersCount={dashboardSummary?.active_orders_count ?? 1}
        loyaltyPointsTotal={dashboardSummary?.loyalty_points_total ?? 4}
        apiOnline={apiOnline}
        healthStatus={healthStatus}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {activeTopNav !== 'search' ? (
          /* Secondary B2B Navigation Tabs (Поездки, Заказы, Отчётность, Клиенты) */
          <div className="max-w-[1220px] mx-auto px-4 py-10">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                    B2B Кабинет Агента • ООО &quot;Shosh Prime&quot;
                  </span>
                  <h1 className="text-2xl font-bold text-[#111827] mt-1">
                    {activeTopNav === 'trips' &&
                      `Активные поездки (${dashboardSummary?.active_orders_count ?? 1
                      })`}
                    {activeTopNav === 'orders' && 'Архив и реестр заказов'}
                    {activeTopNav === 'reports' &&
                      'Финансовая отчётность и акты'}
                    {activeTopNav === 'clients' && 'База клиентов и туристов'}
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTopNav('search');
                    setCurrentView('dashboard');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] text-xs font-semibold"
                >
                  Вернуться к поиску
                </button>
              </div>

              {/* Dynamic Orders List from Backend */}
              <div className="space-y-3">
                {recentOrders.map((ord) => (
                  <div
                    key={ord.order_id}
                    className="p-4 rounded-xl bg-[#FDF9EE] border border-[#F6D04D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold">
                          Требуется оплата
                        </span>
                        <span className="text-sm font-bold text-[#111827]">
                          Заказ #{ord.order_id} • {ord.title}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280]">
                        Создан: {ord.created_at} • {ord.subtitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-[#2563EB]">
                        {ord.total_price} $
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        Начислено +{ord.loyalty_points} P
                      </div>
                    </div>
                  </div>
                ))}

                {/* Default Seeded Order */}
                <div className="p-4 rounded-xl bg-[#F4F5F7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
                        Подтверждено
                      </span>
                      <span className="text-sm font-bold text-[#111827]">
                        Заказ #RH-948210 • Нью-Йорк (The Knickerbocker Hotel 5★)
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      12 нояб. 2026 — 19 нояб. 2026 • 2 взрослых • Оплачено по безналу
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-[#111827]">
                      3 670 $
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold">
                      Начислено +4 P
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : currentView === 'dashboard' ? (
          <>
            <HeroSearch
              activeVertical={activeVertical}
              setActiveVertical={setActiveVertical}
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              onTriggerSearch={handleTriggerSearch}
              aiPrompt={aiPrompt}
              setAiPrompt={setAiPrompt}
              onRunAISearch={handleRunAISearch}
              isGeneratingAI={isGeneratingAI}
            />
            {activeVertical === 'ai-planner' && (
              <AITravelAssistant
                isGenerating={isGeneratingAI}
                loadingStep={aiLoadingStep}
                itineraryData={aiItineraryData}
                aiSummaryText={aiSummaryText}
                onSendFollowUp={(followUp) => {
                  const nextPrompt = `${aiPrompt}. Уточнение: ${followUp}`;
                  setAiPrompt(nextPrompt);
                  handleRunAISearch(nextPrompt);
                }}
                onApplyBundle={handleApplyAIBundle}
                onApplyFiltersToSearch={handleApplyAISuggestedFilters}
                onJumpToHotels={() => handleTriggerSearch('hotels')}
                onJumpToFlights={() => handleTriggerSearch('flights')}
              />
            )}
            <DashboardWidgets
              dashboardSummary={dashboardSummary}
              loadingSummary={loadingSummary}
              onRefreshSummary={refreshDashboard}
              onSelectCuratedRoute={(target) => handleTriggerSearch(target)}
              onOpenAIMode={() => {
                setActiveVertical('ai-planner');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </>
        ) : currentView === 'flights-results' ? (
          <FlightResultsView
            searchParams={searchParams}
            setSearchParams={setSearchParams}
            onSelectFlightTariff={handleSelectFlightTariff}
            onOpenFlightDetail={handleOpenFlightDetail}
          />
        ) : currentView === 'flight-detail' ? (
          <FlightDetailView
            flight={selectedFlightDetail?.flight}
            initialTariff={selectedFlightDetail?.tariff}
            searchParams={searchParams}
            onBackToResults={() => {
              setCurrentView('flights-results');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onCreateB2BOrder={handleSelectFlightTariff}
          />
        ) : currentView === 'hotels-results' ? (
          <HotelResultsView
            searchParams={searchParams}
            onBackToDashboard={() => {
              setActiveVertical('hotels');
              setCurrentView('dashboard');
            }}
            onSelectHotel={handleSelectHotel}
            onOpenHotelDetail={handleOpenHotelDetail}
          />
        ) : currentView === 'hotel-detail' ? (
          <HotelDetailView
            hotel={selectedHotelDetail}
            searchParams={searchParams}
            onBackToResults={() => {
              setCurrentView('hotels-results');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onCreateB2BOrder={handleSelectHotel}
          />
        ) : (
          <TransferResultsView
            searchParams={searchParams}
            onBackToDashboard={() => {
              setActiveVertical('transfers');
              setCurrentView('dashboard');
            }}
            onSelectTransfer={handleSelectTransfer}
          />
        )}
      </main>

      {/* Interactive Booking / Order Creation Modal -> POST /api/v1/orders */}
      {bookingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Подтверждение заказа
                </span>
                <h3 className="text-[18px] font-bold text-[#111827] mt-1">
                  {bookingModal.title}
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {bookingModal.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingModal(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F4F5F7] rounded-xl p-4 space-y-2 text-xs text-[#374151]">
              {bookingModal.details?.map((line, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
                  <span>{line}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs text-[#6B7280] block">
                  Итоговая стоимость B2B (Нетто):
                </span>
                <span className="text-2xl font-extrabold text-[#2563EB]">
                  {bookingModal.priceLabel}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBookingModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-medium text-[#374151]"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  disabled={submittingOrder}
                  onClick={handleConfirmBooking}
                  className="px-5 py-2.5 rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  {submittingOrder && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Забронировать</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Bottom-Right Floating Pill: ✔ Быстрый старт (2) */}
      <QuickStartWidget
        onNavigateToStep={(target) => {
          setActiveTopNav('search');
          if (target === 'ai') {
            setCurrentView('dashboard');
            setActiveVertical('ai-planner');
          } else if (target === 'hotels') {
            setCurrentView('hotels-results');
          }
        }}
      />
    </div>
  );
}
