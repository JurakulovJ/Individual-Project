import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Utensils,
  RotateCcw,
  Star,
  Loader2,
  Building2,
  BedDouble,
} from 'lucide-react';
import { getHotelOffers, getHotelOfferRedirect } from '../../services/api';

const PLATFORM_BADGE_STYLE = {
  booking: {
    bg: '#003580',
    text: '#FFFFFF',
    short: 'B.',
    sub: 'Прямой переход на Booking.com',
  },
  agoda: {
    bg: '#5392F9',
    text: '#FFFFFF',
    short: 'Ag',
    sub: 'Партнёрский тариф Agoda',
  },
  tripcom: {
    bg: '#287DFA',
    text: '#FFFFFF',
    short: 'Tr',
    sub: 'Официальный партнёр Trip.com',
  },
};

export default function HotelOffersModal({
  hotel,
  selectedTariff = null,
  searchParams,
  onClose,
  onOpenFullDetail,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offersData, setOffersData] = useState(null);
  const [redirectingProvider, setRedirectingProvider] = useState(null);

  const adultsCount =
    (Number(searchParams?.adults) || 2) + (Number(searchParams?.children) || 0);
  const roomsCount = Number(searchParams?.rooms) || 1;
  const nightsCount = Number(offersData?.nights || hotel?.nights || 7);

  const loadOffers = useCallback(async () => {
    if (!hotel?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getHotelOffers(hotel.id, {
        checkIn: searchParams?.checkIn,
        checkOut: searchParams?.checkOut,
        adults: adultsCount,
        rooms: roomsCount,
        hotelName: hotel.name,
        city: hotel.city_en || hotel.city,
      });
      setOffersData(data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        'Не удалось загрузить предложения партнёров. Попробуйте повторить запрос.'
      );
    } finally {
      setLoading(false);
    }
  }, [
    hotel?.id,
    hotel?.name,
    hotel?.city_en,
    hotel?.city,
    searchParams?.checkIn,
    searchParams?.checkOut,
    adultsCount,
    roomsCount,
  ]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const handlePlatformRedirect = async (offer) => {
    setRedirectingProvider(offer.provider);
    try {
      const res = await getHotelOfferRedirect(hotel.id, offer.provider, {
        checkIn: offersData?.check_in || searchParams?.checkIn,
        checkOut: offersData?.check_out || searchParams?.checkOut,
        adults: adultsCount,
        rooms: roomsCount,
        hotelName: hotel.name,
        city: hotel.city_en || hotel.city,
        deepLink: offer.deep_link || undefined,
      });
      const targetUrl = res?.target_url;
      if (targetUrl) {
        const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
        if (win) win.opener = null;
      }
    } catch {
      if (offer.deep_link) {
        window.open(offer.deep_link, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setRedirectingProvider(null);
    }
  };

  if (!hotel) return null;

  // Adjust partner offer prices proportionally if a specific room/tariff was clicked
  const rawOffers = offersData?.offers || [];
  const priceRatio =
    selectedTariff?.basePrice && hotel?.total_price
      ? Number(selectedTariff.basePrice) / Math.max(1, Number(hotel.total_price))
      : 1.0;

  const offers = rawOffers.map((off) => {
    const adjustedTotal = Math.round(Number(off.total_price || 0) * priceRatio);
    const adjustedPerNight = Math.round(
      adjustedTotal / Math.max(1, nightsCount)
    );
    return {
      ...off,
      total_price: adjustedTotal,
      price_per_night: adjustedPerNight,
      room_name: selectedTariff?.roomTitle || off.room_name,
      meal_label: selectedTariff?.mealLabel || off.meal_label,
      free_cancellation:
        selectedTariff?.freeCancel !== undefined
          ? selectedTariff.freeCancel
          : off.free_cancellation,
    };
  });

  const isMock = offersData?.source === 'mock';
  const partialErrors = offersData?.errors || [];
  const taContent = offersData?.tripadvisor_content;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#2d3137]/60 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#f4f4f4] rounded-[14px] shadow-[0_18px_50px_rgba(45,49,55,0.32)] w-full max-w-[780px] overflow-hidden flex flex-col max-h-[90vh] text-[#2d3137]"
      >
        {/* ================================================================= */}
        {/* 1. MODAL HEADER (RATEHAWK CLEAN WHITE CARD WITH GREEN RIBBON)     */}
        {/* ================================================================= */}
        <div className="bg-white px-5 py-4 rh-card-shadow flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {hotel.stars > 0 && (
                <div className="flex items-center gap-[2px]">
                  {Array.from({ length: hotel.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-[13px] h-[13px] text-[#F5A623] fill-current"
                    />
                  ))}
                </div>
              )}
              {isMock && (
                <span className="px-2 py-0.5 rounded bg-[#f8f1da] text-[#2d3137] text-[11px] font-medium">
                  Демо-данные
                </span>
              )}
            </div>

            <h3 className="text-[20px] font-bold text-[#2d3137] leading-tight truncate">
              {hotel.name}
            </h3>

            <p className="text-[13px] text-[#868686] truncate mt-0.5">
              {hotel.address} • {searchParams?.checkIn || '3 мар 2027'} —{' '}
              {searchParams?.checkOut || '10 мар 2027'} ({nightsCount} ночей,{' '}
              {adultsCount} гостей)
            </p>

            {/* Selected Room & Meal Pill */}
            <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#fdf3dc] text-[13px] text-[#2d3137]">
              <BedDouble className="w-4 h-4 text-[#2d3137] shrink-0" />
              <span className="font-semibold">
                {selectedTariff?.roomTitle ||
                  hotel.room_type ||
                  'Двухместный номер Standard / Superior'}
              </span>
              <span className="text-[#868686]">•</span>
              <span className="text-[#1FA614] font-semibold">
                {selectedTariff?.mealLabel ||
                  hotel.meal_label ||
                  'Завтрак включён'}
              </span>
            </div>
          </div>

          {/* Right: Green Rating Ribbon + Close Button */}
          <div className="flex items-start gap-2.5 shrink-0">
            <div
              style={{
                clipPath:
                  'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)',
              }}
              className="-mt-4 w-[38px] h-[42px] bg-[#23A916] text-white font-bold text-[15px] flex items-center justify-center pb-1.5 rounded-t-[4px]"
            >
              {hotel.rating_label || '9,4'}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f4f4f4] hover:bg-[#e5e5e5] flex items-center justify-center text-[#868686] hover:text-[#2d3137] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. MODAL BODY (DARK-HEADER RATEHAWK PARTNER SELECTION TABLE)      */}
        {/* ================================================================= */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[14px] font-bold text-[#2d3137]">
              Выберите официального партнёра для бронирования
            </span>
            <span className="text-[12px] text-[#868686]">
              Цены указаны за {nightsCount} ночей
            </span>
          </div>

          {/* Partial Provider Errors Warning */}
          {partialErrors.length > 0 && (
            <div className="rounded-[10px] bg-[#fdf3dc] p-3 flex items-start gap-2.5 text-[12.5px] text-[#2d3137]">
              <AlertTriangle className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">
                  Частичный ответ внешних платформ:
                </div>
                {partialErrors.map((err, i) => (
                  <div key={i}>
                    • {err.provider}: {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LOADING SKELETON STATE */}
          {loading ? (
            <div
              className="bg-white rounded-[12px] overflow-hidden rh-card-shadow divide-y divide-[#f4f4f4]"
              data-testid="offers-skeleton"
            >
              <div className="h-9 bg-[#2d3137]" />
              {[1, 2, 3].map((sk) => (
                <div
                  key={sk}
                  className="p-4 animate-pulse flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-[8px] bg-[#e5e5e5] shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-[#e5e5e5] rounded w-1/3" />
                      <div className="h-3 bg-[#f4f4f4] rounded w-2/3" />
                    </div>
                  </div>
                  <div className="w-36 h-9 bg-[#e5e5e5] rounded-[8px] shrink-0" />
                </div>
              ))}
            </div>
          ) : error ? (
            /* ERROR STATE */
            <div className="bg-white rounded-[12px] p-6 text-center rh-card-shadow space-y-3">
              <AlertTriangle className="w-7 h-7 text-[#ce2121] mx-auto" />
              <div className="text-[14.5px] font-bold text-[#2d3137]">
                {error}
              </div>
              <button
                type="button"
                onClick={loadOffers}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#fddd55] hover:bg-[#ffd300] text-[#2d3137] text-[13.5px] font-semibold cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Повторить</span>
              </button>
            </div>
          ) : offers.length === 0 ? (
            /* EMPTY STATE */
            <div className="bg-white rounded-[12px] p-6 text-center rh-card-shadow space-y-3">
              <Building2 className="w-7 h-7 text-[#868686] mx-auto" />
              <div className="text-[14.5px] font-bold text-[#2d3137]">
                На выбранные даты офферы не найдены
              </div>
              <button
                type="button"
                onClick={loadOffers}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#fddd55] hover:bg-[#ffd300] text-[#2d3137] text-[13.5px] font-semibold cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Повторить</span>
              </button>
            </div>
          ) : (
            /* RATEHAWK DARK-HEADER PARTNER TABLE */
            <div className="bg-white rounded-[12px] overflow-hidden rh-card-shadow">
              {/* Dark Table Header (`#2d3137`) */}
              <div className="hidden sm:grid grid-cols-12 items-center bg-[#2d3137] text-white text-[12px] font-medium px-4 py-2.5">
                <div className="col-span-4">Официальный партнёр</div>
                <div className="col-span-3 border-l border-white/15 pl-3">
                  Условия тарифа
                </div>
                <div className="col-span-2 border-l border-white/15 pl-3">
                  Стоимость
                </div>
                <div className="col-span-3 border-l border-white/15 pl-3 text-right">
                  Бронирование
                </div>
              </div>

              {/* Partner Rows */}
              <div className="divide-y divide-[#f4f4f4]">
                {offers.map((offer) => {
                  const style = PLATFORM_BADGE_STYLE[offer.provider] || {
                    bg: '#2d3137',
                    text: '#FFFFFF',
                    short: offer.provider_label?.slice(0, 2) || 'OT',
                    sub: 'Официальный партнёр',
                  };
                  const isBusy = redirectingProvider === offer.provider;

                  return (
                    <div
                      key={offer.provider}
                      onClick={() => handlePlatformRedirect(offer)}
                      className={`grid grid-cols-1 sm:grid-cols-12 items-center gap-3 px-4 py-3.5 transition-colors cursor-pointer ${offer.is_cheapest
                          ? 'bg-[#fdf3dc]/60 hover:bg-[#fdf3dc]'
                          : 'bg-white hover:bg-[#fafafa]'
                        }`}
                    >
                      {/* Col 1: Partner Logo & Name */}
                      <div className="sm:col-span-4 flex items-center gap-3 min-w-0">
                        <div
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                          }}
                          className="w-10 h-10 rounded-[8px] font-bold text-[13px] flex items-center justify-center shrink-0"
                        >
                          {style.short}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[15px] font-bold text-[#2d3137]">
                              {offer.provider_label}
                            </span>
                            {offer.is_cheapest && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-[#23A916] text-white text-[10.5px] font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Дешевле всего</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[12px] text-[#868686] truncate">
                            {style.sub}
                          </div>
                        </div>
                      </div>

                      {/* Col 2: Meal & Cancellation */}
                      <div className="sm:col-span-3 sm:border-l sm:border-[#f4f4f4] sm:pl-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-[13px] text-[#1FA614] font-medium">
                          <Utensils className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{offer.meal_label}</span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 text-[12.5px] ${offer.free_cancellation
                              ? 'text-[#1FA614]'
                              : 'text-[#868686]'
                            }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {offer.free_cancellation
                              ? 'Беспл. отмена'
                              : 'Без беспл. отмены'}
                          </span>
                        </div>
                      </div>

                      {/* Col 3: Total Price & Per-Night */}
                      <div className="sm:col-span-2 sm:border-l sm:border-[#f4f4f4] sm:pl-3 min-w-0">
                        <div className="text-[17.5px] font-bold text-[#2d3137] leading-tight whitespace-nowrap">
                          {Number(offer.total_price || 0).toLocaleString(
                            'ru-RU'
                          )}{' '}
                          $
                        </div>
                        <div className="text-[11.5px] text-[#868686] truncate">
                          {Number(offer.price_per_night || 0).toLocaleString(
                            'ru-RU'
                          )}{' '}
                          $ / ночь
                        </div>
                      </div>

                      {/* Col 4: Redirect CTA Button */}
                      <div className="sm:col-span-3 sm:border-l sm:border-[#f4f4f4] sm:pl-3 flex justify-end min-w-0">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlatformRedirect(offer);
                          }}
                          className="w-full px-3 py-2 rounded-[8px] bg-[#fddd55] hover:bg-[#ffd300] active:bg-[#fdc500] disabled:opacity-60 text-[#2d3137] text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <span className="truncate">
                                На {offer.provider_label}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tripadvisor Content Strip */}
          {taContent && (
            <div className="bg-white rounded-[10px] p-3.5 rh-card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12.5px]">
              <div>
                <div className="font-bold text-[#2d3137]">
                  Рейтинг Tripadvisor: {taContent.rating || '9.2'} / 10 (
                  {taContent.num_reviews} отзывов)
                </div>
                <p className="text-[#868686] line-clamp-1 mt-0.5">
                  {taContent.description}
                </p>
              </div>
              {taContent.web_url && (
                <a
                  href={taContent.web_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4086e4] hover:underline font-medium shrink-0 inline-flex items-center gap-1"
                >
                  <span>Отзывы на Tripadvisor</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* 3. MODAL FOOTER                                                   */}
        {/* ================================================================= */}
        <div className="bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#868686]">
          <span>
            Нажмите на выбранного партнёра для безопасного перехода на
            официальную страницу бронирования
          </span>
          {onOpenFullDetail && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullDetail(hotel);
              }}
              className="text-[12.5px] font-medium text-[#4086e4] hover:underline cursor-pointer"
            >
              Все номера отеля →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
